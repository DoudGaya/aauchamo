import { z } from "zod";

import { requireAccess, requirePermission, requireStation } from "@/lib/server/access";
import { AppError, NotFoundError, apiFailure, apiSuccess, parseJson, requestIdFrom } from "@/lib/server/api";
import { writeAudit } from "@/lib/server/audit";
import { db } from "@/lib/server/db";

const schema = z.object({ managerId: z.string().cuid(), reason: z.string().trim().min(5).max(500) });

export async function POST(request: Request, { params }: { params: Promise<{ stationId: string }> }) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "stations.assign_manager");
    const { stationId } = await params;
    requireStation(access, stationId, true);
    const input = await parseJson(request, schema);
    const [station, manager] = await Promise.all([
      db.station.findFirst({ where: { id: stationId, companyId: access.companyId } }),
      db.user.findFirst({
        where: {
          id: input.managerId,
          companyId: access.companyId,
          status: "ACTIVE",
          OR: [
            { stationScopes: { some: { stationId, canOperate: true } } },
            { roleAssignments: { some: { role: { scope: "COMPANY" } } } },
          ],
        },
      }),
    ]);
    if (!station) throw new NotFoundError("Station not found.");
    if (!manager) throw new AppError("INVALID_MANAGER", "The selected user is not an active operator for this station.", 422);
    const assignment = await db.$transaction(async (tx) => {
      const previous = await tx.stationManagerAssignment.findMany({ where: { stationId, endsAt: null } });
      await tx.stationManagerAssignment.updateMany({
        where: { stationId, endsAt: null },
        data: { endsAt: new Date() },
      });
      const created = await tx.stationManagerAssignment.create({
        data: { stationId, managerId: manager.id, assignedById: access.userId },
      });
      await writeAudit(tx, {
        companyId: access.companyId,
        actorId: access.userId,
        stationId,
        action: "station.manager_assigned",
        entityType: "Station",
        entityId: stationId,
        requestId,
        reason: input.reason,
        before: previous,
        after: created,
      });
      return created;
    });
    return apiSuccess(assignment, requestId);
  } catch (error) {
    return apiFailure(error, requestId);
  }
}
