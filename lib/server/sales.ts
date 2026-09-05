import "server-only";

import { Prisma } from "@/lib/generated/prisma/client";
import type { AccessContext } from "@/lib/server/access";
import { AppError } from "@/lib/server/api";
import { writeAudit } from "@/lib/server/audit";
import { db } from "@/lib/server/db";
import { claimIdempotency, completeIdempotency, hashRequest } from "@/lib/server/idempotency";
import { applyStockMovement, quantity } from "@/lib/server/inventory";
import { dispatchNotification } from "@/lib/server/notifications";
import { enqueueOutbox } from "@/lib/server/outbox";
import { allocateSequence } from "@/lib/server/sequence";

export type PostSaleInput = {
  stationId: string;
  businessUnitId: string;
  customerId: string;
  agentId?: string;
  posSessionId?: string;
  lines: Array<{ productId: string; quantity: string; discountAmount?: string }>;
  payments: Array<{ paymentMethodId: string; amount: string; reference?: string; terminalId?: string }>;
  postedAt?: string;
};

export async function postSale(input: {
  tx: Prisma.TransactionClient;
  access: AccessContext;
  payload: PostSaleInput;
  idempotencyKey: string;
  requestId: string;
}) {
  const { tx, access, payload, idempotencyKey, requestId } = input;
  const claim = await claimIdempotency({ tx, companyId: access.companyId, userId: access.userId, route: "POST:/api/sales", key: idempotencyKey, requestHash: hashRequest(payload) });
  if (claim.status === "COMPLETED" && claim.responseBody) return { replayed: true, result: claim.responseBody };

  const [customer, stationUnit, products, methods, closedPeriod] = await Promise.all([
    tx.customer.findFirst({ where: { id: payload.customerId, companyId: access.companyId, status: "ACTIVE" } }),
    tx.stationBusinessUnit.findUnique({ where: { stationId_businessUnitId: { stationId: payload.stationId, businessUnitId: payload.businessUnitId } } }),
    tx.product.findMany({ where: { id: { in: payload.lines.map((line) => line.productId) }, companyId: access.companyId, status: "ACTIVE" }, include: { unit: true } }),
    tx.paymentMethod.findMany({ where: { id: { in: payload.payments.map((payment) => payment.paymentMethodId) }, companyId: access.companyId, isActive: true } }),
    tx.financialPeriod.findFirst({ where: { companyId: access.companyId, isClosed: true, startsAt: { lte: new Date() }, endsAt: { gte: new Date() } } }),
  ]);
  if (!customer) throw new AppError("INVALID_CUSTOMER", "Customer is unavailable.", 422);
  if (!stationUnit) throw new AppError("INVALID_BUSINESS_UNIT", "This business unit is not enabled at the selected station.", 422);
  if (closedPeriod) throw new AppError("FINANCIAL_PERIOD_CLOSED", "The current financial period is closed.", 409);
  if (products.length !== new Set(payload.lines.map((line) => line.productId)).size) throw new AppError("INVALID_PRODUCT", "One or more products are unavailable.", 422);
  if (methods.length !== new Set(payload.payments.map((payment) => payment.paymentMethodId)).size) throw new AppError("INVALID_PAYMENT_METHOD", "One or more payment methods are unavailable.", 422);

  const saleDate = payload.postedAt ? new Date(payload.postedAt) : new Date();

  const productMap = new Map(products.map((product) => [product.id, product]));
  const methodMap = new Map(methods.map((method) => [method.id, method]));
  let subtotal = new Prisma.Decimal(0); let taxTotal = new Prisma.Decimal(0); let discountTotal = new Prisma.Decimal(0);
  const calculatedLines = payload.lines.map((line) => {
    const product = productMap.get(line.productId)!; const qty = quantity(line.quantity); const gross = product.sellingPrice.times(qty).toDecimalPlaces(2); const discount = new Prisma.Decimal(line.discountAmount ?? 0).toDecimalPlaces(2);
    if (discount.isNegative() || discount.gt(gross)) throw new AppError("INVALID_DISCOUNT", `Discount is invalid for ${product.name}.`, 422);
    if (discount.gt(0) && !access.permissions.has("sales.discount")) throw new AppError("DISCOUNT_NOT_ALLOWED", "You do not have permission to apply discounts.", 403);
    const taxable = gross.minus(discount); const tax = taxable.times(product.taxRate).div(100).toDecimalPlaces(2); const lineTotal = taxable.plus(tax);
    subtotal = subtotal.plus(gross); discountTotal = discountTotal.plus(discount); taxTotal = taxTotal.plus(tax);
    return { product, qty, discount, tax, lineTotal };
  });
  const total = subtotal.minus(discountTotal).plus(taxTotal).toDecimalPlaces(2);
  const paidTotal = payload.payments.reduce((sum, payment) => sum.plus(payment.amount), new Prisma.Decimal(0)).toDecimalPlaces(2);
  if (paidTotal.isNegative() || paidTotal.gt(total)) throw new AppError("INVALID_PAYMENT_TOTAL", "Payments cannot exceed the sale total.", 422);

  for (const payment of payload.payments) {
    const method = methodMap.get(payment.paymentMethodId)!;
    if (method.requiresReference && !payment.reference?.trim()) throw new AppError("PAYMENT_REFERENCE_REQUIRED", `${method.name} requires a reference.`, 422);
    if (method.requiresTerminal && !payment.terminalId?.trim()) throw new AppError("PAYMENT_TERMINAL_REQUIRED", `${method.name} requires a terminal ID.`, 422);
    if (!new Prisma.Decimal(payment.amount).gt(0)) throw new AppError("INVALID_PAYMENT_AMOUNT", "Payment amounts must be greater than zero.", 422);
  }

  const saleNumber = await allocateSequence(tx, { companyId: access.companyId, stationId: payload.stationId, businessUnitId: payload.businessUnitId, documentType: "SALE", prefix: "AUG", includeDate: true, padding: 6 });
  const outstanding = total.minus(paidTotal).toDecimalPlaces(2);
  const sale = await tx.sale.create({ data: {
    companyId: access.companyId, stationId: payload.stationId, businessUnitId: payload.businessUnitId,
    customerId: payload.customerId, agentId: payload.agentId, posSessionId: payload.posSessionId,
    saleNumber, status: outstanding.isZero() ? "PAID" : paidTotal.isZero() ? "POSTED" : "PARTIALLY_PAID",
    subtotal, taxTotal, discountTotal, total, paidTotal, outstandingTotal: outstanding, officerId: access.userId,
    postedAt: saleDate, createdAt: saleDate,
    lines: { create: calculatedLines.map(({ product, qty, discount, tax, lineTotal }) => ({ productId: product.id, productCode: product.code, productName: product.name, unitCode: product.unit.code, quantity: qty, unitPrice: product.sellingPrice, costPrice: product.purchasePrice, taxRate: product.taxRate, taxAmount: tax, discountAmount: discount, lineTotal })) },
  }, include: { lines: true } });

  for (const line of calculatedLines) await applyStockMovement(tx, { companyId: access.companyId, stationId: payload.stationId, productId: line.product.id, movementType: "SALE", quantityDelta: line.qty.negated(), unitCost: line.product.purchasePrice, referenceType: "Sale", referenceId: sale.id, occurredById: access.userId, occurredAt: saleDate, reason: saleNumber });

  const salesCategory = await tx.financialCategory.findFirst({ where: { companyId: access.companyId, code: "SALES", isActive: true } });
  if (payload.payments.length && !salesCategory) throw new AppError("FINANCE_NOT_CONFIGURED", "Sales income category is not configured.", 500);
  for (const paymentInput of payload.payments) {
    const method = methodMap.get(paymentInput.paymentMethodId)!;
    const paymentNumber = await allocateSequence(tx, { companyId: access.companyId, stationId: payload.stationId, documentType: "PAYMENT", prefix: "PAY", includeDate: true, padding: 6 });
    const payment = await tx.payment.create({ data: { companyId: access.companyId, stationId: payload.stationId, customerId: payload.customerId, paymentMethodId: method.id, paymentNumber, amount: paymentInput.amount, reference: paymentInput.reference, terminalId: paymentInput.terminalId, receivedById: access.userId, createdAt: saleDate, allocations: { create: { saleId: sale.id, amount: paymentInput.amount } } } });
    if (method.type === "WALLET") {
      if (!payload.agentId) throw new AppError("AGENT_REQUIRED", "An agent is required for wallet payment.", 422);
      const wallet = await tx.walletAccount.findFirst({ where: { agent: { id: payload.agentId, companyId: access.companyId, status: "ACTIVE" } }, include: { agent: true } });
      const amount = new Prisma.Decimal(paymentInput.amount); if (!wallet || wallet.balance.lt(amount)) throw new AppError("INSUFFICIENT_WALLET_BALANCE", "Agent wallet balance is insufficient.", 409);
      const nextBalance = wallet.balance.minus(amount);
      const updated = await tx.walletAccount.updateMany({ where: { id: wallet.id, version: wallet.version }, data: { balance: nextBalance, version: { increment: 1 } } }); if (updated.count !== 1) throw new AppError("WALLET_CONFLICT", "Wallet changed while posting. Retry safely.", 409);
      const entryNumber = await allocateSequence(tx, { companyId: access.companyId, stationId: payload.stationId, documentType: "WALLET_ENTRY", prefix: "WLT", includeDate: true, padding: 6 });
      await tx.walletEntry.create({ data: { companyId: access.companyId, stationId: payload.stationId, walletAccountId: wallet.id, paymentMethodId: method.id, entryNumber, type: "SALE_DEBIT", amount: amount.negated(), balanceAfter: nextBalance, referenceType: "Sale", referenceId: sale.id, postedById: access.userId, createdAt: saleDate } });

      if (wallet.agent && wallet.agent.creditLimit && nextBalance.lt(wallet.agent.creditLimit)) {
        await dispatchNotification(tx, {
          companyId: access.companyId,
          stationId: payload.stationId,
          targetRoles: ["SUPER_ADMIN", "ADMIN", "FINANCE", "STATION_MANAGER"],
          type: "WALLET_ALERT",
          severity: "WARNING",
          title: "Low Agent Wallet Balance",
          message: `Agent ${wallet.agent.name} has fallen below their credit limit. Current balance: ${nextBalance.toString()}`,
          entityType: "Agent",
          entityId: wallet.agent.id,
        });
      }
    }
    const account = await tx.financialAccount.findFirst({ where: { companyId: access.companyId, paymentMethodId: method.id, isActive: true } });
    if (!account) throw new AppError("FINANCE_NOT_CONFIGURED", `No financial account is configured for ${method.name}.`, 500);
    const entryNumber = await allocateSequence(tx, { companyId: access.companyId, stationId: payload.stationId, businessUnitId: payload.businessUnitId, documentType: "CASHBOOK", prefix: "CB", includeDate: true, padding: 6 });
    await tx.cashbookEntry.create({ data: { companyId: access.companyId, stationId: payload.stationId, businessUnitId: payload.businessUnitId, accountId: account.id, categoryId: salesCategory!.id, paymentMethodId: method.id, entryNumber, direction: "CREDIT", amount: payment.amount, description: `Sale ${saleNumber}`, sourceType: "Payment", sourceId: payment.id, externalReference: payment.reference, status: "POSTED", postedById: access.userId, postedAt: saleDate } });
  }
  if (outstanding.isPositive()) await tx.outstandingPayment.create({ data: { saleId: sale.id, original: outstanding, outstanding } });
  await enqueueOutbox(tx, { companyId: access.companyId, aggregateType: "Sale", aggregateId: sale.id, eventType: "sale.posted", payload: { saleNumber, stationId: payload.stationId, customerId: payload.customerId, total: total.toString() } });
  await writeAudit(tx, { companyId: access.companyId, actorId: access.userId, stationId: payload.stationId, businessUnitId: payload.businessUnitId, action: "sale.posted", entityType: "Sale", entityId: sale.id, requestId, after: sale });
  
  if (total.gte(500_000)) {
    await dispatchNotification(tx, {
      companyId: access.companyId,
      stationId: payload.stationId,
      targetRoles: ["SUPER_ADMIN", "ADMIN", "FINANCE", "STATION_MANAGER"],
      type: "FINANCE_ALERT",
      title: "Large Sale Processed",
      message: `A large sale of ${total.toString()} was posted.`,
      entityType: "Sale",
      entityId: sale.id,
    });
  }

  const result = { id: sale.id, saleNumber, total: total.toString(), paid: paidTotal.toString(), outstanding: outstanding.toString(), status: sale.status };
  await completeIdempotency(tx, claim.id, 201, result);
  return { replayed: false, result };
}
