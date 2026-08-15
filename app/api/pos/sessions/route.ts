import { z } from "zod";
import { requireAccess, requirePermission, requireStation } from "@/lib/server/access";
import { AppError, apiFailure, apiSuccess, parseJson, requestIdFrom } from "@/lib/server/api";
import { writeAudit } from "@/lib/server/audit";
import { db } from "@/lib/server/db";

const openSessionSchema = z.object({
  stationId: z.string().cuid(),
  openingCash: z.string().regex(/^\d+(\.\d{1,2})?$/),
});

export async function GET(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "sales.create");
    const url = new URL(request.url);
    const stationId = url.searchParams.get("stationId");
    if (!stationId) throw new AppError("STATION_REQUIRED", "A station ID is required.", 422);
    requireStation(access, stationId);

    const activeOnly = url.searchParams.get("active") === "true";
    if (activeOnly) {
      const activeSession = await db.pOSSession.findFirst({
        where: {
          stationId,
          status: "OPEN",
        },
      });
      return apiSuccess(activeSession, requestId);
    }

    const sessions = await db.pOSSession.findMany({
      where: {
        stationId,
      },
      orderBy: {
        openedAt: "desc",
      },
      take: 50,
    });
    return apiSuccess(sessions, requestId);
  } catch (error) {
    return apiFailure(error, requestId);
  }
}

export async function POST(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "sales.create");
    const input = await parseJson(request, openSessionSchema);
    requireStation(access, input.stationId, true);

    const session = await db.$transaction(async (tx) => {
      // Check if there is an active session already open
      const existing = await tx.pOSSession.findFirst({
        where: {
          stationId: input.stationId,
          status: "OPEN",
        },
      });
      if (existing) {
        throw new AppError("SESSION_ALREADY_OPEN", "A POS session is already active for this station.", 409);
      }

      const created = await tx.pOSSession.create({
        data: {
          stationId: input.stationId,
          openedById: access.userId,
          openingCash: input.openingCash,
          status: "OPEN",
        },
      });

      await writeAudit(tx, {
        companyId: access.companyId,
        actorId: access.userId,
        stationId: input.stationId,
        action: "pos.session.opened",
        entityType: "POSSession",
        entityId: created.id,
        requestId,
        after: created,
      });

      return created;
    });

    return apiSuccess(session, requestId, { created: true });
  } catch (error) {
    return apiFailure(error, requestId);
  }
}
