import { z } from "zod";
import { Prisma } from "@/lib/generated/prisma/client";
import { requireAccess, requirePermission } from "@/lib/server/access";
import { AppError, apiFailure, apiSuccess, parseJson, parsePagination, requestIdFrom } from "@/lib/server/api";
import { writeAudit } from "@/lib/server/audit";
import { db } from "@/lib/server/db";

const reconciliationSchema = z.object({
  accountId: z.string().cuid(),
  statementDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  statementBalance: z.string().regex(/^-?\d+(\.\d{1,2})?$/),
  notes: z.string().trim().max(1000).optional(),
});

export async function GET(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "finance.view");
    const url = new URL(request.url);
    const { page, pageSize, skip, take } = parsePagination(url.searchParams);

    const where = {
      account: {
        companyId: access.companyId,
      },
    };

    const [items, total] = await Promise.all([
      db.reconciliation.findMany({
        where,
        include: {
          account: true,
        },
        orderBy: { statementDate: "desc" },
        skip,
        take,
      }),
      db.reconciliation.count({ where }),
    ]);

    return apiSuccess(items, requestId, { page, pageSize, total });
  } catch (error) {
    return apiFailure(error, requestId);
  }
}

export async function POST(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "finance.reconcile");
    const input = await parseJson(request, reconciliationSchema);

    // Verify account exists
    const account = await db.financialAccount.findFirst({
      where: { id: input.accountId, companyId: access.companyId, isActive: true },
    });
    if (!account) throw new AppError("INVALID_ACCOUNT", "Account is invalid or inactive.", 422);

    const statementDate = new Date(input.statementDate + "T23:59:59.999Z");
    const statementBalance = new Prisma.Decimal(input.statementBalance);

    // Calculate system ledger balance up to the statementDate
    const [credits, debits] = await Promise.all([
      db.cashbookEntry.aggregate({
        where: {
          accountId: input.accountId,
          status: { in: ["POSTED", "RECONCILED"] },
          direction: "CREDIT",
          createdAt: { lte: statementDate },
        },
        _sum: { amount: true },
      }),
      db.cashbookEntry.aggregate({
        where: {
          accountId: input.accountId,
          status: { in: ["POSTED", "RECONCILED"] },
          direction: "DEBIT",
          createdAt: { lte: statementDate },
        },
        _sum: { amount: true },
      }),
    ]);

    const sumCredits = credits._sum.amount || new Prisma.Decimal(0);
    const sumDebits = debits._sum.amount || new Prisma.Decimal(0);
    const systemBalance = sumCredits.sub(sumDebits);
    const difference = statementBalance.sub(systemBalance);

    const reconciliation = await db.$transaction(async (tx) => {
      const created = await tx.reconciliation.create({
        data: {
          companyId: access.companyId,
          accountId: input.accountId,
          statementDate,
          statementBalance,
          systemBalance,
          difference,
          status: "COMPLETED",
          reconciledById: access.userId,
          notes: input.notes,
        },
      });

      // Update matching cashbook entries status to RECONCILED
      await tx.cashbookEntry.updateMany({
        where: {
          accountId: input.accountId,
          status: "POSTED",
          createdAt: { lte: statementDate },
        },
        data: {
          status: "RECONCILED",
        },
      });

      await writeAudit(tx, {
        companyId: access.companyId,
        actorId: access.userId,
        action: "finance.reconciled",
        entityType: "Reconciliation",
        entityId: created.id,
        requestId,
        after: created,
      });

      return created;
    });

    return apiSuccess(reconciliation, requestId, { created: true });
  } catch (error) {
    return apiFailure(error, requestId);
  }
}
