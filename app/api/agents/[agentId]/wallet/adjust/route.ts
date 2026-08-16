import { z } from "zod";
import { Prisma } from "@/lib/generated/prisma/client";
import { requireAccess, requirePermission, requireStation } from "@/lib/server/access";
import { AppError, NotFoundError, apiFailure, apiSuccess, parseJson, requestIdFrom } from "@/lib/server/api";
import { writeAudit } from "@/lib/server/audit";
import { db } from "@/lib/server/db";
import { claimIdempotency, completeIdempotency, hashRequest } from "@/lib/server/idempotency";
import { enqueueOutbox } from "@/lib/server/outbox";
import { allocateSequence } from "@/lib/server/sequence";

const adjustSchema = z.object({
  stationId: z.string().cuid(),
  type: z.enum(["ADJUSTMENT_CREDIT", "ADJUSTMENT_DEBIT"]),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/),
  reason: z.string().trim().min(3).max(500),
  paymentMethodId: z.string().cuid().optional(),
  reference: z.string().trim().max(120).optional(),
});

export async function POST(request: Request, { params }: { params: Promise<{ agentId: string }> }) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "wallet.adjust");
    const payload = await parseJson(request, adjustSchema);
    const { agentId } = await params;
    requireStation(access, payload.stationId, true);

    const key = request.headers.get("idempotency-key")?.trim();
    if (!key || key.length < 8) {
      throw new AppError("IDEMPOTENCY_KEY_REQUIRED", "A valid Idempotency-Key header is required.", 422);
    }

    const posted = await db.$transaction(
      async (tx) => {
        const claim = await claimIdempotency({
          tx,
          companyId: access.companyId,
          userId: access.userId,
          route: `POST:/api/agents/${agentId}/wallet/adjust`,
          key,
          requestHash: hashRequest(payload),
        });
        if (claim.status === "COMPLETED" && claim.responseBody) {
          return { replayed: true, result: claim.responseBody };
        }

        const agent = await tx.agent.findFirst({
          where: { id: agentId, companyId: access.companyId, status: "ACTIVE" },
          include: { wallet: true },
        });
        if (!agent?.wallet) throw new NotFoundError("Active agent wallet was not found.");

        const amount = new Prisma.Decimal(payload.amount);
        if (!amount.isPositive()) throw new AppError("INVALID_AMOUNT", "Adjustment must be greater than zero.", 422);

        const next =
          payload.type === "ADJUSTMENT_CREDIT"
            ? agent.wallet.balance.plus(amount)
            : agent.wallet.balance.minus(amount);

        // Credit Limit Invariant Check: prevent spending beyond balance + credit limit
        if (payload.type === "ADJUSTMENT_DEBIT" && next.plus(agent.creditLimit).isNegative()) {
          throw new AppError("INSUFFICIENT_FUNDS", "Spending exceeds the approved credit limit.", 422);
        }

        const changed = await tx.walletAccount.updateMany({
          where: { id: agent.wallet.id, version: agent.wallet.version },
          data: { balance: next, version: { increment: 1 } },
        });
        if (changed.count !== 1) throw new AppError("WALLET_CONFLICT", "Wallet changed while updating. Retry safely.", 409);

        const entryNumber = await allocateSequence(tx, {
          companyId: access.companyId,
          stationId: payload.stationId,
          documentType: "WALLET_ENTRY",
          prefix: "WLT",
          includeDate: true,
          padding: 6,
        });

        let methodId: string | null = null;
        if (payload.paymentMethodId) {
          const method = await tx.paymentMethod.findFirst({
            where: { id: payload.paymentMethodId, companyId: access.companyId, isActive: true },
          });
          if (!method) throw new AppError("INVALID_PAYMENT_METHOD", "Payment method is invalid.", 422);
          methodId = method.id;
        }

        const entry = await tx.walletEntry.create({
          data: {
            companyId: access.companyId,
            stationId: payload.stationId,
            walletAccountId: agent.wallet.id,
            paymentMethodId: methodId,
            entryNumber,
            type: payload.type,
            amount,
            balanceAfter: next,
            referenceType: "WalletAdjustment",
            referenceId: entryNumber,
            externalRef: payload.reference,
            reason: payload.reason,
            postedById: access.userId,
          },
        });

        // Cashbook entry posting (only if payment method is provided)
        if (methodId) {
          const account = await tx.financialAccount.findFirst({
            where: { companyId: access.companyId, paymentMethodId: methodId, isActive: true },
          });

          // Match categories based on debit vs credit adjustments
          const categoryCode = payload.type === "ADJUSTMENT_CREDIT" ? "AGENT_DEPOSIT" : "OPERATING_EXPENSE";
          const category = await tx.financialCategory.findFirst({
            where: { companyId: access.companyId, code: categoryCode, isActive: true },
          });

          if (account && category) {
            const cashbookNumber = await allocateSequence(tx, {
              companyId: access.companyId,
              stationId: payload.stationId,
              documentType: "CASHBOOK",
              prefix: "CB",
              includeDate: true,
              padding: 6,
            });

            await tx.cashbookEntry.create({
              data: {
                companyId: access.companyId,
                stationId: payload.stationId,
                accountId: account.id,
                categoryId: category.id,
                paymentMethodId: methodId,
                entryNumber: cashbookNumber,
                direction: payload.type === "ADJUSTMENT_CREDIT" ? "CREDIT" : "DEBIT",
                amount,
                description: `Wallet adjustment ${payload.type.replaceAll("_", " ").toLowerCase()} for ${agent.name}`,
                sourceType: "WalletEntry",
                sourceId: entry.id,
                externalReference: payload.reference,
                status: "POSTED",
                postedById: access.userId,
                postedAt: new Date(),
              },
            });
          }
        }

        await enqueueOutbox(tx, {
          companyId: access.companyId,
          aggregateType: "WalletAccount",
          aggregateId: agent.wallet.id,
          eventType: "wallet.adjustment_posted",
          payload: { agentId, entryNumber, type: payload.type, amount: amount.toString(), balance: next.toString() },
        });

        await writeAudit(tx, {
          companyId: access.companyId,
          actorId: access.userId,
          stationId: payload.stationId,
          action: "wallet.adjustment_posted",
          entityType: "WalletEntry",
          entityId: entry.id,
          reason: payload.reason,
          requestId,
          after: entry,
        });

        const result = { entryNumber, balance: next.toString(), amount: amount.toString() };
        await completeIdempotency(tx, claim.id, 201, result);
        return { replayed: false, result };
      },
      { isolationLevel: "Serializable", timeout: 30000 }
    );

    return apiSuccess(posted.result, requestId, { created: !posted.replayed, replayed: posted.replayed });
  } catch (error) {
    return apiFailure(error, requestId);
  }
}
