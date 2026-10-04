import { requireAccess, requirePermission, requireStation, stationWhere } from "@/lib/server/access";
import { apiFailure, apiSuccess, requestIdFrom } from "@/lib/server/api";
import { db } from "@/lib/server/db";

function calculateCargoSummary(shipments: any[]) {
  let totalShipments = 0;
  let totalWeightKg = 0;
  let totalPieces = 0;
  let totalDeclaredValue = 0;
  let processingCount = 0;
  let inTransitCount = 0;
  let deliveredCount = 0;
  let onHoldCount = 0;
  let cancelledCount = 0;

  for (const s of shipments) {
    totalShipments++;
    const weight = Number(s.weightKg ?? 0);
    const pieces = Number(s.pieces ?? 0);
    const declared = Number(s.declaredValue ?? 0);

    totalWeightKg += weight;
    totalPieces += pieces;
    totalDeclaredValue += declared;

    switch (s.status) {
      case "DRAFT":
      case "PROCESSING":
      case "LABELLED":
        processingCount++;
        break;
      case "DISPATCHED":
      case "IN_TRANSIT":
      case "ARRIVED":
        inTransitCount++;
        break;
      case "DELIVERED":
        deliveredCount++;
        break;
      case "ON_HOLD":
        onHoldCount++;
        break;
      case "CANCELLED":
        cancelledCount++;
        break;
    }
  }

  const activeDeliveries = deliveredCount + inTransitCount + onHoldCount;
  const deliverySuccessRate = activeDeliveries > 0 ? Math.round((deliveredCount / activeDeliveries) * 100) : (totalShipments > 0 ? 100 : 0);
  const avgWeightKg = totalShipments > 0 ? Number((totalWeightKg / totalShipments).toFixed(2)) : 0;

  return {
    totalShipments,
    totalWeightKg: Number(totalWeightKg.toFixed(3)),
    totalPieces,
    totalDeclaredValue: Number(totalDeclaredValue.toFixed(2)),
    avgWeightKg,
    processingCount,
    inTransitCount,
    deliveredCount,
    onHoldCount,
    cancelledCount,
    deliverySuccessRate,
  };
}

export async function GET(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "cargo.view");

    const url = new URL(request.url);
    const stationId = url.searchParams.get("stationId") ?? undefined;
    if (stationId) requireStation(access, stationId);

    const statusParam = url.searchParams.get("status") ?? undefined;
    const origin = url.searchParams.get("origin") ?? undefined;
    const destination = url.searchParams.get("destination") ?? undefined;
    const airline = url.searchParams.get("airline") ?? undefined;
    const customerId = url.searchParams.get("customerId") ?? undefined;
    const isFragileParam = url.searchParams.get("isFragile") ?? undefined;

    const startDate = url.searchParams.get("startDate") ?? undefined;
    const endDate = url.searchParams.get("endDate") ?? undefined;

    const compareStartDate = url.searchParams.get("compareStartDate") ?? undefined;
    const compareEndDate = url.searchParams.get("compareEndDate") ?? undefined;

    // Base filter
    const baseWhere: any = {
      companyId: access.companyId,
      ...stationWhere(access, stationId),
      ...(customerId ? { customerId } : {}),
      ...(airline ? { airline: { equals: airline, mode: "insensitive" } } : {}),
      ...(origin ? { origin: { equals: origin, mode: "insensitive" } } : {}),
      ...(destination ? { destination: { equals: destination, mode: "insensitive" } } : {}),
      ...(isFragileParam !== undefined ? { isFragile: isFragileParam === "true" } : {}),
    };

    if (statusParam) {
      const statuses = statusParam.split(",").map((s) => s.trim()).filter(Boolean);
      if (statuses.length === 1) {
        baseWhere.status = statuses[0];
      } else if (statuses.length > 1) {
        baseWhere.status = { in: statuses };
      }
    }

    // 1. Fetch main period shipments
    const mainWhere: any = { ...baseWhere };
    if (startDate || endDate) {
      mainWhere.createdAt = {};
      if (startDate) {
        mainWhere.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        mainWhere.createdAt.lte = end;
      }
    }

    const shipments = await db.cargoShipment.findMany({
      where: mainWhere,
      include: {
        customer: { select: { id: true, customerNumber: true, displayName: true } },
        station: { select: { id: true, code: true, name: true } },
      },
    });

    const summary = calculateCargoSummary(shipments);

    // 2. Fetch comparative period shipments if requested
    let compareSummary = null;
    if (compareStartDate || compareEndDate) {
      const compareWhere: any = { ...baseWhere };
      compareWhere.createdAt = {};
      if (compareStartDate) {
        compareWhere.createdAt.gte = new Date(compareStartDate);
      }
      if (compareEndDate) {
        const end = new Date(compareEndDate);
        end.setHours(23, 59, 59, 999);
        compareWhere.createdAt.lte = end;
      }

      const compareShipments = await db.cargoShipment.findMany({
        where: compareWhere,
      });
      compareSummary = calculateCargoSummary(compareShipments);
    }

    // 3. Compute grouping aggregates for main period
    const byStationMap = new Map<string, { code: string; name: string; count: number; totalWeightKg: number; totalPieces: number; totalDeclaredValue: number }>();
    const byRouteMap = new Map<string, { route: string; origin: string; destination: string; count: number; totalWeightKg: number; totalPieces: number }>();
    const byAirlineMap = new Map<string, { airline: string; count: number; totalWeightKg: number; totalPieces: number }>();
    const byStatusMap = new Map<string, { status: string; count: number; totalWeightKg: number; totalPieces: number }>();
    const byCustomerMap = new Map<string, { id: string; name: string; count: number; totalWeightKg: number; totalPieces: number; totalDeclaredValue: number }>();
    const byCommodityMap = new Map<string, { commodity: string; count: number; totalWeightKg: number; totalPieces: number }>();

    for (const s of shipments) {
      const weight = Number(s.weightKg ?? 0);
      const pieces = Number(s.pieces ?? 0);
      const declared = Number(s.declaredValue ?? 0);

      // Group by Station
      const st = byStationMap.get(s.stationId) || {
        code: s.station?.code ?? s.stationId,
        name: s.station?.name ?? s.stationId,
        count: 0,
        totalWeightKg: 0,
        totalPieces: 0,
        totalDeclaredValue: 0,
      };
      st.count++;
      st.totalWeightKg += weight;
      st.totalPieces += pieces;
      st.totalDeclaredValue += declared;
      byStationMap.set(s.stationId, st);

      // Group by Route
      const routeKey = `${s.origin} → ${s.destination}`;
      const rt = byRouteMap.get(routeKey) || {
        route: routeKey,
        origin: s.origin,
        destination: s.destination,
        count: 0,
        totalWeightKg: 0,
        totalPieces: 0,
      };
      rt.count++;
      rt.totalWeightKg += weight;
      rt.totalPieces += pieces;
      byRouteMap.set(routeKey, rt);

      // Group by Airline
      const airKey = s.airline?.trim() || "Unassigned / General";
      const air = byAirlineMap.get(airKey) || {
        airline: airKey,
        count: 0,
        totalWeightKg: 0,
        totalPieces: 0,
      };
      air.count++;
      air.totalWeightKg += weight;
      air.totalPieces += pieces;
      byAirlineMap.set(airKey, air);

      // Group by Status
      const stKey = s.status;
      const statusObj = byStatusMap.get(stKey) || {
        status: stKey,
        count: 0,
        totalWeightKg: 0,
        totalPieces: 0,
      };
      statusObj.count++;
      statusObj.totalWeightKg += weight;
      statusObj.totalPieces += pieces;
      byStatusMap.set(stKey, statusObj);

      // Group by Customer
      if (s.customer) {
        const custKey = s.customer.id;
        const cust = byCustomerMap.get(custKey) || {
          id: s.customer.id,
          name: s.customer.displayName,
          count: 0,
          totalWeightKg: 0,
          totalPieces: 0,
          totalDeclaredValue: 0,
        };
        cust.count++;
        cust.totalWeightKg += weight;
        cust.totalPieces += pieces;
        cust.totalDeclaredValue += declared;
        byCustomerMap.set(custKey, cust);
      }

      // Group by Commodity
      const commKey = s.commodity?.trim() || "General Goods";
      const comm = byCommodityMap.get(commKey) || {
        commodity: commKey,
        count: 0,
        totalWeightKg: 0,
        totalPieces: 0,
      };
      comm.count++;
      comm.totalWeightKg += weight;
      comm.totalPieces += pieces;
      byCommodityMap.set(commKey, comm);
    }

    const byStation = Array.from(byStationMap.entries()).map(([id, val]) => ({
      id,
      ...val,
      totalWeightKg: Number(val.totalWeightKg.toFixed(3)),
    })).sort((a, b) => b.totalWeightKg - a.totalWeightKg);

    const byRoute = Array.from(byRouteMap.values()).map((val) => ({
      ...val,
      totalWeightKg: Number(val.totalWeightKg.toFixed(3)),
    })).sort((a, b) => b.totalWeightKg - a.totalWeightKg);

    const byAirline = Array.from(byAirlineMap.values()).map((val) => ({
      ...val,
      totalWeightKg: Number(val.totalWeightKg.toFixed(3)),
    })).sort((a, b) => b.totalWeightKg - a.totalWeightKg);

    const byStatus = Array.from(byStatusMap.values()).map((val) => ({
      ...val,
      totalWeightKg: Number(val.totalWeightKg.toFixed(3)),
    }));

    const byCustomer = Array.from(byCustomerMap.values()).map((val) => ({
      ...val,
      totalWeightKg: Number(val.totalWeightKg.toFixed(3)),
    })).sort((a, b) => b.totalWeightKg - a.totalWeightKg);

    const byCommodity = Array.from(byCommodityMap.values()).map((val) => ({
      ...val,
      totalWeightKg: Number(val.totalWeightKg.toFixed(3)),
    })).sort((a, b) => b.totalWeightKg - a.totalWeightKg).slice(0, 10);

    return apiSuccess({
      summary,
      compareSummary,
      byStation,
      byRoute,
      byAirline,
      byStatus,
      byCustomer,
      byCommodity,
    }, requestId);
  } catch (error) {
    return apiFailure(error, requestId);
  }
}
