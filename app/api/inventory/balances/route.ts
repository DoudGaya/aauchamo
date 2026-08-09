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
    if (stationId) requireStation(access, stationId);
    const lowStock = url.searchParams.get("lowStock") === "true";
    const where = stationId ? { stationId } : access.companyWide ? {} : { stationId: { in: [...access.stationIds] } };
    const [rows, total] = await Promise.all([
      db.inventoryBalance.findMany({ where, include: { station: { select: { id: true, code: true, name: true } }, product: { include: { category: true, unit: true } }, batch: true }, orderBy: { updatedAt: "desc" }, skip, take }),
      db.inventoryBalance.count({ where }),
    ]);
    const visible = lowStock ? rows.filter((row) => row.quantity.lte(row.product.reorderLevel)) : rows;
    const canViewCost = access.permissions.has("inventory.view_cost");
    return apiSuccess(visible.map((row) => ({ ...row, product: { ...row.product, purchasePrice: canViewCost ? row.product.purchasePrice : null } })), requestId, { page, pageSize, total: lowStock ? visible.length : total });
  } catch (error) { return apiFailure(error, requestId); }
}
