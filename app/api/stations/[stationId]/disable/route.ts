import { z } from "zod";

import { requireAccess, requirePermission } from "@/lib/server/access";
import { AppError, ConflictError, NotFoundError, apiFailure, apiSuccess, parseJson, requestIdFrom } from "@/lib/server/api";
import { writeAudit } from "@/lib/server/audit";
import { db } from "@/lib/server/db";

const schema = z.object({ version: z.number().int().positive(), reason: z.string().trim().min(10).max(500) });

export async function POST(request: Request, { params }: { params: Promise<{ stationId: string }> }) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "stations.disable");
    if (!access.companyWide) throw new AppError("COMPANY_SCOPE_REQUIRED", "Company-wide access is required.", 403);
    const { stationId } = await params;
    const input = await parseJson(request, schema);
    const before = await db.station.findFirst({ where: { id: stationId, companyId: access.companyId } });
    if (!before) throw new NotFoundError("Station not found.");
    if (before.status === "DISABLED") return apiSuccess(before, requestId, { unchanged: true });
    const pendingApprovals = await db.approvalRequest.count({ where: { stationId, status: "PENDING" } });
    if (pendingApprovals) {
      throw new ConflictError("Resolve pending station approvals before disabling this station.", { pendingApprovals });
    }
    const after = await db.$transaction(async (tx) => {
      const result = await tx.station.updateMany({
        where: { id: stationId, version: input.version, status: "ACTIVE" },
        data: {
          status: "DISABLED",
          disabledAt: new Date(),
          disabledReason: input.reason,
          version: { increment: 1 },
          updatedById: access.userId,
        },
      });
      if (!result.count) throw new ConflictError("Station status changed. Refresh and try again.");
      const updated = await tx.station.findUniqueOrThrow({ where: { id: stationId } });
      await writeAudit(tx, {
        companyId: access.companyId,
        actorId: access.userId,
        stationId,
        action: "station.disabled",
        entityType: "Station",
        entityId: stationId,
        requestId,
        reason: input.reason,
        before,
        after: updated,
      });
      return updated;
    });
    return apiSuccess(after, requestId);
  } catch (error) {
    return apiFailure(error, requestId);
  }
}
