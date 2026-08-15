import { requireAccess, requirePermission } from "@/lib/server/access";
import { apiFailure, apiSuccess, NotFoundError, requestIdFrom } from "@/lib/server/api";
import { db } from "@/lib/server/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = requestIdFrom(request);

  try {
    const access = requirePermission(await requireAccess(), "audit.view");
    const { id } = await params;

    const event = await db.auditEvent.findUnique({
      where: { id, companyId: access.companyId },
      include: {
        actor: {
          select: { id: true, name: true, firstName: true, lastName: true, username: true },
        },
        station: {
          select: { id: true, code: true, name: true },
        },
        businessUnit: {
          select: { id: true, code: true, name: true },
        },
      },
    });

    if (!event) throw new NotFoundError("Audit event not found");

    // Validate station scope: if event has a station, ensure user has access
    if (event.stationId && !access.companyWide && !access.stationIds.has(event.stationId)) {
      throw new NotFoundError("Audit event not found");
    }

    // Protect sensitive payloads unless the user has 'audit.view_sensitive'
    if (!access.permissions.has("audit.view_sensitive")) {
      event.before = null;
      event.after = null;
      event.metadata = null;
    }

    return apiSuccess(event, requestId);
  } catch (error) {
    return apiFailure(error, requestId);
  }
}
