import { z } from "zod";

import { requireAccess, requirePermission, requireStation } from "@/lib/server/access";
import { ConflictError, NotFoundError, apiFailure, apiSuccess, parseJson, requestIdFrom } from "@/lib/server/api";
import { writeAudit } from "@/lib/server/audit";
import { db } from "@/lib/server/db";

const schema = z.object({ version: z.number().int().positive(), status: z.enum(["ACTIVE", "ON_LEAVE", "SUSPENDED", "TERMINATED", "RESIGNED", "RETIRED"]), effectiveAt: z.coerce.date(), reason: z.string().trim().min(5).max(500) });

export async function POST(request: Request, { params }: { params: Promise<{ staffId: string }> }) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "staff.change_status");
    const { staffId } = await params;
    const input = await parseJson(request, schema);
    const before = await db.staff.findFirst({ where: { id: staffId, companyId: access.companyId } });
    if (!before) throw new NotFoundError("Staff record not found.");
    requireStation(access, before.homeStationId, true);
    await db.$transaction(async (tx) => {
      const count = await tx.staff.updateMany({ where: { id: staffId, version: input.version }, data: { status: input.status, version: { increment: 1 }, updatedById: access.userId } });
      if (!count.count) throw new ConflictError("This staff record changed after you opened it.");
      const history = await tx.employmentHistory.create({ data: { staffId, previousStatus: before.status, newStatus: input.status, effectiveAt: input.effectiveAt, reason: input.reason, changedById: access.userId } });
      await writeAudit(tx, { companyId: access.companyId, actorId: access.userId, stationId: before.homeStationId, action: "staff.status_changed", entityType: "Staff", entityId: staffId, requestId, reason: input.reason, before: { status: before.status }, after: history });
    });
    return apiSuccess({ updated: true, status: input.status }, requestId);
  } catch (error) {
    return apiFailure(error, requestId);
  }
}
