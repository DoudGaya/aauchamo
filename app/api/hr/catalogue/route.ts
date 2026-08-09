import { z } from "zod";

import { requireAccess, requirePermission } from "@/lib/server/access";
import { apiFailure, apiSuccess, parseJson, requestIdFrom } from "@/lib/server/api";
import { writeAudit } from "@/lib/server/audit";
import { db } from "@/lib/server/db";

const schema = z.object({
  kind: z.enum(["department", "position"]),
  code: z.string().trim().min(2).max(30).regex(/^[A-Z0-9-]+$/).transform((value) => value.toUpperCase()),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).optional(),
  businessUnitId: z.string().cuid().optional(),
});

export async function GET(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "staff.view");
    const [departments, positions] = await Promise.all([
      db.department.findMany({ where: { companyId: access.companyId, isActive: true }, orderBy: { name: "asc" } }),
      db.position.findMany({ where: { companyId: access.companyId, isActive: true }, orderBy: { name: "asc" } }),
    ]);
    return apiSuccess({ departments, positions }, requestId);
  } catch (error) {
    return apiFailure(error, requestId);
  }
}

export async function POST(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "staff.manage");
    const input = await parseJson(request, schema);
    const record = await db.$transaction(async (tx) => {
      const created = input.kind === "department"
        ? await tx.department.create({ data: { companyId: access.companyId, businessUnitId: input.businessUnitId, code: input.code, name: input.name, description: input.description, createdById: access.userId, updatedById: access.userId } })
        : await tx.position.create({ data: { companyId: access.companyId, code: input.code, name: input.name, description: input.description, createdById: access.userId, updatedById: access.userId } });
      await writeAudit(tx, { companyId: access.companyId, actorId: access.userId, action: `hr.${input.kind}_created`, entityType: input.kind === "department" ? "Department" : "Position", entityId: created.id, requestId, after: created });
      return created;
    });
    return apiSuccess(record, requestId, { created: true });
  } catch (error) {
    return apiFailure(error, requestId);
  }
}
