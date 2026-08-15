import { z } from "zod";
import { requireAccess, requirePermission } from "@/lib/server/access";
import { NotFoundError, apiFailure, apiSuccess, parseJson, requestIdFrom } from "@/lib/server/api";
import { writeAudit } from "@/lib/server/audit";
import { db } from "@/lib/server/db";

const patchSchema = z.object({
  code: z.string().trim().min(2).max(40).transform((value) => value.toUpperCase()).optional(),
  barcode: z.string().trim().max(80).optional(),
  name: z.string().trim().min(2).max(180).optional(),
  description: z.string().trim().max(1_000).optional(),
  categoryId: z.string().cuid().optional(),
  unitId: z.string().cuid().optional(),
  defaultSupplierId: z.string().cuid().optional().nullable(),
  purchasePrice: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  sellingPrice: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  taxRate: z.string().regex(/^\d+(\.\d{1,4})?$/).optional(),
  reorderLevel: z.string().regex(/^\d+(\.\d{1,3})?$/).optional(),
  minimumLevel: z.string().regex(/^\d+(\.\d{1,3})?$/).optional(),
  trackBatches: z.boolean().optional(),
  trackExpiry: z.boolean().optional(),
  reason: z.string().trim().min(5).max(500),
});

export async function GET(request: Request, { params }: { params: Promise<{ productId: string }> }) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "inventory.view");
    const { productId } = await params;
    const product = await db.product.findFirst({
      where: { id: productId, companyId: access.companyId },
      include: {
        category: { select: { id: true, code: true, name: true } },
        unit: { select: { id: true, code: true, name: true, precision: true } },
        defaultSupplier: { select: { id: true, supplierNumber: true, name: true } },
        balances: {
          where: access.companyWide ? {} : { stationId: { in: [...access.stationIds] } },
          include: { station: { select: { id: true, code: true, name: true } }, batch: { select: { id: true, code: true, expiresAt: true } } },
        },
      },
    });
    if (!product) throw new NotFoundError("Product not found.");
    if (!access.permissions.has("inventory.view_cost")) {
      (product as any).purchasePrice = null;
    }
    return apiSuccess(product, requestId);
  } catch (error) {
    return apiFailure(error, requestId);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ productId: string }> }) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "inventory.create_product");
    const { productId } = await params;
    const input = await parseJson(request, patchSchema);
    
    const current = await db.product.findFirst({ where: { id: productId, companyId: access.companyId } });
    if (!current) throw new NotFoundError("Product not found.");

    const product = await db.$transaction(async (tx) => {
      const { reason, ...dataToUpdate } = input;
      
      const updated = await tx.product.update({
        where: { id: productId },
        data: {
          ...dataToUpdate,
          updatedById: access.userId,
        },
      });

      await writeAudit(tx, {
        companyId: access.companyId,
        actorId: access.userId,
        action: "product.updated",
        entityType: "Product",
        entityId: productId,
        requestId,
        reason: input.reason,
        before: current,
        after: updated,
      });

      return updated;
    });

    return apiSuccess(product, requestId);
  } catch (error) {
    return apiFailure(error, requestId);
  }
}
