import "dotenv/config";
import { vi, describe, it, expect, beforeAll, afterEach } from "vitest";
vi.mock("@/auth", () => ({
  auth: vi.fn(),
  handlers: { GET: vi.fn(), POST: vi.fn() },
}));
import { db } from "@/lib/server/db";
import { GET as getPeriods, POST as createPeriod } from "@/app/api/finance/periods/route";
import { POST as closePeriod } from "@/app/api/finance/periods/[periodId]/close/route";
import { GET as getSessions, POST as openSession } from "@/app/api/finance/sessions/route";
import { POST as closeSession } from "@/app/api/finance/sessions/[sessionId]/close/route";
import { GET as getReconciliations, POST as createReconciliation } from "@/app/api/finance/reconciliations/route";
import { GET as getProfit } from "@/app/api/finance/profit/route";
import { POST as createEntry } from "@/app/api/finance/entries/route";
import * as accessModule from "@/lib/server/access";

function mockAccessContext(userId: string, companyId: string, stationId: string, permissions: string[] = ["finance.view", "finance.post_income", "finance.post_expense", "finance.reconcile", "settings.manage"]) {
  return {
    userId,
    companyId,
    sessionId: "test-session-finance",
    name: "Finance User",
    email: "finance@user.local",
    username: "financeuser",
    roleNames: ["SUPER_ADMIN"],
    permissions: new Set(permissions),
    stationIds: new Set([stationId]),
    operatingStationIds: new Set([stationId]),
    businessUnitIds: new Set([]),
    companyWide: true,
  };
}

describe("Financial Management Integration Tests (Module 11)", () => {
  let companyId: string;
  let stationId: string;
  let userId: string;
  let accountId: string;
  let categoryId: string;

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

    // 4. Find financial account
    const account = await db.financialAccount.findFirst({ where: { companyId, isActive: true } });
    if (!account) throw new Error("Seed missing financial account.");
    accountId = account.id;

    // 5. Find financial category (CREDIT)
    const category = await db.financialCategory.findFirst({ where: { companyId, isActive: true, type: "CREDIT" } });
    if (!category) throw new Error("Seed missing financial credit category.");
    categoryId = category.id;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should enforce financial periods CRUD and lock postings in closed periods", async () => {
    const access = mockAccessContext(userId, companyId, stationId);
    vi.spyOn(accessModule, "requireAccess").mockResolvedValue(access as any);
    vi.spyOn(accessModule, "requirePermission").mockImplementation((ctx, perm) => ctx as any);

    // Pre-clean: delete any stale test period for Aug 2026 from prior runs
    await db.financialPeriod.deleteMany({
      where: { companyId, name: "Test Period Aug 2026" },
    });

    // 1. Create a period spanning today's date (2026-08-16) so the lock test is deterministic
    const req1 = new Request("http://localhost/api/finance/periods", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Test Period Aug 2026",
        startsAt: "2026-08-01",
        endsAt: "2026-08-31",
      }),
    });
    const res1 = await createPeriod(req1);
    const body1 = await res1.json();

    expect(res1.status).toBe(200);
    expect(body1.ok).toBe(true);
    const periodId = body1.data.id;

    // 2. List periods — verify it is present
    const req2 = new Request("http://localhost/api/finance/periods");
    const res2 = await getPeriods(req2);
    const body2 = await res2.json();

    expect(res2.status).toBe(200);
    expect(body2.data.some((p: any) => p.id === periodId)).toBe(true);

    // 3. Close the period
    const req3 = new Request(`http://localhost/api/finance/periods/${periodId}/close`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ isClosed: true }),
    });
    const res3 = await closePeriod(req3, { params: Promise.resolve({ periodId }) });
    const body3 = await res3.json();

    expect(res3.status).toBe(200);
    expect(body3.data.isClosed).toBe(true);

    // 4. Verify that posting a cashbook entry inside the closed period is blocked
    //    Today (2026-08-16) falls within Aug 2026 → expect 409 FINANCIAL_PERIOD_CLOSED
    const req4 = new Request("http://localhost/api/finance/entries", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        stationId,
        accountId,
        categoryId,
        direction: "CREDIT",
        amount: "1000.00",
        description: "Test income entry inside closed period",
      }),
    });
    const res4 = await createEntry(req4);
    const body4 = await res4.json();

    expect(res4.status).toBe(409);
    expect(body4.error.code).toBe("FINANCIAL_PERIOD_CLOSED");

    // Cleanup: reopen and delete the period so it doesn't affect other tests
    const reqReopen = new Request(`http://localhost/api/finance/periods/${periodId}/close`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ isClosed: false }),
    });
    await closePeriod(reqReopen, { params: Promise.resolve({ periodId }) });
    await db.financialPeriod.delete({ where: { id: periodId } });
  }, 90000);

  it("should open, count, close and audit cash sessions", async () => {
    const access = mockAccessContext(userId, companyId, stationId);
    vi.spyOn(accessModule, "requireAccess").mockResolvedValue(access as any);
    vi.spyOn(accessModule, "requirePermission").mockImplementation((ctx, perm) => ctx as any);

    // 1. Open session
    const req1 = new Request("http://localhost/api/finance/sessions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        stationId,
        accountId,
        openingBalance: "50000.00",
      }),
    });
    const res1 = await openSession(req1);
    const body1 = await res1.json();

    expect(res1.status).toBe(200);
    expect(body1.ok).toBe(true);
    const sessionId = body1.data.id;

    // 2. Get open session
    const req2 = new Request("http://localhost/api/finance/sessions");
    const res2 = await getSessions(req2);
    const body2 = await res2.json();

    expect(res2.status).toBe(200);
    expect(body2.data.some((s: any) => s.id === sessionId)).toBe(true);

    // 3. Post a manual entry to influence expected balance
    const req3 = new Request("http://localhost/api/finance/entries", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        stationId,
        accountId,
        categoryId,
        direction: "CREDIT",
        amount: "5000.00",
        description: "Test income entry in session",
      }),
    });
    await createEntry(req3);

    // 4. Close session and verify variance
    const req4 = new Request(`http://localhost/api/finance/sessions/${sessionId}/close`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        countedBalance: "56000.00", // Expected: opening (50k00) + posted (5k00) = 55000. counted: 56000 => variance: +1000
      }),
    });
    const res4 = await closeSession(req4, { params: Promise.resolve({ sessionId }) });
    const body4 = await res4.json();

    expect(res4.status).toBe(200);
    expect(body4.data.status).toBe("CLOSED");
    expect(Number(body4.data.expected)).toBe(55000);
    expect(Number(body4.data.counted)).toBe(56000);
    expect(Number(body4.data.variance)).toBe(1000);
  }, 90000);

  it("should post reconciliations and lock system balance", async () => {
    const access = mockAccessContext(userId, companyId, stationId);
    vi.spyOn(accessModule, "requireAccess").mockResolvedValue(access as any);
    vi.spyOn(accessModule, "requirePermission").mockImplementation((ctx, perm) => ctx as any);

    // 1. Post a manual credit entry to reconcile
    const reqEntry = new Request("http://localhost/api/finance/entries", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        stationId,
        accountId,
        categoryId,
        direction: "CREDIT",
        amount: "10000.00",
        description: "Test entry for bank reconciliation",
      }),
    });
    const resEntry = await createEntry(reqEntry);
    const bodyEntry = await resEntry.json();
    const entryId = bodyEntry.data.id;

    // 2. Post Reconciliation
    const todayStr = new Date().toISOString().slice(0, 10);
    const reqRecon = new Request("http://localhost/api/finance/reconciliations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        accountId,
        statementDate: todayStr,
        statementBalance: "10000.00",
        notes: "Test reconciliation audit notes",
      }),
    });
    const resRecon = await createReconciliation(reqRecon);
    const bodyRecon = await resRecon.json();

    expect(resRecon.status).toBe(200);
    expect(bodyRecon.ok).toBe(true);

    // Verify reconciliation record lists
    const reqList = new Request("http://localhost/api/finance/reconciliations");
    const resList = await getReconciliations(reqList);
    const bodyList = await resList.json();

    expect(resList.status).toBe(200);
    expect(bodyList.data.some((r: any) => r.id === bodyRecon.data.id)).toBe(true);

    // Verify that the entry status is now updated to RECONCILED
    const entry = await db.cashbookEntry.findUnique({ where: { id: entryId } });
    expect(entry?.status).toBe("RECONCILED");
  }, 90000);

  it("should return detailed P&L calculation results", async () => {
    const access = mockAccessContext(userId, companyId, stationId, ["finance.view", "finance.view_profit"]);
    vi.spyOn(accessModule, "requireAccess").mockResolvedValue(access as any);
    vi.spyOn(accessModule, "requirePermission").mockImplementation((ctx, perm) => ctx as any);

    const req = new Request("http://localhost/api/finance/profit");
    const res = await getProfit(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.grossSales).toBeDefined();
    expect(body.data.netProfit).toBeDefined();
    expect(body.data.byStation.length).toBeGreaterThan(0);
  }, 90000);
});
