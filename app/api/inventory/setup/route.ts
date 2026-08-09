import { z } from "zod";

import { requireAccess, requirePermission } from "@/lib/server/access";
import { apiFailure, apiSuccess, parseJson, requestIdFrom } from "@/lib/server/api";
import { writeAudit } from "@/lib/server/audit";
import { db } from "@/lib/server/db";

const setupSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("CATEGORY"), code: z.string().trim().min(2).max(30), name: z.string().trim().min(2).max(100), description: z.string().max(500).optional() }),
  z.object({ type: z.literal("UNIT"), code: z.string().trim().min(1).max(15), name: z.string().trim().min(1).max(80), precision: z.number().int().min(0).max(3).default(0) }),
]);

export async function GET(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "inventory.view");
    const [categories, units, suppliers] = await Promise.all([
      db.productCategory.findMany({ where: { companyId: access.companyId, isActive: true }, orderBy: { name: "asc" } }),
      db.unitOfMeasure.findMany({ where: { companyId: access.companyId, isActive: true }, orderBy: { name: "asc" } }),
      db.supplier.findMany({ where: { companyId: access.companyId, isActive: true }, orderBy: { name: "asc" } }),
    ]);
    return apiSuccess({ categories, units, suppliers }, requestId);
  } catch (error) { return apiFailure(error, requestId); }
}

export async function POST(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "inventory.create_product");
    const input = await parseJson(request, setupSchema);
    const record = await db.$transaction(async (tx) => {
      const created = input.type === "CATEGORY"
        ? await tx.productCategory.create({ data: { companyId: access.companyId, code: input.code.toUpperCase(), name: input.name, description: input.description } })
        : await tx.unitOfMeasure.create({ data: { companyId: access.companyId, code: input.code.toUpperCase(), name: input.name, precision: input.precision } });
      await writeAudit(tx, { companyId: access.companyId, actorId: access.userId, action: `inventory.${input.type.toLowerCase()}.created`, entityType: input.type, entityId: created.id, requestId, after: created });
      return created;
    });
    return apiSuccess(record, requestId, { created: true });
  } catch (error) { return apiFailure(error, requestId); }
}
