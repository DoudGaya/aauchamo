import { z } from "zod";

import { Prisma } from "@/lib/generated/prisma/client";
import { requireAccess, requirePermission, requireStation } from "@/lib/server/access";
import { AppError, apiFailure, apiSuccess, parseJson, parsePagination, requestIdFrom } from "@/lib/server/api";
import { writeAudit } from "@/lib/server/audit";
import { db } from "@/lib/server/db";
import { allocateSequence } from "@/lib/server/sequence";

const purchaseSchema = z.object({ stationId: z.string().cuid(), businessUnitId: z.string().cuid().optional(), supplierId: z.string().cuid(), expectedDate: z.coerce.date().optional(), notes: z.string().trim().max(1_000).optional(), lines: z.array(z.object({ productId: z.string().cuid(), quantity: z.string().regex(/^\d+(\.\d{1,3})?$/), unitCost: z.string().regex(/^\d+(\.\d{1,2})?$/), taxRate: z.string().regex(/^\d+(\.\d{1,4})?$/).default("0") })).min(1).max(100) });

export async function GET(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "purchases.view");
    const url = new URL(request.url); const { page, pageSize, skip, take } = parsePagination(url.searchParams); const stationId = url.searchParams.get("stationId") ?? undefined; if (stationId) requireStation(access, stationId);
    const where = { companyId: access.companyId, ...(stationId ? { stationId } : access.companyWide ? {} : { stationId: { in: [...access.stationIds] } }) };
    const [items, total] = await Promise.all([db.purchaseOrder.findMany({ where, include: { supplier: true, station: { select: { id: true, code: true, name: true } }, lines: { include: { product: { select: { id: true, code: true, name: true, trackBatches: true, trackExpiry: true } } } } }, orderBy: { createdAt: "desc" }, skip, take }), db.purchaseOrder.count({ where })]);
    return apiSuccess(items, requestId, { page, pageSize, total });
  } catch (error) { return apiFailure(error, requestId); }
}

export async function POST(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "purchases.manage"); const input = await parseJson(request, purchaseSchema); requireStation(access, input.stationId, true);
    const [supplier, products] = await Promise.all([db.supplier.findFirst({ where: { id: input.supplierId, companyId: access.companyId, isActive: true } }), db.product.findMany({ where: { id: { in: input.lines.map((line) => line.productId) }, companyId: access.companyId, status: "ACTIVE" }, select: { id: true } })]);
    if (!supplier || products.length !== new Set(input.lines.map((line) => line.productId)).size) throw new AppError("INVALID_PURCHASE_REFERENCE", "Supplier or product is invalid.", 422);
    const order = await db.$transaction(async (tx) => {
      const orderNumber = await allocateSequence(tx, { companyId: access.companyId, stationId: input.stationId, businessUnitId: input.businessUnitId, documentType: "PURCHASE_ORDER", prefix: "PO", includeDate: true, padding: 5 });
      let subtotal = new Prisma.Decimal(0); let taxTotal = new Prisma.Decimal(0);
      const lines = input.lines.map((line) => { const base = new Prisma.Decimal(line.unitCost).times(line.quantity).toDecimalPlaces(2); const tax = base.times(line.taxRate).div(100).toDecimalPlaces(2); subtotal = subtotal.plus(base); taxTotal = taxTotal.plus(tax); return { productId: line.productId, quantityOrdered: line.quantity, unitCost: line.unitCost, taxRate: line.taxRate, lineTotal: base.plus(tax) }; });
      const created = await tx.purchaseOrder.create({ data: { companyId: access.companyId, stationId: input.stationId, businessUnitId: input.businessUnitId, supplierId: input.supplierId, orderNumber, expectedDate: input.expectedDate, notes: input.notes, subtotal, taxTotal, total: subtotal.plus(taxTotal), createdById: access.userId, lines: { create: lines } }, include: { lines: true, supplier: true } });
      await writeAudit(tx, { companyId: access.companyId, actorId: access.userId, stationId: input.stationId, businessUnitId: input.businessUnitId, action: "purchase.created", entityType: "PurchaseOrder", entityId: created.id, requestId, after: created });
      return created;
    });
    return apiSuccess(order, requestId, { created: true });
  } catch (error) { return apiFailure(error, requestId); }
}
