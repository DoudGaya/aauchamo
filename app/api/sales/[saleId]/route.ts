import { requireAccess, requirePermission, requireStation } from "@/lib/server/access";
import { NotFoundError, apiFailure, apiSuccess, requestIdFrom } from "@/lib/server/api";
import { db } from "@/lib/server/db";

export async function GET(request: Request, { params }: { params: Promise<{ saleId: string }> }) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "sales.view"); const { saleId } = await params;
    const sale = await db.sale.findFirst({ where: { id: saleId, companyId: access.companyId }, include: { company: { select: { legalName: true, displayName: true, address: true, phone: true, currencyCode: true } }, customer: true, station: true, businessUnit: true, lines: true, allocations: { include: { payment: { include: { paymentMethod: true } } } }, refunds: { include: { lines: true } }, outstanding: true } });
    if (!sale) throw new NotFoundError("Sale was not found."); requireStation(access, sale.stationId);
    return apiSuccess(sale, requestId);
  } catch (error) { return apiFailure(error, requestId); }
}
