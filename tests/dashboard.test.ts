import "dotenv/config";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
  handlers: { GET: vi.fn(), POST: vi.fn() },
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

import * as accessModule from "@/lib/server/access";
import { db } from "@/lib/server/db";
import { GET as getSummary } from "@/app/api/dashboard/summary/route";
import { GET as getRevenueTrend } from "@/app/api/dashboard/revenue-trend/route";
import { GET as getStationPerformance } from "@/app/api/dashboard/station-performance/route";
import { GET as getAttention } from "@/app/api/dashboard/attention/route";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Dashboard API Endpoints (Module 01)", () => {
  let companyId: string;
  let userId: string;
  let hqStationId: string;
  let losStationId: string;
  let buCoreId: string;

  beforeAll(async () => {
    // Retrieve some seeded records to ensure we use valid ids in our mock contexts
    const company = await db.company.findFirstOrThrow({ where: { code: "AAU-CHAMO" } });
    companyId = company.id;
    
    const hqStation = await db.station.findFirstOrThrow({ where: { code: "HQ" } });
    hqStationId = hqStation.id;

    const losStation = await db.station.findFirstOrThrow({ where: { code: "LOS" } });
    losStationId = losStation.id;
    
    const user = await db.user.findFirstOrThrow({ where: { username: "superadmin" } });
    userId = user.id;

    const bu = await db.businessUnit.findFirstOrThrow({ where: { code: "CORE" } });
    buCoreId = bu.id;
  });

  it("calculates summary statistics successfully for a company-wide Super Admin", async () => {
    vi.spyOn(accessModule, "requireAccess").mockResolvedValue({
      userId,
      companyId,
      sessionId: "session-1",
      name: "Super Admin",
      email: "admin@aauchamo.local",
      username: "superadmin",
      roleNames: ["SUPER_ADMIN"],
      permissions: new Set(["dashboard.view", "finance.view_profit"]),
      stationIds: new Set([hqStationId, losStationId]),
      operatingStationIds: new Set([hqStationId, losStationId]),
      businessUnitIds: new Set([buCoreId]),
      companyWide: true,
    });

    const request = new Request("http://localhost/api/dashboard/summary?from=2026-08-01&to=2026-08-09");
    const response = await getSummary(request);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.data.sales).toBeDefined();
    expect(body.data.financialVisible).toBe(true);
    expect(response.headers.get("Cache-Control")).toBe("private, max-age=15, must-revalidate");
  });

  it("enforces station isolation filters on summary counts", async () => {
    vi.spyOn(accessModule, "requireAccess").mockResolvedValue({
      userId,
      companyId,
      sessionId: "session-2",
      name: "HQ Scoped User",
      email: "hq@aauchamo.local",
      username: "hq.user",
      roleNames: ["OPERATIONS_COORDINATOR"],
      permissions: new Set(["dashboard.view"]),
      stationIds: new Set([hqStationId]),
      operatingStationIds: new Set([hqStationId]),
      businessUnitIds: new Set([buCoreId]),
      companyWide: false,
    });

    const request = new Request(`http://localhost/api/dashboard/summary?stationId=${hqStationId}`);
    const response = await getSummary(request);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.data.financialVisible).toBe(false);
  });

  it("blocks requests to stations outside the user's scope", async () => {
    vi.spyOn(accessModule, "requireAccess").mockResolvedValue({
      userId,
      companyId,
      sessionId: "session-2",
      name: "HQ Scoped User",
      email: "hq@aauchamo.local",
      username: "hq.user",
      roleNames: ["OPERATIONS_COORDINATOR"],
      permissions: new Set(["dashboard.view"]),
      stationIds: new Set([hqStationId]),
      operatingStationIds: new Set([hqStationId]),
      businessUnitIds: new Set([buCoreId]),
      companyWide: false,
    });

    const request = new Request(`http://localhost/api/dashboard/summary?stationId=${losStationId}`);
    const response = await getSummary(request);
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("FORBIDDEN");
  });

  it("calculates revenue trend correctly", async () => {
    vi.spyOn(accessModule, "requireAccess").mockResolvedValue({
      userId,
      companyId,
      sessionId: "session-1",
      name: "Super Admin",
      email: "admin@aauchamo.local",
      username: "superadmin",
      roleNames: ["SUPER_ADMIN"],
      permissions: new Set(["dashboard.view"]),
      stationIds: new Set([hqStationId, losStationId]),
      operatingStationIds: new Set([hqStationId, losStationId]),
      businessUnitIds: new Set([buCoreId]),
      companyWide: true,
    });

    const request = new Request("http://localhost/api/dashboard/revenue-trend?from=2026-08-01&to=2026-08-09");
    const response = await getRevenueTrend(request);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(response.headers.get("Cache-Control")).toBe("private, max-age=15, must-revalidate");
  });

  it("reconciles active station performance stats", async () => {
    vi.spyOn(accessModule, "requireAccess").mockResolvedValue({
      userId,
      companyId,
      sessionId: "session-1",
      name: "Super Admin",
      email: "admin@aauchamo.local",
      username: "superadmin",
      roleNames: ["SUPER_ADMIN"],
      permissions: new Set(["dashboard.view"]),
      stationIds: new Set([hqStationId, losStationId]),
      operatingStationIds: new Set([hqStationId, losStationId]),
      businessUnitIds: new Set([buCoreId]),
      companyWide: true,
    });

    const request = new Request("http://localhost/api/dashboard/station-performance?from=2026-08-01&to=2026-08-09");
    const response = await getStationPerformance(request);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    const hqPerf = body.data.find((s: { id: string; transactions: number }) => s.id === hqStationId);
    expect(hqPerf).toBeDefined();
    expect(hqPerf.transactions).toBeDefined();
  });

  it("gathers items requiring attention including approvals", async () => {
    vi.spyOn(accessModule, "requireAccess").mockResolvedValue({
      userId,
      companyId,
      sessionId: "session-1",
      name: "Super Admin",
      email: "admin@aauchamo.local",
      username: "superadmin",
      roleNames: ["SUPER_ADMIN"],
      permissions: new Set(["dashboard.view"]),
      stationIds: new Set([hqStationId, losStationId]),
      operatingStationIds: new Set([hqStationId, losStationId]),
      businessUnitIds: new Set([buCoreId]),
      companyWide: true,
    });

    const request = new Request("http://localhost/api/dashboard/attention");
    const response = await getAttention(request);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.data.approvals).toBeDefined();
    expect(body.data.outstanding).toBeDefined();
    expect(body.data.cargoHolds).toBeDefined();
    expect(body.data.expiringBatches).toBeDefined();
  });

  it("validates and rejects overly large date ranges", async () => {
    vi.spyOn(accessModule, "requireAccess").mockResolvedValue({
      userId,
      companyId,
      sessionId: "session-1",
      name: "Super Admin",
      email: "admin@aauchamo.local",
      username: "superadmin",
      roleNames: ["SUPER_ADMIN"],
      permissions: new Set(["dashboard.view"]),
      stationIds: new Set([hqStationId]),
      operatingStationIds: new Set([hqStationId]),
      businessUnitIds: new Set([buCoreId]),
      companyWide: true,
    });

    const request = new Request("http://localhost/api/dashboard/summary?from=2025-01-01&to=2026-03-01");
    const response = await getSummary(request);
    expect(response.status).toBe(422);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("DATE_RANGE_TOO_LARGE");
  });
});
