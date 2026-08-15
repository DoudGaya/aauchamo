/**
 * Quick connectivity / row-count check against the configured database.
 * Run with: npx tsx --tsconfig tsconfig.seed.json db-check.ts
 */
import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "./lib/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  console.log("Stations:", await prisma.station.count());
  console.log("Customers:", await prisma.customer.count());
  console.log("Products:", await prisma.product.count());
  console.log("Sales:", await prisma.sale.count());
  console.log("Cargo shipments:", await prisma.cargoShipment.count());
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
