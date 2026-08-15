import { requireAccess, requirePermission } from "@/lib/server/access";
import { apiFailure, requestIdFrom } from "@/lib/server/api";
import { dashboardFilters, stationFilter } from "@/lib/server/dashboard";
import { db } from "@/lib/server/db";

const csv = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;

export async function GET(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "reports.export");
    const filters = dashboardFilters(request, access);
    const url = new URL(request.url);
    const reportType = url.searchParams.get("report") || "Consolidated sales performance";
    
    let headers: string[] = [];
    let csvRows: string[][] = [];
    let filename = `export-${new Date().toISOString().slice(0, 10)}.csv`;

    const scoped = { companyId: access.companyId, ...stationFilter(filters.stationIds) };

    if (reportType === "Consolidated sales performance") {
      const rows = await db.sale.findMany({
        where: { ...scoped, postedAt: { gte: filters.start, lte: filters.end } },
        include: {
          station: { select: { code: true, name: true } },
          businessUnit: { select: { code: true, name: true } },
          customer: { select: { customerNumber: true, displayName: true } },
        },
        orderBy: { postedAt: "desc" },
        take: 50_000,
      });
      headers = ["saleNumber", "postedAt", "station", "businessUnit", "customerNumber", "customer", "total", "paid", "outstanding", "status"];
      csvRows = rows.map((row) => [
        row.saleNumber,
        row.postedAt?.toISOString() ?? "",
        row.station.code,
        row.businessUnit?.code ?? "",
        row.customer?.customerNumber ?? "",
        row.customer?.displayName ?? "",
        String(row.total),
        String(row.paidTotal),
        String(row.outstandingTotal),
        row.status,
      ]);
      filename = `sales-report-${new Date().toISOString().slice(0, 10)}.csv`;
    } else if (reportType === "Stock valuation & movement") {
      const rows = await db.inventoryBalance.findMany({
        where: scoped,
        include: {
          station: { select: { code: true, name: true } },
          product: { include: { category: { select: { name: true } }, unit: { select: { code: true } } } },
          batch: { select: { expiresAt: true } }
        },
        orderBy: { product: { name: "asc" } },
        take: 50_000,
      });
      headers = ["productCode", "productName", "station", "category", "unit", "quantity", "purchasePrice", "sellingPrice", "stockValue", "expiryDate"];
      csvRows = rows.map((row) => [
        row.product.code,
        row.product.name,
        row.station.code,
        row.product.category.name,
        row.product.unit.code,
        String(row.quantity),
        String(row.product.purchasePrice),
        String(row.product.sellingPrice),
        String(Number(row.quantity) * Number(row.product.purchasePrice)),
        row.batch?.expiresAt?.toISOString().slice(0, 10) ?? "",
      ]);
      filename = `inventory-report-${new Date().toISOString().slice(0, 10)}.csv`;
    } else if (reportType === "Agent wallet reconciliation") {
      const rows = await db.walletEntry.findMany({
        where: { walletAccount: { agent: { companyId: scoped.companyId, homeStationId: scoped.stationId } }, postedAt: { gte: filters.start, lte: filters.end } },
        include: {
          walletAccount: { include: { agent: { select: { agentNumber: true, name: true, homeStation: { select: { code: true } } } } } }
        },
        orderBy: { postedAt: "desc" },
        take: 50_000,
      });
      headers = ["postedAt", "agentNumber", "name", "station", "type", "description", "amount", "balanceAfter"];
      csvRows = rows.map((row) => [
        row.postedAt.toISOString(),
        row.walletAccount.agent.agentNumber,
        row.walletAccount.agent.name ?? "",
        row.walletAccount.agent.homeStation.code,
        row.type,
        row.reason ?? "",
        String(row.amount),
        String(row.balanceAfter),
      ]);
      filename = `wallet-reconciliation-${new Date().toISOString().slice(0, 10)}.csv`;
    } else if (reportType === "Station profitability") {
      const rows = await db.cashbookEntry.findMany({
        where: { ...scoped, createdAt: { gte: filters.start, lte: filters.end }, status: "POSTED" },
        include: {
          station: { select: { code: true, name: true } },
          category: { select: { name: true } },
          account: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50_000,
      });
      headers = ["createdAt", "station", "entryNumber", "direction", "category", "account", "description", "amount"];
      csvRows = rows.map((row) => [
        row.createdAt.toISOString(),
        row.station.code,
        row.entryNumber,
        row.direction,
        row.category.name,
        row.account.name,
        row.description,
        String(row.amount),
      ]);
      filename = `finance-report-${new Date().toISOString().slice(0, 10)}.csv`;
    } else if (reportType === "Audit access review") {
      const rows = await db.auditEvent.findMany({
        where: { ...scoped, occurredAt: { gte: filters.start, lte: filters.end } },
        include: {
          actor: { select: { email: true } },
          station: { select: { code: true } },
        },
        orderBy: { occurredAt: "desc" },
        take: 50_000,
      });
      headers = ["occurredAt", "station", "actorEmail", "action", "entityType", "ipAddress", "userAgent"];
      csvRows = rows.map((row) => [
        row.occurredAt.toISOString(),
        row.station?.code ?? "",
        row.actor?.email ?? "System",
        row.action,
        row.entityType,
        row.ipAddress ?? "",
        row.userAgent ?? "",
      ]);
      filename = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    } else if (reportType === "Customer transaction history") {
      const rows = await db.customer.findMany({
        where: { companyId: scoped.companyId, homeStationId: scoped.stationId, createdAt: { lte: filters.end } },
        include: {
          homeStation: { select: { code: true } },
          _count: { select: { sales: true, cargoShipments: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50_000,
      });
      headers = ["customerNumber", "station", "type", "displayName", "primaryPhone", "primaryEmail", "salesCount", "cargoCount"];
      csvRows = rows.map((row) => [
        row.customerNumber,
        row.homeStation.code,
        row.type,
        row.displayName,
        row.primaryPhone,
        row.primaryEmail ?? "",
        String(row._count.sales),
        String(row._count.cargoShipments),
      ]);
      filename = `customer-history-${new Date().toISOString().slice(0, 10)}.csv`;
    } else {
      return new Response("Unknown report type", { status: 400 });
    }

    const body = [
      headers.join(","),
      ...csvRows.map((row) => row.map(csv).join(","))
    ].join("\r\n");

    return new Response(body, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="${filename}"`,
        "x-request-id": requestId,
      },
    });
  } catch (error) {
    return apiFailure(error, requestId);
  }
}
