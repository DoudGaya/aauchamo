import { requireAccess, requirePermission, requireStation } from "@/lib/server/access";
import { AppError, NotFoundError, apiFailure, apiSuccess, requestIdFrom } from "@/lib/server/api";
import { writeAudit } from "@/lib/server/audit";
import { db } from "@/lib/server/db";

export async function POST(request: Request, { params }: { params: Promise<{ purchaseId: string }> }) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "purchases.manage"); const { purchaseId } = await params;
    const order = await db.purchaseOrder.findFirst({ where: { id: purchaseId, companyId: access.companyId } }); if (!order) throw new NotFoundError("Purchase order was not found."); requireStation(access, order.stationId, true); if (!["DRAFT", "SUBMITTED"].includes(order.status)) throw new AppError("INVALID_PURCHASE_STATUS", "Only draft or submitted orders can be approved.", 409);
    const approved = await db.$transaction(async (tx) => { const updated = await tx.purchaseOrder.update({ where: { id: order.id }, data: { status: "APPROVED", approvedById: access.userId, approvedAt: new Date(), version: { increment: 1 } } }); await writeAudit(tx, { companyId: access.companyId, actorId: access.userId, stationId: order.stationId, action: "purchase.approved", entityType: "PurchaseOrder", entityId: order.id, requestId, before: order, after: updated }); return updated; });
    return apiSuccess(approved, requestId);
  } catch (error) { return apiFailure(error, requestId); }
}
