import { createHash, randomBytes } from "node:crypto";

import { z } from "zod";

import { requireAccess, requirePermission } from "@/lib/server/access";
import { AppError, NotFoundError, apiFailure, apiSuccess, parseJson, requestIdFrom } from "@/lib/server/api";
import { writeAudit } from "@/lib/server/audit";
import { db } from "@/lib/server/db";
import { getRuntimeEnv } from "@/lib/server/env";
import { addMinutes } from "@/lib/server/time";

const actions = ["activate", "deactivate", "lock", "unlock", "reset-password", "revoke-sessions"] as const;
const schema = z.object({ reason: z.string().trim().min(5).max(500) });

export async function POST(
  request: Request,
  { params }: { params: Promise<{ userId: string; action: string }> },
) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "users.manage");
    const { userId, action: rawAction } = await params;
    if (!actions.includes(rawAction as (typeof actions)[number])) throw new NotFoundError("User action not found.");
    const action = rawAction as (typeof actions)[number];
    if (action === "reset-password") requirePermission(access, "users.reset_password");
    if (action === "revoke-sessions") requirePermission(access, "users.revoke_session");
    const { reason } = await parseJson(request, schema);
    const user = await db.user.findFirst({ where: { id: userId, companyId: access.companyId } });
    if (!user) throw new NotFoundError("User not found.");
    if (user.id === access.userId && ["deactivate", "lock"].includes(action)) {
      throw new AppError("SELF_LOCKOUT", "You cannot lock or deactivate your own account.", 409);
    }

    await db.$transaction(async (tx) => {
      const now = new Date();
      if (action === "activate") {
        await tx.user.update({ where: { id: user.id }, data: { status: "ACTIVE", lockedUntil: null, failedLoginCount: 0, securityVersion: { increment: 1 } } });
      } else if (action === "deactivate") {
        await tx.user.update({ where: { id: user.id }, data: { status: "DISABLED", securityVersion: { increment: 1 } } });
      } else if (action === "lock") {
        await tx.user.update({ where: { id: user.id }, data: { status: "LOCKED", lockedUntil: null, securityVersion: { increment: 1 } } });
      } else if (action === "unlock") {
        await tx.user.update({ where: { id: user.id }, data: { status: "ACTIVE", lockedUntil: null, failedLoginCount: 0, securityVersion: { increment: 1 } } });
      } else if (action === "reset-password") {
        if (!user.email) throw new AppError("EMAIL_REQUIRED", "This user has no email address for recovery.", 422);
        const rawToken = randomBytes(32).toString("base64url");
        const token = createHash("sha256").update(rawToken).digest("hex");
        const resetUrl = new URL("/reset-password", getRuntimeEnv().APP_URL);
        resetUrl.searchParams.set("identifier", user.email);
        resetUrl.searchParams.set("token", rawToken);
        await tx.verificationToken.deleteMany({ where: { identifier: user.email, purpose: "PASSWORD_RESET", usedAt: null } });
        await tx.verificationToken.create({ data: { identifier: user.email, token, purpose: "PASSWORD_RESET", expires: addMinutes(now, 30) } });
        await tx.outboxEvent.create({ data: { companyId: access.companyId, aggregateType: "User", aggregateId: user.id, eventType: "auth.password_reset_email_requested", payload: { recipient: user.email, resetUrl: resetUrl.toString() } } });
      }

      if (["deactivate", "lock", "reset-password", "revoke-sessions"].includes(action)) {
        await tx.session.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: now, revokedReason: `Administrator action: ${action}` } });
      }
      await writeAudit(tx, { companyId: access.companyId, actorId: access.userId, action: `user.${action.replace("-", "_")}`, entityType: "User", entityId: user.id, requestId, reason, before: { status: user.status }, metadata: { sessionsRevoked: ["deactivate", "lock", "reset-password", "revoke-sessions"].includes(action) } });
    });
    return apiSuccess({ completed: true, action }, requestId);
  } catch (error) {
    return apiFailure(error, requestId);
  }
}
