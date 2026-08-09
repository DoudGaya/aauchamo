import { z } from "zod";
import { requireAccess, requirePermission } from "@/lib/server/access";
import { apiFailure, apiSuccess, parseJson, requestIdFrom } from "@/lib/server/api";
import { db } from "@/lib/server/db";

const schema = z.object({ preferences: z.array(z.object({ type: z.string().trim().min(2).max(80), channel: z.enum(["IN_APP", "EMAIL", "SMS"]), enabled: z.boolean(), quietFrom: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(), quietTo: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional() })).max(100) });
export async function GET(request: Request) { const requestId = requestIdFrom(request); try { const access = requirePermission(await requireAccess(), "notifications.view"); return apiSuccess(await db.notificationPreference.findMany({ where: { userId: access.userId }, orderBy: [{ type: "asc" }, { channel: "asc" }] }), requestId); } catch (error) { return apiFailure(error, requestId); } }
export async function PUT(request: Request) { const requestId = requestIdFrom(request); try { const access = requirePermission(await requireAccess(), "notifications.view"); const input = await parseJson(request, schema); await db.$transaction(input.preferences.map((item) => db.notificationPreference.upsert({ where: { userId_type_channel: { userId: access.userId, type: item.type, channel: item.channel } }, create: { userId: access.userId, ...item }, update: { enabled: item.enabled, quietFrom: item.quietFrom, quietTo: item.quietTo } }))); return apiSuccess({ updated: input.preferences.length }, requestId); } catch (error) { return apiFailure(error, requestId); } }
