import "dotenv/config";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
  handlers: { GET: vi.fn(), POST: vi.fn() },
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

import { db } from "@/lib/server/db";
import { POST as createAgent } from "@/app/api/agents/route";
import { GET as getAgent, PATCH as updateAgent } from "@/app/api/agents/[agentId]/route";
import { POST as adjustWallet } from "@/app/api/agents/[agentId]/wallet/adjust/route";
import { POST as reverseEntry } from "@/app/api/agents/[agentId]/wallet/reverse/route";
import { GET as getStatement } from "@/app/api/agents/[agentId]/wallet/statement/route";
import * as accessModule from "@/lib/server/access";
import { ForbiddenError } from "@/lib/server/api";

describe("Agent Management & Wallets Integration Tests (Module 10)", () => {
  let companyId: string;
  let stationId: string;
  let userId: string;
  let createdAgentIds: string[] = [];
  let paymentMethodId: string;

  function mockAccessContext(actorId: string, permissions: string[] = []) {
    return {
      userId: actorId,
      companyId,
      sessionId: "agent-test-session",
      name: "Agent Manager",
      email: "manager@aauchamo.local",
      username: "manager_op",
      roleNames: ["SUPER_ADMIN"],
      permissions: new Set(permissions),
      stationIds: new Set([stationId]),
      operatingStationIds: new Set([stationId]),
      businessUnitIds: new Set([]),
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

    // 4. Find valid payment method
    const method = await db.paymentMethod.findFirst({ where: { companyId, isActive: true, type: { not: "WALLET" } } });
    if (!method) throw new Error("Seed missing active payment method.");
    paymentMethodId = method.id;
  });

  afterEach(async () => {
    createdAgentIds = [];
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  it("should enforce Agent CRUD, credit limit updates, controlled adjustments, credit checks, reversals, and statement continuity", async () => {
    // A. Verify Agent Creation
    vi.spyOn(accessModule, "requireAccess").mockResolvedValue(mockAccessContext(userId, ["agents.manage"]) as any);
    vi.spyOn(accessModule, "requirePermission").mockImplementation((ctx, perm) => {
      if (!ctx.permissions.has(perm)) throw new ForbiddenError();
      return ctx;
    });

    const createReq = new Request("http://localhost/api/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        homeStationId: stationId,
        name: "Test Agent Company",
        contactName: "Agent John",
        phone: "+2348031234567",
        email: "john@agentco.local",
        address: "12 Logistics Way",
        creditLimit: "50000.00",
      }),
    });

    const createRes = await createAgent(createReq);
    const createBody = await createRes.json();
    expect(createRes.status).toBe(200);
    expect(createBody.ok).toBe(true);
    expect(createBody.data.id).toBeDefined();
    const agentId = createBody.data.id;
    createdAgentIds.push(agentId);

    // B. Verify Agent Detail fetch (GET /api/agents/[agentId])
    vi.spyOn(accessModule, "requireAccess").mockResolvedValue(mockAccessContext(userId, ["agents.view"]) as any);
    const getRes = await getAgent(new Request(`http://localhost/api/agents/${agentId}`), {
      params: Promise.resolve({ agentId }),
    });
    expect(getRes.status).toBe(200);
    const getBody = await getRes.json();
    expect(getBody.ok).toBe(true);
    expect(getBody.data.agentNumber).toBeDefined();

    // C. Verify profile modification (PATCH /api/agents/[agentId])
    // Attempting profile update (name, contactName) - requires agents.manage
    vi.spyOn(accessModule, "requireAccess").mockResolvedValue(mockAccessContext(userId, ["agents.manage"]) as any);
    const patchReq1 = new Request(`http://localhost/api/agents/${agentId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Updated Agent Company Ltd",
      }),
    });
    const patchRes1 = await updateAgent(patchReq1, { params: Promise.resolve({ agentId }) });
    const patchBody1 = await patchRes1.json();
    expect(patchRes1.status).toBe(200);
    expect(patchBody1.data.name).toBe("Updated Agent Company Ltd");

    // D. Enforce Credit Limit Permission Isolation
    // Attempting creditLimit modification WITHOUT wallet.change_credit_limit should fail
    vi.spyOn(accessModule, "requireAccess").mockResolvedValue(mockAccessContext(userId, ["agents.manage"]) as any);
    const patchReq2 = new Request(`http://localhost/api/agents/${agentId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        creditLimit: "100000.00",
      }),
    });
    const patchRes2 = await updateAgent(patchReq2, { params: Promise.resolve({ agentId }) });
    expect(patchRes2.status).toBe(403); // Forbidden

    // Doing same update WITH wallet.change_credit_limit should succeed
    vi.spyOn(accessModule, "requireAccess").mockResolvedValue(mockAccessContext(userId, ["agents.manage", "wallet.change_credit_limit"]) as any);
    const patchReq3 = new Request(`http://localhost/api/agents/${agentId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        creditLimit: "100000.00",
      }),
    });
    const patchRes3 = await updateAgent(patchReq3, { params: Promise.resolve({ agentId }) });
    const patchBody3 = await patchRes3.json();
    expect(patchRes3.status).toBe(200);
    expect(new Number(patchBody3.data.creditLimit).valueOf()).toBe(100000.00);

    // E. Wallet Credit Adjustment
    vi.spyOn(accessModule, "requireAccess").mockResolvedValue(mockAccessContext(userId, ["wallet.adjust"]) as any);
    const adjustReq1 = new Request(`http://localhost/api/agents/${agentId}/wallet/adjust`, {
      method: "POST",
      headers: { "content-type": "application/json", "idempotency-key": "adj-key-1" },
      body: JSON.stringify({
        stationId,
        type: "ADJUSTMENT_CREDIT",
        amount: "25000.00",
        reason: "Initial onboarding adjustment credit",
      }),
    });
    const adjustRes1 = await adjustWallet(adjustReq1, { params: Promise.resolve({ agentId }) });
    const adjustBody1 = await adjustRes1.json();
    expect(adjustRes1.status).toBe(200);
    expect(adjustBody1.ok).toBe(true);
    expect(new Number(adjustBody1.data.balance).valueOf()).toBe(25000.00);

    // F. Credit Limit Exposure Invariant (spending limit)
    // Wallet balance is currently 25000.00. Credit limit is 100000.00. Permitted exposure = 125000.00.
    // Debit adjustment of 120000.00 should succeed (balance becomes -95000.00 >= -100000.00)
    const adjustReq2 = new Request(`http://localhost/api/agents/${agentId}/wallet/adjust`, {
      method: "POST",
      headers: { "content-type": "application/json", "idempotency-key": "adj-key-2" },
      body: JSON.stringify({
        stationId,
        type: "ADJUSTMENT_DEBIT",
        amount: "120000.00",
        reason: "Test billing debit",
      }),
    });
    const adjustRes2 = await adjustWallet(adjustReq2, { params: Promise.resolve({ agentId }) });
    const adjustBody2 = await adjustRes2.json();
    expect(adjustRes2.status).toBe(200);
    expect(new Number(adjustBody2.data.balance).valueOf()).toBe(-95000.00);

    // Debit adjustment of 10000.00 should fail because balance would become -105000.00 (exceeds 100000 credit limit)
    const adjustReq3 = new Request(`http://localhost/api/agents/${agentId}/wallet/adjust`, {
      method: "POST",
      headers: { "content-type": "application/json", "idempotency-key": "adj-key-3" },
      body: JSON.stringify({
        stationId,
        type: "ADJUSTMENT_DEBIT",
        amount: "10000.00",
        reason: "This debit exceeds credit limit threshold",
      }),
    });
    const adjustRes3 = await adjustWallet(adjustReq3, { params: Promise.resolve({ agentId }) });
    const adjustBody3 = await adjustRes3.json();
    expect(adjustRes3.status).toBe(422); // Unprocessable Entity
    expect(adjustBody3.error.code).toBe("INSUFFICIENT_FUNDS");

    // G. Transaction Reversal & Compensating Ledger Posting
    // Let's get the entries list
    const agentData = await db.agent.findFirstOrThrow({
      where: { id: agentId },
      include: { wallet: { include: { entries: true } } },
    });
    const firstEntry = agentData.wallet?.entries.find((e) => e.type === "ADJUSTMENT_CREDIT");
    expect(firstEntry).toBeDefined();
    const entryId = firstEntry!.id;

    // Reverse the credit entry. This is a debit of 25000.00.
    // New balance will be -95000 - 25000 = -120000, which exceeds credit limit limit (-100000)!
    // Reversal should be blocked by credit checks!
    const reverseReq1 = new Request(`http://localhost/api/agents/${agentId}/wallet/reverse`, {
      method: "POST",
      headers: { "content-type": "application/json", "idempotency-key": "rev-key-1" },
      body: JSON.stringify({
        entryId,
        reason: "Reversing initial credit",
      }),
    });
    const reverseRes1 = await reverseEntry(reverseReq1, { params: Promise.resolve({ agentId }) });
    expect(reverseRes1.status).toBe(422);
    expect((await reverseRes1.json()).error.code).toBe("INSUFFICIENT_FUNDS");

    // Let's bring wallet balance back to safety by posting a credit of 50000.00
    const adjustReq4 = new Request(`http://localhost/api/agents/${agentId}/wallet/adjust`, {
      method: "POST",
      headers: { "content-type": "application/json", "idempotency-key": "adj-key-4" },
      body: JSON.stringify({
        stationId,
        type: "ADJUSTMENT_CREDIT",
        amount: "50000.00",
        reason: "Bringing wallet back to safety",
      }),
    });
    const adjustRes4 = await adjustWallet(adjustReq4, { params: Promise.resolve({ agentId }) });
    expect(adjustRes4.status).toBe(200);

    // Current balance is -95000 + 50000 = -45000.
    // Reversing the first credit entry (debit of 25000) will result in -70000, which is within the credit limit (-100000).
    // Reversal should now succeed!
    const reverseReq1_success = new Request(`http://localhost/api/agents/${agentId}/wallet/reverse`, {
      method: "POST",
      headers: { "content-type": "application/json", "idempotency-key": "rev-key-1-success" },
      body: JSON.stringify({
        entryId,
        reason: "Reversing initial credit",
      }),
    });
    const reverseRes2 = await reverseEntry(reverseReq1_success, { params: Promise.resolve({ agentId }) });
    const reverseBody2 = await reverseRes2.json();
    expect(reverseRes2.status).toBe(200);
    expect(reverseBody2.ok).toBe(true);
    expect(new Number(reverseBody2.data.balance).valueOf()).toBe(-70000.00);

    // Double reversal check: attempting to reverse same entry again should fail
    const reverseReq2 = new Request(`http://localhost/api/agents/${agentId}/wallet/reverse`, {
      method: "POST",
      headers: { "content-type": "application/json", "idempotency-key": "rev-key-2" },
      body: JSON.stringify({
        entryId,
        reason: "Reversing same credit again",
      }),
    });
    const reverseRes3 = await reverseEntry(reverseReq2, { params: Promise.resolve({ agentId }) });
    expect(reverseRes3.status).toBe(422);
    expect((await reverseRes3.json()).error.code).toBe("ALREADY_REVERSED");

    // H. Period Statement exact continuity checks
    vi.spyOn(accessModule, "requireAccess").mockResolvedValue(mockAccessContext(userId, ["wallet.view"]) as any);
    const todayStr = new Date().toISOString().slice(0, 10);
    const tomorrowStr = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

    const statementReq = new Request(`http://localhost/api/agents/${agentId}/wallet/statement?startDate=${todayStr}&endDate=${tomorrowStr}`);
    const statementRes = await getStatement(statementReq, { params: Promise.resolve({ agentId }) });
    const statementBody = await statementRes.json();
    expect(statementRes.status).toBe(200);
    expect(statementBody.ok).toBe(true);
    expect(new Number(statementBody.data.openingBalance).valueOf()).toBe(0);
    expect(new Number(statementBody.data.closingBalance).valueOf()).toBe(-70000);
    expect(statementBody.data.entries.length).toBe(4); // credit-25k, debit-120k, credit-50k, reverse-debit-25k
  }, 90000);
});
