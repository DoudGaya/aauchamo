import { apiFailure, apiSuccess, requestIdFrom } from "@/lib/server/api";
import { requireAccess } from "@/lib/server/access";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    const access = await requireAccess();
    return apiSuccess(
      {
        id: access.userId,
        companyId: access.companyId,
        name: access.name,
        email: access.email,
        username: access.username,
        roles: access.roleNames,
        permissions: [...access.permissions],
        stationIds: [...access.stationIds],
        businessUnitIds: [...access.businessUnitIds],
        companyWide: access.companyWide,
      },
      requestId,
    );
  } catch (error) {
    return apiFailure(error, requestId);
  }
}
