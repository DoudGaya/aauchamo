import { z } from "zod";

import { requireAccess, requirePermission, requireStation } from "@/lib/server/access";
import { NotFoundError, apiFailure, apiSuccess, parseJson, requestIdFrom } from "@/lib/server/api";
import { writeAudit } from "@/lib/server/audit";
import { db } from "@/lib/server/db";

const postingSchema = z.object({
  stationId: z.string().cuid(),
  startsAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/),
  endsAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/).nullable().optional(),
  reason: z.string().trim().min(5).max(500),
  isPrimary: z.boolean().default(false),
});

export async function POST(request: Request, { params }: { params: Promise<{ staffId: string }> }) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "staff.update");
    const { staffId } = await params;
    const input = await parseJson(request, postingSchema);

    const staff = await db.staff.findFirst({ where: { id: staffId, companyId: access.companyId } });
    if (!staff) throw new NotFoundError("Staff record not found.");
    
    // Require access to the staff's home station to post them
    requireStation(access, staff.homeStationId, true);
    // Also require access to the destination station
    requireStation(access, input.stationId, true);

    const assignment = await db.$transaction(async (tx) => {
      // If setting this as primary, we should probably close the existing primary
      if (input.isPrimary) {
         await tx.staffStationAssignment.updateMany({
           where: { staffId, isPrimary: true, endsAt: null },
           data: { endsAt: new Date(input.startsAt) }
         });
      }

      const created = await tx.staffStationAssignment.create({
        data: {
          staffId,
          stationId: input.stationId,
          isPrimary: input.isPrimary,
          startsAt: new Date(input.startsAt),
          endsAt: input.endsAt ? new Date(input.endsAt) : null,
          reason: input.reason,
          assignedById: access.userId,
        },
      });

      await writeAudit(tx, {
        companyId: access.companyId,
        actorId: access.userId,
        stationId: staff.homeStationId,
        action: "staff.posted",
        entityType: "Staff",
        entityId: staffId,
        requestId,
        reason: input.reason,
        before: null,
        after: { newAssignmentId: created.id },
        metadata: {
          newStationId: input.stationId,
          effectiveDate: input.startsAt,
          endDate: input.endsAt,
          isPrimary: input.isPrimary
        }
      });
      return created;
    });

    return apiSuccess({ id: assignment.id, staffId }, requestId);
  } catch (error) {
    return apiFailure(error, requestId);
  }
}
