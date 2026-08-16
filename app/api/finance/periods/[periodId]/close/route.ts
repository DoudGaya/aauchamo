import { z } from "zod";
import { requireAccess, requirePermission } from "@/lib/server/access";
import { NotFoundError, apiFailure, apiSuccess, parseJson, requestIdFrom } from "@/lib/server/api";
import { writeAudit } from "@/lib/server/audit";
import { db } from "@/lib/server/db";

const closeSchema = z.object({
  isClosed: z.boolean(),
});

export async function POST(request: Request, { params }: { params: Promise<{ periodId: string }> }) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "settings.manage");
    const input = await parseJson(request, closeSchema);
    const { periodId } = await params;

    const period = await db.financialPeriod.findFirst({
      where: { id: periodId, companyId: access.companyId },
    });
    if (!period) throw new NotFoundError("Financial period was not found.");

    const updated = await db.$transaction(async (tx) => {
      const result = await tx.financialPeriod.update({
        where: { id: period.id },
        data: {
          isClosed: input.isClosed,
          closedById: input.isClosed ? access.userId : null,
          closedAt: input.isClosed ? new Date() : null,
        },
      });

      await writeAudit(tx, {
        companyId: access.companyId,
        actorId: access.userId,
        action: input.isClosed ? "finance.period_closed" : "finance.period_reopened",
        entityType: "FinancialPeriod",
        entityId: period.id,
        requestId,
        before: period,
        after: result,
      });

      return result;
    });

    return apiSuccess(updated, requestId);
  } catch (error) {
    return apiFailure(error, requestId);
  }
}
