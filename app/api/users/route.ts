import { randomBytes, createHash } from "node:crypto";

import { z } from "zod";

import { requireAccess, requirePermission, requireStation } from "@/lib/server/access";
import { AppError, apiFailure, apiSuccess, parseJson, parsePagination, requestIdFrom } from "@/lib/server/api";
import { writeAudit } from "@/lib/server/audit";
import { db } from "@/lib/server/db";
import { dispatchNotification } from "@/lib/server/notifications";
import { allocateSequence } from "@/lib/server/sequence";
import { getRuntimeEnv } from "@/lib/server/env";
import { hashPassword } from "@/lib/server/password";
import { addMinutes } from "@/lib/server/time";

export const runtime = "nodejs";

const createUserSchema = z.object({
  firstName: z.string().trim().min(2).max(80),
  lastName: z.string().trim().min(2).max(80),
  username: z.string().trim().min(3).max(50).regex(/^[a-zA-Z0-9._-]+$/).transform((value) => value.toLowerCase()),
  email: z.string().trim().email().optional(),
  phone: z.string().trim().max(30).optional(),
  roleIds: z.array(z.string().cuid()).min(1),
  stationIds: z.array(z.string().cuid()).default([]),
  businessUnitIds: z.array(z.string().cuid()).default([]),
  sendInvite: z.boolean().default(true),
});

export async function GET(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "users.view");
    const url = new URL(request.url);
    const { page, pageSize, skip, take } = parsePagination(url.searchParams);
    const search = url.searchParams.get("search")?.trim();
    const status = url.searchParams.get("status");
    const scopedStations = [...access.stationIds];
    const where = {
      companyId: access.companyId,
      ...(status && ["PENDING_INVITE", "ACTIVE", "LOCKED", "DISABLED"].includes(status)
        ? { status: status as "PENDING_INVITE" | "ACTIVE" | "LOCKED" | "DISABLED" }
        : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { username: { contains: search, mode: "insensitive" as const } },
              { email: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
      ...(access.companyWide
        ? {}
        : {
            AND: {
              OR: [
                { stationScopes: { some: { stationId: { in: scopedStations }, canView: true } } },
                { roleAssignments: { some: { stationId: { in: scopedStations } } } },
              ],
            },
          }),
    };
    const [items, total] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          firstName: true,
          lastName: true,
          username: true,
          email: true,
          phone: true,
          status: true,
          lastLoginAt: true,
          lockedUntil: true,
          version: true,
          roleAssignments: {
            select: {
              id: true,
              stationId: true,
              businessUnitId: true,
              role: { select: { id: true, code: true, name: true, scope: true } },
            },
          },
          stationScopes: { select: { stationId: true, canView: true, canOperate: true, isPrimary: true } },
        },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        skip,
        take,
      }),
      db.user.count({ where }),
    ]);
    return apiSuccess(items, requestId, { page, pageSize, total });
  } catch (error) {
    return apiFailure(error, requestId);
  }
}

export async function POST(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "users.manage");
    const input = await parseJson(request, createUserSchema);
    if (input.sendInvite && !input.email) throw new AppError("EMAIL_REQUIRED", "An email is required to send an invitation.", 422);
    input.stationIds.forEach((stationId) => requireStation(access, stationId, true));

    const roles = await db.role.findMany({
      where: { id: { in: input.roleIds }, companyId: access.companyId, isActive: true },
    });
    if (roles.length !== input.roleIds.length) throw new AppError("INVALID_ROLE", "One or more selected roles are invalid.", 422);
    if (roles.some((role) => role.scope === "STATION") && !input.stationIds.length) {
      throw new AppError("STATION_REQUIRED", "Station-scoped roles require at least one station.", 422);
    }

    const temporaryPassword = `Aa1!${randomBytes(18).toString("base64url")}Z9!`;
    const passwordHash = await hashPassword(temporaryPassword);
    const created = await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          companyId: access.companyId,
          firstName: input.firstName,
          lastName: input.lastName,
          name: `${input.firstName} ${input.lastName}`,
          username: input.username,
          email: input.email?.toLowerCase(),
          phone: input.phone,
          passwordHash,
          status: input.sendInvite ? "PENDING_INVITE" : "ACTIVE",
          mustChangePassword: true,
          createdById: access.userId,
          updatedById: access.userId,
        },
      });

      for (const role of roles) {
        if (role.scope === "COMPANY") {
          await tx.userRole.create({ data: { userId: user.id, roleId: role.id, assignedById: access.userId } });
        } else if (role.scope === "BUSINESS_UNIT") {
          for (const businessUnitId of input.businessUnitIds) {
            await tx.userRole.create({ data: { userId: user.id, roleId: role.id, businessUnitId, assignedById: access.userId } });
          }
        } else {
          for (const stationId of input.stationIds) {
            await tx.userRole.create({ data: { userId: user.id, roleId: role.id, stationId, assignedById: access.userId } });
          }
        }
      }

      if (input.stationIds.length) {
        await tx.userStationScope.createMany({
          data: input.stationIds.map((stationId, index) => ({
            userId: user.id,
            stationId,
            canView: true,
            canOperate: true,
            isPrimary: index === 0,
            assignedById: access.userId,
          })),
        });
      }
      if (input.businessUnitIds.length) {
        await tx.userBusinessUnitScope.createMany({
          data: input.businessUnitIds.map((businessUnitId) => ({
            userId: user.id,
            businessUnitId,
            canView: true,
            canOperate: true,
            assignedById: access.userId,
          })),
        });
      }

      if (input.sendInvite && user.email) {
        const rawToken = randomBytes(32).toString("base64url");
        const token = createHash("sha256").update(rawToken).digest("hex");
        const inviteUrl = new URL("/reset-password", getRuntimeEnv().APP_URL);
        inviteUrl.searchParams.set("identifier", user.email);
        inviteUrl.searchParams.set("token", rawToken);
        await tx.verificationToken.create({
          data: { identifier: user.email, token, purpose: "PASSWORD_RESET", expires: addMinutes(new Date(), 1_440) },
        });
        await tx.outboxEvent.create({
          data: {
            companyId: access.companyId,
            aggregateType: "User",
            aggregateId: user.id,
            eventType: "user.invitation_requested",
            payload: { recipient: user.email, inviteUrl: inviteUrl.toString() },
          },
        });
      }

      await dispatchNotification(tx, {
        companyId: access.companyId,
        targetRoles: ["SUPER_ADMIN", "ADMIN"],
        type: "SECURITY",
        title: "New User Registered",
        message: `User ${user.name} was registered.`,
        href: `/admin/users`,
        entityType: "User",
        entityId: user.id,
      });

      await writeAudit(tx, {
        companyId: access.companyId,
        actorId: access.userId,
        action: "user.created",
        entityType: "User",
        entityId: user.id,
        requestId,
        after: { ...user, passwordHash: "[REDACTED]", temporaryPassword: "[REDACTED]" },
      });
      return user;
    });

    return apiSuccess(
      { id: created.id, name: created.name, username: created.username, email: created.email, status: created.status },
      requestId,
      { created: true },
    );
  } catch (error) {
    return apiFailure(error, requestId);
  }
}
