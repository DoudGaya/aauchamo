import { z } from "zod";
import { requireAccess, requirePermission } from "@/lib/server/access";
import { apiFailure, apiSuccess, parseJson, parsePagination, requestIdFrom } from "@/lib/server/api";
import { db } from "@/lib/server/db";
import { normalizeEmail, normalizePhone } from "@/lib/server/normalize";
import { allocateSequence } from "@/lib/server/sequence";
import { encryptSensitive, hashLookup } from "@/lib/server/crypto";

export async function GET(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "customers.view");
    const url = new URL(request.url);
    const { page, pageSize, skip, take } = parsePagination(url.searchParams);
    const search = url.searchParams.get("search")?.trim();
    const status = url.searchParams.get("status")?.trim();
    const accountType = url.searchParams.get("accountType")?.trim();

    const where: any = {};
    if (status) where.status = status;
    if (accountType) where.accountType = accountType;

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { companyName: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      db.websiteUser.findMany({
        where,
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          companyName: true,
          accountType: true,
          selectedServices: true,
          address: true,
          city: true,
          country: true,
          status: true,
          notes: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          enquiries: {
            select: {
              id: true,
              reference: true,
              type: true,
              status: true,
              createdAt: true,
            },
            orderBy: { createdAt: "desc" },
            take: 5,
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      db.websiteUser.count({ where }),
    ]);

    return apiSuccess(items, requestId, { page, pageSize, total });
  } catch (error) {
    return apiFailure(error, requestId);
  }
}

const updateSchema = z.object({
  id: z.string(),
  status: z.enum(["ACTIVE", "SUSPENDED"]).optional(),
  notes: z.string().optional(),
});

export async function PATCH(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "customers.update");
    const payload = await parseJson(request, updateSchema);

    const updated = await db.websiteUser.update({
      where: { id: payload.id },
      data: {
        ...(payload.status ? { status: payload.status } : {}),
        ...(payload.notes !== undefined ? { notes: payload.notes } : {}),
      },
    });

    return apiSuccess(updated, requestId);
  } catch (error) {
    return apiFailure(error, requestId);
  }
}

const convertSchema = z.object({
  websiteUserId: z.string(),
  homeStationId: z.string().cuid(),
});

export async function POST(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "customers.create");
    const payload = await parseJson(request, convertSchema);

    const webUser = await db.websiteUser.findUnique({
      where: { id: payload.websiteUserId },
    });

    if (!webUser) {
      return apiFailure(new Error("Website user not found"), requestId);
    }

    // Check if customer already exists with this email or phone
    const normalizedEmail = normalizeEmail(webUser.email || "");
    const normalizedPhone = normalizePhone(webUser.phone || "");

    const existingCustomer = await db.customer.findFirst({
      where: {
        companyId: access.companyId,
        OR: [
          { primaryEmail: { equals: webUser.email, mode: "insensitive" } },
          { primaryPhone: webUser.phone },
        ],
      },
    });

    if (existingCustomer) {
      return apiSuccess(existingCustomer, requestId, { alreadyExisted: true });
    }

    const isBusiness = webUser.accountType !== "INDIVIDUAL" && Boolean(webUser.companyName);

    const customer = await db.$transaction(async (tx) => {
      let customerNumber = await allocateSequence(tx, {
        companyId: access.companyId,
        documentType: "CUSTOMER",
        prefix: "CUS",
        includeDate: false,
        padding: 6,
      });

      const existingNum = await tx.customer.findFirst({
        where: { companyId: access.companyId, customerNumber },
        select: { id: true },
      });
      if (existingNum) {
        const count = await tx.customer.count({ where: { companyId: access.companyId } });
        customerNumber = `CUS-${String(count + 1).padStart(6, "0")}-${Math.floor(100 + Math.random() * 900)}`;
      }

      return tx.customer.create({
        data: {
          companyId: access.companyId,
          customerNumber,
          type: isBusiness ? "BUSINESS" : "INDIVIDUAL",
          displayName: webUser.companyName || webUser.fullName,
          companyName: webUser.companyName || undefined,
          firstName: isBusiness ? undefined : webUser.fullName.split(" ")[0] || webUser.fullName,
          lastName: isBusiness ? undefined : webUser.fullName.split(" ").slice(1).join(" ") || "Customer",
          primaryPhone: webUser.phone,
          normalizedPhone,
          primaryEmail: webUser.email,
          normalizedEmail,
          homeStationId: payload.homeStationId,
          createdById: access.userId,
          status: "ACTIVE",
          remarks: `Converted from Website Portal User. Selected services: ${Array.isArray(webUser.selectedServices) ? webUser.selectedServices.join(", ") : ""}`,
        },
      });
    });

    return apiSuccess(customer, requestId, { created: true });
  } catch (error) {
    return apiFailure(error, requestId);
  }
}
