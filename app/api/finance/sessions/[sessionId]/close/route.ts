import { z } from "zod";
import { Prisma } from "@/lib/generated/prisma/client";
import { requireAccess, requirePermission, requireStation } from "@/lib/server/access";
import { AppError, NotFoundError, apiFailure, apiSuccess, parseJson, requestIdFrom } from "@/lib/server/api";
import { writeAudit } from "@/lib/server/audit";
import { db } from "@/lib/server/db";

const closeSchema = z.object({
  countedBalance: z.string().regex(/^\d+(\.\d{1,2})?$/),
});

export async function POST(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "finance.reconcile");
    const input = await parseJson(request, closeSchema);
    const { sessionId } = await params;

    const session = await db.cashSession.findUnique({
      where: { id: sessionId },
      include: { station: true },
    });
    if (!session) throw new NotFoundError("Cash session was not found.");
    if (session.status !== "OPEN") throw new AppError("SESSION_NOT_OPEN", "This session is already closed.", 409);
    requireStation(access, session.stationId, true);

    const counted = new Prisma.Decimal(input.countedBalance);

    // Calculate expected movements from cashbook entries
    const [credits, debits] = await Promise.all([
      db.cashbookEntry.aggregate({
        where: {
          stationId: session.stationId,
          accountId: session.accountId,
          status: { in: ["POSTED", "RECONCILED"] },
          direction: "CREDIT",
          createdAt: { gte: session.openedAt },
        },
        _sum: { amount: true },
      }),
      db.cashbookEntry.aggregate({
        where: {
          stationId: session.stationId,
          accountId: session.accountId,
          status: { in: ["POSTED", "RECONCILED"] },
          direction: "DEBIT",
          createdAt: { gte: session.openedAt },
        },
        _sum: { amount: true },
      }),
    ]);

    const sumCredits = credits._sum.amount || new Prisma.Decimal(0);
    const sumDebits = debits._sum.amount || new Prisma.Decimal(0);
    const expected = session.openingBalance.add(sumCredits).sub(sumDebits);
    const variance = counted.sub(expected);

    const updated = await db.$transaction(async (tx) => {
      const result = await tx.cashSession.update({
        where: { id: session.id },
        data: {
          status: "CLOSED",
          closedById: access.userId,
          closedAt: new Date(),
          expected,
          counted,
          variance,
        },
      });

      await writeAudit(tx, {
        companyId: session.station.companyId,
        actorId: access.userId,
        stationId: session.stationId,
        action: "finance.session_closed",
        entityType: "CashSession",
        entityId: session.id,
        requestId,
        before: session,
        after: result,
      });

      return result;
    });

    return apiSuccess(updated, requestId);
  } catch (error) {
    return apiFailure(error, requestId);
  }
}
