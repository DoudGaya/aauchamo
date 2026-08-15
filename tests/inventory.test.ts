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
import { GET as getAdjustments, POST as createAdjustment } from "@/app/api/inventory/adjustments/route";
import { POST as approveAdjustment } from "@/app/api/inventory/adjustments/[adjustmentId]/approve/route";
import { GET as getTransfers, POST as createTransfer } from "@/app/api/inventory/transfers/route";
import { POST as dispatchTransfer } from "@/app/api/inventory/transfers/[transferId]/dispatch/route";
import { POST as receiveTransfer } from "@/app/api/inventory/transfers/[transferId]/receive/route";

afterEach(() => {
  vi.restoreAllMocks();
});

let companyId: string;
let adminUserId: string;
let requesterUserId: string;
let originStationId: string;
let destinationStationId: string;
let productId: string;
let adjustmentId: string;
let transferId: string;

beforeAll(async () => {
  const company = await db.company.findFirst();
  if (!company) throw new Error("Seed data missing company");
  companyId = company.id;

  const users = await db.user.findMany({ where: { companyId }, take: 2 });
  if (users.length < 2) throw new Error("Seed data requires at least two users for maker-checker tests");
  adminUserId = users[0].id;
  requesterUserId = users[1].id;

  const stations = await db.station.findMany({ where: { companyId }, take: 2 });
  if (stations.length < 2) throw new Error("Seed data requires at least two stations");
  originStationId = stations[0].id;
  destinationStationId = stations[1].id;

  const product = await db.product.findFirst({ where: { companyId, status: "ACTIVE" } });
  if (!product) throw new Error("Seed data missing active product");
  productId = product.id;

  // Clean up any stale test runs
  await db.stockTransferLine.deleteMany({ where: { stockTransfer: { companyId } } });
  await db.stockTransfer.deleteMany({ where: { companyId } });
  await db.inventoryAdjustmentLine.deleteMany({ where: { adjustment: { companyId } } });
  await db.inventoryAdjustment.deleteMany({ where: { companyId } });
});

function superAdminAccess(userId: string) {
  return {
    userId,
    companyId,
    sessionId: `session-${userId}`,
    name: "User Name",
    email: "user@aauchamo.local",
    username: "username",
    roleNames: ["SUPER_ADMIN"],
    permissions: new Set([
      "inventory.view",
      "inventory.adjust",
      "inventory.approve_adjustment",
      "inventory.transfer",
    ]),
    stationIds: new Set([originStationId, destinationStationId]),
    operatingStationIds: new Set([originStationId, destinationStationId]),
    businessUnitIds: new Set([]),
    companyWide: true,
  };
}

describe("Purchase & Inventory Management (Module 06)", () => {
  describe("Stock Adjustments (Maker-Checker)", () => {
    it("creates a pending adjustment request and lists it", async () => {
      vi.spyOn(accessModule, "requireAccess").mockResolvedValue(superAdminAccess(requesterUserId) as any);
      vi.spyOn(accessModule, "requirePermission").mockReturnValue(superAdminAccess(requesterUserId) as any);

      // Verify product balance exists or create opening balance
      await db.inventoryBalance.upsert({
        where: { stationId_productId_batchKey: { stationId: originStationId, productId, batchKey: "" } },
        create: { stationId: originStationId, productId, batchKey: "", quantity: 10 },
        update: {},
      });

      const request = new Request("http://localhost/api/inventory/adjustments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          stationId: originStationId,
          reason: "Cycle stock count delta adjustment",
          lines: [{ productId, countedQuantity: "12" }],
        }),
      });

      const response = await createAdjustment(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.ok).toBe(true);
      expect(body.data.status).toBe("PENDING_APPROVAL");
      adjustmentId = body.data.id;

      // List adjustments
      const listReq = new Request("http://localhost/api/inventory/adjustments");
      const listRes = await getAdjustments(listReq);
      const listBody = await listRes.json();
      expect(listRes.status).toBe(200);
      expect(listBody.data.length).toBeGreaterThan(0);
    });

    it("approves pending adjustment request via maker-checker", async () => {
      // Must use a DIFFERENT user (adminUserId) to approve to prevent SELF_APPROVAL_FORBIDDEN
      vi.spyOn(accessModule, "requireAccess").mockResolvedValue(superAdminAccess(adminUserId) as any);
      vi.spyOn(accessModule, "requirePermission").mockReturnValue(superAdminAccess(adminUserId) as any);

      const request = new Request(`http://localhost/api/inventory/adjustments/${adjustmentId}/approve`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          decision: "APPROVED",
          reason: "Count verified by supervisor",
          version: 1,
        }),
      });

      const response = await approveAdjustment(request, { params: Promise.resolve({ adjustmentId }) });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.ok).toBe(true);
      expect(body.data.status).toBe("POSTED");

      // Verify inventory balance was updated to 12
      const balance = await db.inventoryBalance.findUnique({
        where: { stationId_productId_batchKey: { stationId: originStationId, productId, batchKey: "" } },
      });
      expect(Number(balance?.quantity)).toBe(12);
    });
  });

  describe("Inter-Station Stock Transfers", () => {
    it("creates a transfer request and lists transfers", async () => {
      vi.spyOn(accessModule, "requireAccess").mockResolvedValue(superAdminAccess(requesterUserId) as any);
      vi.spyOn(accessModule, "requirePermission").mockReturnValue(superAdminAccess(requesterUserId) as any);

      const request = new Request("http://localhost/api/inventory/transfers", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          originStationId,
          destinationStationId,
          reason: "Replenish destination branch stock",
          lines: [{ productId, quantity: "5" }],
        }),
      });

      const response = await createTransfer(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.ok).toBe(true);
      expect(body.data.status).toBe("REQUESTED");
      transferId = body.data.id;

      // List transfers
      const listReq = new Request("http://localhost/api/inventory/transfers");
      const listRes = await getTransfers(listReq);
      const listBody = await listRes.json();
      expect(listRes.status).toBe(200);
      expect(listBody.data.length).toBeGreaterThan(0);
    });

    it("dispatches the requested transfer lines", async () => {
      vi.spyOn(accessModule, "requireAccess").mockResolvedValue(superAdminAccess(requesterUserId) as any);
      vi.spyOn(accessModule, "requirePermission").mockReturnValue(superAdminAccess(requesterUserId) as any);

      const transfer = await db.stockTransfer.findUnique({ where: { id: transferId }, include: { lines: true } });
      const lineId = transfer!.lines[0].id;

      const request = new Request(`http://localhost/api/inventory/transfers/${transferId}/dispatch`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          version: transfer!.version,
          lines: [{ lineId, quantity: "5" }],
        }),
      });

      const response = await dispatchTransfer(request, { params: Promise.resolve({ transferId }) });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.ok).toBe(true);
      expect(body.data.status).toBe("DISPATCHED");
    });

    it("receives the dispatched transfer lines", async () => {
      vi.spyOn(accessModule, "requireAccess").mockResolvedValue(superAdminAccess(requesterUserId) as any);
      vi.spyOn(accessModule, "requirePermission").mockReturnValue(superAdminAccess(requesterUserId) as any);

      const transfer = await db.stockTransfer.findUnique({ where: { id: transferId }, include: { lines: true } });
      const lineId = transfer!.lines[0].id;

      const request = new Request(`http://localhost/api/inventory/transfers/${transferId}/receive`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          version: transfer!.version,
          lines: [{ lineId, quantity: "5" }],
          notes: "Received in good shape",
        }),
      });

      const response = await receiveTransfer(request, { params: Promise.resolve({ transferId }) });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.ok).toBe(true);
      expect(body.data.status).toBe("RECEIVED");
    });
  });
});
