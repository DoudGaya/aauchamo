import { z } from "zod";

import { requireAccess, requirePermission, requireStation } from "@/lib/server/access";
import { ConflictError, NotFoundError, apiFailure, apiSuccess, parseJson, requestIdFrom } from "@/lib/server/api";
import { writeAudit } from "@/lib/server/audit";
import { db } from "@/lib/server/db";

const transferSchema = z.object({
  stationId: z.string().cuid(),
  startsAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/),
  reason: z.string().trim().min(5).max(500),
  version: z.number().int().positive(),
});

export async function POST(request: Request, { params }: { params: Promise<{ staffId: string }> }) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "staff.update");
    const { staffId } = await params;
    const input = await parseJson(request, transferSchema);

    const before = await db.staff.findFirst({ where: { id: staffId, companyId: access.companyId } });
    if (!before) throw new NotFoundError("Staff record not found.");
    
    // Require access to the staff's CURRENT home station to transfer them out
    requireStation(access, before.homeStationId, true);
    // Also require access to the NEW station to transfer them in
    requireStation(access, input.stationId, true);

    const after = await db.$transaction(async (tx) => {
      // 1. Close current primary assignment
      await tx.staffStationAssignment.updateMany({
        where: {
          staffId,
          isPrimary: true,
          endsAt: null,
        },
        data: {
          endsAt: new Date(input.startsAt),
        },
      });

      // 2. Create new primary assignment
      await tx.staffStationAssignment.create({
        data: {
          staffId,
          stationId: input.stationId,
          isPrimary: true,
          startsAt: new Date(input.startsAt),
          reason: input.reason,
          assignedById: access.userId,
        },
      });

      // 3. Update staff's home station
      const count = await tx.staff.updateMany({
        where: { id: staffId, version: input.version },
        data: {
          homeStationId: input.stationId,
          version: { increment: 1 },
          updatedById: access.userId,
        },
      });

      if (!count.count) throw new ConflictError("This staff record changed after you opened it. Refresh and try again.");

      const updated = await tx.staff.findUniqueOrThrow({ where: { id: staffId } });

      await writeAudit(tx, {
        companyId: access.companyId,
        actorId: access.userId,
        stationId: before.homeStationId,
        action: "staff.transferred",
        entityType: "Staff",
        entityId: staffId,
        requestId,
        reason: input.reason,
        before: { homeStationId: before.homeStationId },
        after: { homeStationId: updated.homeStationId },
        metadata: {
          newStationId: input.stationId,
          effectiveDate: input.startsAt,
        }
      });
      return updated;
    });

    return apiSuccess({ id: after.id, version: after.version }, requestId);
  } catch (error) {
    return apiFailure(error, requestId);
  }
}
