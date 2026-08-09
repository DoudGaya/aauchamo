import { requireAccess, requirePermission, requireStation } from "@/lib/server/access";
import { apiFailure, apiSuccess, parsePagination, requestIdFrom } from "@/lib/server/api";
import { db } from "@/lib/server/db";

export async function GET(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "inventory.view");
    const url = new URL(request.url);
    const { page, pageSize, skip, take } = parsePagination(url.searchParams);
    const stationId = url.searchParams.get("stationId") ?? undefined;
    const productId = url.searchParams.get("productId") ?? undefined;
    if (stationId) requireStation(access, stationId);
    const where = { companyId: access.companyId, ...(stationId ? { stationId } : access.companyWide ? {} : { stationId: { in: [...access.stationIds] } }), ...(productId ? { productId } : {}) };
    const [items, total] = await Promise.all([
      db.stockMovement.findMany({ where, include: { product: { select: { id: true, code: true, name: true } }, station: { select: { id: true, code: true, name: true } }, batch: true }, orderBy: { occurredAt: "desc" }, skip, take }),
      db.stockMovement.count({ where }),
    ]);
    const canViewCost = access.permissions.has("inventory.view_cost");
    return apiSuccess(items.map((item) => ({ ...item, unitCost: canViewCost ? item.unitCost : null })), requestId, { page, pageSize, total });
  } catch (error) { return apiFailure(error, requestId); }
}
