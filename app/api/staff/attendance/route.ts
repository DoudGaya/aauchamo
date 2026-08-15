import { z } from "zod";

import { requireAccess, requirePermission } from "@/lib/server/access";
import { AppError, NotFoundError, apiFailure, apiSuccess, parseJson, parsePagination, requestIdFrom } from "@/lib/server/api";
import { db } from "@/lib/server/db";
import { writeAudit } from "@/lib/server/audit";

const attendanceSchema = z.object({
  action: z.enum(["in", "out"]),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  notes: z.string().trim().max(500).optional(),
});

export async function GET(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "staff.view");
    const url = new URL(request.url);
    const { page, pageSize, skip, take } = parsePagination(url.searchParams);
    
    const staffId = url.searchParams.get("staffId") ?? undefined;
    const stationId = url.searchParams.get("stationId") ?? undefined;
    const dateStr = url.searchParams.get("date") ?? undefined; // YYYY-MM-DD
    
    let dateFilter: any = undefined;
    if (dateStr) {
      dateFilter = new Date(dateStr);
    }

    const where = {
      companyId: access.companyId,
      ...(staffId ? { staffId } : {}),
      ...(stationId ? { staff: { homeStationId: stationId } } : {}),
      ...(dateFilter ? { date: dateFilter } : {}),
    };

    const [items, total] = await Promise.all([
      db.staffAttendance.findMany({
        where,
        include: {
          staff: {
            include: {
              department: { select: { name: true } },
              position: { select: { name: true } },
              homeStation: { select: { name: true } },
            }
          }
        },
        orderBy: { clockInAt: "desc" },
        skip,
        take,
      }),
      db.staffAttendance.count({ where }),
    ]);

    return apiSuccess(items, requestId, { page, pageSize, total });
  } catch (error) {
    return apiFailure(error, requestId);
  }
}

export async function POST(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    const access = await requireAccess(); // Standard authenticated session
    const input = await parseJson(request, attendanceSchema);

    // Resolve physical staff linked to logged-in user
    const staff = await db.staff.findFirst({
      where: { userId: access.userId, companyId: access.companyId },
    });
    if (!staff) {
      throw new AppError("STAFF_RECORD_REQUIRED", "Your system user account is not linked to an active physical employee record. Please contact HR.", 422);
    }

    const now = new Date();
    // Normalize date to YYYY-MM-DD
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

    // Get current IP from request headers
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "127.0.0.1";

    const result = await db.$transaction(async (tx) => {
      // Find today's attendance entry
      const existing = await tx.staffAttendance.findUnique({
        where: {
          staffId_date: {
            staffId: staff.id,
            date: today,
          }
        }
      });

      if (input.action === "in") {
        if (existing) {
          throw new AppError("ALREADY_CLOCKED_IN", "You have already clocked in for today.", 409);
        }

        const created = await tx.staffAttendance.create({
          data: {
            companyId: access.companyId,
            staffId: staff.id,
            date: today,
            clockInAt: now,
            clockInLatitude: input.latitude,
            clockInLongitude: input.longitude,
            clockInIp: ip,
            status: "PRESENT",
            notes: input.notes,
          }
        });

        await writeAudit(tx, {
          companyId: access.companyId,
          actorId: access.userId,
          stationId: staff.homeStationId,
          action: "staff.attendance.clock_in",
          entityType: "StaffAttendance",
          entityId: created.id,
          requestId,
          after: created,
        });

        return created;
      } else {
        if (!existing) {
          throw new AppError("CLOCK_IN_REQUIRED", "You must clock in first before clocking out.", 400);
        }
        if (existing.clockOutAt) {
          throw new AppError("ALREADY_CLOCKED_OUT", "You have already clocked out for today.", 409);
        }

        const updated = await tx.staffAttendance.update({
          where: { id: existing.id },
          data: {
            clockOutAt: now,
            clockOutLatitude: input.latitude,
            clockOutLongitude: input.longitude,
            clockOutIp: ip,
            notes: input.notes ? `${existing.notes || ""}\nOut Notes: ${input.notes}`.trim() : existing.notes,
          }
        });

        await writeAudit(tx, {
          companyId: access.companyId,
          actorId: access.userId,
          stationId: staff.homeStationId,
          action: "staff.attendance.clock_out",
          entityType: "StaffAttendance",
          entityId: updated.id,
          requestId,
          before: existing,
          after: updated,
        });

        return updated;
      }
    });

    return apiSuccess(result, requestId);
  } catch (error) {
    return apiFailure(error, requestId);
  }
}
