import { z } from "zod";

import { requireAccess, requirePermission, requireStation } from "@/lib/server/access";
import { NotFoundError, apiFailure, apiSuccess, parseJson, requestIdFrom } from "@/lib/server/api";
import { writeAudit } from "@/lib/server/audit";
import { db } from "@/lib/server/db";

const reprintSchema = z.object({ format: z.enum(["THERMAL", "A4"]), printerName: z.string().trim().max(120).optional(), reason: z.string().trim().min(3).max(500) });
export async function POST(request: Request, { params }: { params: Promise<{ shipmentId: string }> }) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "cargo.reprint"); const input = await parseJson(request, reprintSchema); const { shipmentId } = await params; const shipment = await db.cargoShipment.findFirst({ where: { id: shipmentId, companyId: access.companyId } }); if (!shipment) throw new NotFoundError("Cargo shipment was not found."); requireStation(access, shipment.stationId); const result = await db.$transaction(async (tx) => { const document = await tx.generatedDocument.findFirstOrThrow({ where: { sourceType: "CargoShipment", sourceId: shipment.id, status: "READY" }, orderBy: { version: "desc" } }); await tx.printEvent.create({ data: { documentId: document.id, printedById: access.userId, printerName: input.printerName, format: input.format, reason: input.reason } }); const updated = await tx.cargoShipment.update({ where: { id: shipment.id }, data: { reprintCount: { increment: 1 } } }); await writeAudit(tx, { companyId: access.companyId, actorId: access.userId, stationId: shipment.stationId, action: "cargo.label_reprinted", entityType: "CargoShipment", entityId: shipment.id, reason: input.reason, requestId, metadata: { format: input.format, printerName: input.printerName, printNumber: updated.reprintCount } }); return { labelUrl: `/print/cargo/${shipment.id}?format=${input.format.toLowerCase()}`, reprintCount: updated.reprintCount }; }); return apiSuccess(result, requestId);
  } catch (error) { return apiFailure(error, requestId); }
}
