import { z } from "zod";
import { Prisma } from "@/lib/generated/prisma/client";
import { requireAccess, requirePermission } from "@/lib/server/access";
import { apiFailure, apiSuccess, parseJson, requestIdFrom } from "@/lib/server/api";
import { writeAudit } from "@/lib/server/audit";
import { db } from "@/lib/server/db";

const clauseSchema = z.object({
  title: z.string().trim().min(1).max(200),
  text: z.string().trim().min(1),
});

const templateSchema = z.object({
  subject: z.string().trim().min(2).max(200),
  salutation: z.string().trim().min(2).max(100),
  openingText: z.string().trim().min(5),
  clauses: z.array(clauseSchema),
  closingText: z.string().trim().min(5),
  signatoryLeft: z.string().trim().max(300).optional(),
  signatoryRight: z.string().trim().max(300).optional(),
  fullBodyOverride: z.string().nullable().optional(),
});

import { DEFAULT_OFFER_LETTER_TEMPLATE } from "@/lib/hr-templates";

export async function GET(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "staff.view");
    const setting = await db.systemSetting.findUnique({
      where: {
        companyId_scopeKey_namespace_key: {
          companyId: access.companyId,
          scopeKey: "COMPANY",
          namespace: "hr",
          key: "offer_letter_template",
        },
      },
    });

    const template = setting?.value ? (setting.value as any) : DEFAULT_OFFER_LETTER_TEMPLATE;
    return apiSuccess({ template, isCustom: Boolean(setting?.value) }, requestId);
  } catch (error) {
    return apiFailure(error, requestId);
  }
}

export async function PUT(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    const access = await requireAccess();
    if (!access.permissions.has("staff.manage") && !access.permissions.has("staff.create") && !access.permissions.has("settings.manage")) {
      throw new Error("Insufficient permissions to modify offer letter template.");
    }
    const input = await parseJson(request, templateSchema);

    const value = JSON.parse(JSON.stringify(input)) as Prisma.InputJsonValue;
    const scopeKey = "COMPANY";

    const result = await db.$transaction(async (tx) => {
      const existing = await tx.systemSetting.findUnique({
        where: {
          companyId_scopeKey_namespace_key: {
            companyId: access.companyId,
            scopeKey,
            namespace: "hr",
            key: "offer_letter_template",
          },
        },
      });

      const updated = await tx.systemSetting.upsert({
        where: {
          companyId_scopeKey_namespace_key: {
            companyId: access.companyId,
            scopeKey,
            namespace: "hr",
            key: "offer_letter_template",
          },
        },
        create: {
          companyId: access.companyId,
          scopeKey,
          namespace: "hr",
          key: "offer_letter_template",
          valueType: "JSON",
          value,
          isSensitive: false,
          updatedById: access.userId,
        },
        update: {
          value,
          version: { increment: 1 },
          updatedById: access.userId,
        },
      });

      await writeAudit(tx, {
        companyId: access.companyId,
        actorId: access.userId,
        action: "hr.offer_letter_template.updated",
        entityType: "SystemSetting",
        entityId: updated.id,
        requestId,
        before: existing,
        after: updated,
      });

      return updated;
    });

    return apiSuccess({ template: result.value, isCustom: true }, requestId);
  } catch (error) {
    return apiFailure(error, requestId);
  }
}
