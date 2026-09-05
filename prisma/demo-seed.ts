/**
 * Demo / UAT transactional seed.
 *
 * Loads a realistic set of transactions on top of the foundation seed
 * (`prisma/seed.ts`) so every operational module is populated: sales,
 * outstanding balances, cargo, purchases, flight bookings, finance entries,
 * an agent wallet deposit, a pending approval, and notifications.
 *
 * It reuses the real `postSale` service and mirrors the route transactions so
 * inventory balances, cashbook, wallet ledger and the audit hash-chain stay
 * consistent — exactly as if the data had been entered through the UI.
 *
 * Run AFTER the foundation seed:
 *   npm run db:seed        # foundation (stations, users, products, ...)
 *   npm run db:seed:demo   # this file
 *
 * NEVER run against production. The seed is idempotent per section: each block
 * checks for its own data and is skipped if already present, so re-running is
 * safe and tops up anything a previous run missed. Because the operational
 * ledgers are append-only, sections that already committed are never mutated.
 */
import "dotenv/config";

import { randomUUID } from "node:crypto";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient, Prisma } from "../lib/generated/prisma/client";
import type { AccessContext } from "@/lib/server/access";
import { writeAudit } from "@/lib/server/audit";
import { allocateSequence } from "@/lib/server/sequence";
import { postSale } from "@/lib/server/sales";
import { PERMISSIONS } from "@/lib/server/permissions";

const databaseUrl =
  process.env.DIRECT_DATABASE_URL ??
  process.env.DATABASE_URL ??
  "postgresql://aau_chamo:aau_chamo@127.0.0.1:5432/aau_chamo";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });

const money = (value: number) => value.toFixed(2);
const TX = { isolationLevel: "Serializable" as const, maxWait: 10_000, timeout: 25_000 };

async function main() {
  const company = await db.company.findFirst({ where: { code: "AAU-CHAMO" } });
  if (!company) throw new Error("Foundation seed missing: run `npm run db:seed` first.");
  const companyId = company.id;

  // ---- Reference data -------------------------------------------------------
  const [stations, businessUnits, products, methods, customers, users, agent] = await Promise.all([
    db.station.findMany({ where: { companyId }, orderBy: { code: "asc" } }),
    db.businessUnit.findMany({ where: { companyId }, orderBy: { code: "asc" } }),
    db.product.findMany({ where: { companyId, status: "ACTIVE" }, orderBy: { code: "asc" } }),
    db.paymentMethod.findMany({ where: { companyId, isActive: true } }),
    db.customer.findMany({ where: { companyId, status: "ACTIVE" }, orderBy: { customerNumber: "asc" } }),
    db.user.findMany({ where: { companyId } }),
    db.agent.findFirst({ where: { companyId, agentNumber: "AGT-00001" }, include: { wallet: true } }),
  ]);

  if (!stations.length || !businessUnits.length || products.length < 3 || !customers.length) {
    throw new Error("Foundation data incomplete: expected stations, business units, products and customers.");
  }

  const superAdmin = users.find((user) => user.username === "superadmin");
  if (!superAdmin) throw new Error("Foundation seed missing super admin user.");
  const supplier = await db.supplier.findFirst({ where: { companyId } });

  const stationByCode = new Map(stations.map((s) => [s.code, s]));
  const hq = stationByCode.get("HQ") ?? stations[0];
  const method = (code: string) => methods.find((m) => m.code === code);
  const account = async (code: string) => db.financialAccount.findFirst({ where: { companyId, code } });
  const category = async (code: string) => db.financialCategory.findFirst({ where: { companyId, code } });

  // Full-authority context used purely to satisfy the reusable services.
  const access: AccessContext = {
    userId: superAdmin.id,
    companyId,
    sessionId: "demo-seed-session",
    name: superAdmin.name ?? "System Administrator",
    email: superAdmin.email,
    username: superAdmin.username,
    roleNames: ["Super Admin"],
    permissions: new Set(PERMISSIONS.map(([key]) => key)),
    stationIds: new Set(stations.map((s) => s.id)),
    operatingStationIds: new Set(stations.map((s) => s.id)),
    businessUnitIds: new Set(businessUnits.map((b) => b.id)),
    companyWide: true,
    isSuperAdmin: true,
  };

  const transfer = method("TRANSFER");

  // ---- Opening stock at every station (foundation only stocks HQ) ----------
  for (const station of stations) {
    if (station.id === hq.id) continue;
    for (const product of products) {
      const balance = await db.inventoryBalance.upsert({
        where: { stationId_productId_batchKey: { stationId: station.id, productId: product.id, batchKey: "" } },
        create: { stationId: station.id, productId: product.id, batchKey: "", quantity: "300" },
        update: {},
      });
      const existing = await db.stockMovement.findFirst({
        where: { stationId: station.id, productId: product.id, movementType: "OPENING", referenceType: "DemoSeed" },
      });
      if (!existing) {
        await db.stockMovement.create({
          data: {
            companyId, stationId: station.id, productId: product.id, movementType: "OPENING",
            quantityDelta: "300", balanceAfter: balance.quantity, unitCost: product.purchasePrice ?? undefined,
            referenceType: "DemoSeed", referenceId: product.id, reason: "Demo opening stock", occurredById: superAdmin.id,
          },
        });
      }
    }
  }
  console.log("Opening stock ensured at all stations.");

  // ---- Agent wallet deposit (populates wallet ledger + cashbook) -----------
  const depositExists = await db.walletEntry.findFirst({ where: { companyId, externalRef: "DEMO-DEP-001" } });
  if (agent?.wallet && transfer && !depositExists) {
    await db.$transaction(async (tx) => {
      const amount = new Prisma.Decimal("750000");
      const next = agent.wallet!.balance.plus(amount);
      await tx.walletAccount.update({ where: { id: agent.wallet!.id }, data: { balance: next, version: { increment: 1 } } });
      const entryNumber = await allocateSequence(tx, { companyId, stationId: agent.homeStationId, documentType: "WALLET_ENTRY", prefix: "WLT", includeDate: true, padding: 6 });
      const entry = await tx.walletEntry.create({
        data: {
          companyId, stationId: agent.homeStationId, walletAccountId: agent.wallet!.id, paymentMethodId: transfer.id,
          entryNumber, type: "DEPOSIT", amount, balanceAfter: next, referenceType: "AgentDeposit", referenceId: entryNumber,
          externalRef: "DEMO-DEP-001", reason: "Demo opening deposit", postedById: superAdmin.id,
        },
      });
      const acc = await account("BANK-CLEARING");
      const cat = await category("AGENT_DEPOSIT");
      if (acc && cat) {
        const cashbookNumber = await allocateSequence(tx, { companyId, stationId: agent.homeStationId, documentType: "CASHBOOK", prefix: "CB", includeDate: true, padding: 6 });
        await tx.cashbookEntry.create({
          data: {
            companyId, stationId: agent.homeStationId, accountId: acc.id, categoryId: cat.id, paymentMethodId: transfer.id,
            entryNumber: cashbookNumber, direction: "CREDIT", amount, description: `Agent deposit ${agent.agentNumber}`,
            sourceType: "WalletEntry", sourceId: entry.id, externalReference: "DEMO-DEP-001", status: "POSTED", postedById: superAdmin.id, postedAt: new Date(),
          },
        });
      }
      await writeAudit(tx, { companyId, actorId: superAdmin.id, stationId: agent.homeStationId, action: "wallet.deposit_posted", entityType: "WalletEntry", entityId: entry.id, requestId: randomUUID(), after: entry });
    }, TX);
    console.log("Agent wallet deposit posted.");
  } else {
    console.log("Agent wallet deposit already present; skipping.");
  }

  // ---- Sales via the real postSale service ---------------------------------
  const cash = method("CASH"), pos = method("POS"), wallet = method("WALLET");
  const saleModes = ["CASH", "POS", "TRANSFER", "CASH", "POS", "TRANSFER", "PARTIAL", "CREDIT_NONE", "WALLET"] as const;
  const existingSales = await db.sale.count({ where: { companyId } });
  if (existingSales > 0) {
    console.log(`Sales already present (${existingSales}); skipping.`);
  } else {
    let salesPosted = 0;
    for (let i = 0; i < 28; i += 1) {
      const station = stations[i % stations.length];
      const businessUnit = businessUnits[i % businessUnits.length];
      const customer = customers[i % customers.length];
      const mode = saleModes[i % saleModes.length];

      const lines = [{ productId: products[i % products.length].id, quantity: String((i % 3) + 1) }];
      if (i % 2 === 0) lines.push({ productId: products[(i + 1) % products.length].id, quantity: "1" });
      const total = lines.reduce((sum, line) => {
        const product = products.find((p) => p.id === line.productId)!;
        return sum + Number(product.sellingPrice) * Number(line.quantity);
      }, 0);

      type PaymentInput = { paymentMethodId: string; amount: string; reference?: string; terminalId?: string };
      let payments: PaymentInput[] = [];
      let agentId: string | undefined;
      if (mode === "CASH" && cash) payments = [{ paymentMethodId: cash.id, amount: money(total) }];
      else if (mode === "POS" && pos) payments = [{ paymentMethodId: pos.id, amount: money(total), reference: `POS-${1000 + i}`, terminalId: `TERM-${station.code}` }];
      else if (mode === "TRANSFER" && transfer) payments = [{ paymentMethodId: transfer.id, amount: money(total), reference: `TRF-${2000 + i}` }];
      else if (mode === "PARTIAL" && cash) payments = [{ paymentMethodId: cash.id, amount: money(Math.round(total * 0.4)) }];
      else if (mode === "CREDIT_NONE") payments = [];
      else if (mode === "WALLET" && wallet && agent) { payments = [{ paymentMethodId: wallet.id, amount: money(total), reference: `WLT-${3000 + i}` }]; agentId = agent.id; }
      else if (cash) payments = [{ paymentMethodId: cash.id, amount: money(total) }];

      try {
        await db.$transaction(
          (tx) => postSale({
            tx, access,
            payload: { stationId: station.id, businessUnitId: businessUnit.id, customerId: customer.id, agentId, lines, payments },
            idempotencyKey: `demo-sale-${i}-${randomUUID()}`, requestId: randomUUID(),
          }),
          TX,
        );
        salesPosted += 1;
      } catch (error) {
        console.warn(`Sale ${i} skipped: ${(error as Error).message}`);
      }
    }
    console.log(`Sales posted: ${salesPosted}.`);
  }

  // ---- Cargo shipments (varied statuses) -----------------------------------
  const cargoSpecs = [
    { origin: "KAN", destination: "LOS", airline: "Max Air", commodity: "Textiles", pieces: 4, weight: "68.400", status: "IN_TRANSIT" },
    { origin: "KAN", destination: "ABV", airline: "Rano Air", commodity: "Documents", pieces: 1, weight: "3.200", status: "DELIVERED" },
    { origin: "LOS", destination: "KAN", airline: "Air Peace", commodity: "Electronics", pieces: 2, weight: "24.100", status: "LABELLED" },
    { origin: "KAN", destination: "PHC", airline: "ValueJet", commodity: "Foodstuff", pieces: 6, weight: "112.000", status: "ON_HOLD" },
    { origin: "ABV", destination: "KAN", airline: "Max Air", commodity: "Machinery parts", pieces: 3, weight: "54.700", status: "PROCESSING" },
    { origin: "KAN", destination: "JED", airline: "Saudia", commodity: "Personal effects", pieces: 5, weight: "88.300", status: "DISPATCHED" },
    { origin: "LOS", destination: "ABV", airline: "Arik Air", commodity: "Pharmaceuticals", pieces: 2, weight: "16.500", status: "DELIVERED" },
    { origin: "KAN", destination: "LOS", airline: "Air Peace", commodity: "Packaging", pieces: 8, weight: "140.000", status: "IN_TRANSIT" },
    { origin: "KAN", destination: "KAD", airline: "Rano Air", commodity: "Spare parts", pieces: 1, weight: "9.800", status: "LABELLED" },
    { origin: "PHC", destination: "KAN", airline: "ValueJet", commodity: "Garments", pieces: 3, weight: "31.200", status: "ARRIVED" },
    { origin: "KAN", destination: "ABV", airline: "Max Air", commodity: "Books", pieces: 2, weight: "22.000", status: "DELIVERED" },
    { origin: "LOS", destination: "KAN", airline: "Arik Air", commodity: "Cosmetics", pieces: 4, weight: "47.600", status: "IN_TRANSIT" },
  ] as const;

  const chainFor = (status: string): Array<{ previousStatus?: string; status: string; notes: string }> => {
    const base = [
      { status: "DRAFT", notes: "Shipment created" },
      { previousStatus: "DRAFT", status: "LABELLED", notes: "Initial label issued" },
    ];
    const order = ["DISPATCHED", "IN_TRANSIT", "ARRIVED", "DELIVERED"];
    if (status === "PROCESSING") return [{ status: "DRAFT", notes: "Shipment created" }, { previousStatus: "DRAFT", status: "PROCESSING", notes: "Processing shipment" }];
    if (status === "ON_HOLD") return [...base, { previousStatus: "LABELLED", status: "ON_HOLD", notes: "Placed on hold" }];
    if (status === "LABELLED") return base;
    const chain: Array<{ previousStatus?: string; status: string; notes: string }> = [...base];
    let prev = "LABELLED";
    for (const step of order) {
      chain.push({ previousStatus: prev, status: step, notes: `${step.replace("_", " ").toLowerCase()} update` });
      prev = step;
      if (step === status) break;
    }
    return chain;
  };

  let cargoCreated = 0;
  for (let i = 0; i < cargoSpecs.length; i += 1) {
    const ref = `DEMO-CARGO-${i}`;
    if (await db.cargoShipment.findFirst({ where: { companyId, handlingNotes: ref } })) continue;
    const spec = cargoSpecs[i];
    const station = stations[i % stations.length];
    const customer = customers[i % customers.length];
    try {
      await db.$transaction(async (tx) => {
        const awbNumber = await allocateSequence(tx, { companyId, stationId: station.id, documentType: "CARGO_AWB", prefix: "AWB", includeDate: true, padding: 6 });
        const shipment = await tx.cargoShipment.create({
          data: {
            companyId, stationId: station.id, customerId: customer.id, awbNumber,
            senderName: customer.displayName, senderPhone: customer.primaryPhone ?? "+2348000000000",
            receiverName: `Receiver ${i + 1}`, receiverPhone: "+2348020000000", receiverAddress: `${spec.destination} depot`,
            origin: spec.origin, destination: spec.destination, weightKg: spec.weight, pieces: spec.pieces,
            commodity: spec.commodity, airline: spec.airline, flightNumber: `${spec.airline.slice(0, 2).toUpperCase()}${100 + i}`,
            handlingNotes: ref,
            status: spec.status as Prisma.CargoShipmentCreateInput["status"],
            dispatchedAt: ["DISPATCHED", "IN_TRANSIT", "ARRIVED", "DELIVERED"].includes(spec.status) ? new Date() : undefined,
            deliveredAt: spec.status === "DELIVERED" ? new Date() : undefined,
            createdById: superAdmin.id,
            events: { create: chainFor(spec.status).map((step) => ({ previousStatus: step.previousStatus as Prisma.CargoStatusEventCreateManyShipmentInput["previousStatus"], status: step.status as Prisma.CargoStatusEventCreateManyShipmentInput["status"], notes: step.notes, changedById: superAdmin.id })) },
          },
        });
        await tx.generatedDocument.create({
          data: {
            companyId, stationId: station.id, documentType: "CARGO_LABEL", documentNumber: `${awbNumber}-LBL`,
            sourceType: "CargoShipment", sourceId: shipment.id, templateKey: "cargo-label-v1", status: "READY", mimeType: "text/html",
            generatedById: superAdmin.id, generatedAt: new Date(),
          },
        });
        await writeAudit(tx, { companyId, actorId: superAdmin.id, stationId: station.id, action: "cargo.created", entityType: "CargoShipment", entityId: shipment.id, requestId: randomUUID(), after: shipment });
      }, TX);
      cargoCreated += 1;
    } catch (error) {
      console.warn(`Cargo ${i} skipped: ${(error as Error).message}`);
    }
  }
  console.log(`Cargo shipments created this run: ${cargoCreated}.`);

  // ---- Purchase orders (left actionable: SUBMITTED / APPROVED) -------------
  let poCreated = 0;
  if (supplier) {
    for (let i = 0; i < 5; i += 1) {
      const ref = `DEMO-PO-${i}`;
      if (await db.purchaseOrder.findFirst({ where: { companyId, notes: ref } })) continue;
      const station = stations[i % stations.length];
      const status = i < 3 ? "SUBMITTED" : "APPROVED";
      const lineInputs = [
        { product: products[i % products.length], quantity: String(20 + i * 5) },
        { product: products[(i + 1) % products.length], quantity: "10" },
      ];
      try {
        await db.$transaction(async (tx) => {
          const orderNumber = await allocateSequence(tx, { companyId, stationId: station.id, documentType: "PURCHASE_ORDER", prefix: "PO", includeDate: true, padding: 5 });
          let subtotal = new Prisma.Decimal(0);
          const lines = lineInputs.map((line) => {
            const unitCost = line.product.purchasePrice ?? new Prisma.Decimal(0);
            const lineTotal = new Prisma.Decimal(unitCost).times(line.quantity).toDecimalPlaces(2);
            subtotal = subtotal.plus(lineTotal);
            return { productId: line.product.id, quantityOrdered: line.quantity, unitCost, taxRate: "0", lineTotal };
          });
          const order = await tx.purchaseOrder.create({
            data: {
              companyId, stationId: station.id, supplierId: supplier.id, orderNumber,
              status: status as Prisma.PurchaseOrderCreateInput["status"], expectedDate: new Date(Date.now() + (i + 2) * 86_400_000),
              subtotal, taxTotal: "0", total: subtotal, notes: ref,
              approvedById: status === "APPROVED" ? superAdmin.id : undefined, approvedAt: status === "APPROVED" ? new Date() : undefined,
              createdById: superAdmin.id, lines: { create: lines },
            },
          });
          await writeAudit(tx, { companyId, actorId: superAdmin.id, stationId: station.id, action: "purchase.created", entityType: "PurchaseOrder", entityId: order.id, requestId: randomUUID(), after: order });
        }, TX);
        poCreated += 1;
      } catch (error) {
        console.warn(`Purchase ${i} skipped: ${(error as Error).message}`);
      }
    }
  }
  console.log(`Purchase orders created this run: ${poCreated}.`);

  // ---- Flight bookings (reserved + ticketed) -------------------------------
  const ticketSpecs = [
    { pnr: "6KX2QA", passenger: "Fatima Garba", origin: "KAN", destination: "LOS", airline: "Air Peace", fare: 142500, selling: 155000, status: "TICKETED" },
    { pnr: "8PM4LT", passenger: "Samuel Okoro", origin: "LOS", destination: "ABV", airline: "ValueJet", fare: 118000, selling: 128000, status: "RESERVED" },
    { pnr: "3AD7RV", passenger: "Rahila Ahmed", origin: "KAN", destination: "JED", airline: "Saudia", fare: 912000, selling: 985000, status: "TICKETED" },
    { pnr: "9QW1ZK", passenger: "Ibrahim Danjuma", origin: "ABV", destination: "KAN", airline: "Max Air", fare: 96000, selling: 104000, status: "RESERVED" },
    { pnr: "2LO8MT", passenger: "Grace Nwosu", origin: "LOS", destination: "KAN", airline: "Arik Air", fare: 132000, selling: 143000, status: "TICKETED" },
    { pnr: "5RT3PA", passenger: "Yusuf Bello", origin: "KAN", destination: "ABV", airline: "Rano Air", fare: 88000, selling: 95000, status: "TICKETED" },
    { pnr: "7HG6NB", passenger: "Aisha Sadiq", origin: "KAN", destination: "LOS", airline: "Air Peace", fare: 145000, selling: 158000, status: "RESERVED" },
    { pnr: "4CV9WD", passenger: "Peter Eze", origin: "LOS", destination: "ABV", airline: "ValueJet", fare: 121000, selling: 131000, status: "TICKETED" },
  ] as const;

  let ticketsCreated = 0;
  for (let i = 0; i < ticketSpecs.length; i += 1) {
    const spec = ticketSpecs[i];
    if (await db.ticketBooking.findFirst({ where: { companyId, pnr: spec.pnr } })) continue;
    const station = stations[i % stations.length];
    const businessUnit = businessUnits[i % businessUnits.length];
    const customer = customers[i % customers.length];
    try {
      await db.$transaction(async (tx) => {
        const bookingNumber = await allocateSequence(tx, { companyId, stationId: station.id, businessUnitId: businessUnit.id, documentType: "TICKET_BOOKING", prefix: "TKT", includeDate: true, padding: 6 });
        const booking = await tx.ticketBooking.create({
          data: {
            companyId, stationId: station.id, businessUnitId: businessUnit.id, customerId: customer.id, bookingNumber,
            pnr: spec.pnr, passengerName: spec.passenger, origin: spec.origin, destination: spec.destination, airline: spec.airline,
            travelDate: new Date(Date.now() + (i + 3) * 86_400_000), fare: money(spec.fare), sellingPrice: money(spec.selling),
            profit: money(spec.selling - spec.fare), status: spec.status as Prisma.TicketBookingCreateInput["status"],
            createdById: superAdmin.id, ticketedAt: spec.status === "TICKETED" ? new Date() : undefined,
          },
        });
        if (spec.status === "TICKETED" && transfer) {
          const acc = await account("BANK-CLEARING");
          const cat = await category("TICKET_SALES");
          if (acc && cat) {
            const entryNumber = await allocateSequence(tx, { companyId, stationId: station.id, businessUnitId: businessUnit.id, documentType: "CASHBOOK", prefix: "CB", includeDate: true, padding: 6 });
            await tx.cashbookEntry.create({
              data: {
                companyId, stationId: station.id, businessUnitId: businessUnit.id, accountId: acc.id, categoryId: cat.id, paymentMethodId: transfer.id,
                entryNumber, direction: "CREDIT", amount: money(spec.selling), description: `Ticket ${spec.pnr}`, sourceType: "TicketBooking", sourceId: booking.id,
                externalReference: `TKT-${spec.pnr}`, status: "POSTED", postedById: superAdmin.id, postedAt: new Date(),
              },
            });
          }
        }
        await writeAudit(tx, { companyId, actorId: superAdmin.id, stationId: station.id, businessUnitId: businessUnit.id, action: `ticket.${spec.status.toLowerCase()}`, entityType: "TicketBooking", entityId: booking.id, requestId: randomUUID(), after: booking });
      }, TX);
      ticketsCreated += 1;
    } catch (error) {
      console.warn(`Ticket ${i} skipped: ${(error as Error).message}`);
    }
  }
  console.log(`Flight bookings created this run: ${ticketsCreated}.`);

  // ---- Manual finance entries (incl. one that needs approval) --------------
  const cashTill = await account("CASH-TILL");
  const bankClearing = await account("BANK-CLEARING");
  const incomeCat = await category("OTHER_INCOME");
  const expenseCat = await category("OPERATING_EXPENSE");
  const financeSpecs = [
    { direction: "CREDIT", amount: 240000, description: "Miscellaneous service income", account: cashTill, cat: incomeCat, pm: cash },
    { direction: "DEBIT", amount: 85000, description: "Airport cargo handling", account: cashTill, cat: expenseCat, pm: cash },
    { direction: "DEBIT", amount: 45000, description: "Office consumables", account: cashTill, cat: expenseCat, pm: cash },
    { direction: "CREDIT", amount: 175000, description: "Packaging resale income", account: bankClearing, cat: incomeCat, pm: transfer },
    { direction: "DEBIT", amount: 120000, description: "Fuel and logistics", account: bankClearing, cat: expenseCat, pm: transfer },
    { direction: "DEBIT", amount: 60000, description: "Staff transport", account: cashTill, cat: expenseCat, pm: cash },
    { direction: "CREDIT", amount: 98000, description: "Handling commission", account: cashTill, cat: incomeCat, pm: cash },
    { direction: "DEBIT", amount: 750000, description: "Warehouse rent (quarterly)", account: bankClearing, cat: expenseCat, pm: transfer },
  ] as const;

  let financeCreated = 0;
  for (let i = 0; i < financeSpecs.length; i += 1) {
    const spec = financeSpecs[i];
    if (!spec.account || !spec.cat) continue;
    const ref = `DEMO-FIN-${i}`;
    if (await db.cashbookEntry.findFirst({ where: { companyId, externalReference: ref } })) continue;
    const station = stations[i % stations.length];
    const amount = new Prisma.Decimal(spec.amount);
    const requiresApproval = spec.direction === "DEBIT" && amount.gte(500_000);
    try {
      await db.$transaction(async (tx) => {
        const entryNumber = await allocateSequence(tx, { companyId, stationId: station.id, documentType: "CASHBOOK", prefix: "CB", includeDate: true, padding: 6 });
        const entry = await tx.cashbookEntry.create({
          data: {
            companyId, stationId: station.id, accountId: spec.account!.id, categoryId: spec.cat!.id, paymentMethodId: spec.pm?.id,
            entryNumber, direction: spec.direction as Prisma.CashbookEntryCreateInput["direction"], amount, description: spec.description,
            sourceType: "ManualFinance", sourceId: entryNumber, externalReference: ref, status: requiresApproval ? "PENDING_APPROVAL" : "POSTED",
            postedById: superAdmin.id, postedAt: requiresApproval ? undefined : new Date(),
          },
        });
        if (requiresApproval) {
          await tx.approvalRequest.create({
            data: {
              companyId, stationId: station.id, entityType: "CashbookEntry", entityId: entry.id, action: "finance.approve_expense",
              requestedById: superAdmin.id, assignedRoleKey: "FINANCE_APPROVER", requestReason: spec.description, payload: { amount: amount.toString(), entryNumber },
            },
          });
        }
        await writeAudit(tx, { companyId, actorId: superAdmin.id, stationId: station.id, action: requiresApproval ? "finance.entry_submitted" : "finance.entry_posted", entityType: "CashbookEntry", entityId: entry.id, requestId: randomUUID(), after: entry });
      }, TX);
      financeCreated += 1;
    } catch (error) {
      console.warn(`Finance entry ${i} skipped: ${(error as Error).message}`);
    }
  }
  console.log(`Finance entries created this run: ${financeCreated}.`);

  // ---- Notifications (for whoever signs in) --------------------------------
  const recipients = users.filter((user) => ["superadmin", "operations.demo", "finance.demo"].includes(user.username));
  const notificationSpecs = [
    { type: "LOW_STOCK", severity: "WARNING", title: "Low stock warning", message: "UMZA Vegetable Oil 25L is at or below its reorder level at Airport." },
    { type: "PENDING_APPROVAL", severity: "WARNING", title: "Approval required", message: "A warehouse rent expense of ₦750,000 is awaiting finance approval." },
    { type: "LARGE_TRANSACTION", severity: "INFO", title: "Large transaction posted", message: "A ticket sale of ₦985,000 was completed at Head Office." },
    { type: "LOW_AGENT_BALANCE", severity: "WARNING", title: "Agent balance check", message: "Review Northstar Agency wallet exposure against its credit limit." },
    { type: "LOGIN_ATTEMPT", severity: "DANGER", title: "Failed login attempt", message: "A failed sign-in attempt was recorded for an operations account." },
    { type: "CARGO_UPDATE", severity: "SUCCESS", title: "Cargo delivered", message: "AWB shipment to ABV was marked delivered." },
    { type: "USER_CREATED", severity: "INFO", title: "New user invited", message: "A new station user account was created and awaits first sign-in." },
    { type: "INVENTORY_ADJUSTMENT", severity: "INFO", title: "Inventory adjustment", message: "A stock adjustment was recorded and added to the audit trail." },
  ] as const;

  let notificationsCreated = 0;
  for (const recipient of recipients) {
    for (let i = 0; i < notificationSpecs.length; i += 1) {
      const spec = notificationSpecs[i];
      if (await db.notification.findFirst({ where: { companyId, recipientId: recipient.id, title: spec.title } })) continue;
      await db.notification.create({
        data: {
          companyId, recipientId: recipient.id, stationId: hq.id, type: spec.type, severity: spec.severity,
          title: spec.title, message: spec.message, status: i % 4 === 0 ? "READ" : "UNREAD", readAt: i % 4 === 0 ? new Date() : undefined,
        },
      });
      notificationsCreated += 1;
    }
  }
  console.log(`Notifications created this run: ${notificationsCreated}.`);

  console.log("\nAAU Chamo demo transactional seed completed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
