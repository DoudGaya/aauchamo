import { z } from "zod";
import { Prisma } from "@/lib/generated/prisma/client";
import { requireAccess, requirePermission, requireStation } from "@/lib/server/access";
import { AppError, apiFailure, apiSuccess, parseJson, requestIdFrom } from "@/lib/server/api";
import { writeAudit } from "@/lib/server/audit";
import { db } from "@/lib/server/db";

const closeSessionSchema = z.object({
  countedCash: z.string().regex(/^\d+(\.\d{1,2})?$/),
});

export async function POST(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "sales.create");
    const input = await parseJson(request, closeSessionSchema);
    const { sessionId } = await params;

    const session = await db.pOSSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) {
      throw new AppError("SESSION_NOT_FOUND", "POS session was not found.", 404);
    }
    requireStation(access, session.stationId, true);

    if (session.status !== "OPEN") {
      throw new AppError("SESSION_NOT_OPEN", "POS session is already closed.", 409);
    }

    const updatedSession = await db.$transaction(async (tx) => {
      // 1. Gather all cash payments received during this session
      const cashPayments = await tx.paymentAllocation.findMany({
        where: {
          sale: {
            posSessionId: session.id,
          },
          payment: {
            paymentMethod: {
              type: "CASH",
            },
          },
        },
        select: {
          amount: true,
        },
      });

      const totalCashReceived = cashPayments.reduce(
        (sum, pay) => sum.plus(pay.amount),
        new Prisma.Decimal(0)
      );

      const expectedCash = session.openingCash.plus(totalCashReceived);
      const countedCash = new Prisma.Decimal(input.countedCash);
      const variance = countedCash.minus(expectedCash);

      const updated = await tx.pOSSession.update({
        where: { id: session.id },
        data: {
          status: "CLOSED",
          closedById: access.userId,
          closedAt: new Date(),
          expectedCash,
          countedCash,
          variance,
        },
      });

      await writeAudit(tx, {
        companyId: access.companyId,
        actorId: access.userId,
        stationId: session.stationId,
        action: "pos.session.closed",
        entityType: "POSSession",
        entityId: session.id,
        requestId,
        before: session,
        after: updated,
      });

      return updated;
    }, { isolationLevel: "Serializable" });

    return apiSuccess(updatedSession, requestId);
  } catch (error) {
    return apiFailure(error, requestId);
  }
}
