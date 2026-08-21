import { requireAccess, requirePermission } from "@/lib/server/access";
import { db } from "@/lib/server/db";
import { apiFailure, apiSuccess, requestIdFrom } from "@/lib/server/api";

export async function PUT(request: Request, { params }: { params: Promise<{ locationId: string }> }) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "settings.manage");
    const { locationId } = await params;
    const input = await request.json();
    
    const updated = await db.cargoLocation.update({
      where: { id: locationId, companyId: access.companyId },
      data: {
        code: input.code,
        name: input.name,
        color: input.color,
        isActive: input.isActive,
      }
    });

    return apiSuccess(updated, requestId);
  } catch (error) {
    return apiFailure(error, requestId);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ locationId: string }> }) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "settings.manage");
    const { locationId } = await params;
    
    await db.cargoLocation.delete({
      where: { id: locationId, companyId: access.companyId }
    });

    return apiSuccess({ deleted: true }, requestId);
  } catch (error) {
    return apiFailure(error, requestId);
  }
}
