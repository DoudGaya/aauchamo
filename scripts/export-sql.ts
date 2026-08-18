import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL environment variable is missing.");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function exportSqlDump() {
  console.log("Exporting AAU Chamo database to SQL script...");
  const outputPath = path.join(process.cwd(), "aau_chamo_database_dump.sql");

  let sqlOutput = `-- ========================================================\n`;
  sqlOutput += `-- A.A.U CHAMO INTERNATIONAL BUSINESS AGENCY SERVICES LTD\n`;
  sqlOutput += `-- FULL SQL DATABASE BACKUP & LOCAL DESKTOP DEPLOYMENT DUMP\n`;
  sqlOutput += `-- Generated on: ${new Date().toISOString()}\n`;
  sqlOutput += `-- ========================================================\n\n`;

  // Fetch all tables data with exact model names
  const tables = [
    { name: "Company", fetch: () => prisma.company.findMany() },
    { name: "BusinessUnit", fetch: () => prisma.businessUnit.findMany() },
    { name: "Station", fetch: () => prisma.station.findMany() },
    { name: "User", fetch: () => prisma.user.findMany() },
    { name: "Role", fetch: () => prisma.role.findMany() },
    { name: "Staff", fetch: () => prisma.staff.findMany() },
    { name: "StaffAttendance", fetch: () => prisma.staffAttendance.findMany() },
    { name: "Customer", fetch: () => prisma.customer.findMany() },
    { name: "Agent", fetch: () => prisma.agent.findMany() },
    { name: "ProductCategory", fetch: () => prisma.productCategory.findMany() },
    { name: "UnitOfMeasure", fetch: () => prisma.unitOfMeasure.findMany() },
    { name: "Supplier", fetch: () => prisma.supplier.findMany() },
    { name: "Product", fetch: () => prisma.product.findMany() },
    { name: "InventoryBalance", fetch: () => prisma.inventoryBalance.findMany() },
    { name: "Sale", fetch: () => prisma.sale.findMany() },
    { name: "CargoShipment", fetch: () => prisma.cargoShipment.findMany() },
    { name: "AuditEvent", fetch: () => prisma.auditEvent.findMany() },
  ];

  for (const table of tables) {
    try {
      const records = await table.fetch();
      sqlOutput += `-- Table: ${table.name} (${records.length} records)\n`;
      if (records.length > 0) {
        for (const row of records) {
          const keys = Object.keys(row);
          const values = Object.values(row).map((val) => {
            if (val === null || val === undefined) return "NULL";
            if (typeof val === "number" || typeof val === "boolean") return val.toString();
            if (val instanceof Date) return `'${val.toISOString()}'`;
            if (typeof val === "object") return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
            return `'${val.toString().replace(/'/g, "''")}'`;
          });
          sqlOutput += `INSERT INTO "${table.name}" (${keys.map(k => `"${k}"`).join(", ")}) VALUES (${values.join(", ")}) ON CONFLICT DO NOTHING;\n`;
        }
      }
      sqlOutput += `\n`;
    } catch (e: any) {
      console.warn(`Could not export table ${table.name}: ${e.message}`);
    }
  }

  fs.writeFileSync(outputPath, sqlOutput, "utf-8");
  console.log(`\n========================================================`);
  console.log(`✅ Database SQL backup exported successfully!`);
  console.log(`📄 Saved to: ${outputPath}`);
  console.log(`========================================================\n`);
  await prisma.$disconnect();
  process.exit(0);
}

exportSqlDump().catch(async (err) => {
  console.error("SQL Export failed:", err);
  await prisma.$disconnect();
  process.exit(1);
});
