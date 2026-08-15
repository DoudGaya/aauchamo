import { z } from "zod";
import { requireAccess, requirePermission } from "@/lib/server/access";
import { apiFailure, apiSuccess, parseJson, requestIdFrom, NotFoundError } from "@/lib/server/api";
import { writeAudit } from "@/lib/server/audit";
import { db } from "@/lib/server/db";

export const runtime = "nodejs";

const updateSchema = z.object({
  isActive: z.boolean(),
  requiresReference: z.boolean(),
  requiresTerminal: z.boolean(),
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "settings.manage");
    const { id } = await params;
    const input = await parseJson(request, updateSchema);

    const before = await db.paymentMethod.findFirst({
      where: { id, companyId: access.companyId },
    });
    if (!before) {
      throw new NotFoundError("Payment method not found.");
    }

    const updated = await db.$transaction(async (tx) => {
      const pm = await tx.paymentMethod.update({
        where: { id },
        data: {
          isActive: input.isActive,
          requiresReference: input.requiresReference,
          requiresTerminal: input.requiresTerminal,
          version: { increment: 1 },
        },
      });

      await writeAudit(tx, {
        companyId: access.companyId,
        actorId: access.userId,
        action: "settings.payment_method.updated",
        entityType: "PaymentMethod",
        entityId: pm.id,
        requestId,
        before,
        after: pm,
      });

      return pm;
    });

    return apiSuccess(updated, requestId);
  } catch (error) {
    return apiFailure(error, requestId);
  }
}
