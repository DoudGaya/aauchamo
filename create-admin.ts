import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";
import { PrismaClient } from "./lib/generated/prisma/client";

const databaseUrl = process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL ?? "postgresql://aau_chamo:aau_chamo@127.0.0.1:5432/aau_chamo";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });

async function main() {
  const passwordHash = await hash("ChangeMe-Immediately-2026!", 12);
  
  const company = await db.company.findUnique({ where: { code: "AAU-CHAMO" } });
  if (!company) throw new Error("Company not found");

  const superAdminRole = await db.role.findFirst({ where: { companyId: company.id, code: "SUPER_ADMIN" } });
  if (!superAdminRole) throw new Error("SUPER_ADMIN role not found");
  
  // Assign to all stations for super admin
  const stations = await db.station.findMany({ where: { companyId: company.id } });
  
  const username = "cargoaauchamo";
  const firstName = "Cargo";
  const lastName = "Admin";
  const email = "cargoaauchamo@gmail.com";
  
  const user = await db.user.upsert({
    where: { username },
    create: {
      companyId: company.id,
      username,
      firstName,
      lastName,
      name: `${firstName} ${lastName}`,
      email,
      passwordHash,
      passwordChangedAt: new Date(),
      mustChangePassword: true,
      status: "ACTIVE",
    },
    update: { email, status: "ACTIVE" },
  });
  
  await db.userRole.deleteMany({ where: { userId: user.id } });
  await db.userRole.create({
    data: {
      userId: user.id,
      roleId: superAdminRole.id,
    },
  });
  
  for (const station of stations) {
    await db.userStationScope.upsert({
      where: { userId_stationId: { userId: user.id, stationId: station.id } },
      create: {
        userId: user.id,
        stationId: station.id,
        canView: true,
        canOperate: true,
        isPrimary: station.code === "KAN",
      },
      update: {
        canView: true,
        canOperate: true,
      },
    });
  }
  
  console.log(`Created super admin user: ${email} with username: ${username}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
