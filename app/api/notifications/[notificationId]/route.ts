import { z } from "zod";
import { requireAccess, requirePermission } from "@/lib/server/access";
import { NotFoundError, apiFailure, apiSuccess, parseJson, requestIdFrom } from "@/lib/server/api";
import { db } from "@/lib/server/db";

const schema = z.object({ status: z.enum(["READ", "ARCHIVED"]) });
export async function PATCH(request: Request, { params }: { params: Promise<{ notificationId: string }> }) { const requestId = requestIdFrom(request); try { const access = requirePermission(await requireAccess(), "notifications.view"); const input = await parseJson(request, schema); const { notificationId } = await params; const existing = await db.notification.findFirst({ where: { id: notificationId, companyId: access.companyId, recipientId: access.userId } }); if (!existing) throw new NotFoundError("Notification was not found."); const now = new Date(); const item = await db.notification.update({ where: { id: existing.id }, data: { status: input.status, readAt: existing.readAt ?? now, archivedAt: input.status === "ARCHIVED" ? now : undefined } }); return apiSuccess(item, requestId); } catch (error) { return apiFailure(error, requestId); } }
