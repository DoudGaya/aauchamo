import { requireAccess, requirePermission } from "@/lib/server/access";
import { apiFailure, apiSuccess, requestIdFrom } from "@/lib/server/api";
import { customerMatchScore } from "@/lib/server/customer-match";
import { db } from "@/lib/server/db";
import { normalizeEmail, normalizeName, normalizePhone } from "@/lib/server/normalize";

export async function GET(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "customers.view");
    const url = new URL(request.url);
    const displayName = normalizeName(url.searchParams.get("name") ?? "");
    const phone = url.searchParams.get("phone") ?? "";
    const email = normalizeEmail(url.searchParams.get("email"));
    const normalizedPhone = phone ? normalizePhone(phone) : "";
    const candidates = await db.customer.findMany({
      where: {
        companyId: access.companyId,
        status: "ACTIVE",
        OR: [
          ...(normalizedPhone ? [{ normalizedPhone }] : []),
          ...(email ? [{ normalizedEmail: email }] : []),
          ...(displayName ? [{ displayName: { equals: displayName, mode: "insensitive" as const } }] : []),
        ],
      },
      select: { id: true, customerNumber: true, displayName: true, primaryPhone: true, primaryEmail: true, homeStationId: true },
      take: 25,
    });
    const matches = candidates
      .filter((candidate) => access.companyWide || access.stationIds.has(candidate.homeStationId))
      .map((candidate) => ({ ...candidate, ...customerMatchScore({ displayName, phone, email }, { displayName: candidate.displayName, phone: candidate.primaryPhone, email: candidate.primaryEmail }) }))
      .sort((left, right) => right.score - left.score);
    return apiSuccess(matches, requestId);
  } catch (error) {
    return apiFailure(error, requestId);
  }
}
