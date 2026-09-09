import { requireAccess, requirePermission } from "@/lib/server/access";
import { apiFailure, apiSuccess, requestIdFrom } from "@/lib/server/api";
import { db } from "@/lib/server/db";
import { PERMISSIONS } from "@/lib/server/permissions";

export async function GET(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    requirePermission(await requireAccess(), "roles.view");

    // Automatically sync code-defined permissions into the database table
    const existingPerms = await db.permission.findMany({ select: { key: true } });
    const existingKeys = new Set(existingPerms.map((p) => p.key));
    const missingPerms = PERMISSIONS.filter(([key]) => !existingKeys.has(key));

    if (missingPerms.length > 0) {
      await db.permission.createMany({
        data: missingPerms.map(([key, module, action, description, isSensitive]) => ({
          key,
          module,
          action,
          description,
          isSensitive,
        })),
        skipDuplicates: true,
      });
    }

    const permissions = await db.permission.findMany({ orderBy: [{ module: "asc" }, { action: "asc" }] });
    return apiSuccess(permissions, requestId);
  } catch (error) {
    return apiFailure(error, requestId);
  }
}

