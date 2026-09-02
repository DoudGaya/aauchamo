import { z } from "zod";

import { requireAccess, requirePermission, requireStation } from "@/lib/server/access";
import { AppError, apiFailure, apiSuccess, parseJson, parsePagination, requestIdFrom } from "@/lib/server/api";
import { writeAudit } from "@/lib/server/audit";
import { db } from "@/lib/server/db";
import { applyStockMovement } from "@/lib/server/inventory";

const productSchema = z.object({
  code: z.string().trim().min(2).max(40).transform((value) => value.toUpperCase()).optional(),
  barcode: z.string().trim().max(80).optional(),
  name: z.string().trim().min(2).max(180),
  description: z.string().trim().max(1_000).optional(),
  categoryId: z.string().cuid(),
  unitId: z.string().cuid(),
  defaultSupplierId: z.string().cuid().optional(),
  purchasePrice: z.string().regex(/^\d+(\.\d{1,2})?$/).default("0"),
  sellingPrice: z.string().regex(/^\d+(\.\d{1,2})?$/),
  taxRate: z.string().regex(/^\d+(\.\d{1,4})?$/).default("0"),
  reorderLevel: z.string().regex(/^\d+(\.\d{1,3})?$/).default("0"),
  minimumLevel: z.string().regex(/^\d+(\.\d{1,3})?$/).default("0"),
  trackBatches: z.boolean().default(false),
  trackExpiry: z.boolean().default(false),
  unlimitedStock: z.boolean().default(false),
  openingBalances: z.array(z.object({ stationId: z.string().cuid(), quantity: z.string().regex(/^\d+(\.\d{1,3})?$/) })).max(20).default([]),
});

export async function GET(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "inventory.view");
    const url = new URL(request.url);
    const { page, pageSize, skip, take } = parsePagination(url.searchParams);
    const search = url.searchParams.get("search")?.trim();
    const stationId = url.searchParams.get("stationId") ?? undefined;
    if (stationId) requireStation(access, stationId);
    const where = {
      companyId: access.companyId,
      status: { not: "DISABLED" as const },
      ...(search ? { OR: [{ name: { contains: search, mode: "insensitive" as const } }, { code: { contains: search, mode: "insensitive" as const } }, { barcode: { contains: search } }] } : {}),
    };
    const [items, total] = await Promise.all([
      db.product.findMany({
        where,
        include: {
          category: { select: { id: true, code: true, name: true } },
          unit: { select: { id: true, code: true, name: true, precision: true } },
          defaultSupplier: { select: { id: true, supplierNumber: true, name: true } },
          balances: {
            where: stationId ? { stationId } : access.companyWide ? {} : { stationId: { in: [...access.stationIds] } },
            include: { station: { select: { id: true, code: true, name: true } }, batch: { select: { id: true, code: true, expiresAt: true } } },
          },
        },
        orderBy: { name: "asc" }, skip, take,
      }),
      db.product.count({ where }),
    ]);
    const canViewCost = access.permissions.has("inventory.view_cost");
    return apiSuccess(items.map((item) => ({ ...item, purchasePrice: canViewCost ? item.purchasePrice : null })), requestId, { page, pageSize, total });
  } catch (error) {
    return apiFailure(error, requestId);
  }
}

export async function POST(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "inventory.create_product");
    const input = await parseJson(request, productSchema);
    for (const opening of input.openingBalances) requireStation(access, opening.stationId, true);
    const [category, unit, supplier] = await Promise.all([
      db.productCategory.findFirst({ where: { id: input.categoryId, companyId: access.companyId, isActive: true } }),
      db.unitOfMeasure.findFirst({ where: { id: input.unitId, companyId: access.companyId, isActive: true } }),
      input.defaultSupplierId ? db.supplier.findFirst({ where: { id: input.defaultSupplierId, companyId: access.companyId, isActive: true } }) : null,
    ]);
    if (!category || !unit || (input.defaultSupplierId && !supplier)) throw new AppError("INVALID_PRODUCT_REFERENCE", "Category, unit, or supplier is invalid.", 422);

    const product = await db.$transaction(async (tx) => {
      let finalCode = input.code;
      if (!finalCode) {
        const productCount = await tx.product.count({ where: { companyId: access.companyId } });
        finalCode = `PRD-${(productCount + 1).toString().padStart(4, '0')}`;
        let attempts = 0;
        while (attempts < 10) {
          const existing = await tx.product.findUnique({ where: { companyId_code: { companyId: access.companyId, code: finalCode } }});
          if (!existing) break;
          attempts++;
          finalCode = `PRD-${(productCount + 1 + attempts).toString().padStart(4, '0')}`;
        }
      }

      const created = await tx.product.create({ data: {
        companyId: access.companyId, categoryId: input.categoryId, unitId: input.unitId,
        defaultSupplierId: input.defaultSupplierId, code: finalCode, barcode: input.barcode,
        qrValue: `product:${finalCode}`, name: input.name, description: input.description,
        purchasePrice: input.purchasePrice, sellingPrice: input.sellingPrice, taxRate: input.taxRate,
        reorderLevel: input.reorderLevel, minimumLevel: input.minimumLevel,
        trackBatches: input.trackBatches, trackExpiry: input.trackExpiry,
        createdById: access.userId, updatedById: access.userId,
      } });

      if (input.unlimitedStock) {
        // Give it unlimited stock across all accessible stations
        const stationsToStock = access.companyWide
          ? await tx.station.findMany({ where: { companyId: access.companyId, status: "ACTIVE" }, select: { id: true } })
          : Array.from(access.stationIds).map(id => ({ id }));

        if (stationsToStock.length > 0) {
          await tx.inventoryBalance.createMany({
            data: stationsToStock.map(station => ({
              stationId: station.id,
              productId: created.id,
              batchKey: "",
              quantity: 9999999,
              version: 1
            }))
          });

          await tx.stockMovement.createMany({
            data: stationsToStock.map(station => ({
              companyId: access.companyId,
              stationId: station.id,
              productId: created.id,
              movementType: "OPENING",
              quantityDelta: 9999999,
              balanceAfter: 9999999,
              unitCost: input.purchasePrice,
              referenceType: "Product",
              referenceId: created.id,
              occurredById: access.userId,
              reason: "Opening stock (Unlimited)"
            }))
          });
        }
      } else {
        await Promise.all(input.openingBalances.map(opening => 
          applyStockMovement(tx, {
            companyId: access.companyId, stationId: opening.stationId, productId: created.id,
            movementType: "OPENING", quantityDelta: opening.quantity, referenceType: "Product", referenceId: created.id,
            occurredById: access.userId, unitCost: input.purchasePrice, reason: "Opening stock",
          })
        ));
      }
      
      await writeAudit(tx, { companyId: access.companyId, actorId: access.userId, action: "product.created", entityType: "Product", entityId: created.id, requestId, after: created });
      return created;
    }, { timeout: 15000 });
    return apiSuccess(product, requestId, { created: true });
  } catch (error) {
    return apiFailure(error, requestId);
  }
}
