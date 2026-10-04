import { requireAccess, requirePermission, requireStation, stationWhere } from "@/lib/server/access";
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

function calculateCargoTrend(shipments: any[], interval: string) {
  const buckets = new Map<string, {
    bucket: string;
    shipments: number;
    weightKg: number;
    pieces: number;
    declaredValue: number;
    delivered: number;
  }>();

  for (const s of shipments) {
    const key = getBucketKey(new Date(s.createdAt), interval);
    const b = buckets.get(key) || {
      bucket: key,
      shipments: 0,
      weightKg: 0,
      pieces: 0,
      declaredValue: 0,
      delivered: 0,
    };

    b.shipments++;
    b.weightKg += Number(s.weightKg ?? 0);
    b.pieces += Number(s.pieces ?? 0);
    b.declaredValue += Number(s.declaredValue ?? 0);
    if (s.status === "DELIVERED") {
      b.delivered++;
    }

    buckets.set(key, b);
  }

  return Array.from(buckets.values())
    .map((b) => ({
      ...b,
      weightKg: Number(b.weightKg.toFixed(3)),
      declaredValue: Number(b.declaredValue.toFixed(2)),
    }))
    .sort((a, b) => a.bucket.localeCompare(b.bucket));
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

    const interval = url.searchParams.get("interval") ?? "daily";
    const startDate = url.searchParams.get("startDate") ?? undefined;
    const endDate = url.searchParams.get("endDate") ?? undefined;

    const compareStartDate = url.searchParams.get("compareStartDate") ?? undefined;
    const compareEndDate = url.searchParams.get("compareEndDate") ?? undefined;

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
      select: {
        createdAt: true,
        weightKg: true,
        pieces: true,
        declaredValue: true,
        status: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const trend = calculateCargoTrend(shipments, interval);

    let compareTrend = null;
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
        select: {
          createdAt: true,
          weightKg: true,
          pieces: true,
          declaredValue: true,
          status: true,
        },
        orderBy: { createdAt: "asc" },
      });

      compareTrend = calculateCargoTrend(compareShipments, interval);
    }

    return apiSuccess({
      trend,
      compareTrend,
    }, requestId);
  } catch (error) {
    return apiFailure(error, requestId);
  }
}
