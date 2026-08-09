import { requireAccess, requirePermission, requireStation } from "@/lib/server/access";
import { AppError, apiFailure, apiSuccess, requestIdFrom } from "@/lib/server/api";
import { db } from "@/lib/server/db";

export async function GET(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "sales.create"); const stationId = new URL(request.url).searchParams.get("stationId"); if (!stationId) throw new AppError("STATION_REQUIRED", "A station is required.", 422); requireStation(access, stationId, true);
    const [products, customers, paymentMethods, businessUnits, agents] = await Promise.all([
      db.product.findMany({ where: { companyId: access.companyId, status: "ACTIVE" }, include: { unit: true, balances: { where: { stationId, batchKey: "" } } }, orderBy: { name: "asc" }, take: 500 }),
      db.customer.findMany({ where: { companyId: access.companyId, status: "ACTIVE", ...(access.companyWide ? {} : { homeStationId: { in: [...access.stationIds] } }) }, select: { id: true, customerNumber: true, displayName: true, primaryPhone: true }, orderBy: { displayName: "asc" }, take: 500 }),
      db.paymentMethod.findMany({ where: { companyId: access.companyId, isActive: true }, orderBy: { displayOrder: "asc" } }),
      db.stationBusinessUnit.findMany({ where: { stationId, businessUnit: { isActive: true } }, include: { businessUnit: true }, orderBy: { businessUnit: { name: "asc" } } }),
      db.agent.findMany({ where: { companyId: access.companyId, status: "ACTIVE", ...(access.companyWide ? {} : { homeStationId: { in: [...access.stationIds] } }) }, include: { wallet: true }, orderBy: { name: "asc" } }),
    ]);
    return apiSuccess({ products: products.map((product) => ({ ...product, purchasePrice: undefined, available: product.balances.reduce((sum, row) => sum + row.quantity.toNumber(), 0) })), customers, paymentMethods, businessUnits: businessUnits.map((link) => link.businessUnit), agents }, requestId);
  } catch (error) { return apiFailure(error, requestId); }
}
