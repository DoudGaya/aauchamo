import { requireAccess, requirePermission } from "@/lib/server/access";
import { apiFailure, apiSuccess, requestIdFrom } from "@/lib/server/api";
import { processOutboxEvents } from "@/lib/server/outbox";

/**
 * POST /api/notifications/process
 * Background cron worker endpoint for processing pending outbox events.
 */
export async function POST(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "notifications.view");
    const result = await processOutboxEvents(50);
    return apiSuccess(result, requestId);
  } catch (error) {
    return apiFailure(error, requestId);
  }
}
