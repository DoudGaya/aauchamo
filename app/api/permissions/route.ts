import { requireAccess, requirePermission } from "@/lib/server/access";
import { apiFailure, apiSuccess, requestIdFrom } from "@/lib/server/api";
import { db } from "@/lib/server/db";

export async function GET(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    requirePermission(await requireAccess(), "roles.view");
    const permissions = await db.permission.findMany({ orderBy: [{ module: "asc" }, { action: "asc" }] });
    return apiSuccess(permissions, requestId);
  } catch (error) {
    return apiFailure(error, requestId);
  }
}
