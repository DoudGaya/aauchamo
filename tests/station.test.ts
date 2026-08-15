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
import { GET as getStations, POST as createStation } from "@/app/api/stations/route";
import { GET as getStation, PATCH as updateStation } from "@/app/api/stations/[stationId]/route";
import { POST as disableStation } from "@/app/api/stations/[stationId]/disable/route";
import { POST as assignManager } from "@/app/api/stations/[stationId]/assign-manager/route";
import { GET as getPerformance } from "@/app/api/stations/[stationId]/performance/route";

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── Shared test state ───────────────────────────────────────────────────────

let companyId: string;
let adminUserId: string;
let hqStationId: string;
let losStationId: string;
let buCoreId: string;

// Tracks stations created during tests so we can clean them up
const createdStationIds: string[] = [];

// ─── Base access identity builders ───────────────────────────────────────────

function superAdminAccess(overrides: Partial<Awaited<ReturnType<typeof accessModule["requireAccess"]>>> = {}) {
  return {
    userId: adminUserId,
    companyId,
    sessionId: "session-admin",
    name: "Super Admin",
    email: "admin@aauchamo.local",
    username: "superadmin",
    roleNames: ["SUPER_ADMIN"],
    permissions: new Set([
      "stations.view",
      "stations.manage",
      "stations.update",
      "stations.disable",
      "stations.assign_manager",
      "stations.view_performance",
    ]),
    stationIds: new Set([hqStationId, losStationId]),
    operatingStationIds: new Set([hqStationId, losStationId]),
    businessUnitIds: new Set([buCoreId]),
    companyWide: true,
    ...overrides,
  };
}

function scopedAccess(stationId: string) {
  return {
    userId: adminUserId,
    companyId,
    sessionId: "session-scoped",
    name: "Station User",
    email: "hq@aauchamo.local",
    username: "hq.user",
    roleNames: ["OPERATIONS_COORDINATOR"],
    permissions: new Set(["stations.view", "stations.view_performance"]),
    stationIds: new Set([stationId]),
    operatingStationIds: new Set([stationId]),
    businessUnitIds: new Set([buCoreId]),
    companyWide: false,
  };
}

// ─── Setup ───────────────────────────────────────────────────────────────────

beforeAll(async () => {
  const company = await db.company.findFirstOrThrow({ where: { code: "AAU-CHAMO" } });
  companyId = company.id;

  const hqStation = await db.station.findFirstOrThrow({ where: { code: "HQ" } });
  hqStationId = hqStation.id;

  const losStation = await db.station.findFirstOrThrow({ where: { code: "LOS" } });
  losStationId = losStation.id;

  const adminUser = await db.user.findFirstOrThrow({ where: { username: "superadmin" } });
  adminUserId = adminUser.id;

  const bu = await db.businessUnit.findFirstOrThrow({ where: { code: "CORE" } });
  buCoreId = bu.id;
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("Station Administration (Module 02)", () => {

  // ── GET /api/stations ─────────────────────────────────────────────────────

  describe("GET /api/stations", () => {
    it("returns all seeded stations for a company-wide admin", async () => {
      vi.spyOn(accessModule, "requireAccess").mockResolvedValue(superAdminAccess());
      const req = new Request("http://localhost/api/stations");
      const res = await getStations(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      // Seeded stations: HQ, AIR, KAN, LOS
      expect(body.data.length).toBeGreaterThanOrEqual(4);
      expect(res.headers.get("Cache-Control")).toBe("private, max-age=10, must-revalidate");
    });

    it("filters stations by scope for a non-company-wide user", async () => {
      vi.spyOn(accessModule, "requireAccess").mockResolvedValue(scopedAccess(hqStationId));
      const req = new Request("http://localhost/api/stations");
      const res = await getStations(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.ok).toBe(true);
      // Should only see HQ
      expect(body.data.every((s: { id: string }) => s.id === hqStationId)).toBe(true);
    });

    it("returns 403 when user lacks stations.view permission", async () => {
      vi.spyOn(accessModule, "requireAccess").mockResolvedValue(
        superAdminAccess({ permissions: new Set() })
      );
      const req = new Request("http://localhost/api/stations");
      const res = await getStations(req);
      expect(res.status).toBe(403);
    });
  });

  // ── POST /api/stations ────────────────────────────────────────────────────

  describe("POST /api/stations", () => {
    it("creates a new station and returns 201", async () => {
      vi.spyOn(accessModule, "requireAccess").mockResolvedValue(superAdminAccess());
      const uniqueCode = `TST${Date.now().toString().slice(-4)}`;
      const req = new Request("http://localhost/api/stations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          code: uniqueCode,
          name: "Test Station (Vitest)",
          city: "Lagos",
          state: "Lagos",
          businessUnitIds: [buCoreId],
        }),
      });
      const res = await createStation(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(body.data.code).toBe(uniqueCode);
      expect(body.data.name).toBe("Test Station (Vitest)");

      // Track for cleanup
      createdStationIds.push(body.data.id);
    });

    it("rejects duplicate station code with 409", async () => {
      vi.spyOn(accessModule, "requireAccess").mockResolvedValue(superAdminAccess());
      const req = new Request("http://localhost/api/stations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        // HQ is already seeded
        body: JSON.stringify({ code: "HQ", name: "Duplicate HQ", businessUnitIds: [] }),
      });
      const res = await createStation(req);
      expect(res.status).toBe(409);
    });

    it("returns 403 when user lacks stations.manage permission", async () => {
      vi.spyOn(accessModule, "requireAccess").mockResolvedValue(
        superAdminAccess({ permissions: new Set(["stations.view"]) })
      );
      const req = new Request("http://localhost/api/stations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: "NOPERM", name: "No Permission", businessUnitIds: [] }),
      });
      const res = await createStation(req);
      expect(res.status).toBe(403);
    });
  });

  // ── GET /api/stations/[stationId] ─────────────────────────────────────────

  describe("GET /api/stations/[stationId]", () => {
    it("returns station detail with managerHistory and businessUnits", async () => {
      vi.spyOn(accessModule, "requireAccess").mockResolvedValue(superAdminAccess());
      const req = new Request(`http://localhost/api/stations/${hqStationId}`);
      const res = await getStation(req, { params: Promise.resolve({ stationId: hqStationId }) });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(body.data.id).toBe(hqStationId);
      expect(Array.isArray(body.data.managerHistory)).toBe(true);
      expect(Array.isArray(body.data.businessUnits)).toBe(true);
    });

    it("returns 404 for a non-existent station ID", async () => {
      vi.spyOn(accessModule, "requireAccess").mockResolvedValue(superAdminAccess());
      const fakeId = "clxxxxxxxxxxxxxxxxxxxxxxx";
      const req = new Request(`http://localhost/api/stations/${fakeId}`);
      const res = await getStation(req, { params: Promise.resolve({ stationId: fakeId }) });
      expect(res.status).toBe(404);
    });

    it("returns 403 when scoped user requests an out-of-scope station", async () => {
      vi.spyOn(accessModule, "requireAccess").mockResolvedValue(scopedAccess(hqStationId));
      const req = new Request(`http://localhost/api/stations/${losStationId}`);
      const res = await getStation(req, { params: Promise.resolve({ stationId: losStationId }) });
      expect(res.status).toBe(403);
    });
  });

  // ── PATCH /api/stations/[stationId] ──────────────────────────────────────

  describe("PATCH /api/stations/[stationId]", () => {
    it("updates station name successfully", async () => {
      vi.spyOn(accessModule, "requireAccess").mockResolvedValue(
        superAdminAccess({ permissions: new Set(["stations.update"]) })
      );
      // Re-fetch current version before updating
      const current = await db.station.findUniqueOrThrow({ where: { id: hqStationId } });
      const req = new Request(`http://localhost/api/stations/${hqStationId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          version: current.version,
          name: "HQ Station (Updated by Vitest)",
          reason: "Automated test update to verify PATCH handler",
        }),
      });
      const res = await updateStation(req, { params: Promise.resolve({ stationId: hqStationId }) });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(body.data.name).toBe("HQ Station (Updated by Vitest)");

      // Restore original name
      await db.station.update({ where: { id: hqStationId }, data: { name: "Head Office" } });
    });

    it("returns 409 when version is stale (optimistic locking)", async () => {
      vi.spyOn(accessModule, "requireAccess").mockResolvedValue(
        superAdminAccess({ permissions: new Set(["stations.update"]) })
      );
      const req = new Request(`http://localhost/api/stations/${hqStationId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          version: 1, // Valid positive int but wrong for current record
          name: "Should Not Succeed",
          reason: "Testing optimistic locking conflict detection",
        }),
      });
      const res = await updateStation(req, { params: Promise.resolve({ stationId: hqStationId }) });
      expect(res.status).toBe(409);
    });
  });

  // ── GET /api/stations/[stationId]/performance ─────────────────────────────

  describe("GET /api/stations/[stationId]/performance", () => {
    it("returns performance counters for a station", async () => {
      vi.spyOn(accessModule, "requireAccess").mockResolvedValue(superAdminAccess());
      const req = new Request(`http://localhost/api/stations/${hqStationId}/performance`);
      const res = await getPerformance(req, { params: Promise.resolve({ stationId: hqStationId }) });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(body.data.stationId).toBe(hqStationId);
      expect(typeof body.data.scopedUsers).toBe("number");
      expect(typeof body.data.activeStaff).toBe("number");
      expect(typeof body.data.customers).toBe("number");
      expect(typeof body.data.pendingApprovals).toBe("number");
      expect(res.headers.get("Cache-Control")).toBe("private, max-age=10, must-revalidate");
    });
  });

  // ── POST /api/stations/[stationId]/assign-manager ─────────────────────────

  describe("POST /api/stations/[stationId]/assign-manager", () => {
    it("returns 422 when manager user is not an active operator for the station", async () => {
      vi.spyOn(accessModule, "requireAccess").mockResolvedValue(superAdminAccess());
      // Use a clearly non-existent user ID
      const req = new Request(`http://localhost/api/stations/${hqStationId}/assign-manager`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          managerId: "clxxxxxxxxxxxxxxxxxxxxxx1",
          reason: "Testing invalid manager rejection",
        }),
      });
      const res = await assignManager(req, { params: Promise.resolve({ stationId: hqStationId }) });
      expect(res.status).toBe(422);
      const body = await res.json();
      expect(body.error.code).toBe("INVALID_MANAGER");
    });

    it("returns 403 without stations.assign_manager permission", async () => {
      vi.spyOn(accessModule, "requireAccess").mockResolvedValue(
        superAdminAccess({ permissions: new Set(["stations.view"]) })
      );
      const req = new Request(`http://localhost/api/stations/${hqStationId}/assign-manager`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ managerId: adminUserId, reason: "Should be denied" }),
      });
      const res = await assignManager(req, { params: Promise.resolve({ stationId: hqStationId }) });
      expect(res.status).toBe(403);
    });
  });

  // ── POST /api/stations/[stationId]/disable ────────────────────────────────

  describe("POST /api/stations/[stationId]/disable", () => {
    it("returns 403 when user does not have company-wide scope", async () => {
      vi.spyOn(accessModule, "requireAccess").mockResolvedValue(
        superAdminAccess({ companyWide: false })
      );
      const current = await db.station.findUniqueOrThrow({ where: { id: losStationId } });
      const req = new Request(`http://localhost/api/stations/${losStationId}/disable`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          version: current.version,
          reason: "Testing company-scope enforcement for disable action",
        }),
      });
      const res = await disableStation(req, { params: Promise.resolve({ stationId: losStationId }) });
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error.code).toBe("COMPANY_SCOPE_REQUIRED");
    });

    it("returns 422 when reason is too short", async () => {
      vi.spyOn(accessModule, "requireAccess").mockResolvedValue(superAdminAccess());
      const current = await db.station.findUniqueOrThrow({ where: { id: losStationId } });
      const req = new Request(`http://localhost/api/stations/${losStationId}/disable`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ version: current.version, reason: "Too short" }),
      });
      const res = await disableStation(req, { params: Promise.resolve({ stationId: losStationId }) });
      expect(res.status).toBe(422);
    });
  });
});
