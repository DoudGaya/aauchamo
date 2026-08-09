import { z } from "zod";

import { requireAccess, requirePermission, requireStation } from "@/lib/server/access";
import { AppError, apiFailure, apiSuccess, parseJson, parsePagination, requestIdFrom } from "@/lib/server/api";
import { writeAudit } from "@/lib/server/audit";
import { encryptSensitive } from "@/lib/server/crypto";
import { db } from "@/lib/server/db";
import { allocateSequence } from "@/lib/server/sequence";

const nextOfKinSchema = z.object({
  name: z.string().trim().min(2).max(120),
  relationship: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(7).max(30),
  email: z.string().email().optional(),
  address: z.string().trim().max(500).optional(),
  isPrimary: z.boolean().default(false),
});

const createStaffSchema = z.object({
  firstName: z.string().trim().min(2).max(80),
  middleName: z.string().trim().max(80).optional(),
  lastName: z.string().trim().min(2).max(80),
  preferredName: z.string().trim().max(80).optional(),
  phone: z.string().trim().min(7).max(30),
  email: z.string().email().optional(),
  address: z.string().trim().max(500).optional(),
  nationalId: z.string().trim().min(4).max(80).optional(),
  salary: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  employmentDate: z.coerce.date(),
  employmentType: z.enum(["PERMANENT", "CONTRACT", "TEMPORARY", "INTERN", "CONSULTANT"]),
  departmentId: z.string().cuid(),
  positionId: z.string().cuid(),
  homeStationId: z.string().cuid(),
  businessUnitId: z.string().cuid().optional(),
  userId: z.string().cuid().optional(),
  nextOfKin: z.array(nextOfKinSchema).max(5).default([]),
});

function safeStaff<T extends { salary: unknown; address: string | null; nationalIdCiphertext: string | null }>(
  staff: T,
  canViewSensitive: boolean,
) {
  const { nationalIdCiphertext: _protected, ...rest } = staff;
  void _protected;
  return {
    ...rest,
    salary: canViewSensitive && staff.salary != null ? String(staff.salary) : staff.salary == null ? null : "••••••",
    address: canViewSensitive ? staff.address : staff.address ? "••••••" : null,
    hasNationalId: Boolean(staff.nationalIdCiphertext),
  };
}

export async function GET(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "staff.view");
    const canViewSensitive = access.permissions.has("staff.view_sensitive");
    const url = new URL(request.url);
    const { page, pageSize, skip, take } = parsePagination(url.searchParams);
    const search = url.searchParams.get("search")?.trim();
    const stationId = url.searchParams.get("stationId") ?? undefined;
    if (stationId) requireStation(access, stationId);
    const where = {
      companyId: access.companyId,
      ...(stationId
        ? { homeStationId: stationId }
        : access.companyWide
          ? {}
          : { homeStationId: { in: [...access.stationIds] } }),
      ...(search
        ? {
            OR: [
              { staffNumber: { contains: search, mode: "insensitive" as const } },
              { firstName: { contains: search, mode: "insensitive" as const } },
              { lastName: { contains: search, mode: "insensitive" as const } },
              { email: { contains: search, mode: "insensitive" as const } },
              { phone: { contains: search } },
            ],
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      db.staff.findMany({
        where,
        include: {
          department: { select: { id: true, code: true, name: true } },
          position: { select: { id: true, code: true, name: true } },
          homeStation: { select: { id: true, code: true, name: true } },
        },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        skip,
        take,
      }),
      db.staff.count({ where }),
    ]);
    return apiSuccess(items.map((item) => safeStaff(item, canViewSensitive)), requestId, { page, pageSize, total });
  } catch (error) {
    return apiFailure(error, requestId);
  }
}

export async function POST(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "staff.create");
    const input = await parseJson(request, createStaffSchema);
    requireStation(access, input.homeStationId, true);
    const [department, position] = await Promise.all([
      db.department.findFirst({ where: { id: input.departmentId, companyId: access.companyId, isActive: true } }),
      db.position.findFirst({ where: { id: input.positionId, companyId: access.companyId, isActive: true } }),
    ]);
    if (!department || !position) throw new AppError("INVALID_HR_REFERENCE", "Department or position is invalid.", 422);

    const staff = await db.$transaction(async (tx) => {
      const staffNumber = await allocateSequence(tx, {
        companyId: access.companyId,
        stationId: input.homeStationId,
        documentType: "STAFF",
        prefix: "STF",
        includeDate: false,
        padding: 5,
      });
      const created = await tx.staff.create({
        data: {
          companyId: access.companyId,
          businessUnitId: input.businessUnitId,
          userId: input.userId,
          staffNumber,
          firstName: input.firstName,
          middleName: input.middleName,
          lastName: input.lastName,
          preferredName: input.preferredName,
          phone: input.phone,
          email: input.email?.toLowerCase(),
          address: input.address,
          nationalIdCiphertext: input.nationalId ? encryptSensitive(input.nationalId) : undefined,
          salary: input.salary,
          employmentDate: input.employmentDate,
          employmentType: input.employmentType,
          departmentId: input.departmentId,
          positionId: input.positionId,
          homeStationId: input.homeStationId,
          createdById: access.userId,
          updatedById: access.userId,
          nextOfKin: {
            create: input.nextOfKin.map((item) => ({ ...item, createdById: access.userId, updatedById: access.userId })),
          },
        },
      });
      await tx.staffStationAssignment.create({
        data: {
          staffId: created.id,
          stationId: input.homeStationId,
          startsAt: input.employmentDate,
          reason: "Initial employment assignment",
          assignedById: access.userId,
        },
      });
      await tx.employmentHistory.create({
        data: {
          staffId: created.id,
          newStatus: "ACTIVE",
          effectiveAt: input.employmentDate,
          reason: "Staff record created",
          changedById: access.userId,
        },
      });
      await writeAudit(tx, {
        companyId: access.companyId,
        actorId: access.userId,
        stationId: input.homeStationId,
        businessUnitId: input.businessUnitId,
        action: "staff.created",
        entityType: "Staff",
        entityId: created.id,
        requestId,
        after: { ...created, salary: "[REDACTED]", address: "[REDACTED]", nationalIdCiphertext: "[REDACTED]" },
      });
      return created;
    });
    return apiSuccess({ id: staff.id, staffNumber: staff.staffNumber, name: `${staff.firstName} ${staff.lastName}` }, requestId, { created: true });
  } catch (error) {
    return apiFailure(error, requestId);
  }
}
