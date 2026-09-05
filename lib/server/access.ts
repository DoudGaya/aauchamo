import "server-only";

import { auth } from "@/auth";
import { ForbiddenError, UnauthorizedError } from "@/lib/server/api";
import { db } from "@/lib/server/db";
import type { PermissionKey } from "@/lib/server/permissions";

export type AccessContext = {
  userId: string;
  companyId: string;
  sessionId: string;
  name: string;
  email: string | null;
  username: string;
  roleNames: string[];
  permissions: Set<string>;
  stationIds: Set<string>;
  operatingStationIds: Set<string>;
  businessUnitIds: Set<string>;
  companyWide: boolean;
  isSuperAdmin: boolean;
};

export async function requireAccess(): Promise<AccessContext> {
  const session = await auth();
  if (!session?.user?.id || !session.sessionId) throw new UnauthorizedError();

  const now = new Date();
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: {
      sessions: {
        where: { id: session.sessionId },
        select: { id: true, expires: true, revokedAt: true, securityVersion: true },
      },
      roleAssignments: {
        where: {
          validFrom: { lte: now },
          OR: [{ validUntil: null }, { validUntil: { gt: now } }],
        },
        include: {
          role: {
            include: {
              permissions: { include: { permission: true } },
            },
          },
        },
      },
      stationScopes: true,
      businessUnitScopes: true,
    },
  });

  const sessionGrant = user?.sessions[0];
  if (
    !user ||
    user.status !== "ACTIVE" ||
    !sessionGrant ||
    sessionGrant.revokedAt ||
    sessionGrant.expires <= now ||
    sessionGrant.securityVersion !== user.securityVersion ||
    session.user.securityVersion !== user.securityVersion
  ) {
    throw new UnauthorizedError("Your session is no longer valid. Please sign in again.");
  }

  const activeAssignments = user.roleAssignments.filter((assignment) => assignment.role.isActive);
  const isSuperAdmin = activeAssignments.some((assignment) => assignment.role.code === "SUPER_ADMIN" || assignment.role.name === "Superadmin");
  let permissions = new Set(
    activeAssignments.flatMap((assignment) =>
      assignment.role.permissions.map((grant) => grant.permission.key),
    ),
  );
  if (isSuperAdmin) {
    const allPerms = await db.permission.findMany({ select: { key: true } });
    permissions = new Set(allPerms.map((p) => p.key));
  }

  const companyWide = isSuperAdmin || activeAssignments.some(
    (assignment) => assignment.role.scope === "COMPANY" && !assignment.stationId,
  );
  const roleStationIds = activeAssignments.flatMap((assignment) =>
    assignment.stationId ? [assignment.stationId] : [],
  );
  // For super admins, empty out the explicitly assigned station scopes so they fallback to global access
  const stationIds = isSuperAdmin ? new Set<string>() : new Set([
    ...roleStationIds,
    ...user.stationScopes.filter((scope) => scope.canView).map((scope) => scope.stationId),
  ]);
  const operatingStationIds = isSuperAdmin ? new Set<string>() : new Set([
    ...roleStationIds,
    ...user.stationScopes.filter((scope) => scope.canOperate).map((scope) => scope.stationId),
  ]);
  const businessUnitIds = isSuperAdmin ? new Set<string>() : new Set([
    ...activeAssignments.flatMap((assignment) =>
      assignment.businessUnitId ? [assignment.businessUnitId] : [],
    ),
    ...user.businessUnitScopes
      .filter((scope) => scope.canView)
      .map((scope) => scope.businessUnitId),
  ]);

  return {
    userId: user.id,
    companyId: user.companyId,
    sessionId: session.sessionId,
    name: user.name ?? `${user.firstName} ${user.lastName}`,
    email: user.email,
    username: user.username,
    roleNames: [...new Set(activeAssignments.map((assignment) => assignment.role.name))],
    permissions,
    stationIds,
    operatingStationIds,
    businessUnitIds,
    companyWide,
    isSuperAdmin,
  };
}

export function requirePermission(context: AccessContext, permission: PermissionKey) {
  if (!context.permissions.has(permission)) throw new ForbiddenError();
  return context;
}

export function requireStation(context: AccessContext, stationId: string, operate = false) {
  const scope = operate ? context.operatingStationIds : context.stationIds;
  if (context.companyWide && !scope.size) return context;
  if (!scope.has(stationId)) throw new ForbiddenError("This station is outside your assigned scope.");
  return context;
}

export function stationWhere(context: AccessContext, requestedStationId?: string) {
  if (requestedStationId) {
    requireStation(context, requestedStationId);
    return { stationId: requestedStationId };
  }
  return context.companyWide && !context.stationIds.size ? {} : { stationId: { in: [...context.stationIds] } };
}

export function maskSensitive<T extends Record<string, unknown>>(
  value: T,
  fields: Array<keyof T>,
  allowed: boolean,
) {
  if (allowed) return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, fieldValue]) => [
      key,
      fields.includes(key as keyof T) && fieldValue != null ? "••••••" : fieldValue,
    ]),
  ) as T;
}
