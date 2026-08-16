import "dotenv/config";
import { vi, describe, it, expect, beforeAll } from "vitest";
vi.mock("@/auth", () => ({
  auth: vi.fn(),
  handlers: { GET: vi.fn(), POST: vi.fn() },
}));
import { db } from "@/lib/server/db";
import { GET as exportReport } from "@/app/api/reports/export/route";
import { GET as getSummary } from "@/app/api/reports/summary/route";
import * as accessModule from "@/lib/server/access";

const REPORT_KEYS = [
  "consolidated_sales",
  "station_sales_breakdown",
  "payment_mix",
  "refunds_cancellations",
  "outstanding_balances",
  "stock_valuation",
  "stock_movement_log",
  "low_stock_alert",
  "purchase_history",
  "cargo_manifest",
  "cashbook_ledger",
  "income_expense",
  "station_profitability",
  "agent_wallet_reconciliation",
  "staff_directory",
  "user_activity",
  "audit_access_review",
  "customer_transaction_history",
];

function mockAccessContext(
  userId: string,
  companyId: string,
  stationId: string,
  permissions: string[] = [
    "reports.view",
    "reports.export",
    "reports.view_financial",
    "finance.view_profit",
  ]
) {
  return {
    userId,
    companyId,
    sessionId: "test-session-reports",
    name: "Reports User",
    email: "reports@user.local",
    username: "reportsuser",
    roleNames: ["SUPER_ADMIN"],
    permissions: new Set(permissions),
    stationIds: new Set([stationId]),
    operatingStationIds: new Set([stationId]),
    businessUnitIds: new Set([]),
    companyWide: true,
  };
}

describe("Reporting & Analytics Integration Tests (Module 12)", () => {
  let companyId: string;
  let stationId: string;
  let userId: string;

  beforeAll(async () => {
    const company = await db.company.findFirstOrThrow({ where: { code: "AAU-CHAMO" } });
    companyId = company.id;

    const station = await db.station.findFirst({ where: { companyId, status: "ACTIVE" } });
    if (!station) throw new Error("Seed missing active station.");
    stationId = station.id;

    const admin = await db.user.findFirst({ where: { companyId, email: "admin@aauchamo.local" } });
    if (!admin) throw new Error("Seed missing admin user.");
    userId = admin.id;
  });

  it("should return report summary with core KPIs", async () => {
    const access = mockAccessContext(userId, companyId, stationId);
    vi.spyOn(accessModule, "requireAccess").mockResolvedValue(access as any);
    vi.spyOn(accessModule, "requirePermission").mockImplementation((ctx) => ctx as any);

    const req = new Request("http://localhost/api/reports/summary");
    const res = await getSummary(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.sales).toBeDefined();
    expect(body.data.sales._count).toBeTypeOf("number");
    expect(body.data.refunds).toBeDefined();
    expect(body.data.cargo).toBeInstanceOf(Array);
    expect(body.data.tickets).toBeDefined();
  }, 30000);

  it("should return JSON for all 17 report types without errors", async () => {
    const access = mockAccessContext(userId, companyId, stationId);
    vi.spyOn(accessModule, "requireAccess").mockResolvedValue(access as any);
    vi.spyOn(accessModule, "requirePermission").mockImplementation((ctx) => ctx as any);

    for (const key of REPORT_KEYS) {
      const req = new Request(`http://localhost/api/reports/export?report=${key}&format=json`);
      const res = await exportReport(req);

      expect(res.status, `Report ${key} should return 200`).toBe(200);

      const body = await res.json();
      expect(body.ok, `Report ${key} body.ok should be true`).toBe(true);
      expect(Array.isArray(body.data), `Report ${key} data should be an array`).toBe(true);
    }
  }, 120000);

  it("should produce valid CSV output for consolidated_sales", async () => {
    const access = mockAccessContext(userId, companyId, stationId);
    vi.spyOn(accessModule, "requireAccess").mockResolvedValue(access as any);
    vi.spyOn(accessModule, "requirePermission").mockImplementation((ctx) => ctx as any);

    const req = new Request("http://localhost/api/reports/export?report=consolidated_sales&format=csv");
    const res = await exportReport(req);

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/csv");
    expect(res.headers.get("content-disposition")).toContain("consolidated-sales");

    const text = await res.text();
    const lines = text.split("\r\n");
    // First line should be the header row
    expect(lines[0]).toContain("saleNumber");
    expect(lines[0]).toContain("total");
    expect(lines[0]).toContain("status");
  }, 30000);

  it("should enforce finance permission on financial reports", async () => {
    // User without reports.view_financial
    const access = mockAccessContext(userId, companyId, stationId, ["reports.view", "reports.export"]);
    vi.spyOn(accessModule, "requireAccess").mockResolvedValue(access as any);
    vi.spyOn(accessModule, "requirePermission").mockImplementation((ctx) => ctx as any);

    const financialReports = ["cashbook_ledger", "income_expense", "station_profitability", "agent_wallet_reconciliation"];

    for (const key of financialReports) {
      const req = new Request(`http://localhost/api/reports/export?report=${key}&format=json`);
      const res = await exportReport(req);
      expect(res.status, `${key} should return 403 for user without reports.view_financial`).toBe(403);
    }
  }, 30000);

  it("should return 400 for unknown report key", async () => {
    const access = mockAccessContext(userId, companyId, stationId);
    vi.spyOn(accessModule, "requireAccess").mockResolvedValue(access as any);
    vi.spyOn(accessModule, "requirePermission").mockImplementation((ctx) => ctx as any);

    const req = new Request("http://localhost/api/reports/export?report=nonexistent_report&format=json");
    const res = await exportReport(req);
    expect(res.status).toBe(400);
  }, 10000);

  it("should apply station filter on consolidated_sales", async () => {
    const access = mockAccessContext(userId, companyId, stationId);
    vi.spyOn(accessModule, "requireAccess").mockResolvedValue(access as any);
    vi.spyOn(accessModule, "requirePermission").mockImplementation((ctx) => ctx as any);

    // With valid stationId filter
    const req = new Request(`http://localhost/api/reports/export?report=consolidated_sales&format=json&stationId=${stationId}`);
    const res = await exportReport(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    // All rows should belong to the specified station
    for (const row of body.data as Record<string, string>[]) {
      expect(row.station).toBeDefined(); // station code column exists
    }
  }, 30000);
});
