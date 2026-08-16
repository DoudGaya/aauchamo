import { z } from "zod";

import { requireAccess, requirePermission, requireStation } from "@/lib/server/access";
import { AppError, NotFoundError, apiFailure, apiSuccess, parseJson, requestIdFrom } from "@/lib/server/api";
import { writeAudit } from "@/lib/server/audit";
import { db } from "@/lib/server/db";

const statusSchema = z.object({ status: z.enum(["PROCESSING", "LABELLED", "DISPATCHED", "IN_TRANSIT", "ARRIVED", "DELIVERED", "ON_HOLD", "CANCELLED"]), location: z.string().trim().max(120).optional(), notes: z.string().trim().min(3).max(500) });
const transitions: Record<string, string[]> = { DRAFT: ["PROCESSING", "LABELLED", "CANCELLED"], PROCESSING: ["LABELLED", "ON_HOLD", "CANCELLED"], LABELLED: ["DISPATCHED", "ON_HOLD", "CANCELLED"], DISPATCHED: ["IN_TRANSIT", "ARRIVED", "ON_HOLD"], IN_TRANSIT: ["ARRIVED", "ON_HOLD"], ARRIVED: ["DELIVERED", "ON_HOLD"], ON_HOLD: ["PROCESSING", "DISPATCHED", "IN_TRANSIT", "ARRIVED", "CANCELLED"], DELIVERED: [], CANCELLED: [] };

export async function POST(request: Request, { params }: { params: Promise<{ shipmentId: string }> }) {
  const requestId = requestIdFrom(request);
  try {
    const input = await parseJson(request, statusSchema); const requiredPerm = input.status === "CANCELLED" ? "cargo.cancel" : "cargo.change_status"; const access = requirePermission(await requireAccess(), requiredPerm); const { shipmentId } = await params; const shipment = await db.cargoShipment.findFirst({ where: { id: shipmentId, companyId: access.companyId } }); if (!shipment) throw new NotFoundError("Cargo shipment was not found."); requireStation(access, shipment.stationId, true); if (!transitions[shipment.status]?.includes(input.status)) throw new AppError("INVALID_CARGO_TRANSITION", `Cargo cannot move from ${shipment.status} to ${input.status}.`, 409);
    const updated = await db.$transaction(async (tx) => { const row = await tx.cargoShipment.update({ where: { id: shipment.id }, data: { status: input.status, dispatchedAt: input.status === "DISPATCHED" ? new Date() : undefined, deliveredAt: input.status === "DELIVERED" ? new Date() : undefined, version: { increment: 1 }, events: { create: { previousStatus: shipment.status, status: input.status, location: input.location, notes: input.notes, changedById: access.userId } } } }); await writeAudit(tx, { companyId: access.companyId, actorId: access.userId, stationId: shipment.stationId, action: "cargo.status_changed", entityType: "CargoShipment", entityId: shipment.id, reason: input.notes, requestId, before: { status: shipment.status }, after: { status: input.status, location: input.location } }); return row; });
    return apiSuccess(updated, requestId);
  } catch (error) { return apiFailure(error, requestId); }
}
