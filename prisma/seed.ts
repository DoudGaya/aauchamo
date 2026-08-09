import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

import { PrismaClient } from "../lib/generated/prisma/client";
import { PERMISSIONS } from "../lib/server/permissions";

const databaseUrl =
  process.env.DIRECT_DATABASE_URL ??
  process.env.DATABASE_URL ??
  "postgresql://aau_chamo:aau_chamo@127.0.0.1:5432/aau_chamo";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

const rolePermissionKeys: Record<string, string[]> = {
  SUPER_ADMIN: PERMISSIONS.map(([key]) => key),
  ADMIN: PERMISSIONS.filter(([key]) => !key.startsWith("staff.view_sensitive")).map(([key]) => key),
  FINANCE: [
    "dashboard.view", "sales.view", "customers.view", "agents.view", "wallet.view", "wallet.post",
    "finance.view", "finance.post_income", "finance.post_expense", "finance.approve",
    "finance.reconcile", "finance.reverse", "finance.view_profit", "reports.view",
    "reports.view_financial", "reports.export", "documents.view", "documents.upload",
    "notifications.view", "approvals.view", "approvals.decide", "search.use", "tickets.view",
  ],
  HR: [
    "dashboard.view", "staff.view", "staff.manage", "staff.create", "staff.update", "staff.change_status",
    "staff.manage_documents", "staff.view_sensitive", "documents.view", "documents.upload",
    "notifications.view", "reports.view", "search.use",
  ],
  OPERATIONS_MANAGER: [
    "dashboard.view", "stations.view", "stations.view_performance", "customers.view", "customers.manage",
    "customers.create", "customers.update", "customers.view_history", "inventory.view",
    "inventory.create_product", "inventory.update_product", "inventory.stock_in", "inventory.stock_out",
    "inventory.transfer", "inventory.adjust", "inventory.approve_adjustment", "inventory.view_cost",
    "purchases.view", "purchases.manage", "sales.view", "cargo.view", "cargo.manage", "cargo.reprint",
    "agents.view", "reports.view", "reports.export", "documents.view", "documents.upload",
    "notifications.view", "approvals.view", "approvals.decide", "search.use", "tickets.view", "tickets.manage",
  ],
  SALES_OFFICER: [
    "dashboard.view", "customers.view", "customers.manage", "customers.create", "customers.update",
    "customers.view_history", "inventory.view", "sales.view", "sales.create",
    "sales.discount", "cargo.view", "agents.view", "wallet.view", "documents.view", "notifications.view",
    "search.use", "tickets.view", "tickets.manage",
  ],
  OPERATIONS_COORDINATOR: [
    "dashboard.view", "stations.view", "customers.view", "customers.manage", "customers.create",
    "customers.update", "customers.view_history", "inventory.view",
    "inventory.stock_in", "inventory.stock_out", "inventory.transfer", "purchases.view", "sales.view",
    "cargo.view", "cargo.manage", "cargo.reprint", "agents.view", "reports.view", "documents.view",
    "notifications.view", "approvals.view", "search.use", "tickets.view", "tickets.manage",
  ],
  CUSTOMER_SERVICE: [
    "dashboard.view", "customers.view", "customers.manage", "customers.create", "customers.update",
    "customers.view_history", "sales.view", "cargo.view", "agents.view",
    "documents.view", "notifications.view", "search.use", "tickets.view",
  ],
  AUDITOR: [
    "dashboard.view", "dashboard.view_consolidated", "stations.view", "users.view", "roles.view",
    "staff.view", "customers.view", "inventory.view", "inventory.view_cost", "purchases.view", "sales.view",
    "cargo.view", "agents.view", "wallet.view", "finance.view", "finance.view_profit", "reports.view",
    "reports.view_financial", "reports.export", "documents.view", "notifications.view", "approvals.view",
    "audit.view", "audit.export", "settings.view", "search.use", "tickets.view",
  ],
};

const roles = [
  ["SUPER_ADMIN", "Super Admin", "COMPANY"],
  ["ADMIN", "Admin", "COMPANY"],
  ["FINANCE", "Finance", "STATION"],
  ["HR", "HR", "COMPANY"],
  ["OPERATIONS_MANAGER", "Operations Manager", "STATION"],
  ["SALES_OFFICER", "Sales Officer", "STATION"],
  ["OPERATIONS_COORDINATOR", "Operations Coordinator", "STATION"],
  ["CUSTOMER_SERVICE", "Customer Service", "STATION"],
  ["AUDITOR", "Auditor", "COMPANY"],
  ["CUSTOM", "Custom Role", "STATION"],
] as const;

const users = [
  ["superadmin", "System", "Administrator", "admin@aauchamo.local", "SUPER_ADMIN", true],
  ["finance.demo", "Fatima", "Bello", "finance@aauchamo.local", "FINANCE", false],
  ["operations.demo", "Amina", "Yusuf", "operations@aauchamo.local", "OPERATIONS_MANAGER", false],
  ["sales.demo", "Musa", "Ibrahim", "sales@aauchamo.local", "SALES_OFFICER", false],
  ["hr.demo", "Zainab", "Aliyu", "hr@aauchamo.local", "HR", true],
  ["auditor.demo", "Kabiru", "Sani", "auditor@aauchamo.local", "AUDITOR", true],
] as const;

async function main() {
  const seedPassword = process.env.SEED_SUPER_ADMIN_PASSWORD ?? "ChangeMe-Immediately-2026!";
  const passwordHash = await hash(seedPassword, 12);

  const company = await db.company.upsert({
    where: { code: "AAU-CHAMO" },
    create: {
      code: "AAU-CHAMO",
      legalName: "A.A.U Chamo International Business Agency Services Limited",
      displayName: "AAU Chamo",
      timezone: "Africa/Lagos",
      currencyCode: "NGN",
      locale: "en-NG",
    },
    update: {
      legalName: "A.A.U Chamo International Business Agency Services Limited",
      displayName: "AAU Chamo",
      isActive: true,
    },
  });

  const businessUnits = await Promise.all(
    [
      ["CORE", "AAU Chamo Core"],
      ["BINANI", "Binani"],
      ["UMZA", "UMZA"],
      ["LOGISTICS", "Logistics"],
      ["CLEARING", "Clearing & Forwarding"],
    ].map(([code, name]) =>
      db.businessUnit.upsert({
        where: { companyId_code: { companyId: company.id, code } },
        create: { companyId: company.id, code, name },
        update: { name, isActive: true },
      }),
    ),
  );

  const stationRows = await Promise.all(
    [
      ["HQ", "Head Office", "Kano"],
      ["AIR", "Airport", "Kano"],
      ["KAN", "Kano Central", "Kano"],
      ["LOS", "Lagos", "Lagos"],
    ].map(([code, name, city]) =>
      db.station.upsert({
        where: { companyId_code: { companyId: company.id, code } },
        create: { companyId: company.id, code, name, city, state: city, status: "ACTIVE" },
        update: { name, city, state: city, status: "ACTIVE" },
      }),
    ),
  );

  for (const station of stationRows) {
    for (const [index, businessUnit] of businessUnits.entries()) {
      await db.stationBusinessUnit.upsert({
        where: { stationId_businessUnitId: { stationId: station.id, businessUnitId: businessUnit.id } },
        create: { stationId: station.id, businessUnitId: businessUnit.id, isPrimary: index === 0 },
        update: { isPrimary: index === 0 },
      });
    }
  }

  for (const [key, module, action, description, isSensitive] of PERMISSIONS) {
    await db.permission.upsert({
      where: { key },
      create: { key, module, action, description, isSensitive },
      update: { module, action, description, isSensitive },
    });
  }

  const roleMap = new Map<string, string>();
  for (const [code, name, scope] of roles) {
    const role = await db.role.upsert({
      where: { companyId_code: { companyId: company.id, code } },
      create: {
        companyId: company.id,
        code,
        name,
        scope,
        isSystem: code !== "CUSTOM",
      },
      update: { name, scope, isActive: true },
    });
    roleMap.set(code, role.id);
    const permissionKeys = rolePermissionKeys[code] ?? [];
    const permissions = await db.permission.findMany({ where: { key: { in: permissionKeys } } });
    await db.rolePermission.deleteMany({ where: { roleId: role.id } });
    if (permissions.length) {
      await db.rolePermission.createMany({
        data: permissions.map((permission) => ({ roleId: role.id, permissionId: permission.id })),
      });
    }
  }

  const userMap = new Map<string, string>();
  for (const [username, firstName, lastName, email, roleCode, companyWide] of users) {
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
      update: { firstName, lastName, name: `${firstName} ${lastName}`, email, status: "ACTIVE" },
    });
    userMap.set(username, user.id);
    await db.userRole.deleteMany({ where: { userId: user.id } });
    await db.userRole.create({
      data: {
        userId: user.id,
        roleId: roleMap.get(roleCode)!,
        stationId: companyWide ? undefined : stationRows[0].id,
      },
    });
    for (const station of companyWide ? stationRows : [stationRows[0]]) {
      await db.userStationScope.upsert({
        where: { userId_stationId: { userId: user.id, stationId: station.id } },
        create: {
          userId: user.id,
          stationId: station.id,
          canView: true,
          canOperate: !["auditor.demo", "hr.demo"].includes(username),
          isPrimary: station.id === stationRows[0].id,
        },
        update: {
          canView: true,
          canOperate: !["auditor.demo", "hr.demo"].includes(username),
          isPrimary: station.id === stationRows[0].id,
        },
      });
    }
  }

  const managerId = userMap.get("operations.demo")!;
  const activeManager = await db.stationManagerAssignment.findFirst({
    where: { stationId: stationRows[0].id, endsAt: null },
  });
  if (!activeManager) {
    await db.stationManagerAssignment.create({
      data: { stationId: stationRows[0].id, managerId },
    });
  }

  const departments = new Map<string, string>();
  for (const [code, name] of [
    ["OPS", "Operations"],
    ["FIN", "Finance"],
    ["HR", "Human Resources"],
    ["SALES", "Sales & Customer Service"],
  ]) {
    const department = await db.department.upsert({
      where: { companyId_code: { companyId: company.id, code } },
      create: { companyId: company.id, businessUnitId: businessUnits[0].id, code, name },
      update: { name, isActive: true },
    });
    departments.set(code, department.id);
  }

  const positions = new Map<string, string>();
  for (const [code, name] of [
    ["OPS-MGR", "Operations Manager"],
    ["FIN-OFF", "Finance Officer"],
    ["SALES-OFF", "Sales Officer"],
    ["HR-OFF", "HR Officer"],
  ]) {
    const position = await db.position.upsert({
      where: { companyId_code: { companyId: company.id, code } },
      create: { companyId: company.id, code, name },
      update: { name, isActive: true },
    });
    positions.set(code, position.id);
  }

  for (const [staffNumber, firstName, lastName, departmentCode, positionCode, username] of [
    ["STF-00001", "Amina", "Yusuf", "OPS", "OPS-MGR", "operations.demo"],
    ["STF-00002", "Fatima", "Bello", "FIN", "FIN-OFF", "finance.demo"],
    ["STF-00003", "Musa", "Ibrahim", "SALES", "SALES-OFF", "sales.demo"],
    ["STF-00004", "Zainab", "Aliyu", "HR", "HR-OFF", "hr.demo"],
  ]) {
    const staffRecord = await db.staff.upsert({
      where: { companyId_staffNumber: { companyId: company.id, staffNumber } },
      create: {
        companyId: company.id,
        businessUnitId: businessUnits[0].id,
        userId: userMap.get(username),
        staffNumber,
        firstName,
        lastName,
        phone: "+2348000000000",
        email: `${username}@aauchamo.local`,
        employmentDate: new Date("2025-01-06T00:00:00.000Z"),
        employmentType: "PERMANENT",
        departmentId: departments.get(departmentCode)!,
        positionId: positions.get(positionCode)!,
        homeStationId: stationRows[0].id,
        status: "ACTIVE",
      },
      update: {
        userId: userMap.get(username),
        departmentId: departments.get(departmentCode)!,
        positionId: positions.get(positionCode)!,
        status: "ACTIVE",
      },
    });
    const assignment = await db.staffStationAssignment.findFirst({ where: { staffId: staffRecord.id, endsAt: null } });
    if (!assignment) {
      await db.staffStationAssignment.create({
        data: { staffId: staffRecord.id, stationId: stationRows[0].id, startsAt: staffRecord.employmentDate, reason: "Seeded initial assignment", assignedById: userMap.get("superadmin")! },
      });
    }
  }

  for (const [index, displayName, phone, type] of [
    [1, "Bashir & Sons", "+2348031112200", "BUSINESS"],
    [2, "Maryam Sani", "+2348031112201", "INDIVIDUAL"],
    [3, "Chinedu Okafor", "+2348031112202", "INDIVIDUAL"],
    [4, "Northstar Agency", "+2348031112203", "BUSINESS"],
  ] as const) {
    const customerNumber = `CUS-${String(index).padStart(6, "0")}`;
    await db.customer.upsert({
      where: { companyId_customerNumber: { companyId: company.id, customerNumber } },
      create: {
        companyId: company.id,
        businessUnitId: businessUnits[0].id,
        homeStationId: stationRows[index % stationRows.length].id,
        customerNumber,
        type,
        firstName: type === "INDIVIDUAL" ? displayName.split(" ")[0] : undefined,
        lastName: type === "INDIVIDUAL" ? displayName.split(" ").slice(1).join(" ") : undefined,
        companyName: type === "BUSINESS" ? displayName : undefined,
        displayName,
        primaryPhone: phone,
        normalizedPhone: phone,
        status: "ACTIVE",
        contacts: { create: { type: "PHONE", value: phone, normalized: phone, isPrimary: true } },
      },
      update: { displayName, primaryPhone: phone, normalizedPhone: phone, status: "ACTIVE" },
    });
  }

  const unit = await db.unitOfMeasure.upsert({
    where: { companyId_code: { companyId: company.id, code: "EA" } },
    create: { companyId: company.id, code: "EA", name: "Each", precision: 0 },
    update: { name: "Each", precision: 0, isActive: true },
  });
  const categoryMap = new Map<string, string>();
  for (const [code, name] of [["FOOD", "Foodstuff"], ["OIL", "Cooking oil"], ["PACK", "Packaging"]]) {
    const category = await db.productCategory.upsert({
      where: { companyId_code: { companyId: company.id, code } },
      create: { companyId: company.id, code, name },
      update: { name, isActive: true },
    });
    categoryMap.set(code, category.id);
  }
  const supplier = await db.supplier.upsert({
    where: { companyId_supplierNumber: { companyId: company.id, supplierNumber: "SUP-00001" } },
    create: { companyId: company.id, supplierNumber: "SUP-00001", name: "Northern Commodities Distribution", contactName: "Sani Garba", phone: "+2348030001100", paymentTerms: "30 days" },
    update: { name: "Northern Commodities Distribution", isActive: true },
  });
  for (const [code, name, categoryCode, purchasePrice, sellingPrice, reorderLevel, openingQuantity] of [
    ["BNA-RCE-050", "Binani Premium Rice 50kg", "FOOD", "52000", "57500", "20", "120"],
    ["UMZ-OIL-025", "UMZA Vegetable Oil 25L", "OIL", "34000", "38500", "15", "80"],
    ["LOG-BOX-L", "Logistics Cargo Box Large", "PACK", "4200", "6000", "30", "150"],
  ]) {
    const product = await db.product.upsert({
      where: { companyId_code: { companyId: company.id, code } },
      create: { companyId: company.id, categoryId: categoryMap.get(categoryCode)!, unitId: unit.id, defaultSupplierId: supplier.id, code, barcode: `1000${code.replace(/\D/g, "").padEnd(8, "0").slice(0, 8)}`, qrValue: `product:${code}`, name, purchasePrice, sellingPrice, reorderLevel },
      update: { name, categoryId: categoryMap.get(categoryCode)!, unitId: unit.id, defaultSupplierId: supplier.id, purchasePrice, sellingPrice, reorderLevel, status: "ACTIVE" },
    });
    const balance = await db.inventoryBalance.upsert({
      where: { stationId_productId_batchKey: { stationId: stationRows[0].id, productId: product.id, batchKey: "" } },
      create: { stationId: stationRows[0].id, productId: product.id, batchKey: "", quantity: openingQuantity },
      update: { quantity: openingQuantity, version: { increment: 1 } },
    });
    const opening = await db.stockMovement.findFirst({ where: { stationId: stationRows[0].id, productId: product.id, movementType: "OPENING", referenceType: "Seed" } });
    if (!opening) await db.stockMovement.create({ data: { companyId: company.id, stationId: stationRows[0].id, productId: product.id, movementType: "OPENING", quantityDelta: openingQuantity, balanceAfter: balance.quantity, unitCost: purchasePrice, referenceType: "Seed", referenceId: product.id, reason: "Development opening stock", occurredById: userMap.get("superadmin")! } });
  }

  const northstarCustomer = await db.customer.findFirst({ where: { companyId: company.id, displayName: "Northstar Agency" } });
  const seededAgent = await db.agent.upsert({
    where: { companyId_agentNumber: { companyId: company.id, agentNumber: "AGT-00001" } },
    create: { companyId: company.id, homeStationId: stationRows[0].id, customerId: northstarCustomer?.id, agentNumber: "AGT-00001", name: "Northstar Agency", contactName: "Hauwa Ibrahim", phone: "+2348031112203", creditLimit: "1000000", createdById: userMap.get("superadmin")! },
    update: { name: "Northstar Agency", status: "ACTIVE", creditLimit: "1000000" },
  });
  await db.walletAccount.upsert({ where: { agentId: seededAgent.id }, create: { agentId: seededAgent.id, balance: "500000" }, update: { balance: "500000", version: { increment: 1 } } });

  const paymentMethodMap = new Map<string, string>();
  for (const [code, name, type, requiresReference, requiresTerminal] of [
    ["CASH", "Cash", "CASH", false, false],
    ["POS", "POS Terminal", "POS_TERMINAL", true, true],
    ["TRANSFER", "Bank Transfer", "BANK_TRANSFER", true, false],
    ["WALLET", "Agent Wallet", "WALLET", true, false],
    ["CREDIT", "Approved Credit", "CREDIT", true, false],
  ] as const) {
    const paymentMethod = await db.paymentMethod.upsert({
      where: { companyId_code: { companyId: company.id, code } },
      create: { companyId: company.id, code, name, type, requiresReference, requiresTerminal },
      update: { name, type, requiresReference, requiresTerminal, isActive: true },
    });
    paymentMethodMap.set(code, paymentMethod.id);
  }

  for (const [code, name, type] of [
    ["SALES", "Product sales", "CREDIT"],
    ["TICKET_SALES", "Flight ticket sales", "CREDIT"],
    ["AGENT_DEPOSIT", "Agent wallet deposits", "CREDIT"],
    ["OTHER_INCOME", "Other income", "CREDIT"],
    ["OPERATING_EXPENSE", "Operating expenses", "DEBIT"],
    ["REFUND", "Customer refunds", "DEBIT"],
  ] as const) {
    await db.financialCategory.upsert({
      where: { companyId_code: { companyId: company.id, code } },
      create: { companyId: company.id, code, name, type },
      update: { name, type, isActive: true },
    });
  }

  for (const [methodCode, code, name, accountType] of [
    ["CASH", "CASH-TILL", "Cash till", "CASH"],
    ["POS", "POS-CLEARING", "POS clearing", "CLEARING"],
    ["TRANSFER", "BANK-CLEARING", "Bank transfer clearing", "BANK"],
    ["WALLET", "AGENT-WALLET-LIABILITY", "Agent wallet liability", "LIABILITY"],
    ["CREDIT", "CUSTOMER-RECEIVABLE", "Customer receivable", "RECEIVABLE"],
  ] as const) {
    await db.financialAccount.upsert({
      where: { companyId_code: { companyId: company.id, code } },
      create: { companyId: company.id, code, name, accountType, paymentMethodId: paymentMethodMap.get(methodCode)! },
      update: { name, accountType, paymentMethodId: paymentMethodMap.get(methodCode)!, isActive: true },
    });
  }

  const settings = [
    ["company", "identity", { displayName: company.displayName, legalName: company.legalName }],
    ["security", "login", { maxFailedAttempts: 5, lockMinutes: 15, sessionHours: 8 }],
    ["inventory", "negativeStock", { allowed: false }],
    ["documents", "receipt", { footer: "Thank you for doing business with AAU Chamo." }],
  ] as const;
  for (const [namespace, key, value] of settings) {
    await db.systemSetting.upsert({
      where: { companyId_scopeKey_namespace_key: { companyId: company.id, scopeKey: "COMPANY", namespace, key } },
      create: { companyId: company.id, scopeKey: "COMPANY", namespace, key, value },
      update: { value, version: { increment: 1 } },
    });
  }

  console.log("AAU Chamo development seed completed.");
  console.log(`Super admin: ${process.env.SEED_SUPER_ADMIN_EMAIL ?? "admin@aauchamo.local"}`);
  console.log(`Temporary password: ${seedPassword}`);
  console.log("All seeded users must change the temporary password after first sign-in.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
