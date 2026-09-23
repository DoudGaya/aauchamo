import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from './lib/generated/prisma/client';

const databaseUrl = process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL ?? "postgresql://aau_chamo:aau_chamo@127.0.0.1:5432/aau_chamo";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });

async function main() {
  console.log("Identifying unlimited stock products...");
  const unlimitedBalances = await db.inventoryBalance.findMany({
    where: { quantity: { gte: 9000000 } },
    select: { productId: true }
  });

  const productIds = [...new Set(unlimitedBalances.map(b => b.productId))];
  console.log(`Found ${productIds.length} unlimited products.`);

  if (productIds.length === 0) {
    console.log("No unlimited products found. Exiting.");
    return;
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
        console.log(`Missing balance for '${product.name}' at station '${station.name}'. Backfilling...`);
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
              occurredById: "system"
            }
          });
        });
        createdCount++;
      }
    }
  }

  console.log(`\nSuccessfully backfilled ${createdCount} missing inventory balances across all active stations.`);
}

main().catch(console.error).finally(() => process.exit(0));
