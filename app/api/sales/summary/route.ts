import { businessUnitWhere, getSalesHistoryLimitDate, requireAccess, requirePermission, requireStation, stationWhere } from "@/lib/server/access";
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
    const productQuery = (url.searchParams.get("product") ?? url.searchParams.get("productId") ?? "").trim();

    const startDate = url.searchParams.get("startDate") ?? undefined;
    const endDate = url.searchParams.get("endDate") ?? undefined;

    const compareStartDate = url.searchParams.get("compareStartDate") ?? undefined;
    const compareEndDate = url.searchParams.get("compareEndDate") ?? undefined;

    // Build base filter
    const baseWhere: any = {
      companyId: access.companyId,
      ...stationWhere(access, stationId),
      ...businessUnitWhere(access, businessUnitId),
      ...(officerId ? { officerId } : {}),
      ...(customerId ? { customerId } : {}),
      ...(airline ? { customer: { defaultAirline: airline } } : {}),
    };

    if (productQuery) {
      baseWhere.lines = {
        some: {
          OR: [
            { productId: productQuery },
            { productName: { contains: productQuery, mode: "insensitive" } },
            { productCode: { contains: productQuery, mode: "insensitive" } },
          ],
        },
      };
    }

    const limitDate = getSalesHistoryLimitDate(access);

    // 1. Fetch main period sales
    const mainWhere: any = { ...baseWhere };
    if (startDate || endDate || limitDate) {
      mainWhere.postedAt = {};
      if (startDate) {
        const parsedStart = new Date(startDate);
        mainWhere.postedAt.gte = limitDate && parsedStart < limitDate ? limitDate : parsedStart;
      } else if (limitDate) {
        mainWhere.postedAt.gte = limitDate;
      }
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
    if (compareStartDate || compareEndDate || limitDate) {
      const compareWhere: any = { ...baseWhere };
      compareWhere.postedAt = {};
      if (compareStartDate) {
        const parsedStart = new Date(compareStartDate);
        compareWhere.postedAt.gte = limitDate && parsedStart < limitDate ? limitDate : parsedStart;
      } else if (limitDate) {
        compareWhere.postedAt.gte = limitDate;
      }
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
    const byProductMap = new Map<string, { id: string; name: string; code: string; gross: number; net: number; cost: number; quantity: number; transactions: Set<string> }>();

    for (const s of sales) {
      if (s.status === "CANCELLED") continue;

      let saleGross = 0;
      let saleDiscount = 0;
      let saleTax = 0;
      let saleCost = 0;

      for (const line of s.lines) {
        const qty = Number(line.quantity || 0);
        const lineGross = qty * Number(line.unitPrice || 0);
        const lineDiscount = Number(line.discountAmount || 0);
        const lineTax = Number(line.taxAmount || 0);
        const lineCost = Number(line.costPrice || 0) * qty;

        saleGross += lineGross;
        saleDiscount += lineDiscount;
        saleTax += lineTax;
        saleCost += lineCost;

        // Group by Product
        const pKey = line.productId || line.productCode || line.productName || "Other";
        const prod = byProductMap.get(pKey) || {
          id: line.productId || pKey,
          name: line.productName || line.productCode || "Product",
          code: line.productCode || "",
          gross: 0,
          net: 0,
          cost: 0,
          quantity: 0,
          transactions: new Set<string>(),
        };
        prod.gross += lineGross;
        prod.net += (lineGross - lineDiscount + lineTax);
        prod.cost += lineCost;
        prod.quantity += qty;
        prod.transactions.add(s.id);
        byProductMap.set(pKey, prod);
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

    // Calculate specific product summary if product is queried
    let selectedProductSummary = null;
    if (productQuery) {
      const qLower = productQuery.toLowerCase();
      let matchedGross = 0;
      let matchedNet = 0;
      let matchedCost = 0;
      let matchedQty = 0;
      const matchedTxIds = new Set<string>();
      let primaryName = "";
      let primaryCode = "";

      for (const [key, p] of byProductMap.entries()) {
        const matches = key.toLowerCase() === qLower ||
                        p.id.toLowerCase() === qLower ||
                        p.name.toLowerCase().includes(qLower) ||
                        p.code.toLowerCase() === qLower;
        if (matches) {
          if (!primaryName) {
            primaryName = p.name;
            primaryCode = p.code;
          }
          matchedGross += p.gross;
          matchedNet += p.net;
          matchedCost += p.cost;
          matchedQty += p.quantity;
          p.transactions.forEach((tx) => matchedTxIds.add(tx));
        }
      }

      if (primaryName || matchedGross > 0 || matchedQty > 0) {
        selectedProductSummary = {
          name: primaryName || productQuery,
          code: primaryCode,
          grossSales: matchedGross,
          netSales: matchedNet,
          quantity: matchedQty,
          transactions: matchedTxIds.size,
          avgTransaction: matchedTxIds.size > 0 ? matchedGross / matchedTxIds.size : 0,
          profit: includeProfit ? matchedNet - matchedCost : null,
          pctOfTotal: summary.grossSales > 0 ? (matchedGross / summary.grossSales) * 100 : 0,
        };
      }
    }

    const byProduct = Array.from(byProductMap.values())
      .map((p) => ({
        id: p.id,
        name: p.name,
        code: p.code,
        grossSales: p.gross,
        netSales: p.net,
        quantity: p.quantity,
        transactions: p.transactions.size,
        profit: includeProfit ? p.net - p.cost : null,
        pctOfTotal: summary.grossSales > 0 ? (p.gross / summary.grossSales) * 100 : 0,
      }))
      .sort((a, b) => b.grossSales - a.grossSales);

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
      selectedProductSummary,
      byProduct,
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
