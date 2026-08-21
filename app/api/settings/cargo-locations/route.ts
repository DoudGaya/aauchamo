import { requireAccess, requirePermission } from "@/lib/server/access";
import { db } from "@/lib/server/db";
import { apiFailure, apiSuccess, requestIdFrom } from "@/lib/server/api";

export async function POST(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "settings.manage");
    const input = await request.json();
    
    if (!input.code || !input.name || !input.color) {
      throw new Error("Code, name, and color are required.");
    }

    const created = await db.cargoLocation.create({
      data: {
        companyId: access.companyId,
        code: input.code,
        name: input.name,
        color: input.color,
        isActive: input.isActive ?? true,
      }
    });

    return apiSuccess(created, requestId);
  } catch (error) {
    return apiFailure(error, requestId);
  }
}
