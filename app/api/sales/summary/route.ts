import { requireAccess, requirePermission, requireStation } from "@/lib/server/access";
import { apiFailure, apiSuccess, requestIdFrom } from "@/lib/server/api";
import { db } from "@/lib/server/db";

function calculateSummary(sales: any[], includeProfit: boolean) {
  let grossSales = 0;
  let discounts = 0;
  let tax = 0;
  let refunds = 0;
  let cancellations = 0;
  let paidTotal = 0;
  let outstandingTotal = 0;
  let cost = 0;

  for (const s of sales) {
    if (s.status === "CANCELLED") {
      cancellations += Number(s.total);
      continue;
    }

    paidTotal += Number(s.paidTotal);
    outstandingTotal += Number(s.outstandingTotal);

    for (const r of s.refunds) {
      if (r.status === "POSTED") {
        refunds += Number(r.amount);
      }
    }

    for (const line of s.lines) {
      const qty = Number(line.quantity);
      grossSales += qty * Number(line.unitPrice);
      discounts += Number(line.discountAmount);
      tax += Number(line.taxAmount);
      cost += Number(line.costPrice) * qty;
    }
  }

  const netSales = grossSales - discounts + tax - refunds;
  const profit = includeProfit ? (netSales - cost) : null;

  return {
    grossSales,
    netSales,
    discounts,
    tax,
    refunds,
    cancellations,
    paidTotal,
    outstandingTotal,
    profit,
  };
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

    const startDate = url.searchParams.get("startDate") ?? undefined;
    const endDate = url.searchParams.get("endDate") ?? undefined;

    const compareStartDate = url.searchParams.get("compareStartDate") ?? undefined;
    const compareEndDate = url.searchParams.get("compareEndDate") ?? undefined;

    // Build base filter
    const baseWhere = {
      companyId: access.companyId,
      ...(stationId ? { stationId } : access.companyWide ? {} : { stationId: { in: [...access.stationIds] } }),
      ...(businessUnitId ? { businessUnitId } : {}),
      ...(officerId ? { officerId } : {}),
      ...(customerId ? { customerId } : {}),
      ...(airline ? { customer: { defaultAirline: airline } } : {}),
    };

    // 1. Fetch main period sales
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

    const [sales, users] = await Promise.all([
      db.sale.findMany({
        where: mainWhere,
        include: {
          customer: true,
          station: true,
          businessUnit: true,
          lines: true,
          allocations: {
            include: {
              payment: {
                include: {
                  paymentMethod: true,
                },
              },
            },
          },
          refunds: true,
        },
      }),
      db.user.findMany({
        where: { companyId: access.companyId },
        select: { id: true, name: true },
      }),
    ]);

    const userMap = new Map(users.map((u) => [u.id, u.name]));
    const summary = calculateSummary(sales, includeProfit);

    // 2. Fetch comparative period sales if requested
    let compareSummary = null;
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
      compareSummary = calculateSummary(compareSales, includeProfit);
    }

    // 3. Compute grouping aggregates for main period
    const byStationMap = new Map<string, { name: string; gross: number; net: number; cost: number }>();
    const byBUMap = new Map<string, { name: string; gross: number; net: number; cost: number }>();
    const byMethodMap = new Map<string, { name: string; net: number }>();
    const byCustomerMap = new Map<string, { name: string; net: number }>();
    const byOfficerMap = new Map<string, { name: string; net: number }>();
    const byAirlineMap = new Map<string, { net: number }>();

    for (const s of sales) {
      if (s.status === "CANCELLED") continue;

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

      const saleNet = saleGross - saleDiscount + saleTax - saleRefunds;

      // Group by Station
      const st = byStationMap.get(s.stationId) || { name: s.station.name, gross: 0, net: 0, cost: 0 };
      st.gross += saleGross;
      st.net += saleNet;
      st.cost += saleCost;
      byStationMap.set(s.stationId, st);

      // Group by Business Unit
      const bu = byBUMap.get(s.businessUnitId) || { name: s.businessUnit.name, gross: 0, net: 0, cost: 0 };
      bu.gross += saleGross;
      bu.net += saleNet;
      bu.cost += saleCost;
      byBUMap.set(s.businessUnitId, bu);

      // Group by Customer
      const cust = byCustomerMap.get(s.customerId) || { name: s.customer.displayName, net: 0 };
      cust.net += saleNet;
      byCustomerMap.set(s.customerId, cust);

      // Group by Officer
      const officerName = userMap.get(s.officerId) || s.officerId;
      const off = byOfficerMap.get(s.officerId) || { name: officerName, net: 0 };
      off.net += saleNet;
      byOfficerMap.set(s.officerId, off);

      // Group by Airline
      const airKey = s.customer.defaultAirline || "General/Other";
      const air = byAirlineMap.get(airKey) || { net: 0 };
      air.net += saleNet;
      byAirlineMap.set(airKey, air);

      // Group by Payment Method (from allocations)
      for (const alloc of s.allocations) {
        const pm = alloc.payment.paymentMethod;
        const methodObj = byMethodMap.get(pm.id) || { name: pm.name, net: 0 };
        methodObj.net += Number(alloc.amount);
        byMethodMap.set(pm.id, methodObj);
      }
    }

    const byStation = Array.from(byStationMap.entries()).map(([id, val]) => ({
      id,
      name: val.name,
      grossSales: val.gross,
      netSales: val.net,
      profit: includeProfit ? val.net - val.cost : null,
    }));

    const byBusinessUnit = Array.from(byBUMap.entries()).map(([id, val]) => ({
      id,
      name: val.name,
      grossSales: val.gross,
      netSales: val.net,
      profit: includeProfit ? val.net - val.cost : null,
    }));

    const byPaymentMethod = Array.from(byMethodMap.entries()).map(([id, val]) => ({
      id,
      name: val.name,
      netSales: val.net,
    }));

    const byCustomer = Array.from(byCustomerMap.entries()).map(([id, val]) => ({
      id,
      name: val.name,
      netSales: val.net,
    }));

    const byOfficer = Array.from(byOfficerMap.entries()).map(([id, val]) => ({
      id,
      name: val.name,
      netSales: val.net,
    }));

    const byAirline = Array.from(byAirlineMap.entries()).map(([airlineName, val]) => ({
      airline: airlineName,
      netSales: val.net,
    }));

    return apiSuccess({
      summary,
      compareSummary,
      byStation,
      byBusinessUnit,
      byPaymentMethod,
      byCustomer,
      byOfficer,
      byAirline,
    }, requestId);
  } catch (error) {
    return apiFailure(error, requestId);
  }
}
