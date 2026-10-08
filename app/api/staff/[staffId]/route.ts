import { z } from "zod";

import { requireAccess, requirePermission, requireStation } from "@/lib/server/access";
import { ConflictError, NotFoundError, apiFailure, apiSuccess, parseJson, requestIdFrom } from "@/lib/server/api";
import { writeAudit } from "@/lib/server/audit";
import { encryptSensitive } from "@/lib/server/crypto";
import { db } from "@/lib/server/db";

const nextOfKinSchema = z.object({
  name: z.string().trim().min(2).max(120),
  relationship: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(7).max(30),
  email: z.string().email().optional(),
  address: z.string().trim().max(500).optional(),
  isPrimary: z.boolean().default(false),
});

const schema = z.object({
  version: z.number().int().positive(),
  firstName: z.string().trim().min(2).max(80),
  middleName: z.string().trim().max(80).nullable(),
  lastName: z.string().trim().min(2).max(80),
  preferredName: z.string().trim().max(80).nullable(),
  phone: z.string().trim().min(7).max(30),
  email: z.string().email().nullable(),
  address: z.string().trim().max(500).nullable().optional(),
  nationalId: z.string().trim().min(4).max(80).nullable().optional(),
  salary: z.string().regex(/^\d+(\.\d{1,2})?$/).nullable().optional(),
  employmentType: z.enum(["PERMANENT", "CONTRACT", "TEMPORARY", "INTERN", "CONSULTANT"]),
  departmentId: z.string().optional(),
  department: z.string().trim().min(1).max(120).optional(),
  positionId: z.string().optional(),
  position: z.string().trim().min(1).max(120).optional(),
  passportPhoto: z.string().nullable().optional(),
  reason: z.string().trim().min(5).max(500),
  nextOfKin: z.array(nextOfKinSchema).max(5).optional(),
});

export async function GET(request: Request, { params }: { params: Promise<{ staffId: string }> }) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "staff.view");
    const { staffId } = await params;
    const staff = await db.staff.findFirst({
      where: { id: staffId, companyId: access.companyId },
      include: { department: true, position: true, homeStation: true, stationHistory: { include: { station: true }, orderBy: { startsAt: "desc" } }, employmentHistory: { orderBy: { effectiveAt: "desc" } }, nextOfKin: true },
    });
    if (!staff) throw new NotFoundError("Staff record not found.");
    requireStation(access, staff.homeStationId);
    const canViewSensitive = access.permissions.has("staff.view_sensitive");
    const { nationalIdCiphertext: _protected, nextOfKin, ...safe } = staff;
    void _protected;
    return apiSuccess({
      ...safe,
      salary: canViewSensitive && staff.salary != null ? String(staff.salary) : staff.salary == null ? null : "••••••",
      address: canViewSensitive ? staff.address : staff.address ? "••••••" : null,
      hasNationalId: Boolean(staff.nationalIdCiphertext),
      passportPhotoUrl: staff.passportObjectKey,
      nextOfKin: canViewSensitive ? nextOfKin : nextOfKin.map(() => ({ protected: true })),
    }, requestId);
  } catch (error) {
    return apiFailure(error, requestId);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ staffId: string }> }) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "staff.update");
    const { staffId } = await params;
    const input = await parseJson(request, schema);
    const before = await db.staff.findFirst({ where: { id: staffId, companyId: access.companyId } });
    if (!before) throw new NotFoundError("Staff record not found.");
    requireStation(access, before.homeStationId, true);

    // Resolve Department:
    let resolvedDepartmentId = before.departmentId;
    if (input.departmentId && input.departmentId.startsWith("c") && input.departmentId.length >= 20) {
      const dept = await db.department.findFirst({ where: { id: input.departmentId, companyId: access.companyId, isActive: true } });
      if (dept) resolvedDepartmentId = dept.id;
    }
    const deptName = (input.department || (!input.departmentId?.startsWith("c") ? input.departmentId : null))?.trim();
    if (deptName) {
      let dept = await db.department.findFirst({ where: { companyId: access.companyId, name: { equals: deptName, mode: "insensitive" } } });
      if (!dept) {
        let code = deptName.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 15) || "DEPT";
        const existingCode = await db.department.findFirst({ where: { companyId: access.companyId, code } });
        if (existingCode) code = `${code.slice(0, 10)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
        dept = await db.department.create({
          data: { companyId: access.companyId, name: deptName, code, isActive: true, createdById: access.userId, updatedById: access.userId }
        });
      }
      resolvedDepartmentId = dept.id;
    }

    // Resolve Position:
    let resolvedPositionId = before.positionId;
    if (input.positionId && input.positionId.startsWith("c") && input.positionId.length >= 20) {
      const pos = await db.position.findFirst({ where: { id: input.positionId, companyId: access.companyId, isActive: true } });
      if (pos) resolvedPositionId = pos.id;
    }
    const posName = (input.position || (!input.positionId?.startsWith("c") ? input.positionId : null))?.trim();
    if (posName) {
      let pos = await db.position.findFirst({ where: { companyId: access.companyId, name: { equals: posName, mode: "insensitive" } } });
      if (!pos) {
        let code = posName.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 15) || "POS";
        const existingCode = await db.position.findFirst({ where: { companyId: access.companyId, code } });
        if (existingCode) code = `${code.slice(0, 10)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
        pos = await db.position.create({
          data: { companyId: access.companyId, name: posName, code, isActive: true, createdById: access.userId, updatedById: access.userId }
        });
      }
      resolvedPositionId = pos.id;
    }

    const after = await db.$transaction(async (tx) => {
      const count = await tx.staff.updateMany({
        where: { id: staffId, version: input.version },
        data: {
          firstName: input.firstName, middleName: input.middleName, lastName: input.lastName,
          preferredName: input.preferredName, phone: input.phone, email: input.email?.toLowerCase() ?? null,
          address: input.address, salary: input.salary, employmentType: input.employmentType,
          departmentId: resolvedDepartmentId, positionId: resolvedPositionId,
          ...(input.passportPhoto !== undefined ? { passportObjectKey: input.passportPhoto } : {}),
          ...(input.nationalId !== undefined ? { nationalIdCiphertext: input.nationalId ? encryptSensitive(input.nationalId) : null } : {}),
          version: { increment: 1 }, updatedById: access.userId,
        },
      });
      if (!count.count) throw new ConflictError("This staff record changed after you opened it. Refresh and try again.");
      
      if (input.nextOfKin) {
        await tx.nextOfKin.deleteMany({ where: { staffId } });
        if (input.nextOfKin.length > 0) {
          await tx.nextOfKin.createMany({
            data: input.nextOfKin.map(nok => ({
              ...nok,
              staffId,
              createdById: access.userId,
              updatedById: access.userId,
            }))
          });
        }
      }

      const updated = await tx.staff.findUniqueOrThrow({ where: { id: staffId } });
      await writeAudit(tx, { companyId: access.companyId, actorId: access.userId, stationId: before.homeStationId, action: "staff.updated", entityType: "Staff", entityId: staffId, requestId, reason: input.reason, before: { ...before, salary: "[REDACTED]", address: "[REDACTED]", nationalIdCiphertext: "[REDACTED]" }, after: { ...updated, salary: "[REDACTED]", address: "[REDACTED]", nationalIdCiphertext: "[REDACTED]" } });
      return updated;
    });
    return apiSuccess({ id: after.id, staffNumber: after.staffNumber, version: after.version }, requestId);
  } catch (error) {
    return apiFailure(error, requestId);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ staffId: string }> }) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "staff.update");
    const { staffId } = await params;
    const body = await parseJson(request, z.object({ reason: z.string().trim().min(5).max(500) }));
    const staff = await db.staff.findFirst({ where: { id: staffId, companyId: access.companyId } });
    if (!staff) throw new NotFoundError("Staff record not found.");
    requireStation(access, staff.homeStationId, true);
    
    await db.$transaction(async (tx) => {
      await tx.staffStationAssignment.deleteMany({ where: { staffId } });
      await tx.employmentHistory.deleteMany({ where: { staffId } });
      await tx.nextOfKin.deleteMany({ where: { staffId } });
      await tx.staff.delete({ where: { id: staffId } });
      await writeAudit(tx, { companyId: access.companyId, actorId: access.userId, stationId: staff.homeStationId, action: "staff.deleted", entityType: "Staff", entityId: staffId, requestId, reason: body.reason, before: { ...staff, salary: "[REDACTED]", address: "[REDACTED]", nationalIdCiphertext: "[REDACTED]" } });
    });
    return apiSuccess({ deleted: true }, requestId);
  } catch (error) {
    return apiFailure(error, requestId);
  }
}
