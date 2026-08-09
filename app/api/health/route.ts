import { Prisma } from "@/lib/generated/prisma/client";
import { apiFailure, apiSuccess, requestIdFrom } from "@/lib/server/api";
import { db } from "@/lib/server/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = requestIdFrom(request);
  const startedAt = performance.now();
  try {
    await db.$queryRaw(Prisma.sql`SELECT 1`);
    return apiSuccess(
      {
        status: "ready",
        database: "reachable",
        latencyMs: Math.round(performance.now() - startedAt),
      },
      requestId,
    );
  } catch (error) {
    return apiFailure(error, requestId);
  }
}
