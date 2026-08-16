import { z } from "zod";
import { requireAccess, requirePermission, requireStation } from "@/lib/server/access";
import { AppError, NotFoundError, apiFailure, apiSuccess, parseJson, requestIdFrom } from "@/lib/server/api";
import { writeAudit } from "@/lib/server/audit";
import { db } from "@/lib/server/db";

const patchCargoSchema = z.object({
  senderName: z.string().trim().min(2).max(160).optional(),
  senderPhone: z.string().trim().min(7).max(30).optional(),
  receiverName: z.string().trim().min(2).max(160).optional(),
  receiverPhone: z.string().trim().min(7).max(30).optional(),
  receiverAddress: z.string().trim().max(500).optional().nullable(),
  origin: z.string().trim().min(2).max(80).optional(),
  destination: z.string().trim().min(2).max(80).optional(),
  weightKg: z.string().regex(/^\d+(\.\d{1,3})?$/).optional(),
  pieces: z.number().int().min(1).max(10_000).optional(),
  commodity: z.string().trim().min(2).max(300).optional(),
  airline: z.string().trim().max(100).optional().nullable(),
  flightNumber: z.string().trim().max(40).optional().nullable(),
  flightDate: z.coerce.date().optional().nullable(),
  handlingNotes: z.string().trim().max(1_000).optional().nullable(),
  declaredValue: z.string().regex(/^\d+(\.\d{1,2})?$/).optional().nullable(),
  reason: z.string().trim().min(3).max(500).optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ shipmentId: string }> }) {
  const requestId = requestIdFrom(request);
  try {
    const access = await requireAccess();
    const input = await parseJson(request, patchCargoSchema);
    const { shipmentId } = await params;

    const shipment = await db.cargoShipment.findFirst({
      where: { id: shipmentId, companyId: access.companyId },
    });
    if (!shipment) throw new NotFoundError("Cargo shipment was not found.");
    requireStation(access, shipment.stationId, true);

    const isPreDispatch = ["DRAFT", "PROCESSING", "LABELLED"].includes(shipment.status);

    if (isPreDispatch) {
      // Direct Edit path (requires cargo.update_draft)
      requirePermission(access, "cargo.update_draft");

      const hasLabelChanges =
        (input.senderName && input.senderName !== shipment.senderName) ||
        (input.receiverName && input.receiverName !== shipment.receiverName) ||
        (input.origin && input.origin !== shipment.origin) ||
        (input.destination && input.destination !== shipment.destination) ||
        (input.weightKg && input.weightKg !== shipment.weightKg.toString()) ||
        (input.pieces && input.pieces !== shipment.pieces) ||
        (input.commodity && input.commodity !== shipment.commodity);

      const updated = await db.$transaction(async (tx) => {
        const row = await tx.cargoShipment.update({
          where: { id: shipment.id },
          data: {
            senderName: input.senderName,
            senderPhone: input.senderPhone,
            receiverName: input.receiverName,
            receiverPhone: input.receiverPhone,
            receiverAddress: input.receiverAddress,
            origin: input.origin,
            destination: input.destination,
            weightKg: input.weightKg,
            pieces: input.pieces,
            commodity: input.commodity,
            airline: input.airline,
            flightNumber: input.flightNumber,
            flightDate: input.flightDate,
            handlingNotes: input.handlingNotes,
            declaredValue: input.declaredValue,
            labelVersion: hasLabelChanges ? { increment: 1 } : undefined,
            version: { increment: 1 },
          },
        });

        if (hasLabelChanges) {
          const doc = await tx.generatedDocument.findFirst({
            where: { sourceType: "CargoShipment", sourceId: shipment.id },
          });
          if (doc) {
            await tx.generatedDocument.update({
              where: { id: doc.id },
              data: {
                version: { increment: 1 },
                generatedAt: new Date(),
                generatedById: access.userId,
              },
            });
          }
        }

        await writeAudit(tx, {
          companyId: access.companyId,
          actorId: access.userId,
          stationId: shipment.stationId,
          action: "cargo.updated",
          entityType: "CargoShipment",
          entityId: shipment.id,
          requestId,
          before: shipment,
          after: row,
        });

        return row;
      }, { timeout: 30000 });

      return apiSuccess(updated, requestId);
    } else {
      // Correction Case path (requires cargo.edit_label)
      requirePermission(access, "cargo.edit_label");
      if (!input.reason) {
        throw new AppError("REASON_REQUIRED", "A correction reason is required for dispatched shipments.", 422);
      }

      const approval = await db.$transaction(async (tx) => {
        const { reason, ...payload } = input;

        const request = await tx.approvalRequest.create({
          data: {
            companyId: access.companyId,
            stationId: shipment.stationId,
            entityType: "CargoShipment",
            entityId: shipment.id,
            action: "cargo.edit_label",
            status: "PENDING",
            requestedById: access.userId,
            requestReason: reason || "",
            payload: payload as any,
          },
        });

        await writeAudit(tx, {
          companyId: access.companyId,
          actorId: access.userId,
          stationId: shipment.stationId,
          action: "cargo.correction_requested",
          entityType: "CargoShipment",
          entityId: shipment.id,
          reason: reason || "",
          requestId,
          after: request,
        });

        return request;
      }, { timeout: 30000 });

      return apiSuccess({ approvalRequired: true, approvalId: approval.id }, requestId);
    }
  } catch (error) {
    return apiFailure(error, requestId);
  }
}
