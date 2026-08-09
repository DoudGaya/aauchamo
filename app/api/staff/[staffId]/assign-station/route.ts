import { z } from "zod";

import { requireAccess, requirePermission, requireStation } from "@/lib/server/access";
import { ConflictError, NotFoundError, apiFailure, apiSuccess, parseJson, requestIdFrom } from "@/lib/server/api";
import { writeAudit } from "@/lib/server/audit";
import { db } from "@/lib/server/db";

const schema = z.object({ version: z.number().int().positive(), stationId: z.string().cuid(), effectiveAt: z.coerce.date(), reason: z.string().trim().min(5).max(500) });

export async function POST(request: Request, { params }: { params: Promise<{ staffId: string }> }) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "staff.update");
    const { staffId } = await params;
    const input = await parseJson(request, schema);
    requireStation(access, input.stationId, true);
    const before = await db.staff.findFirst({ where: { id: staffId, companyId: access.companyId } });
    if (!before) throw new NotFoundError("Staff record not found.");
    requireStation(access, before.homeStationId, true);
    await db.$transaction(async (tx) => {
      const count = await tx.staff.updateMany({ where: { id: staffId, version: input.version }, data: { homeStationId: input.stationId, version: { increment: 1 }, updatedById: access.userId } });
      if (!count.count) throw new ConflictError("This staff record changed after you opened it.");
      await tx.staffStationAssignment.updateMany({ where: { staffId, endsAt: null }, data: { endsAt: input.effectiveAt, isPrimary: false } });
      const assignment = await tx.staffStationAssignment.create({ data: { staffId, stationId: input.stationId, startsAt: input.effectiveAt, reason: input.reason, assignedById: access.userId } });
      await writeAudit(tx, { companyId: access.companyId, actorId: access.userId, stationId: input.stationId, action: "staff.station_assigned", entityType: "Staff", entityId: staffId, requestId, reason: input.reason, before: { homeStationId: before.homeStationId }, after: assignment });
    });
    return apiSuccess({ assigned: true, stationId: input.stationId }, requestId);
  } catch (error) {
    return apiFailure(error, requestId);
  }
}
