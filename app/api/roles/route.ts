import { z } from "zod";

import { requireAccess, requirePermission } from "@/lib/server/access";
import { AppError, apiFailure, apiSuccess, parseJson, requestIdFrom } from "@/lib/server/api";
import { writeAudit } from "@/lib/server/audit";
import { db } from "@/lib/server/db";

const createRoleSchema = z.object({
  code: z.string().trim().min(2).max(40).regex(/^[A-Z0-9_]+$/).transform((value) => value.toUpperCase()),
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(500).optional(),
  scope: z.enum(["COMPANY", "BUSINESS_UNIT", "STATION"]),
  permissionKeys: z.array(z.string().min(3)).default([]),
});

export async function GET(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "roles.view");
    const roles = await db.role.findMany({
      where: { companyId: access.companyId },
      include: { permissions: { include: { permission: true } }, _count: { select: { users: true } } },
      orderBy: { name: "asc" },
    });
    return apiSuccess(roles, requestId);
  } catch (error) {
    return apiFailure(error, requestId);
  }
}

export async function POST(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "roles.manage");
    const input = await parseJson(request, createRoleSchema);
    const permissions = await db.permission.findMany({ where: { key: { in: input.permissionKeys } } });
    if (permissions.length !== new Set(input.permissionKeys).size) throw new AppError("INVALID_PERMISSION", "One or more permission keys are invalid.", 422);
    const role = await db.$transaction(async (tx) => {
      const created = await tx.role.create({
        data: {
          companyId: access.companyId,
          code: input.code,
          name: input.name,
          description: input.description,
          scope: input.scope,
          createdById: access.userId,
          updatedById: access.userId,
          permissions: { create: permissions.map((permission) => ({ permissionId: permission.id, grantedById: access.userId })) },
        },
        include: { permissions: { include: { permission: true } } },
      });
      await writeAudit(tx, { companyId: access.companyId, actorId: access.userId, action: "role.created", entityType: "Role", entityId: created.id, requestId, after: created });
      return created;
    });
    return apiSuccess(role, requestId, { created: true });
  } catch (error) {
    return apiFailure(error, requestId);
  }
}
