import { requireAccess, requirePermission, requireStation } from "@/lib/server/access";
import { ForbiddenError, apiFailure, apiSuccess, requestIdFrom } from "@/lib/server/api";
import { db } from "@/lib/server/db";
import { SaleStatus, PostingStatus } from "@/lib/generated/prisma/client";

export async function GET(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    const access = await requireAccess();
    // Checked permission
    const hasView = access.permissions.has("finance.view");
    const hasProfit = access.permissions.has("finance.view_profit");
    if (!hasView && !hasProfit) {
      throw new ForbiddenError();
    }

    const url = new URL(request.url);
    const stationId = url.searchParams.get("stationId") ?? undefined;
    const businessUnitId = url.searchParams.get("businessUnitId") ?? undefined;
    const startDateStr = url.searchParams.get("startDate");
    const endDateStr = url.searchParams.get("endDate");

    if (stationId) requireStation(access, stationId);

    const startDate = startDateStr ? new Date(startDateStr) : undefined;
    const endDate = endDateStr ? new Date(endDateStr + "T23:59:59.999Z") : undefined;

    // 1. Where filters for sales
    const salesWhere = {
      companyId: access.companyId,
      status: { in: ["POSTED", "PARTIALLY_PAID", "PAID"] as SaleStatus[] },
      ...(stationId ? { stationId } : access.companyWide && !access.stationIds.size ? {} : { stationId: { in: [...access.stationIds] } }),
      ...(businessUnitId ? { businessUnitId } : {}),
      ...(startDate || endDate
        ? {
            postedAt: {
              ...(startDate ? { gte: startDate } : {}),
              ...(endDate ? { lte: endDate } : {}),
            },
          }
        : {}),
    };

    // 2. Where filters for cashbook entries
    const cbWhere = {
      companyId: access.companyId,
      status: { in: ["POSTED", "RECONCILED"] as PostingStatus[] },
      ...(stationId ? { stationId } : access.companyWide && !access.stationIds.size ? {} : { stationId: { in: [...access.stationIds] } }),
      ...(businessUnitId ? { businessUnitId } : {}),
      ...(startDate || endDate
        ? {
            createdAt: {
              ...(startDate ? { gte: startDate } : {}),
              ...(endDate ? { lte: endDate } : {}),
            },
          }
        : {}),
    };

    // Fetch sales and lines for COGS
    const sales = await db.sale.findMany({
      where: salesWhere as any,
      include: {
        lines: true,
        station: true,
        businessUnit: true,
      },
    });

    // Fetch cashbook entries
    const cashbook = await db.cashbookEntry.findMany({
      where: cbWhere as any,
      include: {
        station: true,
        businessUnit: true,
      },
    });

    // Compute metrics
    let grossSales = 0;
    let costOfSales = 0;
    for (const sale of sales) {
      grossSales += Number(sale.total);
      for (const line of sale.lines) {
        costOfSales += Number(line.costPrice || 0) * Number(line.quantity);
      }
    }

    let manualIncome = 0;
    let manualExpenses = 0;
    for (const cb of cashbook) {
      if (cb.direction === "CREDIT") {
        manualIncome += Number(cb.amount);
      } else {
        manualExpenses += Number(cb.amount);
      }
    }

    const netProfit = grossSales - costOfSales + manualIncome - manualExpenses;

    // Breakdown by station
    const stationsMap: Record<string, { id: string; name: string; code: string; grossSales: number; costOfSales: number; manualIncome: number; manualExpenses: number }> = {};
    const fetchStations = await db.station.findMany({ where: { companyId: access.companyId } });
    for (const st of fetchStations) {
      stationsMap[st.id] = { id: st.id, name: st.name, code: st.code, grossSales: 0, costOfSales: 0, manualIncome: 0, manualExpenses: 0 };
    }

    for (const sale of sales) {
      const entry = stationsMap[sale.stationId];
      if (entry) {
        entry.grossSales += Number(sale.total);
        for (const line of sale.lines) {
          entry.costOfSales += Number(line.costPrice || 0) * Number(line.quantity);
        }
      }
    }

    for (const cb of cashbook) {
      const entry = stationsMap[cb.stationId];
      if (entry) {
        if (cb.direction === "CREDIT") {
          entry.manualIncome += Number(cb.amount);
        } else {
          entry.manualExpenses += Number(cb.amount);
        }
      }
    }

    const byStation = Object.values(stationsMap)
      .map((st) => ({
        stationId: st.id,
        stationName: st.name,
        stationCode: st.code,
        grossSales: st.grossSales,
        costOfSales: hasProfit ? st.costOfSales : null,
        manualIncome: st.manualIncome,
        manualExpenses: hasProfit ? st.manualExpenses : null,
        netProfit: hasProfit ? st.grossSales - st.costOfSales + st.manualIncome - st.manualExpenses : null,
      }))
      .filter((st) => st.grossSales > 0 || st.manualIncome > 0 || (st.manualExpenses ?? 0) > 0);

    // Response object
    const report = {
      grossSales,
      costOfSales: hasProfit ? costOfSales : null,
      manualIncome,
      manualExpenses: hasProfit ? manualExpenses : null,
      netProfit: hasProfit ? netProfit : null,
      byStation,
    };

    return apiSuccess(report, requestId);
  } catch (error) {
    return apiFailure(error, requestId);
  }
}
