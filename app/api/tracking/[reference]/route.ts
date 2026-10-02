import { db } from "@/lib/server/db";
import { requestIdFrom } from "@/lib/server/api";

export async function GET(request: Request, context: { params: Promise<{ reference: string }> }) {
  const requestId = requestIdFrom(request);
  try {
    const authHeader = request.headers.get("authorization")?.trim();
    const token = authHeader?.replace(/^Bearer\s+/i, "");
    const expectedToken = process.env.CARGO_TRACKING_API_TOKEN || process.env.INVENTORY_API_TOKEN;

    // Optional token validation (if a secret token is configured in ERP environment)
    if (expectedToken && token !== expectedToken) {
      return Response.json(
        { error: "Unauthorized access to cargo tracking API." },
        { status: 401 }
      );
    }

    const { reference: rawReference } = await context.params;
    const reference = rawReference.trim();

    const shipment = await db.cargoShipment.findFirst({
      where: {
        OR: [
          { awbNumber: { equals: reference, mode: "insensitive" } },
          { id: reference },
        ],
      },
      select: {
        id: true,
        awbNumber: true,
        origin: true,
        destination: true,
        status: true,
        pieces: true,
        weightKg: true,
        commodity: true,
        createdAt: true,
        updatedAt: true,
        events: {
          select: {
            id: true,
            status: true,
            location: true,
            notes: true,
            occurredAt: true,
          },
          orderBy: { occurredAt: "desc" },
          take: 10,
        },
      },
    });

    if (!shipment) {
      return Response.json(
        { error: `Shipment with reference ${reference} not found in cargo system.` },
        { status: 404 }
      );
    }

    const latestEvent = shipment.events[0];

    return Response.json({
      reference: shipment.awbNumber,
      status: shipment.status,
      origin: shipment.origin,
      destination: shipment.destination,
      pieces: shipment.pieces,
      weightKg: shipment.weightKg.toString(),
      commodity: shipment.commodity,
      description: latestEvent?.notes || `Shipment is currently ${shipment.status.replace(/_/g, " ").toLowerCase()}.`,
      updatedAt: shipment.updatedAt.toISOString(),
      events: shipment.events,
    });
  } catch (error) {
    console.error(`[Tracking API] Error fulfilling request ${requestId}:`, error);
    return Response.json(
      { error: "Unable to retrieve tracking information from cargo system." },
      { status: 500 }
    );
  }
}
