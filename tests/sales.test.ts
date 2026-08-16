import "dotenv/config";
import { vi, describe, it, expect, beforeAll, afterEach } from "vitest";
vi.mock("@/auth", () => ({
  auth: vi.fn(),
  handlers: { GET: vi.fn(), POST: vi.fn() },
}));
import { db } from "@/lib/server/db";
import { GET as getSummary } from "@/app/api/sales/summary/route";
import { GET as getTrend } from "@/app/api/sales/trend/route";
import { GET as getExport } from "@/app/api/sales/export/route";
import * as accessModule from "@/lib/server/access";



describe("Sales & Revenue Management Integration Tests (Module 09)", () => {
  let companyId: string;
  let stationId: string;
  let userId: string;
  let customerId: string;
  let businessUnitId: string;
  let testSaleId: string;

  function mockAccessContext(actorId: string, permissions: string[] = ["sales.view"]) {
    return {
      userId: actorId,
      companyId,
      sessionId: "test-session-123",
      name: "Test User",
      email: "test@user.local",
      username: "testuser",
      roleNames: ["OPERATOR"],
      permissions: new Set(permissions),
      stationIds: new Set([stationId]),
      operatingStationIds: new Set([stationId]),
      businessUnitIds: new Set([businessUnitId]),
      companyWide: true,
    };
  }

  beforeAll(async () => {
    // 1. Setup company
    const company = await db.company.findFirstOrThrow({ where: { code: "AAU-CHAMO" } });
    companyId = company.id;

    // 2. Setup station
    const station = await db.station.findFirst({ where: { companyId, status: "ACTIVE" } });
    if (!station) throw new Error("Seed missing active station.");
    stationId = station.id;

    // 3. Find super admin user
    const admin = await db.user.findFirst({ where: { companyId, email: "admin@aauchamo.local" } });
    if (!admin) throw new Error("Seed missing admin user.");
    userId = admin.id;

    // 4. Create unique test customer
    const phone = `+23480${Math.floor(1000000 + Math.random() * 9000000)}`;
    const customer = await db.customer.create({
      data: {
        companyId,
        homeStationId: stationId,
        customerNumber: `TCUST-${Math.random().toString(36).slice(2, 9).toUpperCase()}`,
        firstName: "Sales",
        lastName: "TestCustomer",
        displayName: "Sales TestCustomer",
        primaryPhone: phone,
        normalizedPhone: phone,
        type: "INDIVIDUAL",
        defaultAirline: "TestAir",
      },
    });
    customerId = customer.id;

    // 5. Find business unit
    const bu = await db.businessUnit.findFirst({ where: { companyId } });
    if (!bu) throw new Error("Seed missing business unit.");
    businessUnitId = bu.id;

    const product = await db.product.findFirst({ where: { companyId } });
    if (!product) throw new Error("Seed missing product.");
    const productId = product.id;

    // 6. Create a test sale
    const sale = await db.sale.create({
      data: {
        companyId,
        stationId,
        businessUnitId,
        customerId,
        saleNumber: `TSAL-${Math.random().toString(36).slice(2, 9).toUpperCase()}`,
        status: "PAID",
        subtotal: "10000.00",
        taxTotal: "750.00",
        discountTotal: "500.00",
        total: "10250.00",
        paidTotal: "10250.00",
        outstandingTotal: "0.00",
        officerId: userId,
        postedAt: new Date(),
        lines: {
          create: [
            {
              productId,
              productCode: product.code,
              productName: product.name,
              unitCode: "PCS",
              quantity: "2.000",
              unitPrice: "5000.00",
              costPrice: "3000.00",
              taxRate: "7.5000",
              taxAmount: "750.00",
              discountAmount: "500.00",
              lineTotal: "10250.00",
            },
          ],
        },
      },
    });
    testSaleId = sale.id;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return detailed sales summary and respect profit permissions", async () => {
    // A. Verify summary query without sales.view_profit (should hide cost/profit)
    const accessWithoutProfit = mockAccessContext(userId, ["sales.view"]);
    vi.spyOn(accessModule, "requireAccess").mockResolvedValue(accessWithoutProfit as any);
    vi.spyOn(accessModule, "requirePermission").mockImplementation((ctx, perm) => ctx as any);

    const req1 = new Request(`http://localhost/api/sales/summary?customerId=${customerId}`);
    const res1 = await getSummary(req1);
    const body1 = await res1.json();

    expect(res1.status).toBe(200);
    expect(body1.ok).toBe(true);
    expect(body1.data.summary.grossSales).toBe(10000);
    expect(body1.data.summary.discounts).toBe(500);
    expect(body1.data.summary.tax).toBe(750);
    expect(body1.data.summary.netSales).toBe(10250);
    expect(body1.data.summary.profit).toBeNull(); // profit should be hidden

    // B. Verify summary query WITH sales.view_profit (should show cost/profit)
    const accessWithProfit = mockAccessContext(userId, ["sales.view", "sales.view_profit"]);
    vi.spyOn(accessModule, "requireAccess").mockResolvedValue(accessWithProfit as any);

    const req2 = new Request(`http://localhost/api/sales/summary?customerId=${customerId}`);
    const res2 = await getSummary(req2);
    const body2 = await res2.json();

    expect(res2.status).toBe(200);
    expect(body2.ok).toBe(true);
    expect(body2.data.summary.profit).toBe(4250); // profit: netSales (10250) - cost (2 * 3000 = 6000) = 4250
    expect(body2.data.byStation.length).toBeGreaterThan(0);
    expect(body2.data.byStation[0].profit).toBe(4250);
  }, 90000);

  it("should calculate trend lines and comparative periods", async () => {
    const access = mockAccessContext(userId, ["sales.view"]);
    vi.spyOn(accessModule, "requireAccess").mockResolvedValue(access as any);
    vi.spyOn(accessModule, "requirePermission").mockImplementation((ctx, perm) => ctx as any);

    const todayStr = new Date().toISOString().slice(0, 10);
    const req = new Request(`http://localhost/api/sales/trend?interval=daily&startDate=${todayStr}&compareStartDate=${todayStr}&customerId=${customerId}`);
    const res = await getTrend(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.trend.length).toBeGreaterThan(0);
    expect(body.data.compareTrend.length).toBeGreaterThan(0);
  }, 90000);

  it("should generate sales export CSV and format profit columns based on permissions", async () => {
    // A. Export without profit permission
    const accessWithoutProfit = mockAccessContext(userId, ["sales.view"]);
    vi.spyOn(accessModule, "requireAccess").mockResolvedValue(accessWithoutProfit as any);
    vi.spyOn(accessModule, "requirePermission").mockImplementation((ctx, perm) => ctx as any);

    const req1 = new Request(`http://localhost/api/sales/export?customerId=${customerId}`);
    const res1 = await getExport(req1);
    const csv1 = await res1.text();

    expect(res1.status).toBe(200);
    expect(res1.headers.get("content-type")).toContain("text/csv");
    expect(csv1).toContain("Transaction Number");
    expect(csv1).not.toContain("Gross Profit");

    // B. Export WITH profit permission
    const accessWithProfit = mockAccessContext(userId, ["sales.view", "sales.view_profit"]);
    vi.spyOn(accessModule, "requireAccess").mockResolvedValue(accessWithProfit as any);

    const req2 = new Request(`http://localhost/api/sales/export?customerId=${customerId}`);
    const res2 = await getExport(req2);
    const csv2 = await res2.text();

    expect(res2.status).toBe(200);
    expect(csv2).toContain("Gross Profit");
    expect(csv2).toContain("4250.00"); // Cost: 6000, Total: 10250 => Profit: 4250
  }, 90000);
});
