import { z } from "zod";
import { requireAccess, requirePermission } from "@/lib/server/access";
import { apiFailure, apiSuccess, AppError, parseJson, requestIdFrom } from "@/lib/server/api";
import { db } from "@/lib/server/db";
import { MANDATORY_SECURITY_EVENT_TYPES } from "@/lib/server/notification-providers";

const preferenceSchema = z.object({
  type: z.string().min(1),
  channel: z.enum(["IN_APP", "EMAIL", "SMS"]),
  enabled: z.boolean(),
  quietFrom: z.string().optional(),
  quietTo: z.string().optional(),
});

export async function GET(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "notifications.view");
    const prefs = await db.notificationPreference.findMany({
      where: { userId: access.userId },
      orderBy: { type: "asc" },
    });
    return apiSuccess(prefs, requestId);
  } catch (error) {
    return apiFailure(error, requestId);
  }
}

export async function PUT(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "notifications.view");
    const input = await parseJson(request, preferenceSchema);

    // Rule: Mandatory security notifications CANNOT be disabled
    if (MANDATORY_SECURITY_EVENT_TYPES.has(input.type) && !input.enabled) {
      throw new AppError(
        "BAD_REQUEST",
        `Mandatory security notification "${input.type}" cannot be disabled.`
      );
    }

    const pref = await db.notificationPreference.upsert({
      where: {
        userId_type_channel: {
          userId: access.userId,
          type: input.type,
          channel: input.channel,
        },
      },
      create: {
        userId: access.userId,
        type: input.type,
        channel: input.channel,
        enabled: input.enabled,
        quietFrom: input.quietFrom,
        quietTo: input.quietTo,
      },
      update: {
        enabled: input.enabled,
        quietFrom: input.quietFrom,
        quietTo: input.quietTo,
      },
    });

    return apiSuccess(pref, requestId);
  } catch (error) {
    return apiFailure(error, requestId);
  }
}
