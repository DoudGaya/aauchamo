import { createHash } from "node:crypto";

import { z } from "zod";

import { AppError, apiFailure, apiSuccess, parseJson, requestIdFrom } from "@/lib/server/api";
import { db } from "@/lib/server/db";
import { writeAudit } from "@/lib/server/audit";
import { hashPassword, passwordSchema } from "@/lib/server/password";

export const runtime = "nodejs";

const schema = z
  .object({
    identifier: z.string().trim().min(3).max(254),
    token: z.string().min(32).max(200),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export async function POST(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    const values = await parseJson(request, schema);
    const identifier = values.identifier.toLowerCase();
    const tokenHash = createHash("sha256").update(values.token).digest("hex");
    const now = new Date();
    const resetToken = await db.verificationToken.findFirst({
      where: {
        identifier: { equals: identifier, mode: "insensitive" },
        token: tokenHash,
        purpose: "PASSWORD_RESET",
        usedAt: null,
        expires: { gt: now },
      },
    });
    const user = await db.user.findFirst({
      where: { email: { equals: identifier, mode: "insensitive" } },
    });
    if (!resetToken || !user) {
      throw new AppError("INVALID_RESET_TOKEN", "This password reset link is invalid or has expired.", 400);
    }

    const passwordHash = await hashPassword(values.password);
    await db.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          passwordChangedAt: now,
          mustChangePassword: false,
          failedLoginCount: 0,
          lockedUntil: null,
          status: "ACTIVE",
          securityVersion: { increment: 1 },
        },
      });
      await tx.verificationToken.update({
        where: { identifier_token: { identifier: resetToken.identifier, token: resetToken.token } },
        data: { usedAt: now },
      });
      await tx.session.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: now, revokedReason: "Password reset" },
      });
      await writeAudit(tx, { companyId: user.companyId, actorId: user.id, action: "auth.password_reset_completed", entityType: "User", entityId: user.id, requestId, ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() });
    });

    return apiSuccess({ reset: true }, requestId);
  } catch (error) {
    return apiFailure(error, requestId);
  }
}
