import { requireAccess, requirePermission, requireStation } from "@/lib/server/access";
import { NotFoundError, apiFailure, apiSuccess, requestIdFrom } from "@/lib/server/api";
import { db } from "@/lib/server/db";

export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "inventory.view");
    const { code } = await params;
    const stationId = new URL(request.url).searchParams.get("stationId") ?? undefined;
    if (stationId) requireStation(access, stationId);
    const product = await db.product.findFirst({
      where: { companyId: access.companyId, status: "ACTIVE", OR: [{ code: { equals: code, mode: "insensitive" } }, { barcode: code }] },
      include: { category: true, unit: true, balances: { where: stationId ? { stationId } : access.companyWide ? {} : { stationId: { in: [...access.stationIds] } }, include: { station: true } } },
    });
    if (!product) throw new NotFoundError("No active product matches this code or barcode.");
    return apiSuccess({ ...product, purchasePrice: access.permissions.has("inventory.view_cost") ? product.purchasePrice : null }, requestId);
  } catch (error) { return apiFailure(error, requestId); }
}
