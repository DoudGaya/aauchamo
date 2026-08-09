import { z } from "zod";

import { requireAccess, requirePermission, requireStation } from "@/lib/server/access";
import { AppError, NotFoundError, apiFailure, apiSuccess, parseJson, requestIdFrom } from "@/lib/server/api";
import { writeAudit } from "@/lib/server/audit";
import { db } from "@/lib/server/db";

const schema = z.object({ sourceCustomerId: z.string().cuid(), targetCustomerId: z.string().cuid(), reason: z.string().trim().min(10).max(1_000) });

export async function POST(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "customers.merge");
    const input = await parseJson(request, schema);
    if (input.sourceCustomerId === input.targetCustomerId) throw new AppError("INVALID_MERGE", "Source and target must be different customers.", 422);
    const [source, target] = await Promise.all([
      db.customer.findFirst({ where: { id: input.sourceCustomerId, companyId: access.companyId, status: "ACTIVE" }, include: { contacts: true, identifiers: true } }),
      db.customer.findFirst({ where: { id: input.targetCustomerId, companyId: access.companyId, status: "ACTIVE" }, include: { contacts: true, identifiers: true } }),
    ]);
    if (!source || !target) throw new NotFoundError("Both customers must be active and belong to this company.");
    requireStation(access, source.homeStationId, true);
    requireStation(access, target.homeStationId, true);
    const merge = await db.$transaction(async (tx) => {
      const snapshot = JSON.parse(JSON.stringify({ source, target }));
      for (const contact of source.contacts) {
        const duplicate = target.contacts.some((item) => item.type === contact.type && item.normalized === contact.normalized);
        if (duplicate) await tx.customerContact.delete({ where: { id: contact.id } });
        else await tx.customerContact.update({ where: { id: contact.id }, data: { customerId: target.id, isPrimary: false } });
      }
      for (const identifier of source.identifiers) {
        const duplicate = target.identifiers.some((item) => item.type === identifier.type && item.valueHash === identifier.valueHash);
        if (duplicate) await tx.customerIdentifier.delete({ where: { id: identifier.id } });
        else await tx.customerIdentifier.update({ where: { id: identifier.id }, data: { customerId: target.id } });
      }
      await tx.customer.update({ where: { id: source.id }, data: { status: "MERGED", mergedIntoId: target.id, version: { increment: 1 }, updatedById: access.userId } });
      const created = await tx.customerMerge.create({ data: { companyId: access.companyId, sourceCustomerId: source.id, targetCustomerId: target.id, reason: input.reason, snapshot, mergedById: access.userId } });
      await writeAudit(tx, { companyId: access.companyId, actorId: access.userId, stationId: target.homeStationId, action: "customer.merged", entityType: "Customer", entityId: source.id, requestId, reason: input.reason, before: { sourceId: source.id, targetId: target.id }, after: created });
      return created;
    });
    return apiSuccess({ mergeId: merge.id, sourceCustomerId: merge.sourceCustomerId, targetCustomerId: merge.targetCustomerId }, requestId);
  } catch (error) {
    return apiFailure(error, requestId);
  }
}
