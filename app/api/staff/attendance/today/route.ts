import { requireAccess } from "@/lib/server/access";
import { apiFailure, apiSuccess, requestIdFrom } from "@/lib/server/api";
import { db } from "@/lib/server/db";

export async function GET(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    const access = await requireAccess();

    // Resolve physical staff linked to logged-in user
    const staff = await db.staff.findFirst({
      where: { userId: access.userId, companyId: access.companyId },
      include: {
        department: { select: { name: true } },
        position: { select: { name: true } },
        homeStation: { select: { id: true, name: true, code: true } },
      },
    });

    if (!staff) {
      return apiSuccess({
        hasStaffRecord: false,
        message: "Logged in user is not linked to a physical employee record.",
      }, requestId);
    }

    const now = new Date();
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

    // Find today's attendance entry for this staff member
    const attendance = await db.staffAttendance.findUnique({
      where: {
        staffId_date: {
          staffId: staff.id,
          date: today,
        },
      },
    });

    const isClockedIn = !!attendance?.clockInAt;
    const isClockedOut = !!attendance?.clockOutAt;
    
    let durationMinutes = 0;
    if (attendance?.clockInAt) {
      const endTime = attendance.clockOutAt ? new Date(attendance.clockOutAt) : now;
      const startTime = new Date(attendance.clockInAt);
      durationMinutes = Math.max(0, Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60)));
    }

    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    const shiftDurationFormatted = `${hours}h ${minutes}m`;

    return apiSuccess({
      hasStaffRecord: true,
      staff: {
        id: staff.id,
        staffNumber: staff.staffNumber,
        firstName: staff.firstName,
        lastName: staff.lastName,
        fullName: `${staff.firstName} ${staff.lastName}`.trim(),
        departmentName: staff.department?.name ?? "General",
        positionName: staff.position?.name ?? "Staff Member",
        homeStation: staff.homeStation,
        passportObjectKey: staff.passportObjectKey,
      },
      todayStatus: {
        date: today.toISOString().split("T")[0],
        isClockedIn,
        isClockedOut,
        clockInAt: attendance?.clockInAt ?? null,
        clockOutAt: attendance?.clockOutAt ?? null,
        clockInLatitude: attendance?.clockInLatitude ?? null,
        clockInLongitude: attendance?.clockInLongitude ?? null,
        clockOutLatitude: attendance?.clockOutLatitude ?? null,
        clockOutLongitude: attendance?.clockOutLongitude ?? null,
        notes: attendance?.notes ?? "",
        status: attendance?.status ?? (isClockedIn ? "PRESENT" : "NOT_CLOCKED_IN"),
        durationMinutes,
        shiftDurationFormatted,
      },
    }, requestId);
  } catch (error) {
    return apiFailure(error, requestId);
  }
}
