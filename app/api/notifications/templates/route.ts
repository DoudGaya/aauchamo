import { z } from "zod";
import { requireAccess, requirePermission } from "@/lib/server/access";
import { apiFailure, apiSuccess, parseJson, requestIdFrom } from "@/lib/server/api";
import { db } from "@/lib/server/db";

const templateSchema = z.object({
  namespace: z.string().default("notifications"),
  key: z.string().min(1),
  value: z.any(),
});

export async function GET(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "notifications.view");
    const settings = await db.systemSetting.findMany({
      where: { companyId: access.companyId, namespace: "notifications" },
      orderBy: { key: "asc" },
    });
    return apiSuccess(settings, requestId);
  } catch (error) {
    return apiFailure(error, requestId);
  }
}

export async function PUT(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "settings.manage");
    const input = await parseJson(request, templateSchema);

    const setting = await db.systemSetting.upsert({
      where: {
        companyId_scopeKey_namespace_key: {
          companyId: access.companyId,
          scopeKey: "COMPANY",
          namespace: "notifications",
          key: input.key,
        },
      },
      create: {
        companyId: access.companyId,
        stationId: null,
        scopeKey: "COMPANY",
        namespace: "notifications",
        key: input.key,
        value: input.value,
        valueType: typeof input.value === "number" ? "NUMBER" : "STRING",
      },
      update: {
        value: input.value,
      },
    });

    return apiSuccess(setting, requestId);
  } catch (error) {
    return apiFailure(error, requestId);
  }
}
