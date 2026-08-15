import { z } from "zod";
import { Prisma } from "@/lib/generated/prisma/client";
import { requireAccess, requirePermission, requireStation } from "@/lib/server/access";
import { AppError, apiFailure, apiSuccess, parseJson, requestIdFrom } from "@/lib/server/api";
import { writeAudit } from "@/lib/server/audit";
import { db } from "@/lib/server/db";
import { applyStockMovement } from "@/lib/server/inventory";

const schema = z.object({ reason: z.string().trim().min(5).max(500) });

export async function POST(request: Request, { params }: { params: Promise<{ saleId: string }> }) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "sales.cancel");
    const { saleId } = await params;
    const input = await parseJson(request, schema);

    const sale = await db.sale.findFirst({
      where: { id: saleId, companyId: access.companyId },
      include: { lines: true, allocations: { include: { payment: true } } },
    });
    if (!sale) throw new AppError("SALE_NOT_FOUND", "Sale was not found.", 404);
    requireStation(access, sale.stationId, true);

    if (["CANCELLED", "REFUNDED"].includes(sale.status)) {
      throw new AppError("SALE_ALREADY_CANCELLED", "This sale cannot be cancelled in its current state.", 409);
    }

    const cancelled = await db.$transaction(
      async (tx) => {
        // Reverse inventory movements
        for (const line of sale.lines) {
          if (line.quantity.gt(0)) {
            await applyStockMovement(tx, {
              companyId: access.companyId,
              stationId: sale.stationId,
              productId: line.productId,
              quantityDelta: line.quantity.toString(),
              movementType: "ADJUSTMENT",
              referenceType: "SALE_CANCELLATION",
              referenceId: sale.id,
              occurredById: access.userId,
            });
          }
        }

        // We do not physically delete payments, but let's assume finance manages reversals.
        // For atomic sale cancellations, we simply mark the sale as CANCELLED.
        const updated = await tx.sale.update({
          where: { id: sale.id },
          data: {
            status: "CANCELLED"
          },
        });

        await writeAudit(tx, {
          companyId: access.companyId,
          actorId: access.userId,
          stationId: sale.stationId,
          businessUnitId: sale.businessUnitId,
          action: "sale.cancelled",
          entityType: "Sale",
          entityId: sale.id,
          reason: input.reason,
          requestId,
          after: updated,
        });

        return updated;
      },
      { isolationLevel: "Serializable" }
    );

    return apiSuccess(cancelled, requestId, { cancelled: true });
  } catch (error) {
    return apiFailure(error, requestId);
  }
}
