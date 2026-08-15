import { z } from "zod";

import { requireAccess, requirePermission, requireStation } from "@/lib/server/access";
import { ConflictError, NotFoundError, apiFailure, apiSuccess, parseJson, requestIdFrom } from "@/lib/server/api";
import { writeAudit } from "@/lib/server/audit";
import { db } from "@/lib/server/db";

export const runtime = "nodejs";

const updateSchema = z.object({
  version: z.number().int().positive(),
  name: z.string().trim().min(2).max(120).optional(),
  legalName: z.string().trim().max(180).nullable().optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().trim().max(30).nullable().optional(),
  address: z.string().trim().max(500).nullable().optional(),
  city: z.string().trim().max(80).nullable().optional(),
  state: z.string().trim().max(80).nullable().optional(),
  timezone: z.string().trim().min(3).max(80).optional(),
  businessUnitIds: z.array(z.string().cuid()).optional(),
  reason: z.string().trim().min(5).max(500),
});

export async function GET(request: Request, { params }: { params: Promise<{ stationId: string }> }) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "stations.view");
    const { stationId } = await params;
    requireStation(access, stationId);
    const station = await db.station.findFirst({
      where: { id: stationId, companyId: access.companyId },
      include: {
        businessUnits: { include: { businessUnit: true } },
        managerHistory: {
          where: { endsAt: null },
          include: { manager: { select: { id: true, name: true, email: true } } },
        },
      },
    });
    if (!station) throw new NotFoundError("Station not found.");
    return apiSuccess(station, requestId);
  } catch (error) {
    return apiFailure(error, requestId);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ stationId: string }> }) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "stations.update");
    const { stationId } = await params;
    requireStation(access, stationId, true);
    const input = await parseJson(request, updateSchema);
    const before = await db.station.findFirst({ where: { id: stationId, companyId: access.companyId } });
    if (!before) throw new NotFoundError("Station not found.");
    const after = await db.$transaction(async (tx) => {
      const result = await tx.station.updateMany({
        where: { id: stationId, companyId: access.companyId, version: input.version },
        data: {
          name: input.name,
          legalName: input.legalName,
          email: input.email,
          phone: input.phone,
          address: input.address,
          city: input.city,
          state: input.state,
          timezone: input.timezone,
          version: { increment: 1 },
          updatedById: access.userId,
        },
      });
      if (!result.count) throw new ConflictError("This station changed after you opened it. Refresh and try again.");
      
      if (input.businessUnitIds !== undefined) {
        await tx.stationBusinessUnit.deleteMany({ where: { stationId } });
        await tx.stationBusinessUnit.createMany({
          data: input.businessUnitIds.map((businessUnitId, index) => ({
            stationId,
            businessUnitId,
            isPrimary: index === 0,
          })),
        });
      }
      
      const updated = await tx.station.findUniqueOrThrow({ where: { id: stationId } });
      await writeAudit(tx, {
        companyId: access.companyId,
        actorId: access.userId,
        stationId,
        action: "station.updated",
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
