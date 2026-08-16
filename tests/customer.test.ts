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
import { GET as getCustomerHistory } from "@/app/api/customers/[customerId]/history/route";
import { POST as mergeCustomer } from "@/app/api/customers/[customerId]/merge/route";

afterEach(() => {
  vi.restoreAllMocks();
});

let companyId: string;
let adminUserId: string;
let hqStationId: string;
let sourceCustomerId: string;
let targetCustomerId: string;

beforeAll(async () => {
  const company = await db.company.findFirst();
  if (!company) throw new Error("Seed data missing company");
  companyId = company.id;

  const user = await db.user.findFirst({ where: { companyId } });
  if (!user) throw new Error("Seed data missing user");
  adminUserId = user.id;

  const station = await db.station.findFirst({ where: { companyId } });
  if (!station) throw new Error("Seed data missing station");
  hqStationId = station.id;

  // Clean up any stale records from previous runs
  const testCustomers = await db.customer.findMany({
    where: {
      customerNumber: { in: ["CUST-SRC-9999", "CUST-TGT-9999"] }
    },
    select: { id: true }
  });
  const testIds = testCustomers.map((c) => c.id);
  for (const id of testIds) {
    await db.customer.update({
      where: { id },
      data: { customerNumber: `OLD-CUST-${Math.random().toString(36).slice(2, 9)}` }
    });
  }

  // Create two customers
  const c1 = await db.customer.create({
    data: {
      companyId,
      homeStationId: hqStationId,
      customerNumber: "CUST-SRC-9999",
      firstName: "Source",
      lastName: "Customer",
      displayName: "Source Customer",
      primaryPhone: "+2348000000001",
      normalizedPhone: "+2348000000001",
      type: "INDIVIDUAL",
    }
  });
  sourceCustomerId = c1.id;

  const c2 = await db.customer.create({
    data: {
      companyId,
      homeStationId: hqStationId,
      customerNumber: "CUST-TGT-9999",
      firstName: "Target",
      lastName: "Customer",
      displayName: "Target Customer",
      primaryPhone: "+2348000000002",
      normalizedPhone: "+2348000000002",
      type: "INDIVIDUAL",
    }
  });
  targetCustomerId = c2.id;
});

function superAdminAccess() {
  return {
    userId: adminUserId,
    companyId,
    sessionId: "session-admin",
    name: "Super Admin",
    email: "admin@aauchamo.local",
    username: "superadmin",
    roleNames: ["SUPER_ADMIN"],
    permissions: new Set([
      "customers.view",
      "customers.view_history",
      "customers.update",
    ]),
    stationIds: new Set([hqStationId]),
    operatingStationIds: new Set([hqStationId]),
    businessUnitIds: new Set([]),
    companyWide: true,
  };
}

describe("Customer Management & Duplicate Merging (Module 05)", () => {
  it("fetches history logs (sales, cargo, bookings) successfully", async () => {
    vi.spyOn(accessModule, "requireAccess").mockResolvedValue(superAdminAccess() as any);
    vi.spyOn(accessModule, "requirePermission").mockReturnValue(superAdminAccess() as any);

    const request = new Request(`http://localhost/api/customers/${sourceCustomerId}/history`);
    const response = await getCustomerHistory(request, { params: Promise.resolve({ customerId: sourceCustomerId }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.sales).toBeDefined();
    expect(body.data.cargo).toBeDefined();
    expect(body.data.bookings).toBeDefined();
  });

  it("executes duplicate customer merge, transferring records and deactivating source", async () => {
    vi.spyOn(accessModule, "requireAccess").mockResolvedValue(superAdminAccess() as any);
    vi.spyOn(accessModule, "requirePermission").mockReturnValue(superAdminAccess() as any);

    const request = new Request(`http://localhost/api/customers/${sourceCustomerId}/merge`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        targetCustomerId,
        reason: "Merging duplicate accounts created during testing.",
      }),
    });

    const response = await mergeCustomer(request, { params: Promise.resolve({ customerId: sourceCustomerId }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.success).toBe(true);
    expect(body.data.targetCustomerId).toBe(targetCustomerId);

    // Verify source customer is now MERGED
    const updatedSource = await db.customer.findUnique({ where: { id: sourceCustomerId } });
    expect(updatedSource?.status).toBe("MERGED");
    expect(updatedSource?.mergedIntoId).toBe(targetCustomerId);
  });
});
