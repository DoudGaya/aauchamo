import { z } from "zod";

import { requireAccess, requirePermission, requireStation } from "@/lib/server/access";
import { AppError, NotFoundError, apiFailure, apiSuccess, parseJson, requestIdFrom } from "@/lib/server/api";
import { writeAudit } from "@/lib/server/audit";
import { db } from "@/lib/server/db";

const patchSchema = z.object({
  customerId: z.string().cuid().optional(),
  agentId: z.string().cuid().nullable().optional(),
});

export async function GET(request: Request, { params }: { params: Promise<{ saleId: string }> }) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "sales.view"); const { saleId } = await params;
    const sale = await db.sale.findFirst({ where: { id: saleId, companyId: access.companyId }, include: { company: { select: { legalName: true, displayName: true, address: true, phone: true, currencyCode: true, logoObjectKey: true, logoDarkObjectKey: true } }, customer: true, station: true, businessUnit: true, lines: true, allocations: { include: { payment: { include: { paymentMethod: true } } } }, refunds: { include: { lines: true } }, outstanding: true } });
    if (!sale) throw new NotFoundError("Sale was not found."); requireStation(access, sale.stationId);
    return apiSuccess(sale, requestId);
  } catch (error) { return apiFailure(error, requestId); }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ saleId: string }> }) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "sales.delete");
    const { saleId } = await params;
    const sale = await db.sale.findFirst({ where: { id: saleId, companyId: access.companyId } });
    if (!sale) throw new NotFoundError("Sale not found.");
    requireStation(access, sale.stationId, true);

    await db.$transaction(async (tx) => {
      // Clean up child relations to satisfy foreign key constraints
      await tx.refundLine.deleteMany({
        where: {
          OR: [
            { refund: { saleId } },
            { saleLine: { saleId } },
          ],
        },
      });
      await tx.refund.deleteMany({ where: { saleId } });
      await tx.paymentAllocation.deleteMany({ where: { saleId } });
      await tx.outstandingPayment.deleteMany({ where: { saleId } });
      await tx.saleLine.deleteMany({ where: { saleId } });
      await tx.sale.updateMany({
        where: { reversedSaleId: saleId },
        data: { reversedSaleId: null },
      });

      await tx.sale.delete({ where: { id: saleId } });
      await writeAudit(tx, {
        companyId: access.companyId,
        actorId: access.userId,
        stationId: sale.stationId,
        action: "sale.deleted",
        entityType: "Sale",
        entityId: saleId,
        requestId,
        reason: "Admin hard delete",
        before: sale,
        after: null,
      });
    }, { maxWait: 10_000, timeout: 30_000 });
    return apiSuccess({ deleted: true }, requestId);
  } catch (error) {
    return apiFailure(error, requestId);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ saleId: string }> }) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "sales.update");
    const { saleId } = await params;
    const payload = await parseJson(request, patchSchema);
    
    if (Object.keys(payload).length === 0) {
      throw new AppError("INVALID_PAYLOAD", "No fields provided to update.", 400);
    }

    const sale = await db.sale.findFirst({ where: { id: saleId, companyId: access.companyId } });
    if (!sale) throw new NotFoundError("Sale not found.");
    requireStation(access, sale.stationId);

    if (payload.customerId) {
      const customer = await db.customer.findFirst({ where: { id: payload.customerId, companyId: access.companyId } });
      if (!customer) throw new AppError("INVALID_CUSTOMER", "Customer not found.", 422);
    }
    
    if (payload.agentId) {
      const agent = await db.agent.findFirst({ where: { id: payload.agentId, companyId: access.companyId } });
      if (!agent) throw new AppError("INVALID_AGENT", "Agent not found.", 422);
    }

    const updateData: any = {};
    if (payload.customerId !== undefined) updateData.customerId = payload.customerId;
    if (payload.agentId !== undefined) updateData.agentId = payload.agentId;

    const updated = await db.$transaction(async (tx) => {
      const result = await tx.sale.update({
        where: { id: saleId },
        data: updateData,
      });
      await writeAudit(tx, {
        companyId: access.companyId,
        actorId: access.userId,
        stationId: sale.stationId,
        action: "sale.updated",
        entityType: "Sale",
        entityId: saleId,
        requestId,
        reason: "Admin updated sale fields",
        before: sale,
        after: result,
      });
      return result;
    });

    return apiSuccess(updated, requestId);
  } catch (error) {
    return apiFailure(error, requestId);
  }
}
