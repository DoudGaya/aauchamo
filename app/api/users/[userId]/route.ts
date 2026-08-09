import { z } from "zod";

import { requireAccess, requirePermission, requireStation } from "@/lib/server/access";
import { AppError, ConflictError, NotFoundError, apiFailure, apiSuccess, parseJson, requestIdFrom } from "@/lib/server/api";
import { writeAudit } from "@/lib/server/audit";
import { db } from "@/lib/server/db";

const updateSchema = z.object({
  version: z.number().int().positive(),
  firstName: z.string().trim().min(2).max(80),
  lastName: z.string().trim().min(2).max(80),
  email: z.string().email().nullable(),
  phone: z.string().trim().max(30).nullable(),
  roleIds: z.array(z.string().cuid()).min(1),
  stationIds: z.array(z.string().cuid()).default([]),
  businessUnitIds: z.array(z.string().cuid()).default([]),
  reason: z.string().trim().min(5).max(500),
});

export async function GET(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "users.view");
    const { userId } = await params;
    const user = await db.user.findFirst({
      where: { id: userId, companyId: access.companyId },
      select: {
        id: true, name: true, firstName: true, lastName: true, username: true, email: true, phone: true,
        status: true, lastLoginAt: true, failedLoginCount: true, lockedUntil: true, version: true,
        roleAssignments: { include: { role: true } },
        stationScopes: { include: { station: true } },
        businessUnitScopes: { include: { businessUnit: true } },
        sessions: { select: { id: true, expires: true, lastSeenAt: true, revokedAt: true, ipAddress: true, userAgent: true } },
      },
    });
    if (!user) throw new NotFoundError("User not found.");
    if (!access.companyWide) user.stationScopes.forEach((scope) => requireStation(access, scope.stationId));
    return apiSuccess(user, requestId);
  } catch (error) {
    return apiFailure(error, requestId);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "users.manage");
    const { userId } = await params;
    const input = await parseJson(request, updateSchema);
    input.stationIds.forEach((stationId) => requireStation(access, stationId, true));
    const [before, roles] = await Promise.all([
      db.user.findFirst({ where: { id: userId, companyId: access.companyId }, include: { roleAssignments: true, stationScopes: true } }),
      db.role.findMany({ where: { id: { in: input.roleIds }, companyId: access.companyId, isActive: true } }),
    ]);
    if (!before) throw new NotFoundError("User not found.");
    if (roles.length !== input.roleIds.length) throw new AppError("INVALID_ROLE", "One or more roles are invalid.", 422);
    const after = await db.$transaction(async (tx) => {
      const updatedCount = await tx.user.updateMany({
        where: { id: userId, version: input.version },
        data: {
          firstName: input.firstName,
          lastName: input.lastName,
          name: `${input.firstName} ${input.lastName}`,
          email: input.email?.toLowerCase() ?? null,
          phone: input.phone,
          version: { increment: 1 },
          securityVersion: { increment: 1 },
          updatedById: access.userId,
        },
      });
      if (!updatedCount.count) throw new ConflictError("This user changed after you opened it. Refresh and try again.");
      await tx.userRole.deleteMany({ where: { userId } });
      await tx.userStationScope.deleteMany({ where: { userId } });
      await tx.userBusinessUnitScope.deleteMany({ where: { userId } });
      for (const role of roles) {
        if (role.scope === "COMPANY") {
          await tx.userRole.create({ data: { userId, roleId: role.id, assignedById: access.userId } });
        } else if (role.scope === "BUSINESS_UNIT") {
          for (const businessUnitId of input.businessUnitIds) await tx.userRole.create({ data: { userId, roleId: role.id, businessUnitId, assignedById: access.userId } });
        } else {
          for (const stationId of input.stationIds) await tx.userRole.create({ data: { userId, roleId: role.id, stationId, assignedById: access.userId } });
        }
      }
      if (input.stationIds.length) await tx.userStationScope.createMany({ data: input.stationIds.map((stationId, index) => ({ userId, stationId, canView: true, canOperate: true, isPrimary: index === 0, assignedById: access.userId })) });
      if (input.businessUnitIds.length) await tx.userBusinessUnitScope.createMany({ data: input.businessUnitIds.map((businessUnitId) => ({ userId, businessUnitId, canView: true, canOperate: true, assignedById: access.userId })) });
      await tx.session.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date(), revokedReason: "Permissions changed" } });
      const updated = await tx.user.findUniqueOrThrow({ where: { id: userId } });
      await writeAudit(tx, { companyId: access.companyId, actorId: access.userId, action: "user.access_updated", entityType: "User", entityId: userId, requestId, reason: input.reason, before, after: { ...updated, passwordHash: "[REDACTED]" } });
      return updated;
    });
    return apiSuccess({ id: after.id, name: after.name, status: after.status, version: after.version }, requestId);
  } catch (error) {
    return apiFailure(error, requestId);
  }
}
