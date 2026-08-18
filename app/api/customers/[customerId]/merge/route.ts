import { z } from "zod";
import { requireAccess, requirePermission, requireStation } from "@/lib/server/access";
import { NotFoundError, ConflictError, apiFailure, apiSuccess, parseJson, requestIdFrom } from "@/lib/server/api";
import { db } from "@/lib/server/db";
import { writeAudit } from "@/lib/server/audit";

const schema = z.object({
  targetCustomerId: z.string().cuid(),
  reason: z.string().trim().min(10).max(500),
});

export async function POST(request: Request, { params }: { params: Promise<{ customerId: string }> }) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "customers.update");
    const { customerId: sourceCustomerId } = await params;
    const input = await parseJson(request, schema);

    if (sourceCustomerId === input.targetCustomerId) {
      throw new ConflictError("Cannot merge a customer into themselves.");
    }

    const [source, target] = await Promise.all([
      db.customer.findFirst({ where: { id: sourceCustomerId, companyId: access.companyId, status: "ACTIVE" } }),
      db.customer.findFirst({ where: { id: input.targetCustomerId, companyId: access.companyId, status: "ACTIVE" } }),
    ]);

    if (!source) throw new NotFoundError("Source customer not found or is already merged.");
    if (!target) throw new NotFoundError("Target customer not found or is already merged.");

    requireStation(access, source.homeStationId, true);
    requireStation(access, target.homeStationId, true);

    const merged = await db.$transaction(async (tx) => {
      await tx.sale.updateMany({ where: { customerId: source.id }, data: { customerId: target.id } });
      await tx.cargoShipment.updateMany({ where: { customerId: source.id }, data: { customerId: target.id } });
      await tx.ticketBooking.updateMany({ where: { customerId: source.id }, data: { customerId: target.id } });
      await tx.payment.updateMany({ where: { customerId: source.id }, data: { customerId: target.id } });
      await tx.attachment.updateMany({ where: { recordType: "Customer", recordId: source.id }, data: { recordId: target.id } });
      
      await tx.customerContact.updateMany({ where: { customerId: source.id }, data: { customerId: target.id, isPrimary: false } });
      await tx.customerIdentifier.updateMany({ where: { customerId: source.id }, data: { customerId: target.id } });

      const updatedSource = await tx.customer.update({
        where: { id: source.id },
        data: {
          status: "MERGED",
          mergedIntoId: target.id,
          updatedById: access.userId,
        },
      });

      const mergeRecord = await tx.customerMerge.create({
        data: {
          companyId: access.companyId,
          sourceCustomerId: source.id,
          targetCustomerId: target.id,
          reason: input.reason,
          snapshot: JSON.parse(JSON.stringify(source)),
          mergedById: access.userId,
        },
      });

      await writeAudit(tx, {
        companyId: access.companyId,
        actorId: access.userId,
        stationId: source.homeStationId,
        action: "customer.merged",
        entityType: "Customer",
        entityId: target.id,
        requestId,
        reason: input.reason,
        metadata: { sourceCustomerId: source.id, targetCustomerId: target.id, mergeId: mergeRecord.id },
      });

      return mergeRecord;
    }, { isolationLevel: "Serializable", timeout: 30000 });

    return apiSuccess({ success: true, mergeId: merged.id, targetCustomerId: target.id }, requestId);
  } catch (error) {
    return apiFailure(error, requestId);
  }
}
