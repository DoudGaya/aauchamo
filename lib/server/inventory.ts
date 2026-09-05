import "server-only";

import { Prisma, type StockMovementType } from "@/lib/generated/prisma/client";
import { AppError, ConflictError } from "@/lib/server/api";
import { dispatchNotification } from "@/lib/server/notifications";

type StockMutation = {
  companyId: string;
  stationId: string;
  productId: string;
  batchId?: string | null;
  movementType: StockMovementType;
  quantityDelta: Prisma.Decimal | string | number;
  referenceType: string;
  referenceId: string;
  occurredById: string;
  occurredAt?: Date;
  unitCost?: Prisma.Decimal | string | number | null;
  reason?: string;
  allowNegative?: boolean;
};

export function quantity(value: Prisma.Decimal | string | number) {
  const parsed = new Prisma.Decimal(value).toDecimalPlaces(3);
  if (!parsed.gt(0)) throw new AppError("INVALID_QUANTITY", "Quantity must be greater than zero.", 422);
  return parsed;
}

export async function applyStockMovement(tx: Prisma.TransactionClient, input: StockMutation) {
  const delta = new Prisma.Decimal(input.quantityDelta).toDecimalPlaces(3);
  if (delta.isZero()) throw new AppError("INVALID_QUANTITY", "Stock movement quantity cannot be zero.", 422);
  const batchKey = input.batchId ?? "";

  await tx.inventoryBalance.upsert({
    where: { stationId_productId_batchKey: { stationId: input.stationId, productId: input.productId, batchKey } },
    create: {
      stationId: input.stationId,
      productId: input.productId,
      batchId: input.batchId,
      batchKey,
      quantity: 0,
    },
    update: {},
  });

  const balance = await tx.inventoryBalance.findUniqueOrThrow({
    where: { stationId_productId_batchKey: { stationId: input.stationId, productId: input.productId, batchKey } },
  });
  const nextQuantity = balance.quantity.plus(delta).toDecimalPlaces(3);
  if (!input.allowNegative && nextQuantity.isNegative()) {
    throw new AppError("INSUFFICIENT_STOCK", "The requested quantity exceeds available stock.", 409, {
      productId: input.productId,
      available: balance.quantity.toString(),
      requested: delta.abs().toString(),
    });
  }

  const updated = await tx.inventoryBalance.updateMany({
    where: { id: balance.id, version: balance.version },
    data: { quantity: nextQuantity, version: { increment: 1 } },
  });
  if (updated.count !== 1) throw new ConflictError("Stock changed while this transaction was posting. Retry safely.");

  const movement = await tx.stockMovement.create({
    data: {
      companyId: input.companyId,
      stationId: input.stationId,
      productId: input.productId,
      batchId: input.batchId,
      movementType: input.movementType,
      quantityDelta: delta,
      balanceAfter: nextQuantity,
      unitCost: input.unitCost == null ? undefined : new Prisma.Decimal(input.unitCost).toDecimalPlaces(2),
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      occurredById: input.occurredById,
      occurredAt: input.occurredAt,
      reason: input.reason,
    },
  });

  const product = await tx.product.findUnique({ where: { id: input.productId }, select: { name: true, minimumLevel: true } });
  if (product && product.minimumLevel.gt(0) && balance.quantity.gte(product.minimumLevel) && nextQuantity.lt(product.minimumLevel)) {
    await dispatchNotification(tx, {
      companyId: input.companyId,
      stationId: input.stationId,
      targetRoles: ["SUPER_ADMIN", "ADMIN", "OPERATIONS_MANAGER", "STATION_MANAGER"],
      type: "INVENTORY_ALERT",
      severity: "WARNING",
      title: "Low Stock Alert",
      message: `${product.name} has dropped below the minimum level of ${product.minimumLevel.toString()}. (Current: ${nextQuantity.toString()})`,
      entityType: "Product",
      entityId: input.productId,
    });
  }

  return { movement, balance: nextQuantity };
}
