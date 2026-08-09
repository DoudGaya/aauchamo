import "server-only";

import { AppError } from "@/lib/server/api";
import type { AccessContext } from "@/lib/server/access";
import { requireStation } from "@/lib/server/access";

export function dashboardFilters(request: Request, access: AccessContext) {
  const url = new URL(request.url);
  const end = url.searchParams.get("to") ? new Date(`${url.searchParams.get("to")}T23:59:59.999Z`) : new Date();
  const start = url.searchParams.get("from") ? new Date(`${url.searchParams.get("from")}T00:00:00.000Z`) : new Date(end.getTime() - 29 * 86_400_000);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) throw new AppError("INVALID_DATE_RANGE", "The dashboard date range is invalid.", 422);
  if (end.getTime() - start.getTime() > 366 * 86_400_000) throw new AppError("DATE_RANGE_TOO_LARGE", "Dashboard ranges cannot exceed 366 days.", 422);
  const requested = url.searchParams.getAll("stationId").filter(Boolean);
  requested.forEach((id) => requireStation(access, id));
  const stationIds = requested.length ? requested : access.companyWide ? undefined : [...access.stationIds];
  const businessUnitIds = url.searchParams.getAll("businessUnitId").filter(Boolean);
  if (businessUnitIds.some((id) => !access.companyWide && access.businessUnitIds.size && !access.businessUnitIds.has(id))) throw new AppError("FORBIDDEN", "A selected business unit is outside your scope.", 403);
  return { start, end, stationIds, businessUnitIds: businessUnitIds.length ? businessUnitIds : undefined };
}

export function stationFilter(stationIds?: string[]) {
  return stationIds ? { stationId: { in: stationIds } } : {};
}
