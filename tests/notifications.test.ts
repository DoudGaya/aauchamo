import "dotenv/config";
import { vi, describe, it, expect, beforeAll } from "vitest";
vi.mock("@/auth", () => ({
  auth: vi.fn(),
  handlers: { GET: vi.fn(), POST: vi.fn() },
}));

import { db } from "@/lib/server/db";
import { emitOutboxEvent, processOutboxEvents } from "@/lib/server/outbox";
import { POST as processOutboxRoute } from "@/app/api/notifications/process/route";
import { GET as getPreferences, PUT as updatePreferences } from "@/app/api/notifications/preferences/route";
import { GET as getTemplates, PUT as updateTemplates } from "@/app/api/notifications/templates/route";
import * as accessModule from "@/lib/server/access";

function mockAccessContext(
  userId: string,
  companyId: string,
  stationId: string,
  permissions: string[] = ["notifications.view", "settings.manage"]
) {
  return {
    userId,
    companyId,
    sessionId: "test-session-notifs",
    name: "Notifications User",
    email: "notifs@user.local",
    username: "notifsuser",
    roleNames: ["SUPER_ADMIN"],
    permissions: new Set(permissions),
    stationIds: new Set([stationId]),
    operatingStationIds: new Set([stationId]),
    businessUnitIds: new Set([]),
    companyWide: true,
  };
}

describe("Notifications Integration Tests (Module 14)", () => {
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

  it("should emit outbox event atomically in transaction", async () => {
    const aggregateId = `item_test_${Date.now()}`;
    const event = await emitOutboxEvent(db, {
      companyId,
      aggregateType: "InventoryBalance",
      aggregateId,
      eventType: "inventory.low_stock",
      payload: {
        productName: "Test Product",
        currentQty: 2,
        reorderLevel: 10,
        stationId,
      },
    });

    expect(event.id).toBeDefined();
    expect(event.status).toBe("PENDING");
    expect(event.aggregateId).toBe(aggregateId);
  });

  it("should process pending outbox events and dispatch notifications", async () => {
    const aggregateId = `item_proc_${Date.now()}`;
    await emitOutboxEvent(db, {
      companyId,
      aggregateType: "InventoryBalance",
      aggregateId,
      eventType: "inventory.low_stock",
      payload: {
        productName: "Proc Test Product",
        currentQty: 1,
        reorderLevel: 15,
        stationId,
      },
    });

    const result = await processOutboxEvents(10);
    expect(result.processed).toBeGreaterThan(0);
    expect(result.published).toBeGreaterThan(0);
  }, 30000);

  it("should execute outbox process route via API endpoint", async () => {
    const access = mockAccessContext(userId, companyId, stationId);
    vi.spyOn(accessModule, "requireAccess").mockResolvedValue(access as any);
    vi.spyOn(accessModule, "requirePermission").mockImplementation((ctx) => ctx as any);

    const req = new Request("http://localhost/api/notifications/process", { method: "POST" });
    const res = await processOutboxRoute(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.processed).toBeDefined();
  }, 30000);

  it("should fetch user channel preferences", async () => {
    const access = mockAccessContext(userId, companyId, stationId);
    vi.spyOn(accessModule, "requireAccess").mockResolvedValue(access as any);
    vi.spyOn(accessModule, "requirePermission").mockImplementation((ctx) => ctx as any);

    const req = new Request("http://localhost/api/notifications/preferences");
    const res = await getPreferences(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it("should allow updating optional channel preferences", async () => {
    const access = mockAccessContext(userId, companyId, stationId);
    vi.spyOn(accessModule, "requireAccess").mockResolvedValue(access as any);
    vi.spyOn(accessModule, "requirePermission").mockImplementation((ctx) => ctx as any);

    const req = new Request("http://localhost/api/notifications/preferences", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        type: "inventory.low_stock",
        channel: "EMAIL",
        enabled: true,
      }),
    });

    const res = await updatePreferences(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.enabled).toBe(true);
  });

  it("should reject disabling mandatory security notifications", async () => {
    const access = mockAccessContext(userId, companyId, stationId);
    vi.spyOn(accessModule, "requireAccess").mockResolvedValue(access as any);
    vi.spyOn(accessModule, "requirePermission").mockImplementation((ctx) => ctx as any);

    const req = new Request("http://localhost/api/notifications/preferences", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        type: "auth.login_failed",
        channel: "EMAIL",
        enabled: false, // Disabling mandatory alert should fail with 400 Bad Request
      }),
    });

    const res = await updatePreferences(req);
    expect(res.status).toBe(400);
  });

  it("should configure notification templates and thresholds", async () => {
    const access = mockAccessContext(userId, companyId, stationId);
    vi.spyOn(accessModule, "requireAccess").mockResolvedValue(access as any);
    vi.spyOn(accessModule, "requirePermission").mockImplementation((ctx) => ctx as any);

    const putReq = new Request("http://localhost/api/notifications/templates", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        key: "large_transaction_threshold",
        value: 500000,
      }),
    });

    const putRes = await updateTemplates(putReq);
    const putBody = await putRes.json();

    expect(putRes.status).toBe(200);
    expect(putBody.ok).toBe(true);

    const getReq = new Request("http://localhost/api/notifications/templates");
    const getRes = await getTemplates(getReq);
    const getBody = await getRes.json();

    expect(getRes.status).toBe(200);
    expect(getBody.ok).toBe(true);
    expect(Array.isArray(getBody.data)).toBe(true);
  });
});
