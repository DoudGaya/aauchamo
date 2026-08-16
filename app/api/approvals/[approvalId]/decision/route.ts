import { z } from "zod";
import { requireAccess, requirePermission, requireStation } from "@/lib/server/access";
import { AppError, NotFoundError, apiFailure, apiSuccess, parseJson, requestIdFrom } from "@/lib/server/api";
import { writeAudit } from "@/lib/server/audit";
import { db } from "@/lib/server/db";
import { applyStockMovement } from "@/lib/server/inventory";
import { postRefund } from "@/lib/server/refunds";

const schema = z.object({ decision: z.enum(["APPROVED", "REJECTED"]), reason: z.string().trim().min(3).max(500), version: z.number().int().positive() });
export async function POST(request: Request, { params }: { params: Promise<{ approvalId: string }> }) { const requestId = requestIdFrom(request); try { const access = requirePermission(await requireAccess(), "approvals.decide"); const input = await parseJson(request, schema); const { approvalId } = await params; const result = await db.$transaction(async (tx) => { const approval = await tx.approvalRequest.findFirst({ where: { id: approvalId, companyId: access.companyId } }); if (!approval) throw new NotFoundError("Approval request was not found."); if (approval.stationId) requireStation(access, approval.stationId, true); if (approval.requestedById === access.userId) throw new AppError("SELF_APPROVAL_FORBIDDEN", "The requester cannot decide their own approval.", 409); if (approval.status !== "PENDING" || approval.version !== input.version) throw new AppError("APPROVAL_CONFLICT", "This approval was already changed. Refresh and try again.", 409); const changed = await tx.approvalRequest.updateMany({ where: { id: approval.id, status: "PENDING", version: input.version }, data: { status: input.decision, decisionReason: input.reason, decidedById: access.userId, decidedAt: new Date(), version: { increment: 1 } } }); if (changed.count !== 1) throw new AppError("APPROVAL_CONFLICT", "This approval was decided concurrently.", 409);
    if (approval.entityType === "CashbookEntry" && approval.action === "finance.approve_expense") await tx.cashbookEntry.update({ where: { id: approval.entityId }, data: { status: input.decision === "APPROVED" ? "POSTED" : "REJECTED", postedAt: input.decision === "APPROVED" ? new Date() : undefined, approvedById: input.decision === "APPROVED" ? access.userId : undefined } });
    if (approval.entityType === "Refund" && approval.action === "sales.approve_refund") { if (input.decision === "APPROVED") await postRefund(tx, approval.entityId, access.userId); else await tx.refund.update({ where: { id: approval.entityId }, data: { status: "REJECTED", approvedById: access.userId } }); }
    if (approval.entityType === "InventoryAdjustment" && approval.action === "inventory.approve_adjustment") { if (!access.permissions.has("inventory.approve_adjustment")) throw new AppError("FORBIDDEN", "Inventory approval permission is required.", 403); const adjustment = await tx.inventoryAdjustment.findUniqueOrThrow({ where: { id: approval.entityId }, include: { lines: true } }); if (input.decision === "APPROVED") for (const line of adjustment.lines) await applyStockMovement(tx, { companyId: access.companyId, stationId: adjustment.stationId, productId: line.productId, batchId: line.batchId, movementType: "ADJUSTMENT", quantityDelta: line.quantityDelta, referenceType: "InventoryAdjustment", referenceId: adjustment.id, reason: adjustment.reason, occurredById: access.userId }); await tx.inventoryAdjustment.update({ where: { id: adjustment.id }, data: { status: input.decision === "APPROVED" ? "POSTED" : "REJECTED", approvedById: input.decision === "APPROVED" ? access.userId : undefined, approvedAt: new Date(), postedAt: input.decision === "APPROVED" ? new Date() : undefined, version: { increment: 1 } } }); }
    if (approval.entityType === "CargoShipment" && approval.action === "cargo.edit_label") {
      if (!access.permissions.has("cargo.edit_label")) throw new AppError("FORBIDDEN", "Cargo edit permission is required.", 403);
      if (input.decision === "APPROVED") {
        const payload = approval.payload as any;
        await tx.cargoShipment.update({
          where: { id: approval.entityId },
          data: {
            senderName: payload.senderName,
            senderPhone: payload.senderPhone,
            receiverName: payload.receiverName,
            receiverPhone: payload.receiverPhone,
            receiverAddress: payload.receiverAddress,
            origin: payload.origin,
            destination: payload.destination,
            weightKg: payload.weightKg,
            pieces: payload.pieces,
            commodity: payload.commodity,
            airline: payload.airline,
            flightNumber: payload.flightNumber,
            flightDate: payload.flightDate ? new Date(payload.flightDate) : undefined,
            handlingNotes: payload.handlingNotes,
            declaredValue: payload.declaredValue,
            labelVersion: { increment: 1 },
            version: { increment: 1 },
          },
        });
        const doc = await tx.generatedDocument.findFirst({
          where: { sourceType: "CargoShipment", sourceId: approval.entityId },
        });
        if (doc) {
          await tx.generatedDocument.update({
            where: { id: doc.id },
            data: { version: { increment: 1 }, generatedAt: new Date(), generatedById: access.userId },
          });
        }
      }
    }
    await tx.notification.create({ data: { companyId: access.companyId, recipientId: approval.requestedById, stationId: approval.stationId, businessUnitId: approval.businessUnitId, type: "APPROVAL_DECIDED", severity: input.decision === "APPROVED" ? "SUCCESS" : "WARNING", title: `Request ${input.decision.toLowerCase()}`, message: input.reason, href: "/?module=approvals", entityType: "ApprovalRequest", entityId: approval.id } }); await writeAudit(tx, { companyId: access.companyId, actorId: access.userId, stationId: approval.stationId, businessUnitId: approval.businessUnitId, action: `approval.${input.decision.toLowerCase()}`, entityType: "ApprovalRequest", entityId: approval.id, reason: input.reason, requestId, before: approval, after: { status: input.decision } }); return tx.approvalRequest.findUniqueOrThrow({ where: { id: approval.id } }); }, { isolationLevel: "Serializable", timeout: 30000 }); return apiSuccess(result, requestId); } catch (error) { return apiFailure(error, requestId); } }
