import { z } from "zod";

import { requireAccess, requirePermission } from "@/lib/server/access";
import { apiFailure, apiSuccess, parseJson, requestIdFrom } from "@/lib/server/api";
import { writeAudit } from "@/lib/server/audit";
import { db } from "@/lib/server/db";

export const runtime = "nodejs";

const createStationSchema = z.object({
  code: z.string().trim().min(2).max(12).regex(/^[A-Z0-9-]+$/).transform((value) => value.toUpperCase()),
  name: z.string().trim().min(2).max(120),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional(),
  address: z.string().trim().max(500).optional(),
  city: z.string().trim().max(80).optional(),
  state: z.string().trim().max(80).optional(),
  businessUnitIds: z.array(z.string().cuid()).default([]),
});

export async function GET(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "stations.view");
    const stations = await db.station.findMany({
      where: {
        companyId: access.companyId,
        ...(access.companyWide ? {} : { id: { in: [...access.stationIds] } }),
      },
      include: {
        businessUnits: { include: { businessUnit: { select: { id: true, code: true, name: true } } } },
        managerHistory: {
          where: { endsAt: null },
          include: { manager: { select: { id: true, name: true, firstName: true, lastName: true } } },
          take: 1,
        },
      },
      orderBy: { name: "asc" },
    });
    return apiSuccess(stations, requestId);
  } catch (error) {
    return apiFailure(error, requestId);
  }
}

export async function POST(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "stations.manage");
    const input = await parseJson(request, createStationSchema);
    const station = await db.$transaction(async (tx) => {
      const created = await tx.station.create({
        data: {
          companyId: access.companyId,
          code: input.code,
          name: input.name,
          email: input.email || null,
          phone: input.phone,
          address: input.address,
          city: input.city,
          state: input.state,
          createdById: access.userId,
          updatedById: access.userId,
          businessUnits: {
            create: input.businessUnitIds.map((businessUnitId, index) => ({
              businessUnitId,
              isPrimary: index === 0,
            })),
          },
        },
      });
      await writeAudit(tx, {
        companyId: access.companyId,
        actorId: access.userId,
        action: "station.created",
        entityType: "Station",
        entityId: created.id,
        requestId,
        after: created,
      });
      return created;
    });
    return apiSuccess(station, requestId, { created: true });
  } catch (error) {
    return apiFailure(error, requestId);
  }
}
