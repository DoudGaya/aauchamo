import { Prisma } from "@/lib/generated/prisma/client";
import { requireAccess, requirePermission } from "@/lib/server/access";
import { apiFailure, apiSuccess, requestIdFrom } from "@/lib/server/api";
import { dashboardFilters } from "@/lib/server/dashboard";
import { db } from "@/lib/server/db";

type TrendRow = { day: Date; revenue: Prisma.Decimal; transactions: bigint };
export async function GET(request: Request) { const requestId = requestIdFrom(request); try { const access = requirePermission(await requireAccess(), "dashboard.view"); const filters = dashboardFilters(request, access); const rows = await db.$queryRaw<TrendRow[]>(Prisma.sql`SELECT date_trunc('day', "postedAt") AS day, COALESCE(SUM(total), 0) AS revenue, COUNT(*)::bigint AS transactions FROM sales WHERE "companyId" = ${access.companyId} AND status = 'POSTED'::"SaleStatus" AND "postedAt" >= ${filters.start} AND "postedAt" <= ${filters.end} ${filters.stationIds ? Prisma.sql`AND "stationId" IN (${Prisma.join(filters.stationIds)})` : Prisma.empty} ${filters.businessUnitIds ? Prisma.sql`AND "businessUnitId" IN (${Prisma.join(filters.businessUnitIds)})` : Prisma.empty} GROUP BY 1 ORDER BY 1`); return apiSuccess(rows.map((row) => ({ date: row.day, revenue: row.revenue.toString(), transactions: Number(row.transactions) })), requestId); } catch (error) { return apiFailure(error, requestId); } }
