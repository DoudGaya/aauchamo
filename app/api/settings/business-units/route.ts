import { z } from "zod";
import { requireAccess, requirePermission } from "@/lib/server/access";
import { AppError, apiFailure, apiSuccess, parseJson, requestIdFrom } from "@/lib/server/api";
import { writeAudit } from "@/lib/server/audit";
import { db } from "@/lib/server/db";

const createSchema = z.object({
  code: z.string().trim().min(1).max(20).toUpperCase(),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).optional(),
});

export async function GET(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "settings.view");

    const businessUnits = await db.businessUnit.findMany({
      where: { companyId: access.companyId },
      orderBy: { name: "asc" },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        isActive: true,
        version: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { sales: true, ticketBookings: true } },
      },
    });

    return apiSuccess(businessUnits, requestId, { total: businessUnits.length });
  } catch (error) {
    return apiFailure(error, requestId);
  }
}

export async function POST(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "settings.manage");
    const input = await parseJson(request, createSchema);

    // Ensure the code is unique within this company
    const existing = await db.businessUnit.findFirst({
      where: { companyId: access.companyId, code: input.code },
    });
    if (existing) {
      throw new AppError(
        "CONFLICT",
        `A business unit with code '${input.code}' already exists.`,
        409,
      );
    }

    const created = await db.$transaction(async (tx) => {
      const unit = await tx.businessUnit.create({
        data: {
          companyId: access.companyId,
          code: input.code,
          name: input.name,
          description: input.description,
          createdById: access.userId,
        },
      });

      await writeAudit(tx, {
        companyId: access.companyId,
        actorId: access.userId,
        action: "settings.business_unit.created",
        entityType: "BusinessUnit",
        entityId: unit.id,
        requestId,
        after: unit,
      });

      return unit;
    });

    return apiSuccess(created, requestId, { created: true });
  } catch (error) {
    return apiFailure(error, requestId);
  }
}
