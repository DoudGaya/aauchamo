import { z } from "zod";

import { requireAccess, requirePermission, requireStation } from "@/lib/server/access";
import { ConflictError, apiFailure, apiSuccess, parseJson, parsePagination, requestIdFrom } from "@/lib/server/api";
import { writeAudit } from "@/lib/server/audit";
import { encryptSensitive, hashLookup } from "@/lib/server/crypto";
import { customerMatchScore } from "@/lib/server/customer-match";
import { db } from "@/lib/server/db";
import { normalizeEmail, normalizeName, normalizePhone } from "@/lib/server/normalize";
import { allocateSequence } from "@/lib/server/sequence";

const createCustomerSchema = z
  .object({
    type: z.enum(["INDIVIDUAL", "BUSINESS"]).default("INDIVIDUAL"),
    firstName: z.string().trim().max(80).optional(),
    lastName: z.string().trim().max(80).optional(),
    companyName: z.string().trim().max(160).optional(),
    phone: z.string().trim().min(7).max(30).optional(),
    email: z.string().email().optional(),
    pnr: z.string().trim().max(30).optional(),
    nationalId: z.string().trim().min(4).max(80).optional(),
    destination: z.string().trim().max(120).optional(),
    airline: z.string().trim().max(120).optional(),
    remarks: z.string().trim().max(1_000).optional(),
    homeStationId: z.string().cuid(),
    businessUnitId: z.string().cuid().optional(),
    allowDuplicate: z.boolean().default(false),
  })
  .superRefine((value, context) => {
    if (value.type === "INDIVIDUAL" && (!value.firstName || !value.lastName)) {
      context.addIssue({ code: "custom", path: ["firstName"], message: "Individual customers require first and last name." });
    }
    if (value.type === "BUSINESS" && !value.companyName) {
      context.addIssue({ code: "custom", path: ["companyName"], message: "Business customers require a company name." });
    }
  });

export async function GET(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "customers.view");
    const url = new URL(request.url);
    const { page, pageSize, skip, take } = parsePagination(url.searchParams);
    const search = url.searchParams.get("search")?.trim();
    const stationId = url.searchParams.get("stationId") ?? undefined;
    if (stationId) requireStation(access, stationId);
    const normalizedSearchPhone = search ? normalizePhone(search) : undefined;
    const where = {
      companyId: access.companyId,
      status: "ACTIVE" as const,
      ...(stationId
        ? { homeStationId: stationId }
        : access.companyWide
          ? {}
          : { homeStationId: { in: [...access.stationIds] } }),
      ...(search
        ? {
            OR: [
              { customerNumber: { contains: search, mode: "insensitive" as const } },
              { displayName: { contains: search, mode: "insensitive" as const } },
              { primaryPhone: { contains: search } },
              ...(normalizedSearchPhone ? [{ normalizedPhone: { contains: normalizedSearchPhone } }] : []),
              { primaryEmail: { contains: search, mode: "insensitive" as const } },
              { defaultPnr: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      db.customer.findMany({
        where,
        select: {
          id: true, customerNumber: true, type: true, displayName: true, primaryPhone: true,
          primaryEmail: true, defaultPnr: true, defaultDestination: true, defaultAirline: true,
          remarks: true, status: true, version: true, createdAt: true,
          homeStation: { select: { id: true, code: true, name: true } },
        },
        orderBy: { updatedAt: "desc" },
        skip,
        take,
      }),
      db.customer.count({ where }),
    ]);
    return apiSuccess(items, requestId, { page, pageSize, total });
  } catch (error) {
    return apiFailure(error, requestId);
  }
}

export async function POST(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "customers.create");
    const input = await parseJson(request, createCustomerSchema);
    requireStation(access, input.homeStationId, true);
    const displayName = normalizeName(
      input.type === "BUSINESS" ? input.companyName! : `${input.firstName!} ${input.lastName!}`,
    );
    const normalizedPhone = normalizePhone(input.phone);
    const normalizedEmail = normalizeEmail(input.email);
    const candidates = await db.customer.findMany({
      where: {
        companyId: access.companyId,
        status: "ACTIVE",
        OR: [
          ...(normalizedPhone ? [{ normalizedPhone }] : []),
          ...(normalizedEmail ? [{ normalizedEmail }] : []),
          { displayName: { equals: displayName, mode: "insensitive" } },
        ],
      },
      select: { id: true, customerNumber: true, displayName: true, primaryPhone: true, primaryEmail: true },
      take: 10,
    });
    const matches = candidates
      .map((candidate) => ({
        ...candidate,
        ...customerMatchScore(
          { displayName, phone: input.phone, email: input.email },
          { displayName: candidate.displayName, phone: candidate.primaryPhone, email: candidate.primaryEmail },
        ),
      }))
      .filter((candidate) => candidate.score >= 50)
      .sort((left, right) => right.score - left.score);
    if (matches.length && !input.allowDuplicate) {
      throw new ConflictError("Possible duplicate customer found. Review the matches before creating another record.", { matches });
    }

    const customer = await db.$transaction(async (tx) => {
      let customerNumber = await allocateSequence(tx, {
        companyId: access.companyId,
        stationId: input.homeStationId,
        documentType: "CUSTOMER",
        prefix: "CUS",
        includeDate: false,
        padding: 6,
      });

      const existing = await tx.customer.findFirst({
        where: { companyId: access.companyId, customerNumber },
        select: { id: true },
      });
      if (existing) {
        const count = await tx.customer.count({ where: { companyId: access.companyId } });
        customerNumber = `CUS-${String(count + 1).padStart(6, "0")}-${Math.floor(100 + Math.random() * 900)}`;
      }

      const nationalIdCiphertext = input.nationalId ? encryptSensitive(input.nationalId) : undefined;
      const created = await tx.customer.create({
        data: {
          companyId: access.companyId,
          businessUnitId: input.businessUnitId,
          homeStationId: input.homeStationId,
          customerNumber,
          type: input.type,
          firstName: input.firstName,
          lastName: input.lastName,
          companyName: input.companyName,
          displayName,
          primaryPhone: input.phone || null,
          normalizedPhone,
          primaryEmail: input.email?.toLowerCase(),
          normalizedEmail,
          defaultPnr: input.pnr?.toUpperCase(),
          defaultDestination: input.destination,
          defaultAirline: input.airline,
          nationalIdCiphertext,
          remarks: input.remarks,
          createdById: access.userId,
          updatedById: access.userId,
          contacts: {
            create: [
              ...(normalizedPhone ? [{ type: "PHONE" as const, value: input.phone!, normalized: normalizedPhone, isPrimary: true }] : []),
              ...(normalizedEmail ? [{ type: "EMAIL" as const, value: input.email!, normalized: normalizedEmail, isPrimary: true }] : []),
            ],
          },
          identifiers: input.nationalId
            ? {
                create: {
                  type: "NATIONAL_ID",
                  valueCiphertext: nationalIdCiphertext!,
                  valueHash: hashLookup(input.nationalId),
                  lastFour: input.nationalId.slice(-4),
                  createdById: access.userId,
                },
              }
            : undefined,
        },
      });
      await writeAudit(tx, {
        companyId: access.companyId,
        actorId: access.userId,
        stationId: input.homeStationId,
        businessUnitId: input.businessUnitId,
        action: "customer.created",
        entityType: "Customer",
        entityId: created.id,
        requestId,
        after: { ...created, nationalIdCiphertext: "[REDACTED]" },
        metadata: { duplicateOverride: input.allowDuplicate, candidateCount: matches.length },
      });
      return created;
    });
    return apiSuccess({ id: customer.id, customerNumber: customer.customerNumber, displayName: customer.displayName }, requestId, { created: true });
  } catch (error) {
    return apiFailure(error, requestId);
  }
}
