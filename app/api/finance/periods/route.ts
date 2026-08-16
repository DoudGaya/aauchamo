import { z } from "zod";
import { requireAccess, requirePermission } from "@/lib/server/access";
import { AppError, apiFailure, apiSuccess, parseJson, requestIdFrom } from "@/lib/server/api";
import { writeAudit } from "@/lib/server/audit";
import { db } from "@/lib/server/db";

const periodSchema = z.object({
  name: z.string().trim().min(3).max(100),
  startsAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endsAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function GET(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "finance.view");
    const periods = await db.financialPeriod.findMany({
      where: { companyId: access.companyId },
      orderBy: { startsAt: "desc" },
    });
    return apiSuccess(periods, requestId);
  } catch (error) {
    return apiFailure(error, requestId);
  }
}

export async function POST(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "settings.manage");
    const input = await parseJson(request, periodSchema);

    const startsAt = new Date(input.startsAt);
    const endsAt = new Date(input.endsAt);

    if (endsAt <= startsAt) {
      throw new AppError("INVALID_DATES", "Ends date must be after starts date.", 422);
    }

    // Check overlapping periods
    const overlap = await db.financialPeriod.findFirst({
      where: {
        companyId: access.companyId,
        OR: [
          {
            startsAt: { lte: endsAt },
            endsAt: { gte: startsAt },
          },
        ],
      },
    });

    if (overlap) {
      throw new AppError("OVERLAPPING_PERIOD", "The date range overlaps with an existing period.", 409);
    }

    const period = await db.$transaction(async (tx) => {
      const created = await tx.financialPeriod.create({
        data: {
          companyId: access.companyId,
          name: input.name,
          startsAt,
          endsAt,
          isClosed: false,
        },
      });

      await writeAudit(tx, {
        companyId: access.companyId,
        actorId: access.userId,
        action: "finance.period_created",
        entityType: "FinancialPeriod",
        entityId: created.id,
        requestId,
        after: created,
      });

      return created;
    });

    return apiSuccess(period, requestId, { created: true });
  } catch (error) {
    return apiFailure(error, requestId);
  }
}
