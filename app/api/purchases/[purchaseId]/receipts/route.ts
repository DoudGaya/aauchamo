import { z } from "zod";

import { Prisma } from "@/lib/generated/prisma/client";
import { requireAccess, requirePermission, requireStation } from "@/lib/server/access";
import { AppError, NotFoundError, apiFailure, apiSuccess, parseJson, requestIdFrom } from "@/lib/server/api";
import { writeAudit } from "@/lib/server/audit";
import { db } from "@/lib/server/db";
import { applyStockMovement, quantity } from "@/lib/server/inventory";
import { enqueueOutbox } from "@/lib/server/outbox";
import { allocateSequence } from "@/lib/server/sequence";

const receiptSchema = z.object({ supplierRef: z.string().trim().max(100).optional(), notes: z.string().trim().max(1_000).optional(), lines: z.array(z.object({ purchaseOrderLineId: z.string().cuid(), quantity: z.string().regex(/^\d+(\.\d{1,3})?$/), batchCode: z.string().trim().max(60).optional(), expiresAt: z.coerce.date().optional() })).min(1).max(100) });

export async function POST(request: Request, { params }: { params: Promise<{ purchaseId: string }> }) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "inventory.stock_in"); const input = await parseJson(request, receiptSchema); const { purchaseId } = await params;
    const order = await db.purchaseOrder.findFirst({ where: { id: purchaseId, companyId: access.companyId }, include: { lines: { include: { product: true } } } });
    if (!order) throw new NotFoundError("Purchase order was not found."); requireStation(access, order.stationId, true); if (!["APPROVED", "PARTIALLY_RECEIVED"].includes(order.status)) throw new AppError("INVALID_PURCHASE_STATUS", "The purchase order is not open for receipt.", 409);
    const lineMap = new Map(order.lines.map((line) => [line.id, line]));
    for (const received of input.lines) { const line = lineMap.get(received.purchaseOrderLineId); if (!line) throw new AppError("INVALID_RECEIPT_LINE", "A receipt line does not belong to this purchase order.", 422); const amount = quantity(received.quantity); if (amount.gt(line.quantityOrdered.minus(line.quantityReceived))) throw new AppError("RECEIPT_EXCEEDS_ORDER", `Received quantity exceeds the remaining quantity for ${line.product.name}.`, 409); if (line.product.trackBatches && !received.batchCode) throw new AppError("BATCH_REQUIRED", `A batch code is required for ${line.product.name}.`, 422); }
    const receipt = await db.$transaction(async (tx) => {
      const receiptNumber = await allocateSequence(tx, { companyId: access.companyId, stationId: order.stationId, documentType: "GOODS_RECEIPT", prefix: "GRN", includeDate: true, padding: 5 });
      const created = await tx.goodsReceipt.create({ data: { companyId: access.companyId, stationId: order.stationId, purchaseOrderId: order.id, receiptNumber, supplierRef: input.supplierRef, receivedById: access.userId, notes: input.notes } });
      for (const received of input.lines) {
        const orderLine = lineMap.get(received.purchaseOrderLineId)!; let batchId: string | undefined;
        if (received.batchCode) { const batch = await tx.batch.upsert({ where: { productId_code: { productId: orderLine.productId, code: received.batchCode } }, create: { productId: orderLine.productId, code: received.batchCode, expiresAt: received.expiresAt }, update: { expiresAt: received.expiresAt } }); batchId = batch.id; }
        await tx.goodsReceiptLine.create({ data: { goodsReceiptId: created.id, purchaseOrderLineId: orderLine.id, productId: orderLine.productId, batchId, quantity: received.quantity, unitCost: orderLine.unitCost } });
        await applyStockMovement(tx, { companyId: access.companyId, stationId: order.stationId, productId: orderLine.productId, batchId, movementType: "PURCHASE_RECEIPT", quantityDelta: received.quantity, unitCost: orderLine.unitCost, referenceType: "GoodsReceipt", referenceId: created.id, occurredById: access.userId, reason: `Receipt against ${order.orderNumber}` });
        await tx.purchaseOrderLine.update({ where: { id: orderLine.id }, data: { quantityReceived: { increment: new Prisma.Decimal(received.quantity) } } });
      }
      const refreshed = await tx.purchaseOrderLine.findMany({ where: { purchaseOrderId: order.id } });
      const complete = refreshed.every((line) => line.quantityReceived.gte(line.quantityOrdered));
      await tx.purchaseOrder.update({ where: { id: order.id }, data: { status: complete ? "RECEIVED" : "PARTIALLY_RECEIVED", version: { increment: 1 } } });
      const posted = await tx.goodsReceipt.update({ where: { id: created.id }, data: { status: "POSTED", postedAt: new Date() }, include: { lines: true } });
      await enqueueOutbox(tx, { companyId: access.companyId, aggregateType: "GoodsReceipt", aggregateId: posted.id, eventType: "inventory.goods_received", payload: { receiptNumber, purchaseOrderId: order.id, stationId: order.stationId } });
      await writeAudit(tx, { companyId: access.companyId, actorId: access.userId, stationId: order.stationId, action: "goods_receipt.posted", entityType: "GoodsReceipt", entityId: posted.id, requestId, after: posted });
      return posted;
    }, { isolationLevel: "Serializable", timeout: 30000, maxWait: 15000 });
    return apiSuccess(receipt, requestId, { created: true });
  } catch (error) { return apiFailure(error, requestId); }
}
