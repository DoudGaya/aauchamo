import { requireAccess, requirePermission } from "@/lib/server/access";
import { apiFailure, requestIdFrom } from "@/lib/server/api";
import { dashboardFilters, stationFilter } from "@/lib/server/dashboard";
import { db } from "@/lib/server/db";
import { PostingStatus } from "@/lib/generated/prisma/client";

const csv = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;

function buildCsvResponse(headers: string[], rows: string[][], filename: string, requestId: string) {
  const body = [headers.join(","), ...rows.map((r) => r.map(csv).join(","))].join("\r\n");
  return new Response(body, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
      "x-request-id": requestId,
    },
  });
}

function buildJsonResponse(headers: string[], rows: string[][], requestId: string) {
  const data = rows.map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i]])));
  return Response.json(
    { ok: true, data, meta: { count: data.length } },
    { headers: { "x-request-id": requestId } }
  );
}

export async function GET(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "reports.view");
    const filters = dashboardFilters(request, access);
    const url = new URL(request.url);
    const reportKey = url.searchParams.get("report") ?? "consolidated_sales";
    const format = url.searchParams.get("format") ?? "csv";
    const stationIdParam = url.searchParams.get("stationId") ?? undefined;
    const today = new Date().toISOString().slice(0, 10);

    const scopedStation = stationIdParam
      ? [stationIdParam]
      : filters.stationIds ? [...filters.stationIds] : undefined;

    const scoped = {
      companyId: access.companyId,
      ...stationFilter(scopedStation),
    };

    const dateRange = { gte: filters.start, lte: filters.end };

    let headers: string[] = [];
    let csvRows: string[][] = [];
    let filename = `report-${today}.csv`;

    // ── SALES ────────────────────────────────────────────────────────────

    if (reportKey === "consolidated_sales") {
      const rows = await db.sale.findMany({
        where: { ...scoped, postedAt: dateRange },
        include: {
          station: { select: { code: true } },
          businessUnit: { select: { code: true } },
          customer: { select: { customerNumber: true, displayName: true } },
        },
        orderBy: { postedAt: "desc" },
        take: 50_000,
      });
      headers = ["saleNumber", "postedAt", "station", "businessUnit", "customerNumber", "customer", "subtotal", "tax", "discount", "total", "paid", "outstanding", "status"];
      csvRows = rows.map((r) => [
        r.saleNumber, r.postedAt?.toISOString() ?? "",
        r.station.code, r.businessUnit?.code ?? "",
        r.customer?.customerNumber ?? "", r.customer?.displayName ?? "",
        String(r.subtotal), String(r.taxTotal), String(r.discountTotal),
        String(r.total), String(r.paidTotal), String(r.outstandingTotal), r.status,
      ]);
      filename = `consolidated-sales-${today}.csv`;

    } else if (reportKey === "station_sales_breakdown") {
      const rows = await db.sale.groupBy({
        by: ["stationId"],
        where: { companyId: access.companyId, postedAt: dateRange, status: { in: ["POSTED", "PARTIALLY_PAID", "PAID"] } },
        _sum: { total: true, paidTotal: true, outstandingTotal: true },
        _count: true,
      });
      const stations = await db.station.findMany({
        where: { companyId: access.companyId },
        select: { id: true, code: true, name: true },
      });
      const stMap = Object.fromEntries(stations.map((s) => [s.id, s]));
      headers = ["station", "stationName", "saleCount", "totalRevenue", "totalCollected", "totalOutstanding"];
      csvRows = rows.map((r) => [
        stMap[r.stationId]?.code ?? r.stationId,
        stMap[r.stationId]?.name ?? "",
        String(r._count),
        String(r._sum.total ?? 0), String(r._sum.paidTotal ?? 0), String(r._sum.outstandingTotal ?? 0),
      ]);
      filename = `station-sales-${today}.csv`;

    } else if (reportKey === "payment_mix") {
      // Payment.paymentMethod is a relation to PaymentMethod model — use paymentMethodId scalar
      const rows = await db.paymentAllocation.findMany({
        where: { sale: { companyId: access.companyId, postedAt: dateRange } },
        include: {
          sale: { select: { stationId: true, saleNumber: true } },
          payment: { select: { paymentMethodId: true } },
        },
        take: 50_000,
      });
      headers = ["saleNumber", "stationId", "paymentMethodId", "amount"];
      csvRows = rows.map((r) => [
        r.sale.saleNumber, r.sale.stationId,
        r.payment?.paymentMethodId ?? "", String(r.amount),
      ]);
      filename = `payment-mix-${today}.csv`;

    } else if (reportKey === "refunds_cancellations") {
      // Refund: has station, sale, customer relations. No officer relation - use requestedById scalar.
      const rows = await db.refund.findMany({
        where: { companyId: access.companyId, postedAt: { not: null } },
        include: {
          sale: { select: { saleNumber: true } },
          station: { select: { code: true } },
          customer: { select: { displayName: true } },
        },
        orderBy: { postedAt: "desc" },
        take: 50_000,
      });
      headers = ["postedAt", "station", "saleNumber", "refundNumber", "customerName", "amount", "reason", "status"];
      csvRows = rows.map((r) => [
        r.postedAt?.toISOString() ?? "", r.station.code,
        r.sale?.saleNumber ?? "", r.refundNumber,
        r.customer?.displayName ?? "",
        String(r.amount), r.reason, r.status,
      ]);
      filename = `refunds-cancellations-${today}.csv`;

    } else if (reportKey === "outstanding_balances") {
      // OutstandingPayment has no direct customer relation — join via sale
      const rows = await db.outstandingPayment.findMany({
        where: { outstanding: { gt: 0 } },
        include: {
          sale: {
            include: {
              station: { select: { code: true } },
              customer: { select: { customerNumber: true, displayName: true, primaryPhone: true } },
            },
          },
        },
        orderBy: { dueAt: "asc" },
        take: 50_000,
      });
      // Filter by company via sale
      const filtered = rows.filter((r) => r.sale.companyId === access.companyId &&
        (!stationIdParam || r.sale.stationId === stationIdParam));
      headers = ["saleNumber", "postedAt", "station", "customerNumber", "customer", "phone", "outstanding", "daysOverdue"];
      csvRows = filtered.map((r) => {
        const posted = r.sale.postedAt ? new Date(r.sale.postedAt) : null;
        const days = posted ? Math.floor((Date.now() - posted.getTime()) / 86400000) : 0;
        return [
          r.sale.saleNumber, r.sale.postedAt?.toISOString() ?? "",
          r.sale.station.code,
          r.sale.customer?.customerNumber ?? "", r.sale.customer?.displayName ?? "",
          r.sale.customer?.primaryPhone ?? "",
          String(r.outstanding), String(days),
        ];
      });
      filename = `outstanding-balances-${today}.csv`;

    // ── INVENTORY ────────────────────────────────────────────────────────

    } else if (reportKey === "stock_valuation") {
      // InventoryBalance has no companyId — filter via station relation
      const rows = await db.inventoryBalance.findMany({
        where: {
          station: { companyId: access.companyId },
          ...(stationIdParam ? { stationId: stationIdParam } : {}),
        },
        include: {
          station: { select: { code: true } },
          product: { include: { category: { select: { name: true } }, unit: { select: { code: true } } } },
          batch: { select: { expiresAt: true } },
        },
        orderBy: { product: { name: "asc" } },
        take: 50_000,
      });
      headers = ["productCode", "productName", "station", "category", "unit", "quantity", "purchasePrice", "sellingPrice", "stockValue", "expiryDate"];
      csvRows = rows.map((r) => [
        r.product.code, r.product.name, r.station.code,
        r.product.category.name, r.product.unit.code,
        String(r.quantity), String(r.product.purchasePrice), String(r.product.sellingPrice),
        String(Number(r.quantity) * Number(r.product.purchasePrice)),
        r.batch?.expiresAt?.toISOString().slice(0, 10) ?? "",
      ]);
      filename = `stock-valuation-${today}.csv`;

    } else if (reportKey === "stock_movement_log") {
      // StockMovement has station, product relations but NO officer relation
      const rows = await db.stockMovement.findMany({
        where: { ...scoped, occurredAt: dateRange },
        include: {
          product: { select: { code: true, name: true } },
          station: { select: { code: true } },
        },
        orderBy: { occurredAt: "desc" },
        take: 50_000,
      });
      // Fetch officer info separately from occurredById (User)
      headers = ["occurredAt", "station", "productCode", "productName", "movementType", "quantityDelta", "referenceType", "referenceId", "reason"];
      csvRows = rows.map((r) => [
        r.occurredAt.toISOString(),
        r.station?.code ?? r.stationId,
        r.product.code, r.product.name,
        r.movementType, String(r.quantityDelta),
        r.referenceType, r.referenceId,
        r.reason ?? "",
      ]);
      filename = `stock-movement-${today}.csv`;

    } else if (reportKey === "low_stock_alert") {
      // InventoryBalance has no companyId — filter via station relation
      const rows = await db.inventoryBalance.findMany({
        where: {
          station: { companyId: access.companyId },
          ...(stationIdParam ? { stationId: stationIdParam } : {}),
        },
        include: {
          product: {
            include: { category: { select: { name: true } }, unit: { select: { code: true } } },
          },
          station: { select: { code: true } },
        },
        take: 10_000,
      });
      // Filter in memory: quantity <= reorderLevel
      const lowStock = rows.filter((r) => Number(r.product.reorderLevel) > 0 && Number(r.quantity) <= Number(r.product.reorderLevel));
      headers = ["station", "productCode", "productName", "category", "unit", "currentQty", "reorderLevel"];
      csvRows = lowStock.map((r) => [
        r.station.code, r.product.code, r.product.name,
        r.product.category.name, r.product.unit.code,
        String(r.quantity), String(r.product.reorderLevel),
      ]);
      filename = `low-stock-alert-${today}.csv`;

    } else if (reportKey === "purchase_history") {
      // PurchaseOrder has `lines` as PurchaseOrderLine[], station, supplier relations
      const rows = await db.purchaseOrder.findMany({
        where: { companyId: access.companyId, createdAt: dateRange },
        include: {
          station: { select: { code: true } },
          supplier: { select: { name: true } },
          lines: {
            include: { product: { select: { code: true, name: true } } },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 50_000,
      });
      headers = ["createdAt", "orderNumber", "station", "supplier", "status", "productCode", "productName", "quantityOrdered", "unitCost", "lineTotal"];
      csvRows = rows.flatMap((r) =>
        r.lines.map((line) => [
          r.createdAt.toISOString(), r.orderNumber, r.station.code,
          r.supplier?.name ?? "", r.status,
          line.product.code, line.product.name,
          String(line.quantityOrdered), String(line.unitCost), String(line.lineTotal),
        ])
      );
      filename = `purchase-history-${today}.csv`;

    // ── CARGO ────────────────────────────────────────────────────────────

    } else if (reportKey === "cargo_manifest") {
      // CargoShipment has station, customer relations. origin/destination are direct fields.
      const rows = await db.cargoShipment.findMany({
        where: { ...scoped, createdAt: dateRange },
        include: {
          station: { select: { code: true } },
          customer: { select: { customerNumber: true, displayName: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50_000,
      });
      headers = ["awbNumber", "createdAt", "station", "origin", "destination", "customerNumber", "customer", "weightKg", "pieces", "status"];
      csvRows = rows.map((r) => [
        r.awbNumber, r.createdAt.toISOString(), r.station.code,
        r.origin, r.destination,
        r.customer?.customerNumber ?? "", r.customer?.displayName ?? "",
        String(r.weightKg), String(r.pieces), r.status,
      ]);
      filename = `cargo-manifest-${today}.csv`;

    // ── FINANCE ──────────────────────────────────────────────────────────

    } else if (reportKey === "cashbook_ledger") {
      if (!access.permissions.has("reports.view_financial")) {
        return new Response("Forbidden", { status: 403 });
      }
      // CashbookEntry relations: station, account (FinancialAccount), category (FinancialCategory)
      // NO officer relation — poster is postedById (User FK only, no include)
      const rows = await db.cashbookEntry.findMany({
        where: { ...scoped, createdAt: dateRange, status: { in: ["POSTED", "RECONCILED"] as PostingStatus[] } },
        include: {
          station: { select: { code: true } },
          category: { select: { name: true } },
          account: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50_000,
      });
      headers = ["createdAt", "station", "entryNumber", "direction", "category", "account", "description", "amount", "status", "postedById"];
      csvRows = rows.map((r) => [
        r.createdAt.toISOString(), r.station.code, r.entryNumber,
        r.direction, r.category.name, r.account.name,
        r.description, String(r.amount), r.status, r.postedById,
      ]);
      filename = `cashbook-ledger-${today}.csv`;

    } else if (reportKey === "income_expense") {
      if (!access.permissions.has("reports.view_financial")) {
        return new Response("Forbidden", { status: 403 });
      }
      const rows = await db.cashbookEntry.groupBy({
        by: ["direction", "stationId"],
        where: { companyId: access.companyId, createdAt: dateRange, status: { in: ["POSTED", "RECONCILED"] as PostingStatus[] } },
        _sum: { amount: true },
        _count: true,
      });
      const stations = await db.station.findMany({
        where: { companyId: access.companyId },
        select: { id: true, code: true },
      });
      const stMap = Object.fromEntries(stations.map((s) => [s.id, s.code]));
      headers = ["station", "direction", "count", "total"];
      csvRows = rows.map((r) => [
        stMap[r.stationId] ?? r.stationId, r.direction,
        String(r._count), String(r._sum.amount ?? 0),
      ]);
      filename = `income-expense-${today}.csv`;

    } else if (reportKey === "station_profitability") {
      if (!access.permissions.has("reports.view_financial")) {
        return new Response("Forbidden", { status: 403 });
      }
      const rows = await db.cashbookEntry.findMany({
        where: { ...scoped, createdAt: dateRange, status: { in: ["POSTED", "RECONCILED"] as PostingStatus[] } },
        include: {
          station: { select: { code: true } },
          category: { select: { name: true } },
          account: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50_000,
      });
      headers = ["createdAt", "station", "entryNumber", "direction", "category", "account", "description", "amount"];
      csvRows = rows.map((r) => [
        r.createdAt.toISOString(), r.station.code, r.entryNumber,
        r.direction, r.category.name, r.account.name, r.description, String(r.amount),
      ]);
      filename = `station-profitability-${today}.csv`;

    } else if (reportKey === "agent_wallet_reconciliation") {
      if (!access.permissions.has("reports.view_financial")) {
        return new Response("Forbidden", { status: 403 });
      }
      const rows = await db.walletEntry.findMany({
        where: {
          walletAccount: {
            agent: {
              companyId: access.companyId,
              ...(stationIdParam ? { homeStationId: stationIdParam } : {}),
            },
          },
          postedAt: dateRange,
        },
        include: {
          walletAccount: {
            include: {
              agent: { select: { agentNumber: true, name: true, homeStation: { select: { code: true } } } },
            },
          },
        },
        orderBy: { postedAt: "desc" },
        take: 50_000,
      });
      headers = ["postedAt", "agentNumber", "name", "station", "type", "description", "amount", "balanceAfter"];
      csvRows = rows.map((r) => [
        r.postedAt.toISOString(),
        r.walletAccount.agent.agentNumber,
        r.walletAccount.agent.name ?? "",
        r.walletAccount.agent.homeStation.code,
        r.type, r.reason ?? "", String(r.amount), String(r.balanceAfter),
      ]);
      filename = `agent-wallet-reconciliation-${today}.csv`;

    // ── STAFF ────────────────────────────────────────────────────────────

    } else if (reportKey === "staff_directory") {
      // Model is `Staff` not `Employee`
      const rows = await db.staff.findMany({
        where: { companyId: access.companyId, status: "ACTIVE" },
        include: {
          homeStation: { select: { code: true, name: true } },
          user: { select: { email: true } },
          department: { select: { name: true } },
          position: { select: { name: true } }, // Position has `name` not `title`
        },
        orderBy: { lastName: "asc" },
        take: 10_000,
      });
      headers = ["staffNumber", "firstName", "lastName", "email", "phone", "station", "employmentType", "department", "position", "employmentDate"];
      csvRows = rows.map((r) => [
        r.staffNumber, r.firstName, r.lastName,
        r.user?.email ?? r.email ?? "", r.phone ?? "",
        r.homeStation?.code ?? "", r.employmentType,
        r.department?.name ?? "", r.position?.name ?? "",
        r.employmentDate?.toISOString().slice(0, 10) ?? "",
      ]);
      filename = `staff-directory-${today}.csv`;

    } else if (reportKey === "user_activity") {
      const rows = await db.auditEvent.findMany({
        where: { companyId: access.companyId, occurredAt: dateRange, action: { startsWith: "auth." } },
        include: {
          actor: { select: { email: true } },
          station: { select: { code: true } },
        },
        orderBy: { occurredAt: "desc" },
        take: 50_000,
      });
      headers = ["occurredAt", "station", "actorEmail", "action", "ipAddress", "userAgent"];
      csvRows = rows.map((r) => [
        r.occurredAt.toISOString(), r.station?.code ?? "",
        r.actor?.email ?? "System", r.action,
        r.ipAddress ?? "", r.userAgent ?? "",
      ]);
      filename = `user-activity-${today}.csv`;

    // ── AUDIT ────────────────────────────────────────────────────────────

    } else if (reportKey === "audit_access_review") {
      const rows = await db.auditEvent.findMany({
        where: { companyId: access.companyId, occurredAt: dateRange },
        include: {
          actor: { select: { email: true } },
          station: { select: { code: true } },
        },
        orderBy: { occurredAt: "desc" },
        take: 50_000,
      });
      headers = ["occurredAt", "station", "actorEmail", "action", "entityType", "ipAddress", "userAgent"];
      csvRows = rows.map((r) => [
        r.occurredAt.toISOString(), r.station?.code ?? "",
        r.actor?.email ?? "System", r.action, r.entityType,
        r.ipAddress ?? "", r.userAgent ?? "",
      ]);
      filename = `audit-access-review-${today}.csv`;

    } else if (reportKey === "customer_transaction_history") {
      const rows = await db.customer.findMany({
        where: {
          companyId: access.companyId,
          ...(stationIdParam ? { homeStationId: stationIdParam } : {}),
        },
        include: {
          homeStation: { select: { code: true } },
          _count: { select: { sales: true, cargoShipments: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50_000,
      });
      headers = ["customerNumber", "station", "type", "displayName", "primaryPhone", "primaryEmail", "salesCount", "cargoCount"];
      csvRows = rows.map((r) => [
        r.customerNumber, r.homeStation.code, r.type, r.displayName,
        r.primaryPhone, r.primaryEmail ?? "",
        String(r._count.sales), String(r._count.cargoShipments),
      ]);
      filename = `customer-history-${today}.csv`;

    } else {
      return new Response(
        JSON.stringify({ ok: false, error: { message: `Unknown report type: ${reportKey}` } }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    if (format === "json") {
      return buildJsonResponse(headers, csvRows, requestId);
    }
    return buildCsvResponse(headers, csvRows, filename, requestId);

  } catch (error) {
    return apiFailure(error, requestId);
  }
}
