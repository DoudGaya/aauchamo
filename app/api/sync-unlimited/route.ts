import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const unlimitedBalances = await db.inventoryBalance.findMany({
      where: { quantity: { gte: 9000000 } },
      select: { productId: true }
    });

    const productIds = [...new Set(unlimitedBalances.map(b => b.productId))];
    if (productIds.length === 0) {
      return NextResponse.json({ ok: true, message: "No unlimited products found." });
    }

    const products = await db.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, purchasePrice: true }
    });

    const stations = await db.station.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true, companyId: true }
    });

    let createdCount = 0;

    for (const product of products) {
      for (const station of stations) {
        const existing = await db.inventoryBalance.findFirst({
          where: { productId: product.id, stationId: station.id }
        });

        if (!existing) {
          await db.$transaction(async (tx) => {
            await tx.inventoryBalance.create({
              data: {
                stationId: station.id,
                productId: product.id,
                batchKey: "",
                quantity: 9999999,
                version: 1
              }
            });

            await tx.stockMovement.create({
              data: {
                companyId: station.companyId,
                stationId: station.id,
                productId: product.id,
                movementType: "OPENING",
                quantityDelta: 9999999,
                balanceAfter: 9999999,
                unitCost: product.purchasePrice,
                referenceType: "Product",
                referenceId: product.id,
                reason: "Opening stock (Unlimited - Auto backfill)",
                occurredById: "SYSTEM"
              }
            });
          });
          createdCount++;
        }
      }
    }

    return NextResponse.json({ ok: true, message: `Successfully backfilled ${createdCount} missing inventory balances.` });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
