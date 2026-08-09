import { z } from "zod";

import { requireAccess, requirePermission, requireStation } from "@/lib/server/access";
import { AppError, apiFailure, apiSuccess, parseJson, parsePagination, requestIdFrom } from "@/lib/server/api";
import { writeAudit } from "@/lib/server/audit";
import { db } from "@/lib/server/db";
import { allocateSequence } from "@/lib/server/sequence";

const cargoSchema = z.object({ stationId: z.string().cuid(), customerId: z.string().cuid(), senderName: z.string().trim().min(2).max(160), senderPhone: z.string().trim().min(7).max(30), receiverName: z.string().trim().min(2).max(160), receiverPhone: z.string().trim().min(7).max(30), receiverAddress: z.string().trim().max(500).optional(), origin: z.string().trim().min(2).max(80), destination: z.string().trim().min(2).max(80), weightKg: z.string().regex(/^\d+(\.\d{1,3})?$/), pieces: z.number().int().min(1).max(10_000), commodity: z.string().trim().min(2).max(300), airline: z.string().trim().max(100).optional(), flightNumber: z.string().trim().max(40).optional(), flightDate: z.coerce.date().optional(), handlingNotes: z.string().trim().max(1_000).optional(), declaredValue: z.string().regex(/^\d+(\.\d{1,2})?$/).optional() }).refine((value) => value.origin.toLowerCase() !== value.destination.toLowerCase(), { path: ["destination"], message: "Origin and destination must differ." });

export async function GET(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "cargo.view"); const url = new URL(request.url); const { page, pageSize, skip, take } = parsePagination(url.searchParams); const stationId = url.searchParams.get("stationId") ?? undefined; const search = url.searchParams.get("search")?.trim(); if (stationId) requireStation(access, stationId);
    const where = { companyId: access.companyId, ...(stationId ? { stationId } : access.companyWide ? {} : { stationId: { in: [...access.stationIds] } }), ...(search ? { OR: [{ awbNumber: { contains: search, mode: "insensitive" as const } }, { senderName: { contains: search, mode: "insensitive" as const } }, { receiverName: { contains: search, mode: "insensitive" as const } }] } : {}) };
    const [items, total] = await Promise.all([db.cargoShipment.findMany({ where, include: { customer: { select: { id: true, customerNumber: true, displayName: true } }, station: { select: { id: true, code: true, name: true } }, events: { orderBy: { occurredAt: "desc" }, take: 1 } }, orderBy: { createdAt: "desc" }, skip, take }), db.cargoShipment.count({ where })]);
    return apiSuccess(items, requestId, { page, pageSize, total });
  } catch (error) { return apiFailure(error, requestId); }
}

export async function POST(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "cargo.manage"); const input = await parseJson(request, cargoSchema); requireStation(access, input.stationId, true); const customer = await db.customer.findFirst({ where: { id: input.customerId, companyId: access.companyId, status: "ACTIVE" } }); if (!customer) throw new AppError("INVALID_CUSTOMER", "Customer is unavailable.", 422);
    const shipment = await db.$transaction(async (tx) => {
      const awbNumber = await allocateSequence(tx, { companyId: access.companyId, stationId: input.stationId, documentType: "CARGO_AWB", prefix: "AWB", includeDate: true, padding: 6 });
      const created = await tx.cargoShipment.create({ data: { companyId: access.companyId, stationId: input.stationId, customerId: input.customerId, awbNumber, senderName: input.senderName, senderPhone: input.senderPhone, receiverName: input.receiverName, receiverPhone: input.receiverPhone, receiverAddress: input.receiverAddress, origin: input.origin, destination: input.destination, weightKg: input.weightKg, pieces: input.pieces, commodity: input.commodity, airline: input.airline, flightNumber: input.flightNumber, flightDate: input.flightDate, handlingNotes: input.handlingNotes, declaredValue: input.declaredValue, status: "LABELLED", createdById: access.userId, events: { create: [{ status: "DRAFT", changedById: access.userId, notes: "Shipment created" }, { previousStatus: "DRAFT", status: "LABELLED", changedById: access.userId, notes: "Initial label issued" }] } } });
      const documentNumber = `${awbNumber}-LBL`;
      await tx.generatedDocument.create({ data: { companyId: access.companyId, stationId: input.stationId, documentType: "CARGO_LABEL", documentNumber, sourceType: "CargoShipment", sourceId: created.id, templateKey: "cargo-label-v1", status: "READY", mimeType: "text/html", generatedById: access.userId, generatedAt: new Date() } });
      await writeAudit(tx, { companyId: access.companyId, actorId: access.userId, stationId: input.stationId, action: "cargo.created", entityType: "CargoShipment", entityId: created.id, requestId, after: created });
      return { ...created, labelUrl: `/print/cargo/${created.id}` };
    });
    return apiSuccess(shipment, requestId, { created: true });
  } catch (error) { return apiFailure(error, requestId); }
}
