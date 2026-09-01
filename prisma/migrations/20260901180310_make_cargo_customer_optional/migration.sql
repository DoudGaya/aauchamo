-- DropForeignKey
ALTER TABLE "cargo_shipments" DROP CONSTRAINT "cargo_shipments_customerId_fkey";

-- AlterTable
ALTER TABLE "cargo_shipments" ALTER COLUMN "customerId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "cargo_shipments" ADD CONSTRAINT "cargo_shipments_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
