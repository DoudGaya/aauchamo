import { requireAccess, requirePermission, requireStation } from "@/lib/server/access";
import { apiFailure, apiSuccess, requestIdFrom } from "@/lib/server/api";
import { db } from "@/lib/server/db";

function getBucketKey(date: Date, interval: string): string {
  const iso = date.toISOString();
  if (interval === "hourly") {
    return iso.slice(0, 13) + ":00";
  } else if (interval === "monthly") {
    return iso.slice(0, 7);
  } else if (interval === "yearly") {
    return iso.slice(0, 4);
  } else if (interval === "weekly") {
    const d = new Date(date);
    const day = d.getUTCDay();
    const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), diff));
    return startOfWeek.toISOString().slice(0, 10);
  } else {
    return iso.slice(0, 10);
  }
}

function calculateTrend(sales: any[], interval: string, includeProfit: boolean) {
  const buckets = new Map<string, {
    bucket: string;
    grossSales: number;
    netSales: number;
    discounts: number;
    tax: number;
    refunds: number;
    cancellations: number;
    profit: number | null;
    cost: number;
  }>();

  for (const s of sales) {
    const key = getBucketKey(s.postedAt, interval);
    const b = buckets.get(key) || {
      bucket: key,
      grossSales: 0,
      netSales: 0,
      discounts: 0,
      tax: 0,
      refunds: 0,
      cancellations: 0,
      profit: includeProfit ? 0 : null,
      cost: 0,
    };

    if (s.status === "CANCELLED") {
      b.cancellations += Number(s.total);
      buckets.set(key, b);
      continue;
    }

    let saleGross = 0;
    let saleDiscount = 0;
    let saleTax = 0;
    let saleCost = 0;

    for (const line of s.lines) {
      const qty = Number(line.quantity);
      saleGross += qty * Number(line.unitPrice);
      saleDiscount += Number(line.discountAmount);
      saleTax += Number(line.taxAmount);
      saleCost += Number(line.costPrice) * qty;
    }

    let saleRefunds = 0;
    for (const r of s.refunds) {
      if (r.status === "POSTED") saleRefunds += Number(r.amount);
    }

    b.grossSales += saleGross;
    b.discounts += saleDiscount;
    b.tax += saleTax;
    b.refunds += saleRefunds;
    b.cost += saleCost;
    b.netSales += (saleGross - saleDiscount + saleTax - saleRefunds);

    if (includeProfit) {
      b.profit = (b.profit || 0) + (saleGross - saleDiscount + saleTax - saleRefunds - saleCost);
    }

    buckets.set(key, b);
  }

  // Sort chronologically by bucket key
  return Array.from(buckets.values()).sort((a, b) => a.bucket.localeCompare(b.bucket));
}

export async function GET(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "sales.view");
    const includeProfit = access.permissions.has("sales.view_profit");

    const url = new URL(request.url);
    const stationId = url.searchParams.get("stationId") ?? undefined;
    if (stationId) requireStation(access, stationId);
    const businessUnitId = url.searchParams.get("businessUnitId") ?? undefined;
    const officerId = url.searchParams.get("officerId") ?? undefined;
    const customerId = url.searchParams.get("customerId") ?? undefined;
    const airline = url.searchParams.get("airline") ?? undefined;

    const interval = url.searchParams.get("interval") ?? "daily";
    const startDate = url.searchParams.get("startDate") ?? undefined;
    const endDate = url.searchParams.get("endDate") ?? undefined;

    const compareStartDate = url.searchParams.get("compareStartDate") ?? undefined;
    const compareEndDate = url.searchParams.get("compareEndDate") ?? undefined;

    const baseWhere = {
      companyId: access.companyId,
      ...(stationId ? { stationId } : access.companyWide && !access.stationIds.size ? {} : { stationId: { in: [...access.stationIds] } }),
      ...(businessUnitId ? { businessUnitId } : {}),
      ...(officerId ? { officerId } : {}),
      ...(customerId ? { customerId } : {}),
      ...(airline ? { customer: { defaultAirline: airline } } : {}),
    };

    const mainWhere: any = { ...baseWhere };
    if (startDate || endDate) {
      mainWhere.postedAt = {};
      if (startDate) mainWhere.postedAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        mainWhere.postedAt.lte = end;
      }
    }

    const sales = await db.sale.findMany({
      where: mainWhere,
      include: {
        lines: true,
        refunds: true,
      },
    });

    const trend = calculateTrend(sales, interval, includeProfit);

    let compareTrend = null;
    if (compareStartDate || compareEndDate) {
      const compareWhere: any = { ...baseWhere };
      compareWhere.postedAt = {};
      if (compareStartDate) compareWhere.postedAt.gte = new Date(compareStartDate);
      if (compareEndDate) {
        const end = new Date(compareEndDate);
        end.setHours(23, 59, 59, 999);
        compareWhere.postedAt.lte = end;
      }

      const compareSales = await db.sale.findMany({
        where: compareWhere,
        include: {
          lines: true,
          refunds: true,
        },
      });

      compareTrend = calculateTrend(compareSales, interval, includeProfit);
    }

    return apiSuccess({
      trend,
      compareTrend,
    }, requestId);
  } catch (error) {
    return apiFailure(error, requestId);
  }
}
