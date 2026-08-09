import "server-only";

import { Prisma } from "@/lib/generated/prisma/client";
import { AppError } from "@/lib/server/api";
import { applyStockMovement } from "@/lib/server/inventory";
import { allocateSequence } from "@/lib/server/sequence";

export async function postRefund(tx: Prisma.TransactionClient, refundId: string, actorId: string) {
  const refund = await tx.refund.findUniqueOrThrow({ where: { id: refundId }, include: { lines: { include: { saleLine: true } }, sale: true, paymentMethod: true } });
  if (refund.status === "POSTED") return refund;
  if (refund.status !== "PENDING_APPROVAL") throw new AppError("REFUND_NOT_POSTABLE", "Refund is no longer available for posting.", 409);
  for (const line of refund.lines) {
    const latest = await tx.saleLine.findUniqueOrThrow({ where: { id: line.saleLineId } });
    if (latest.quantityRefunded.plus(line.quantity).gt(latest.quantity)) throw new AppError("REFUND_QUANTITY_CONFLICT", "A sale line was refunded concurrently.", 409);
    await tx.saleLine.update({ where: { id: latest.id }, data: { quantityRefunded: { increment: line.quantity } } });
    if (refund.returnToStock) await applyStockMovement(tx, { companyId: refund.companyId, stationId: refund.stationId, productId: line.productId, movementType: "SALE_RETURN", quantityDelta: line.quantity, referenceType: "Refund", referenceId: refund.id, reason: refund.reason, occurredById: actorId, unitCost: line.saleLine.costPrice });
  }
  const [account, category] = await Promise.all([tx.financialAccount.findFirst({ where: { companyId: refund.companyId, paymentMethodId: refund.paymentMethodId, isActive: true } }), tx.financialCategory.findFirst({ where: { companyId: refund.companyId, code: "REFUND", type: "DEBIT", isActive: true } })]);
  if (!account || !category) throw new AppError("FINANCE_NOT_CONFIGURED", "Refund finance mapping is not configured.", 500);
  const entryNumber = await allocateSequence(tx, { companyId: refund.companyId, stationId: refund.stationId, businessUnitId: refund.sale.businessUnitId, documentType: "CASHBOOK", prefix: "CB", includeDate: true, padding: 6 });
  await tx.cashbookEntry.create({ data: { companyId: refund.companyId, stationId: refund.stationId, businessUnitId: refund.sale.businessUnitId, accountId: account.id, categoryId: category.id, paymentMethodId: refund.paymentMethodId, entryNumber, direction: "DEBIT", amount: refund.amount, description: `Refund ${refund.refundNumber} for ${refund.sale.saleNumber}`, sourceType: "Refund", sourceId: refund.id, externalReference: refund.paymentReference, status: "POSTED", postedById: actorId, postedAt: new Date() } });
  const postedRefunds = await tx.refund.aggregate({ where: { saleId: refund.saleId, OR: [{ status: "POSTED" }, { id: refund.id }] }, _sum: { amount: true } });
  const refunded = postedRefunds._sum.amount ?? new Prisma.Decimal(0); const saleStatus = refunded.gte(refund.sale.total) ? "REFUNDED" : "PARTIALLY_REFUNDED";
  await tx.sale.update({ where: { id: refund.saleId }, data: { status: saleStatus, version: { increment: 1 } } });
  return tx.refund.update({ where: { id: refund.id }, data: { status: "POSTED", approvedById: actorId, postedAt: new Date() }, include: { lines: true } });
}
