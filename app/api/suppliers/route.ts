import { z } from "zod";

import { requireAccess, requirePermission } from "@/lib/server/access";
import { apiFailure, apiSuccess, parseJson, parsePagination, requestIdFrom } from "@/lib/server/api";
import { writeAudit } from "@/lib/server/audit";
import { db } from "@/lib/server/db";
import { allocateSequence } from "@/lib/server/sequence";

const supplierSchema = z.object({ name: z.string().trim().min(2).max(180), contactName: z.string().trim().max(120).optional(), phone: z.string().trim().max(30).optional(), email: z.string().email().optional(), address: z.string().trim().max(500).optional(), taxId: z.string().trim().max(80).optional(), paymentTerms: z.string().trim().max(200).optional() });

export async function GET(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "purchases.view");
    const { page, pageSize, skip, take } = parsePagination(new URL(request.url).searchParams);
    const [items, total] = await Promise.all([db.supplier.findMany({ where: { companyId: access.companyId }, orderBy: { name: "asc" }, skip, take }), db.supplier.count({ where: { companyId: access.companyId } })]);
    return apiSuccess(items, requestId, { page, pageSize, total });
  } catch (error) { return apiFailure(error, requestId); }
}

export async function POST(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "purchases.manage");
    const input = await parseJson(request, supplierSchema);
    const supplier = await db.$transaction(async (tx) => {
      const supplierNumber = await allocateSequence(tx, { companyId: access.companyId, documentType: "SUPPLIER", prefix: "SUP", includeDate: false, padding: 5 });
      const created = await tx.supplier.create({ data: { companyId: access.companyId, supplierNumber, ...input, createdById: access.userId, updatedById: access.userId } });
      await writeAudit(tx, { companyId: access.companyId, actorId: access.userId, action: "supplier.created", entityType: "Supplier", entityId: created.id, requestId, after: created });
      return created;
    });
    return apiSuccess(supplier, requestId, { created: true });
  } catch (error) { return apiFailure(error, requestId); }
}
