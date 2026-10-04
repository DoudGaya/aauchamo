import { requireAccess, requirePermission, requireStation, stationWhere } from "@/lib/server/access";
import { apiFailure, requestIdFrom } from "@/lib/server/api";
import { db } from "@/lib/server/db";

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
    const search = url.searchParams.get("search")?.trim();

    const startDate = url.searchParams.get("startDate") ?? undefined;
    const endDate = url.searchParams.get("endDate") ?? undefined;

    const where: any = {
      companyId: access.companyId,
      ...stationWhere(access, stationId),
      ...(customerId ? { customerId } : {}),
      ...(airline ? { airline: { equals: airline, mode: "insensitive" } } : {}),
      ...(origin ? { origin: { equals: origin, mode: "insensitive" } } : {}),
      ...(destination ? { destination: { equals: destination, mode: "insensitive" } } : {}),
      ...(isFragileParam !== undefined ? { isFragile: isFragileParam === "true" } : {}),
      ...(search
        ? {
            OR: [
              { awbNumber: { contains: search, mode: "insensitive" as const } },
              { senderName: { contains: search, mode: "insensitive" as const } },
              { receiverName: { contains: search, mode: "insensitive" as const } },
              { senderPhone: { contains: search, mode: "insensitive" as const } },
              { receiverPhone: { contains: search, mode: "insensitive" as const } },
              { commodity: { contains: search, mode: "insensitive" as const } },
              { flightNumber: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    if (statusParam) {
      const statuses = statusParam.split(",").map((s) => s.trim()).filter(Boolean);
      if (statuses.length === 1) {
        where.status = statuses[0];
      } else if (statuses.length > 1) {
        where.status = { in: statuses };
      }
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const shipments = await db.cargoShipment.findMany({
      where,
      include: {
        customer: { select: { customerNumber: true, displayName: true } },
        station: { select: { code: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50_000,
    });

    const headers = [
      "AWB Number",
      "Created Date",
      "Station",
      "Customer",
      "Sender Name",
      "Sender Phone",
      "Receiver Name",
      "Receiver Phone",
      "Receiver Address",
      "Origin",
      "Destination",
      "Weight (kg)",
      "Pieces",
      "Commodity",
      "Airline",
      "Flight Number",
      "Flight Date",
      "Declared Value (NGN)",
      "Fragile",
      "Status",
      "Label Version",
      "Reprint Count",
    ];

    const csvRows = [headers.map((h) => `"${h}"`).join(",")];

    for (const s of shipments) {
      const row = [
        s.awbNumber,
        s.createdAt.toISOString(),
        s.station?.code || s.stationId,
        s.customer?.displayName || "",
        s.senderName,
        s.senderPhone,
        s.receiverName,
        s.receiverPhone,
        s.receiverAddress || "",
        s.origin,
        s.destination,
        String(s.weightKg),
        String(s.pieces),
        s.commodity,
        s.airline || "",
        s.flightNumber || "",
        s.flightDate ? s.flightDate.toISOString().slice(0, 10) : "",
        s.declaredValue ? String(s.declaredValue) : "0.00",
        s.isFragile ? "Yes" : "No",
        s.status,
        `v${s.labelVersion}`,
        String(s.reprintCount),
      ];

      csvRows.push(row.map((val) => `"${(val ?? "").toString().replace(/"/g, '""')}"`).join(","));
    }

    const csvString = csvRows.join("\r\n");

    return new Response(csvString, {
      status: 200,
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="cargo_export_${new Date().toISOString().slice(0, 10)}.csv"`,
        "x-request-id": requestId,
      },
    });
  } catch (error) {
    return apiFailure(error, requestId);
  }
}
