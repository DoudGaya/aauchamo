import { z } from "zod";

import { requireAccess, requirePermission, requireStation } from "@/lib/server/access";
import { AppError, apiFailure, apiSuccess, parseJson, parsePagination, requestIdFrom } from "@/lib/server/api";
import { db } from "@/lib/server/db";
import { postSale } from "@/lib/server/sales";

const saleSchema = z.object({
  stationId: z.string().cuid(), businessUnitId: z.string().cuid(), customerId: z.string().cuid(), agentId: z.string().cuid().optional(), posSessionId: z.string().cuid().optional(),
  lines: z.array(z.object({ productId: z.string().cuid(), quantity: z.string().regex(/^\d+(\.\d{1,3})?$/), discountAmount: z.string().regex(/^\d+(\.\d{1,2})?$/).optional() })).min(1).max(100),
  payments: z.array(z.object({ paymentMethodId: z.string().cuid(), amount: z.string().regex(/^\d+(\.\d{1,2})?$/), reference: z.string().trim().max(120).optional(), terminalId: z.string().trim().max(80).optional() })).max(10),
});

export async function GET(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "sales.view"); const url = new URL(request.url); const { page, pageSize, skip, take } = parsePagination(url.searchParams); const stationId = url.searchParams.get("stationId") ?? undefined; if (stationId) requireStation(access, stationId);
    const businessUnitId = url.searchParams.get("businessUnitId") ?? undefined;
    const where = { companyId: access.companyId, ...(stationId ? { stationId } : access.companyWide && !access.stationIds.size ? {} : { stationId: { in: [...access.stationIds] } }), ...(businessUnitId ? { businessUnitId } : {}) };
    const [items, total, totals] = await Promise.all([
      db.sale.findMany({ where, include: { customer: { select: { id: true, customerNumber: true, displayName: true } }, station: { select: { id: true, code: true, name: true } }, businessUnit: { select: { id: true, code: true, name: true } }, lines: { select: { id: true, productCode: true, productName: true, quantity: true, unitPrice: true, lineTotal: true } }, allocations: { include: { payment: { include: { paymentMethod: true } } } } }, orderBy: { postedAt: "desc" }, skip, take }),
      db.sale.count({ where }), db.sale.aggregate({ where: { ...where, status: { in: ["POSTED", "PARTIALLY_PAID", "PAID", "PARTIALLY_REFUNDED"] } }, _sum: { total: true, paidTotal: true, outstandingTotal: true } }),
    ]);
    return apiSuccess(items, requestId, { page, pageSize, total, summary: totals._sum });
  } catch (error) { return apiFailure(error, requestId); }
}

export async function POST(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "sales.create"); const payload = await parseJson(request, saleSchema); requireStation(access, payload.stationId, true);
    const idempotencyKey = request.headers.get("idempotency-key")?.trim(); if (!idempotencyKey || idempotencyKey.length < 8 || idempotencyKey.length > 120) throw new AppError("IDEMPOTENCY_KEY_REQUIRED", "A valid Idempotency-Key header is required.", 422);
    const posted = await db.$transaction((tx) => postSale({ tx, access, payload, idempotencyKey, requestId }), { isolationLevel: "Serializable", maxWait: 10_000, timeout: 20_000 });
    return apiSuccess(posted.result, requestId, { created: !posted.replayed, replayed: posted.replayed });
  } catch (error) { return apiFailure(error, requestId); }
}
