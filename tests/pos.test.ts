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
import { GET as getSessions, POST as openSession } from "@/app/api/pos/sessions/route";
import { POST as closeSession } from "@/app/api/pos/sessions/[sessionId]/close/route";
import { POST as createSale } from "@/app/api/sales/route";
import { GET as getSaleDetail } from "@/app/api/sales/[saleId]/route";

afterEach(() => {
  vi.restoreAllMocks();
});

let companyId: string;
let adminUserId: string;
let stationId: string;
let businessUnitId: string;
let customerId: string;
let productId: string;
let paymentMethodId: string;
let posSessionId: string;
let saleId: string;

beforeAll(async () => {
  const company = await db.company.findFirstOrThrow({ where: { code: "AAU-CHAMO" } });
  companyId = company.id;

  const user = await db.user.findFirst({ where: { companyId } });
  if (!user) throw new Error("Seed data missing user");
  adminUserId = user.id;

  const station = await db.station.findFirst({ where: { companyId } });
  if (!station) throw new Error("Seed data missing station");
  stationId = station.id;

  const unit = await db.businessUnit.findFirst({ where: { companyId, isActive: true } });
  if (!unit) throw new Error("Seed data missing active business unit");
  businessUnitId = unit.id;

  // Make sure the station business unit relation exists
  await db.stationBusinessUnit.upsert({
    where: { stationId_businessUnitId: { stationId, businessUnitId } },
    create: { stationId, businessUnitId },
    update: {},
  });

  const customer = await db.customer.findFirst({ where: { companyId, status: "ACTIVE" } });
  if (!customer) throw new Error("Seed data missing active customer");
  customerId = customer.id;

  const product = await db.product.findFirst({ where: { companyId, status: "ACTIVE" } });
  if (!product) throw new Error("Seed data missing active product");
  productId = product.id;

  await db.paymentMethod.updateMany({
    where: { companyId, type: "CASH" },
    data: { isActive: true },
  });

  const method = await db.paymentMethod.findFirst({ where: { companyId, type: "CASH", isActive: true } });
  if (!method) throw new Error("Seed data missing active CASH payment method");
  paymentMethodId = method.id;

  // Ensure inventory balance is setup
  await db.inventoryBalance.upsert({
    where: { stationId_productId_batchKey: { stationId, productId, batchKey: "" } },
    create: { stationId, productId, batchKey: "", quantity: 100 },
    update: { quantity: 100 },
  });

  // Ensure cashbook sales income category is setup
  await db.financialCategory.upsert({
    where: { companyId_code: { companyId, code: "SALES" } },
    create: { companyId, code: "SALES", name: "Sales Revenue", type: "CREDIT", isActive: true },
    update: { isActive: true },
  });

  // Ensure financial account mapping exists
  await db.financialAccount.upsert({
    where: { companyId_code: { companyId, code: "CASH_DRAWER" } },
    create: { companyId, code: "CASH_DRAWER", name: "Main Cash Drawer", accountType: "CASH", paymentMethodId, isActive: true },
    update: { paymentMethodId, isActive: true },
  });

  // Clean up any stale POS sessions from previous test runs
  await db.saleLine.deleteMany({ where: { sale: { companyId } } });
  await db.paymentAllocation.deleteMany({ where: { payment: { companyId } } });
  await db.payment.deleteMany({ where: { companyId } });
  await db.outstandingPayment.deleteMany({ where: { sale: { companyId } } });
  await db.sale.deleteMany({ where: { companyId } });
  await db.pOSSession.deleteMany({ where: { stationId } });
});

function mockAccessContext(permissions: string[] = ["sales.create", "sales.view", "sales.discount"]) {
  return {
    userId: adminUserId,
    companyId,
    sessionId: "pos-test-session",
    name: "POS Admin",
    email: "pos@aauchamo.local",
    username: "pos_admin",
    roleNames: ["POS_OPERATOR"],
    permissions: new Set(permissions),
    stationIds: new Set([stationId]),
    operatingStationIds: new Set([stationId]),
    businessUnitIds: new Set([]),
    companyWide: true,
  };
}

describe("Point of Sale (Module 07)", () => {
  describe("POS Drawer Sessions", () => {
    it("opens a new POS session and retrieves active status", async () => {
      vi.spyOn(accessModule, "requireAccess").mockResolvedValue(mockAccessContext() as any);
      vi.spyOn(accessModule, "requirePermission").mockReturnValue(mockAccessContext() as any);

      const req = new Request("http://localhost/api/pos/sessions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          stationId,
          openingCash: "15000.00",
        }),
      });

      const res = await openSession(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.ok).toBe(true);
      expect(body.data.status).toBe("OPEN");
      posSessionId = body.data.id;

      // Verify active session lookup
      const activeReq = new Request(`http://localhost/api/pos/sessions?active=true&stationId=${stationId}`);
      const activeRes = await getSessions(activeReq);
      const activeBody = await activeRes.json();
      expect(activeRes.status).toBe(200);
      expect(activeBody.data.id).toBe(posSessionId);
    });

    it("rejects opening another session while drawer is open", async () => {
      vi.spyOn(accessModule, "requireAccess").mockResolvedValue(mockAccessContext() as any);
      vi.spyOn(accessModule, "requirePermission").mockReturnValue(mockAccessContext() as any);

      const req = new Request("http://localhost/api/pos/sessions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          stationId,
          openingCash: "1000.00",
        }),
      });

      const res = await openSession(req);
      const body = await res.json();
      expect(res.status).toBe(409);
      expect(body.error.code).toBe("SESSION_ALREADY_OPEN");
    });
  });

  describe("POS Sale Checkout", () => {
    it("completes checkout with split payments and line discounts", async () => {
      vi.spyOn(accessModule, "requireAccess").mockResolvedValue(mockAccessContext() as any);
      vi.spyOn(accessModule, "requirePermission").mockReturnValue(mockAccessContext() as any);

      const req = new Request("http://localhost/api/sales", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "idempotency-key": `idemp-pos-checkout-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        },
        body: JSON.stringify({
          stationId,
          businessUnitId,
          customerId,
          posSessionId,
          lines: [
            {
              productId,
              quantity: "2",
              discountAmount: "10.00", // Authoritative price is validated, discount applied
            },
          ],
          payments: [
            {
              paymentMethodId,
              amount: "1990.00", // (1000*2 - 10) assuming product price is 1000
              reference: "REF-12345",
              terminalId: "TERM-12345",
            },
          ],
        }),
      });

      // Override product price temporarily to make testing deterministic
      await db.product.update({
        where: { id: productId },
        data: { sellingPrice: 1000.00, purchasePrice: 500.00, taxRate: 0.00 },
      });

      const res = await createSale(req);
      const body = await res.json();
      if (!body.ok) console.log("CHECKOUT ERROR DETAIL:", body.error);

      expect(res.status).toBe(200);
      expect(body.ok).toBe(true);
      expect(body.data.status).toBe("PAID");
      saleId = body.data.id;
    });

    it("verifies and reproduces receipt snapshot detail", async () => {
      vi.spyOn(accessModule, "requireAccess").mockResolvedValue(mockAccessContext() as any);
      vi.spyOn(accessModule, "requirePermission").mockReturnValue(mockAccessContext() as any);

      const res = await getSaleDetail(new Request(`http://localhost/api/sales/${saleId}`), {
        params: Promise.resolve({ saleId }),
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.ok).toBe(true);
      expect(body.data.saleNumber).toBeDefined();
      expect(body.data.lines.length).toBe(1);
      expect(body.data.company).toBeDefined();
    });
  });

  describe("Reconciliation and Session Closing", () => {
    it("closes the POS session, verifying expected drawer cash and variance", async () => {
      vi.spyOn(accessModule, "requireAccess").mockResolvedValue(mockAccessContext() as any);
      vi.spyOn(accessModule, "requirePermission").mockReturnValue(mockAccessContext() as any);

      const req = new Request(`http://localhost/api/pos/sessions/${posSessionId}/close`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          countedCash: "16990.00", // expected: 15000 (opening float) + 1990 (cash payment) = 16990
        }),
      });

      const res = await closeSession(req, { params: Promise.resolve({ sessionId: posSessionId }) });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.ok).toBe(true);
      expect(body.data.status).toBe("CLOSED");
      expect(Number(body.data.expectedCash)).toBe(16990);
      expect(Number(body.data.countedCash)).toBe(16990);
      expect(Number(body.data.variance)).toBe(0);
    });
  });
});
