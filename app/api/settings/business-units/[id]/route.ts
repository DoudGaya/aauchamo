import { z } from "zod";
import { requireAccess, requirePermission } from "@/lib/server/access";
import { AppError, apiFailure, apiSuccess, parseJson, requestIdFrom } from "@/lib/server/api";
import { writeAudit } from "@/lib/server/audit";
import { db } from "@/lib/server/db";

const updateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).optional(),
  isActive: z.boolean().optional(),
  version: z.number().int().positive(),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "settings.manage");
    const { id } = await params;
    const input = await parseJson(request, updateSchema);

    const existing = await db.businessUnit.findFirst({
      where: { id, companyId: access.companyId },
    });
    if (!existing) {
      throw new AppError("NOT_FOUND", "Business unit not found.", 404);
    }
    if (existing.version !== input.version) {
      throw new AppError(
        "CONFLICT",
        "This record was modified by someone else. Reload and try again.",
        409,
      );
    }

    const updated = await db.$transaction(async (tx) => {
      const unit = await tx.businessUnit.update({
        where: { id },
        data: {
          name: input.name,
          description: input.description,
          isActive: input.isActive ?? existing.isActive,
          version: { increment: 1 },
          updatedById: access.userId,
        },
      });

      await writeAudit(tx, {
        companyId: access.companyId,
        actorId: access.userId,
        action: "settings.business_unit.updated",
        entityType: "BusinessUnit",
        entityId: unit.id,
        requestId,
        before: existing,
        after: unit,
      });

      return unit;
    });

    return apiSuccess(updated, requestId);
  } catch (error) {
    return apiFailure(error, requestId);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "settings.manage");
    const { id } = await params;

    const existing = await db.businessUnit.findFirst({
      where: { id, companyId: access.companyId },
      include: {
        _count: { select: { sales: true, ticketBookings: true, purchaseOrders: true } },
      },
    });
    if (!existing) {
      throw new AppError("NOT_FOUND", "Business unit not found.", 404);
    }

    const linked =
      existing._count.sales + existing._count.ticketBookings + existing._count.purchaseOrders;
    if (linked > 0) {
      throw new AppError(
        "CONFLICT",
        `This business unit has ${linked} linked record(s) and cannot be deleted. Disable it instead.`,
        409,
      );
    }

    await db.$transaction(async (tx) => {
      // Hard-delete only if truly unlinked
      await tx.businessUnit.delete({ where: { id } });

      await writeAudit(tx, {
        companyId: access.companyId,
        actorId: access.userId,
        action: "settings.business_unit.deleted",
        entityType: "BusinessUnit",
        entityId: id,
        requestId,
        before: existing,
        after: null,
      });
    });

    return apiSuccess({ deleted: true }, requestId);
  } catch (error) {
    return apiFailure(error, requestId);
  }
}
