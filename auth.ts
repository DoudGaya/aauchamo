import { randomUUID } from "node:crypto";

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

import { db } from "@/lib/server/db";
import { writeAudit } from "@/lib/server/audit";
import { getRuntimeEnv } from "@/lib/server/env";
import { verifyPassword } from "@/lib/server/password";
import { addMinutes, addSeconds } from "@/lib/server/time";

const credentialSchema = z.object({
  identifier: z.string().trim().min(3).max(254),
  password: z.string().min(1).max(128),
});

const MAX_FAILED_LOGINS = 5;
const LOCK_MINUTES = 15;

function requestMetadata(request: Request) {
  return {
    ipAddress:
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      undefined,
    userAgent: request.headers.get("user-agent")?.slice(0, 500) ?? undefined,
    requestId: request.headers.get("x-request-id")?.slice(0, 100) ?? undefined,
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth(() => {
  const env = getRuntimeEnv();

  return {
    secret: env.AUTH_SECRET,
    trustHost: true,
    pages: { signIn: "/login" },
    session: {
      strategy: "jwt" as const,
      maxAge: env.AUTH_SESSION_MAX_AGE_SECONDS,
      updateAge: 15 * 60,
    },
    providers: [
      Credentials({
        credentials: {
          identifier: { label: "Email or username", type: "text" },
          password: { label: "Password", type: "password" },
        },
        async authorize(rawCredentials, request) {
          const parsed = credentialSchema.safeParse(rawCredentials);
          if (!parsed.success) return null;

          const identifier = parsed.data.identifier.toLowerCase();
          const metadata = requestMetadata(request);
          const user = await db.user.findFirst({
            where: {
              OR: [
                { email: { equals: identifier, mode: "insensitive" } },
                { username: { equals: identifier, mode: "insensitive" } },
              ],
            },
          });

          const passwordMatches = await verifyPassword(parsed.data.password, user?.passwordHash);
          const now = new Date();

          if (!user || !passwordMatches) {
            if (!user) {
              await db.loginAttempt.create({
                data: {
                  identifier,
                  result: "INVALID_CREDENTIALS",
                  ...metadata,
                },
              });
              return null;
            }

            const failedLoginCount = user.failedLoginCount + 1;
            const shouldLock = failedLoginCount >= MAX_FAILED_LOGINS;
            await db.$transaction(async (tx) => {
              await tx.user.update({
                where: { id: user.id },
                data: {
                  failedLoginCount,
                  status: shouldLock ? "LOCKED" : user.status,
                  lockedUntil: shouldLock ? addMinutes(now, LOCK_MINUTES) : user.lockedUntil,
                  securityVersion: shouldLock ? { increment: 1 } : undefined,
                },
              });
              await tx.loginAttempt.create({
                data: {
                  userId: user.id,
                  identifier,
                  result: "INVALID_CREDENTIALS",
                  ...metadata,
                },
              });
              await writeAudit(tx, { companyId: user.companyId, actorId: user.id, action: shouldLock ? "auth.account_locked" : "auth.login_failed", entityType: "User", entityId: user.id, outcome: "FAILURE", ...metadata });
            });
            return null;
          }

          const temporaryLockExpired =
            user.status === "LOCKED" && user.lockedUntil && user.lockedUntil <= now;
          if (user.status === "DISABLED" || (user.status === "LOCKED" && !temporaryLockExpired)) {
            await db.loginAttempt.create({
              data: {
                userId: user.id,
                identifier,
                result: user.status === "DISABLED" ? "DISABLED" : "LOCKED",
                ...metadata,
              },
            });
            return null;
          }

          if (user.status !== "ACTIVE" && !temporaryLockExpired) return null;

          const activeUser = await db.$transaction(async (tx) => {
            const updated = await tx.user.update({
              where: { id: user.id },
              data: {
                status: "ACTIVE",
                failedLoginCount: 0,
                lockedUntil: null,
                lastLoginAt: now,
                lastLoginIp: metadata.ipAddress,
              },
            });
            await tx.loginAttempt.create({
              data: {
                userId: user.id,
                identifier,
                result: "SUCCESS",
                ...metadata,
              },
            });
            await writeAudit(tx, { companyId: user.companyId, actorId: user.id, action: "auth.login_succeeded", entityType: "User", entityId: user.id, outcome: "SUCCESS", ...metadata });
            return updated;
          });

          return {
            id: activeUser.id,
            name: activeUser.name ?? `${activeUser.firstName} ${activeUser.lastName}`,
            email: activeUser.email,
            image: activeUser.image,
            username: activeUser.username,
            companyId: activeUser.companyId,
            securityVersion: activeUser.securityVersion,
          };
        },
      }),
    ],
    callbacks: {
      async jwt({ token, user }) {
        if (user) {
          const sessionId = randomUUID();
          const expires = addSeconds(new Date(), env.AUTH_SESSION_MAX_AGE_SECONDS);
          await db.session.create({
            data: {
              id: sessionId,
              sessionToken: randomUUID(),
              userId: user.id!,
              expires,
              securityVersion: user.securityVersion,
            },
          });
          token.sessionId = sessionId;
          token.username = user.username;
          token.companyId = user.companyId;
          token.securityVersion = user.securityVersion;
        }
        return token;
      },
      session({ session, token }) {
        if (session.user && token.sub) {
          session.user.id = token.sub;
          session.user.username = String(token.username ?? "");
          session.user.companyId = String(token.companyId ?? "");
          session.user.securityVersion = Number(token.securityVersion ?? 0);
          session.sessionId = String(token.sessionId ?? "");
        }
        return session;
      },
    },
  };
});
