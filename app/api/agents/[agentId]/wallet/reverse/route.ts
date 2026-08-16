import { z } from "zod";
import { Prisma } from "@/lib/generated/prisma/client";
import { requireAccess, requirePermission, requireStation } from "@/lib/server/access";
import { AppError, NotFoundError, apiFailure, apiSuccess, parseJson, requestIdFrom } from "@/lib/server/api";
import { writeAudit } from "@/lib/server/audit";
import { db } from "@/lib/server/db";
import { claimIdempotency, completeIdempotency, hashRequest } from "@/lib/server/idempotency";
import { enqueueOutbox } from "@/lib/server/outbox";
import { allocateSequence } from "@/lib/server/sequence";

const reverseSchema = z.object({
  entryId: z.string().cuid(),
  reason: z.string().trim().min(3).max(500),
});

export async function POST(request: Request, { params }: { params: Promise<{ agentId: string }> }) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "wallet.adjust");
    const payload = await parseJson(request, reverseSchema);
    const { agentId } = await params;

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
          route: `POST:/api/agents/${agentId}/wallet/reverse`,
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
        requireStation(access, agent.homeStationId, true);

        // Find original entry
        const originalEntry = await tx.walletEntry.findFirst({
          where: { id: payload.entryId, walletAccountId: agent.wallet.id, companyId: access.companyId },
        });
        if (!originalEntry) throw new NotFoundError("Original wallet entry was not found.");

        // Check if already reversed
        if (originalEntry.reversedEntryId) {
          throw new AppError("ALREADY_REVERSED", "This wallet entry has already been reversed.", 422);
        }
        const existingReversal = await tx.walletEntry.findFirst({
          where: { reversedEntryId: originalEntry.id },
        });
        if (existingReversal) {
          throw new AppError("ALREADY_REVERSED", "This wallet entry has already been reversed.", 422);
        }

        const amount = originalEntry.amount;
        const isOriginalCredit = ["DEPOSIT", "REFUND_CREDIT", "ADJUSTMENT_CREDIT"].includes(originalEntry.type);
        const reversalType = isOriginalCredit ? "ADJUSTMENT_DEBIT" : "ADJUSTMENT_CREDIT";

        const next = isOriginalCredit
          ? agent.wallet.balance.minus(amount)
          : agent.wallet.balance.plus(amount);

        // Check credit limit invariant if the reversal is a debit (original was credit)
        if (isOriginalCredit && next.plus(agent.creditLimit).isNegative()) {
          throw new AppError("INSUFFICIENT_FUNDS", "Reversal would exceed the approved credit limit.", 422);
        }

        // Lock and update wallet balance
        const changed = await tx.walletAccount.updateMany({
          where: { id: agent.wallet.id, version: agent.wallet.version },
          data: { balance: next, version: { increment: 1 } },
        });
        if (changed.count !== 1) throw new AppError("WALLET_CONFLICT", "Wallet changed while updating. Retry safely.", 409);

        const entryNumber = await allocateSequence(tx, {
          companyId: access.companyId,
          stationId: originalEntry.stationId,
          documentType: "WALLET_ENTRY",
          prefix: "WLT",
          includeDate: true,
          padding: 6,
        });

        // Create reversal entry
        const entry = await tx.walletEntry.create({
          data: {
            companyId: access.companyId,
            stationId: originalEntry.stationId,
            walletAccountId: agent.wallet.id,
            paymentMethodId: originalEntry.paymentMethodId,
            entryNumber,
            type: reversalType,
            amount,
            balanceAfter: next,
            referenceType: "WalletReversal",
            referenceId: originalEntry.entryNumber,
            externalRef: originalEntry.externalRef,
            reason: payload.reason,
            postedById: access.userId,
            reversedEntryId: originalEntry.id,
          },
        });



        // Reverse cashbook entry if original cashbook entry exists
        const originalCashbook = await tx.cashbookEntry.findFirst({
          where: { sourceType: "WalletEntry", sourceId: originalEntry.id, companyId: access.companyId },
        });

        if (originalCashbook) {
          const cashbookNumber = await allocateSequence(tx, {
            companyId: access.companyId,
            stationId: originalEntry.stationId,
            documentType: "CASHBOOK",
            prefix: "CB",
            includeDate: true,
            padding: 6,
          });

          await tx.cashbookEntry.create({
            data: {
              companyId: access.companyId,
              stationId: originalEntry.stationId,
              accountId: originalCashbook.accountId,
              categoryId: originalCashbook.categoryId,
              paymentMethodId: originalCashbook.paymentMethodId,
              entryNumber: cashbookNumber,
              direction: originalCashbook.direction === "CREDIT" ? "DEBIT" : "CREDIT",
              amount,
              description: `Reversal of ${originalEntry.entryNumber}: ${payload.reason}`,
              sourceType: "WalletEntry",
              sourceId: entry.id,
              externalReference: originalCashbook.externalReference,
              status: "POSTED",
              postedById: access.userId,
              postedAt: new Date(),
            },
          });
        }

        await enqueueOutbox(tx, {
          companyId: access.companyId,
          aggregateType: "WalletAccount",
          aggregateId: agent.wallet.id,
          eventType: "wallet.reversal_posted",
          payload: { agentId, entryNumber, reversedEntryNumber: originalEntry.entryNumber, amount: amount.toString(), balance: next.toString() },
        });

        await writeAudit(tx, {
          companyId: access.companyId,
          actorId: access.userId,
          stationId: originalEntry.stationId,
          action: "wallet.reversal_posted",
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
