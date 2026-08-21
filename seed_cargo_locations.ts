import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from './lib/generated/prisma/client';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? "postgresql://aau_chamo:aau_chamo@127.0.0.1:5432/aau_chamo",
  connectionTimeoutMillis: 30_000,
  idleTimeoutMillis: 30_000,
  max: 1,
});

const db = new PrismaClient({ adapter });

async function main() {
  const company = await db.company.findFirst();
  if (!company) {
    console.log("No company found.");
    return;
  }
  
  const destinationColors: Record<string, string> = {
    ABV: "#dc2626", MIU: "#1e3a8a", KAN: "#14532d", SKO: "#7f1d1d",
    ILR: "#4b5563", YOL: "#000000", NBK: "#2563eb", LOS: "#eab308",
    GMO: "#fa8072", KAD: "#06b6d4",
  };

  const names: Record<string, string> = {
    ABV: "Abuja", MIU: "Maiduguri", KAN: "Kano", SKO: "Sokoto",
    ILR: "Ilorin", YOL: "Yola", NBK: "Unknown", LOS: "Lagos",
    GMO: "Unknown", KAD: "Kaduna",
  };

  for (const [code, color] of Object.entries(destinationColors)) {
    const existing = await db.cargoLocation.findFirst({
      where: { companyId: company.id, code }
    });
    if (!existing) {
      await db.cargoLocation.create({
        data: {
          companyId: company.id,
          code,
          name: names[code] || code,
          color,
          isActive: true
        }
      });
      console.log(`Created location ${code} with color ${color}`);
    }
  }
  console.log("Seed complete.");
}

main()
  .then(async () => {
    process.exit(0);
  })
  .catch(async (e) => {
    console.error(e)
    process.exit(1)
  });
