import { z } from "zod";

import { requireAccess, requirePermission, requireStation } from "@/lib/server/access";
import { AppError, apiFailure, apiSuccess, parseJson, requestIdFrom } from "@/lib/server/api";
import { writeAudit } from "@/lib/server/audit";
import { db } from "@/lib/server/db";
import { applyStockMovement, quantity } from "@/lib/server/inventory";
import { allocateSequence } from "@/lib/server/sequence";

const stockSchema = z.object({
  stationId: z.string().cuid(), productId: z.string().cuid(), batchId: z.string().cuid().optional(),
  action: z.enum(["STOCK_IN", "STOCK_OUT", "DAMAGE", "RETURN_TO_SUPPLIER"]),
  quantity: z.string().regex(/^\d+(\.\d{1,3})?$/), unitCost: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  reason: z.string().trim().min(5).max(500), externalReference: z.string().trim().max(100).optional(),
});

export async function POST(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    const input = await parseJson(request, stockSchema);
    const access = requirePermission(await requireAccess(), input.action === "STOCK_IN" ? "inventory.stock_in" : "inventory.stock_out");
    requireStation(access, input.stationId, true);
    const product = await db.product.findFirst({ where: { id: input.productId, companyId: access.companyId, status: "ACTIVE" } });
    if (!product) throw new AppError("INVALID_PRODUCT", "Product is unavailable.", 422);
    const result = await db.$transaction(async (tx) => {
      const reference = await allocateSequence(tx, { companyId: access.companyId, stationId: input.stationId, documentType: "STOCK_MOVEMENT", prefix: "STK", includeDate: true, padding: 5 });
      const amount = quantity(input.quantity);
      const sign = input.action === "STOCK_IN" ? amount : amount.negated();
      const movementType = input.action === "STOCK_IN" ? "ADJUSTMENT" : input.action === "STOCK_OUT" ? "ADJUSTMENT" : input.action;
      const posted = await applyStockMovement(tx, { companyId: access.companyId, stationId: input.stationId, productId: input.productId, batchId: input.batchId, movementType, quantityDelta: sign, referenceType: "ManualStockMovement", referenceId: reference, occurredById: access.userId, unitCost: input.unitCost, reason: input.reason });
      await writeAudit(tx, { companyId: access.companyId, actorId: access.userId, stationId: input.stationId, action: `inventory.${input.action.toLowerCase()}`, entityType: "StockMovement", entityId: posted.movement.id, reason: input.reason, requestId, after: { reference, productId: input.productId, quantity: sign.toString(), externalReference: input.externalReference } });
      return { reference, movementId: posted.movement.id, balance: posted.balance.toString() };
    }, { isolationLevel: "Serializable" });
    return apiSuccess(result, requestId, { created: true });
  } catch (error) { return apiFailure(error, requestId); }
}
