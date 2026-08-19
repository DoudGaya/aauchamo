import { requireAccess, requirePermission } from "@/lib/server/access";
import { apiFailure, apiSuccess, requestIdFrom } from "@/lib/server/api";
import { dashboardFilters, stationFilter } from "@/lib/server/dashboard";
import { db } from "@/lib/server/db";
import { Prisma } from "@/lib/generated/prisma/client";

export async function GET(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "dashboard.view");
    const filters = dashboardFilters(request, access);
    const scoped = stationFilter(filters.stationIds);

    const businessUnitCondition = filters.businessUnitIds
      ? Prisma.sql`AND "businessUnitId" IN (${Prisma.join(filters.businessUnitIds)})`
      : Prisma.empty;

    const stationCondition = filters.stationIds && filters.stationIds.length > 0
      ? Prisma.sql`AND "stationId" IN (${Prisma.join(filters.stationIds)})`
      : Prisma.empty;

    // Use a raw query to group sales by day
    const salesTrends = await db.$queryRaw`
      SELECT 
        DATE_TRUNC('day', "postedAt") as date,
        COALESCE(SUM(total), 0) as sales
      FROM sales
      WHERE "companyId" = ${access.companyId}
        AND status = 'POSTED'
        AND "postedAt" >= ${filters.start}
        AND "postedAt" <= ${filters.end}
        ${stationCondition}
        ${businessUnitCondition}
      GROUP BY DATE_TRUNC('day', "postedAt")
      ORDER BY date ASC
    `;

    // Group refunds by day
    const refundTrends = await db.$queryRaw`
      SELECT 
        DATE_TRUNC('day', r."postedAt") as date,
        COALESCE(SUM(r.amount), 0) as refunds
      FROM refunds r
      ${filters.businessUnitIds ? Prisma.sql`JOIN sales s ON r."saleId" = s.id` : Prisma.empty}
      WHERE r."companyId" = ${access.companyId}
        AND r.status = 'POSTED'
        AND r."postedAt" >= ${filters.start}
        AND r."postedAt" <= ${filters.end}
        ${filters.stationIds && filters.stationIds.length > 0 ? Prisma.sql`AND r."stationId" IN (${Prisma.join(filters.stationIds)})` : Prisma.empty}
        ${filters.businessUnitIds ? Prisma.sql`AND s."businessUnitId" IN (${Prisma.join(filters.businessUnitIds)})` : Prisma.empty}
      GROUP BY DATE_TRUNC('day', r."postedAt")
      ORDER BY date ASC
    `;

    // Merge into a continuous timeline
    const dataMap = new Map<string, { date: string; sales: number; refunds: number }>();
    
    // Initialize days
    let current = new Date(filters.start);
    while (current <= filters.end) {
      const dateStr = current.toISOString().split('T')[0];
      dataMap.set(dateStr, { date: dateStr, sales: 0, refunds: 0 });
      current.setDate(current.getDate() + 1);
    }

    for (const row of salesTrends as any[]) {
      if (!row.date) continue;
      const dateStr = (row.date as Date).toISOString().split('T')[0];
      if (dataMap.has(dateStr)) {
        dataMap.get(dateStr)!.sales = Number(row.sales);
      }
    }

    for (const row of refundTrends as any[]) {
      if (!row.date) continue;
      const dateStr = (row.date as Date).toISOString().split('T')[0];
      if (dataMap.has(dateStr)) {
        dataMap.get(dateStr)!.refunds = Number(row.refunds);
      }
    }

    const res = apiSuccess(Array.from(dataMap.values()), requestId);
    res.headers.set("Cache-Control", "private, max-age=30, must-revalidate");
    return res;
  } catch (error) {
    return apiFailure(error, requestId);
  }
}
