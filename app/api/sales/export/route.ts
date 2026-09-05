import { requireAccess, requirePermission, requireStation } from "@/lib/server/access";
import { apiFailure, requestIdFrom } from "@/lib/server/api";
import { db } from "@/lib/server/db";

export async function GET(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "sales.view");
    const includeProfit = access.permissions.has("sales.view_profit");

    const url = new URL(request.url);
    const stationId = url.searchParams.get("stationId") ?? undefined;
    if (stationId) requireStation(access, stationId);
    const businessUnitId = url.searchParams.get("businessUnitId") ?? undefined;
    const officerId = url.searchParams.get("officerId") ?? undefined;
    const customerId = url.searchParams.get("customerId") ?? undefined;
    const airline = url.searchParams.get("airline") ?? undefined;

    const startDate = url.searchParams.get("startDate") ?? undefined;
    const endDate = url.searchParams.get("endDate") ?? undefined;

    const baseWhere = {
      companyId: access.companyId,
      ...(stationId ? { stationId } : access.companyWide && !access.stationIds.size ? {} : { stationId: { in: [...access.stationIds] } }),
      ...(businessUnitId ? { businessUnitId } : {}),
      ...(officerId ? { officerId } : {}),
      ...(customerId ? { customerId } : {}),
      ...(airline ? { customer: { defaultAirline: airline } } : {}),
    };

    const mainWhere: any = { ...baseWhere };
    if (startDate || endDate) {
      mainWhere.postedAt = {};
      if (startDate) mainWhere.postedAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        mainWhere.postedAt.lte = end;
      }
    }

    const sales = await db.sale.findMany({
      where: mainWhere,
      include: {
        customer: true,
        station: true,
        businessUnit: true,
        lines: true,
        allocations: {
          include: {
            payment: {
              include: {
                paymentMethod: true,
              },
            },
          },
        },
        refunds: true,
      },
      orderBy: { postedAt: "desc" },
    });

    // Generate CSV content
    const headers = [
      "Transaction Number",
      "Date",
      "Customer",
      "Station",
      "Business Unit",
      "Payment Methods",
      "Subtotal",
      "Tax",
      "Discount",
      "Total",
      "Paid",
      "Outstanding",
      "Status",
    ];

    if (includeProfit) {
      headers.push("Gross Profit");
    }

    const csvRows = [headers.map((h) => `"${h}"`).join(",")];

    for (const s of sales) {
      const dateStr = s.postedAt.toISOString();
      const customerName = s.customer.displayName;
      const stationName = s.station.name;
      const buName = s.businessUnit.name;
      const paymentMethods = s.allocations.map((a) => a.payment.paymentMethod.name).join(" + ") || "Outstanding";

      const row = [
        s.saleNumber,
        dateStr,
        customerName,
        stationName,
        buName,
        paymentMethods,
        s.subtotal.toString(),
        s.taxTotal.toString(),
        s.discountTotal.toString(),
        s.total.toString(),
        s.paidTotal.toString(),
        s.outstandingTotal.toString(),
        s.status,
      ];

      if (includeProfit) {
        let saleCost = 0;
        let saleGross = 0;
        let saleDiscount = 0;
        let saleTax = 0;

        for (const line of s.lines) {
          const qty = Number(line.quantity);
          saleGross += qty * Number(line.unitPrice);
          saleDiscount += Number(line.discountAmount);
          saleTax += Number(line.taxAmount);
          saleCost += Number(line.costPrice) * qty;
        }

        let saleRefunds = 0;
        for (const r of s.refunds) {
          if (r.status === "POSTED") saleRefunds += Number(r.amount);
        }

        const netSales = saleGross - saleDiscount + saleTax - saleRefunds;
        const profit = netSales - saleCost;
        row.push(profit.toFixed(2));
      }

      csvRows.push(row.map((val) => `"${(val ?? "").toString().replace(/"/g, '""')}"`).join(","));
    }

    const csvString = csvRows.join("\n");

    return new Response(csvString, {
      status: 200,
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="sales_export_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    // If it's an error, we return an API failure or structured response
    return new Response(JSON.stringify({ ok: false, error: { message: error instanceof Error ? error.message : "Export failed" } }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
