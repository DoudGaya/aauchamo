import { createHash, randomBytes } from "node:crypto";

import { z } from "zod";

import { apiFailure, apiSuccess, parseJson, requestIdFrom } from "@/lib/server/api";
import { db } from "@/lib/server/db";
import { writeAudit } from "@/lib/server/audit";
import { getRuntimeEnv } from "@/lib/server/env";
import { addMinutes } from "@/lib/server/time";

export const runtime = "nodejs";

const schema = z.object({ identifier: z.string().trim().min(3).max(254) });

export async function POST(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    const { identifier: submitted } = await parseJson(request, schema);
    const identifier = submitted.toLowerCase();
    const user = await db.user.findFirst({
      where: {
        status: { not: "DISABLED" },
        OR: [
          { email: { equals: identifier, mode: "insensitive" } },
          { username: { equals: identifier, mode: "insensitive" } },
        ],
      },
    });

    if (user?.email) {
      const rawToken = randomBytes(32).toString("base64url");
      const tokenHash = createHash("sha256").update(rawToken).digest("hex");
      const resetUrl = new URL("/reset-password", getRuntimeEnv().APP_URL);
      resetUrl.searchParams.set("identifier", user.email);
      resetUrl.searchParams.set("token", rawToken);

      await db.$transaction(async (tx) => {
        await tx.verificationToken.deleteMany({
          where: { identifier: user.email!, purpose: "PASSWORD_RESET", usedAt: null },
        });
        await tx.verificationToken.create({
          data: {
            identifier: user.email!,
            token: tokenHash,
            purpose: "PASSWORD_RESET",
            expires: addMinutes(new Date(), 30),
          },
        });
        await tx.outboxEvent.create({
          data: {
            companyId: user.companyId,
            aggregateType: "User",
            aggregateId: user.id,
            eventType: "auth.password_reset_email_requested",
            payload: { recipient: user.email!, resetUrl: resetUrl.toString() },
          },
        });
        await writeAudit(tx, { companyId: user.companyId, actorId: user.id, action: "auth.password_reset_requested", entityType: "User", entityId: user.id, requestId, ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() });
      });
    }

    return apiSuccess({ accepted: true }, requestId);
  } catch (error) {
    return apiFailure(error, requestId);
  }
}
