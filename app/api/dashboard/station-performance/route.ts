import { Prisma } from "@/lib/generated/prisma/client";
import { requireAccess, requirePermission } from "@/lib/server/access";
import { apiFailure, apiSuccess, requestIdFrom } from "@/lib/server/api";
import { dashboardFilters } from "@/lib/server/dashboard";
import { db } from "@/lib/server/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) { const requestId = requestIdFrom(request); try { const access = requirePermission(await requireAccess(), "dashboard.view"); const filters = dashboardFilters(request, access); const stations = await db.station.findMany({ where: { companyId: access.companyId, status: "ACTIVE", ...(filters.stationIds ? { id: { in: filters.stationIds } } : {}) }, select: { id: true, code: true, name: true, _count: { select: { staffHome: { where: { status: "ACTIVE" } }, cargoShipments: { where: { createdAt: { gte: filters.start, lte: filters.end } } } } }, sales: { where: { postedAt: { gte: filters.start, lte: filters.end }, status: "POSTED", ...(filters.businessUnitIds ? { businessUnitId: { in: filters.businessUnitIds } } : {}) }, select: { total: true, outstandingTotal: true } } }, orderBy: { name: "asc" } }); const res = apiSuccess(stations.map(({ sales, ...station }) => ({ ...station, revenue: sales.reduce((sum, sale) => sum.plus(sale.total), new Prisma.Decimal(0)).toString(), outstanding: sales.reduce((sum, sale) => sum.plus(sale.outstandingTotal), new Prisma.Decimal(0)).toString(), transactions: sales.length })), requestId); res.headers.set("Cache-Control", "private, max-age=15, must-revalidate"); return res; } catch (error) { return apiFailure(error, requestId); } }
