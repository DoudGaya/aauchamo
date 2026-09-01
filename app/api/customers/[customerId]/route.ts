import { z } from "zod";

import { requireAccess, requirePermission, requireStation } from "@/lib/server/access";
import { ConflictError, NotFoundError, apiFailure, apiSuccess, parseJson, requestIdFrom } from "@/lib/server/api";
import { decryptSensitive, encryptSensitive, hashLookup } from "@/lib/server/crypto";
import { db } from "@/lib/server/db";
import { normalizeEmail, normalizeName, normalizePhone } from "@/lib/server/normalize";
import { writeAudit } from "@/lib/server/audit";

const schema = z
  .object({
    version: z.number().int().positive(),
    type: z.enum(["INDIVIDUAL", "BUSINESS"]),
    firstName: z.string().trim().max(80).nullable(),
    lastName: z.string().trim().max(80).nullable(),
    companyName: z.string().trim().max(160).nullable(),
    phone: z.string().trim().min(7).max(30).optional(),
    email: z.string().email().nullable(),
    pnr: z.string().trim().max(30).nullable(),
    nationalId: z.string().trim().min(4).max(80).nullable().optional(),
    destination: z.string().trim().max(120).nullable(),
    airline: z.string().trim().max(120).nullable(),
    remarks: z.string().trim().max(1_000).nullable(),
    reason: z.string().trim().min(5).max(500),
  })
  .superRefine((value, context) => {
    if (value.type === "INDIVIDUAL" && (!value.firstName || !value.lastName)) context.addIssue({ code: "custom", path: ["firstName"], message: "First and last name are required." });
    if (value.type === "BUSINESS" && !value.companyName) context.addIssue({ code: "custom", path: ["companyName"], message: "Company name is required." });
  });

export async function GET(request: Request, { params }: { params: Promise<{ customerId: string }> }) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "customers.view");
    const { customerId } = await params;
    const customer = await db.customer.findFirst({
      where: { id: customerId, companyId: access.companyId },
      include: { homeStation: true, contacts: true, identifiers: true, mergedInto: { select: { id: true, customerNumber: true, displayName: true } } },
    });
    if (!customer) throw new NotFoundError("Customer not found.");
    requireStation(access, customer.homeStationId);
    const canViewSensitive = access.permissions.has("customers.view_sensitive");
    const { nationalIdCiphertext: _protected, identifiers, ...safe } = customer;
    void _protected;
    return apiSuccess({
      ...safe,
      identifiers: identifiers.map((identifier) => ({
        id: identifier.id,
        type: identifier.type,
        lastFour: identifier.lastFour,
        expiresAt: identifier.expiresAt,
        value: canViewSensitive ? decryptSensitive(identifier.valueCiphertext) : identifier.lastFour ? `••••${identifier.lastFour}` : "••••••",
      })),
    }, requestId);
  } catch (error) {
    return apiFailure(error, requestId);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ customerId: string }> }) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "customers.update");
    const { customerId } = await params;
    const input = await parseJson(request, schema);
    const before = await db.customer.findFirst({ where: { id: customerId, companyId: access.companyId, status: "ACTIVE" } });
    if (!before) throw new NotFoundError("Active customer not found.");
    requireStation(access, before.homeStationId, true);
    const displayName = normalizeName(input.type === "BUSINESS" ? input.companyName! : `${input.firstName!} ${input.lastName!}`);
    const normalizedPhone = normalizePhone(input.phone);
    const normalizedEmail = normalizeEmail(input.email);
    const updated = await db.$transaction(async (tx) => {
      const count = await tx.customer.updateMany({
        where: { id: customerId, version: input.version, status: "ACTIVE" },
        data: {
          type: input.type, firstName: input.firstName, lastName: input.lastName, companyName: input.companyName,
          displayName, primaryPhone: input.phone || null, normalizedPhone: normalizedPhone || null, primaryEmail: input.email?.toLowerCase() ?? null,
          normalizedEmail, defaultPnr: input.pnr?.toUpperCase() ?? null, defaultDestination: input.destination,
          defaultAirline: input.airline, remarks: input.remarks,
          ...(input.nationalId !== undefined ? { nationalIdCiphertext: input.nationalId ? encryptSensitive(input.nationalId) : null } : {}),
          version: { increment: 1 }, updatedById: access.userId,
        },
      });
      if (!count.count) throw new ConflictError("This customer changed after you opened it. Refresh and try again.");
      await tx.customerContact.deleteMany({ where: { customerId, isPrimary: true, type: { in: ["PHONE", "EMAIL"] } } });
      if (input.phone) await tx.customerContact.create({ data: { customerId, type: "PHONE", value: input.phone, normalized: normalizedPhone!, isPrimary: true } });
      if (normalizedEmail) await tx.customerContact.create({ data: { customerId, type: "EMAIL", value: input.email!, normalized: normalizedEmail, isPrimary: true } });
      if (input.nationalId !== undefined) {
        await tx.customerIdentifier.deleteMany({ where: { customerId, type: "NATIONAL_ID" } });
        if (input.nationalId) {
          await tx.customerIdentifier.create({ data: { customerId, type: "NATIONAL_ID", valueCiphertext: encryptSensitive(input.nationalId), valueHash: hashLookup(input.nationalId), lastFour: input.nationalId.slice(-4), createdById: access.userId } });
        }
      }
      const after = await tx.customer.findUniqueOrThrow({ where: { id: customerId } });
      await writeAudit(tx, { companyId: access.companyId, actorId: access.userId, stationId: before.homeStationId, action: "customer.updated", entityType: "Customer", entityId: customerId, requestId, reason: input.reason, before: { ...before, nationalIdCiphertext: "[REDACTED]" }, after: { ...after, nationalIdCiphertext: "[REDACTED]" } });
      return after;
    });
    return apiSuccess({ id: updated.id, customerNumber: updated.customerNumber, displayName: updated.displayName, version: updated.version }, requestId);
  } catch (error) {
    return apiFailure(error, requestId);
  }
}
