import { z } from "zod";

import { requireAccess, requirePermission } from "@/lib/server/access";
import { AppError, ConflictError, NotFoundError, apiFailure, apiSuccess, parseJson, requestIdFrom } from "@/lib/server/api";
import { writeAudit } from "@/lib/server/audit";
import { db } from "@/lib/server/db";

const schema = z.object({
  version: z.number().int().positive(),
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(500).nullable(),
  scope: z.enum(["COMPANY", "BUSINESS_UNIT", "STATION"]),
  isActive: z.boolean(),
  permissionKeys: z.array(z.string().min(3)),
  reason: z.string().trim().min(5).max(500),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ roleId: string }> }) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "roles.manage");
    const { roleId } = await params;
    const input = await parseJson(request, schema);
    const [before, permissions] = await Promise.all([
      db.role.findFirst({ where: { id: roleId, companyId: access.companyId }, include: { permissions: true } }),
      db.permission.findMany({ where: { key: { in: input.permissionKeys } } }),
    ]);
    if (!before) throw new NotFoundError("Role not found.");
    if (permissions.length !== new Set(input.permissionKeys).size) throw new AppError("INVALID_PERMISSION", "One or more permission keys are invalid.", 422);
    const after = await db.$transaction(async (tx) => {
      const count = await tx.role.updateMany({ where: { id: roleId, version: input.version }, data: { name: input.name, description: input.description, scope: input.scope, isActive: input.isActive, version: { increment: 1 }, updatedById: access.userId } });
      if (!count.count) throw new ConflictError("This role changed after you opened it. Refresh and try again.");
      await tx.rolePermission.deleteMany({ where: { roleId } });
      if (permissions.length) await tx.rolePermission.createMany({ data: permissions.map((permission) => ({ roleId, permissionId: permission.id, grantedById: access.userId })) });
      const users = await tx.userRole.findMany({ where: { roleId }, select: { userId: true } });
      const userIds = [...new Set(users.map((assignment) => assignment.userId))];
      if (userIds.length) {
        await tx.user.updateMany({ where: { id: { in: userIds } }, data: { securityVersion: { increment: 1 } } });
        await tx.session.updateMany({ where: { userId: { in: userIds }, revokedAt: null }, data: { revokedAt: new Date(), revokedReason: "Role permissions changed" } });
      }
      const updated = await tx.role.findUniqueOrThrow({ where: { id: roleId }, include: { permissions: { include: { permission: true } } } });
      await writeAudit(tx, { companyId: access.companyId, actorId: access.userId, action: "role.updated", entityType: "Role", entityId: roleId, requestId, reason: input.reason, before, after: updated, metadata: { sessionsInvalidated: userIds.length } });
      return updated;
    });
    return apiSuccess(after, requestId);
  } catch (error) {
    return apiFailure(error, requestId);
  }
}
