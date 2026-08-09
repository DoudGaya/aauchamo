import { requireAccess, requirePermission, requireStation } from "@/lib/server/access";
import { apiFailure, apiSuccess, requestIdFrom } from "@/lib/server/api";
import { db } from "@/lib/server/db";

export async function GET(request: Request, { params }: { params: Promise<{ stationId: string }> }) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "stations.view_performance");
    const { stationId } = await params;
    requireStation(access, stationId);
    const [scopedUsers, activeStaff, customers, pendingApprovals] = await Promise.all([
      db.userStationScope.count({ where: { stationId, canView: true } }),
      db.staff.count({ where: { homeStationId: stationId, status: "ACTIVE" } }),
      db.customer.count({ where: { homeStationId: stationId, status: "ACTIVE" } }),
      db.approvalRequest.count({ where: { stationId, status: "PENDING" } }),
    ]);
    return apiSuccess({ stationId, scopedUsers, activeStaff, customers, pendingApprovals }, requestId);
  } catch (error) {
    return apiFailure(error, requestId);
  }
}
