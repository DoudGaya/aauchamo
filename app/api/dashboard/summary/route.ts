import { requireAccess, requirePermission } from "@/lib/server/access";
import { apiFailure, apiSuccess, requestIdFrom } from "@/lib/server/api";
import { dashboardFilters, stationFilter } from "@/lib/server/dashboard";
import { db } from "@/lib/server/db";

export async function GET(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "dashboard.view");
    const filters = dashboardFilters(request, access); const scoped = stationFilter(filters.stationIds);
    const saleWhere = { companyId: access.companyId, ...scoped, postedAt: { gte: filters.start, lte: filters.end }, status: "POSTED" as const, ...(filters.businessUnitIds ? { businessUnitId: { in: filters.businessUnitIds } } : {}) };
    const [sales, refunds, stock, lowStock, customers, agents, staff, stations, cargo, approvals, outstanding] = await Promise.all([
      db.sale.aggregate({ where: saleWhere, _sum: { total: true, outstandingTotal: true }, _count: true }),
      db.refund.aggregate({ where: { companyId: access.companyId, ...scoped, status: "POSTED", postedAt: { gte: filters.start, lte: filters.end } }, _sum: { amount: true }, _count: true }),
      db.inventoryBalance.aggregate({ where: filters.stationIds ? { stationId: { in: filters.stationIds } } : {}, _sum: { quantity: true }, _count: true }),
      db.inventoryBalance.count({ where: { ...(filters.stationIds ? { stationId: { in: filters.stationIds } } : {}), quantity: { lte: 0 } } }),
      db.customer.count({ where: { companyId: access.companyId, status: "ACTIVE", ...(filters.stationIds ? { homeStationId: { in: filters.stationIds } } : {}) } }),
      db.agent.count({ where: { companyId: access.companyId, status: "ACTIVE", ...(filters.stationIds ? { homeStationId: { in: filters.stationIds } } : {}) } }),
      db.staff.count({ where: { companyId: access.companyId, status: "ACTIVE", ...(filters.stationIds ? { homeStationId: { in: filters.stationIds } } : {}) } }),
      db.station.count({ where: { companyId: access.companyId, status: "ACTIVE", ...(filters.stationIds ? { id: { in: filters.stationIds } } : {}) } }),
      db.cargoShipment.groupBy({ by: ["status"], where: { companyId: access.companyId, ...scoped, createdAt: { gte: filters.start, lte: filters.end } }, _count: true }),
      db.approvalRequest.count({ where: { companyId: access.companyId, status: "PENDING", ...(filters.stationIds ? { OR: [{ stationId: null }, { stationId: { in: filters.stationIds } }] } : {}) } }),
      db.outstandingPayment.aggregate({ where: { sale: saleWhere, outstanding: { gt: 0 } }, _sum: { outstanding: true }, _count: true }),
    ]);
    const gross = sales._sum.total?.toString() ?? "0"; const refundTotal = refunds._sum.amount?.toString() ?? "0";
    return apiSuccess({ range: { from: filters.start, to: filters.end }, sales: { grossRevenue: gross, refunds: refundTotal, netRevenue: sales._sum.total?.minus(refunds._sum.amount ?? 0).toString() ?? "0", transactions: sales._count, outstanding: sales._sum.outstandingTotal?.toString() ?? "0" }, inventory: { quantity: stock._sum.quantity?.toString() ?? "0", balanceRows: stock._count, outOfStock: lowStock }, entities: { customers, agents, staff, stations }, cargo: Object.fromEntries(cargo.map((item) => [item.status, item._count])), approvals: { pending: approvals }, receivables: { count: outstanding._count, amount: outstanding._sum.outstanding?.toString() ?? "0" }, financialVisible: access.permissions.has("finance.view_profit") }, requestId);
  } catch (error) { return apiFailure(error, requestId); }
}
