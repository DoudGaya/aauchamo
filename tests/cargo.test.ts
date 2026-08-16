import "dotenv/config";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
  handlers: { GET: vi.fn(), POST: vi.fn() },
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

import { db } from "@/lib/server/db";
import { POST as createCargo } from "@/app/api/cargo/route";
import { PATCH as updateCargo } from "@/app/api/cargo/[shipmentId]/route";
import { POST as changeStatus } from "@/app/api/cargo/[shipmentId]/status/route";
import { POST as decideApproval } from "@/app/api/approvals/[approvalId]/decision/route";
import * as accessModule from "@/lib/server/access";

describe("Cargo & AWB Labeling Integration Tests (Module 8)", () => {
  let companyId: string;
  let stationId: string;
  let customerId: string;
  let userId: string;
  let supervisorId: string;
  let createdShipmentIds: string[] = [];

  function mockAccessContext(
    actorId: string,
    permissions: string[] = ["cargo.create", "cargo.update_draft", "cargo.change_status", "cargo.edit_label"]
  ) {
    return {
      userId: actorId,
      companyId,
      sessionId: "cargo-test-session",
      name: "Cargo Operator",
      email: "cargo@aauchamo.local",
      username: "cargo_op",
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

    // 3. Find customer
    const customer = await db.customer.findFirst({ where: { companyId, status: "ACTIVE" } });
    if (!customer) throw new Error("Seed missing active customer.");
    customerId = customer.id;

    // 4. Find super admin user (maker)
    const admin = await db.user.findFirst({ where: { companyId, email: "admin@aauchamo.local" } });
    if (!admin) throw new Error("Seed missing admin user.");
    userId = admin.id;

    // 5. Find / Create supervisor user (checker)
    const supervisor = await db.user.findFirst({ where: { companyId, NOT: { id: userId } } });
    if (supervisor) {
      supervisorId = supervisor.id;
    } else {
      const createdSupervisor = await db.user.create({
        data: {
          companyId,
          email: "supervisor@aauchamo.local",
          firstName: "Supervisor",
          lastName: "Chamo",
          passwordHash: "dummy-hash",
          username: "supervisor1",
        },
      });
      supervisorId = createdSupervisor.id;

      // Assign role with approvals permission to supervisor
      const role = await db.role.findFirst({ where: { companyId, code: "SUPER_ADMIN" } });
      if (role) {
        await db.userRole.create({
          data: {
            userId: supervisorId,
            roleId: role.id,
          },
        });
      }
    }
  });

  afterEach(async () => {
    if (createdShipmentIds.length) {
      await db.approvalRequest.deleteMany({
        where: {
          companyId,
          entityType: "CargoShipment",
          entityId: { in: createdShipmentIds },
        },
      });

      await db.cargoStatusEvent.deleteMany({
        where: {
          shipmentId: { in: createdShipmentIds },
        },
      });

      await db.generatedDocument.deleteMany({
        where: {
          companyId,
          sourceType: "CargoShipment",
          sourceId: { in: createdShipmentIds },
        },
      });

      await db.cargoShipment.deleteMany({
        where: {
          id: { in: createdShipmentIds },
        },
      });

      createdShipmentIds = [];
    }
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  it("should enforce complete Cargo lifecycle from creation, draft edit, dispatch, correction request, and supervisor approval", async () => {
    // Mock user access checks for Maker (Admin)
    vi.spyOn(accessModule, "requireAccess").mockResolvedValue(mockAccessContext(userId) as any);
    vi.spyOn(accessModule, "requirePermission").mockImplementation((ctx, perm) => {
      if (!ctx.permissions.has(perm)) throw new Error("Forbidden");
      return ctx;
    });

    // 1. Create a Cargo Shipment
    const createReq = new Request("http://localhost/api/cargo", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        stationId,
        customerId,
        senderName: "Ngozi Obi",
        senderPhone: "+2348011112222",
        receiverName: "Chinedu Oke",
        receiverPhone: "+2348022223333",
        receiverAddress: "12 Airport Road, Ikeja, Lagos",
        origin: "KAN",
        destination: "LOS",
        weightKg: "12.500",
        pieces: 3,
        commodity: "General Cargo - Electronics",
        airline: "Max Air",
        flightNumber: "VM204",
        flightDate: "2026-09-10T00:00:00.000Z",
        handlingNotes: "Fragile - Handle with care",
        declaredValue: "50000.00",
      }),
    });

    const createRes = await createCargo(createReq);
    expect(createRes.status).toBe(200);

    const cargoEnvelope = await createRes.json();
    expect(cargoEnvelope.ok).toBe(true);
    const shipment = cargoEnvelope.data;
    createdShipmentIds.push(shipment.id);
    expect(shipment.status).toBe("LABELLED");
    expect(shipment.labelVersion).toBe(1);
    expect(shipment.reprintCount).toBe(0);

    // Verify label document was generated
    const doc = await db.generatedDocument.findFirst({
      where: { sourceType: "CargoShipment", sourceId: shipment.id },
    });
    expect(doc).toBeDefined();
    expect(doc?.documentType).toBe("CARGO_LABEL");
    expect(doc?.version).toBe(1);

    // 2. Direct Update of Pre-dispatched (Draft/Labelled) Cargo Shipment
    const editReq = new Request(`http://localhost/api/cargo/${shipment.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        weightKg: "14.200",
        pieces: 4,
        commodity: "General Cargo - Upgraded Electronics",
      }),
    });

    const editRes = await updateCargo(editReq, { params: Promise.resolve({ shipmentId: shipment.id }) });
    expect(editRes.status).toBe(200);

    const editEnvelope = await editRes.json();
    expect(editEnvelope.ok).toBe(true);
    expect(Number(editEnvelope.data.weightKg).toFixed(3)).toBe("14.200");
    expect(editEnvelope.data.pieces).toBe(4);
    // Since printed fields changed, labelVersion is bumped
    expect(editEnvelope.data.labelVersion).toBe(2);

    const updatedDoc = await db.generatedDocument.findUniqueOrThrow({
      where: { id: doc!.id },
    });
    expect(updatedDoc.version).toBe(2);

    // 3. Dispatch Cargo (Immutability lock starts)
    const statusReq = new Request(`http://localhost/api/cargo/${shipment.id}/status`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        status: "DISPATCHED",
        location: "Kano Intl Airport (KAN)",
        notes: "Cargo loaded and dispatched flight VM204",
      }),
    });

    const statusRes = await changeStatus(statusReq, { params: Promise.resolve({ shipmentId: shipment.id }) });
    expect(statusRes.status).toBe(200);

    const statusEnvelope = await statusRes.json();
    expect(statusEnvelope.ok).toBe(true);
    expect(statusEnvelope.data.status).toBe("DISPATCHED");

    // 4. Try to directly edit dispatched cargo - Should require Correction Approval
    const correctReq = new Request(`http://localhost/api/cargo/${shipment.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        weightKg: "15.000",
        pieces: 5,
        reason: "Weight correction after custom audit",
      }),
    });

    const correctRes = await updateCargo(correctReq, { params: Promise.resolve({ shipmentId: shipment.id }) });
    expect(correctRes.status).toBe(200);

    const correctEnvelope = await correctRes.json();
    expect(correctEnvelope.ok).toBe(true);
    expect(correctEnvelope.data.approvalRequired).toBe(true);
    const approvalId = correctEnvelope.data.approvalId;
    expect(approvalId).toBeDefined();

    // Verify cargo shipment in DB was not updated yet
    const shipmentInDb = await db.cargoShipment.findUniqueOrThrow({ where: { id: shipment.id } });
    expect(Number(shipmentInDb.weightKg).toFixed(3)).toBe("14.200");
    expect(shipmentInDb.pieces).toBe(4);

    // 5. Supervisor Decides (Approves) the Correction Request
    // Mock user access checks for Checker (Supervisor)
    vi.spyOn(accessModule, "requireAccess").mockResolvedValue(
      mockAccessContext(supervisorId, ["approvals.decide", "cargo.edit_label"]) as any
    );

    const approveReq = new Request(`http://localhost/api/approvals/${approvalId}/decision`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        decision: "APPROVED",
        reason: "Valid correction request. Verified with customs logs.",
        version: 1,
      }),
    });

    const approveRes = await decideApproval(approveReq, { params: Promise.resolve({ approvalId }) });
    expect(approveRes.status).toBe(200);

    const approveEnvelope = await approveRes.json();
    expect(approveEnvelope.ok).toBe(true);
    expect(approveEnvelope.data.status).toBe("APPROVED");

    // Verify cargo shipment was successfully updated after approval
    const correctedShipment = await db.cargoShipment.findUniqueOrThrow({ where: { id: shipment.id } });
    expect(Number(correctedShipment.weightKg).toFixed(3)).toBe("15.000");
    expect(correctedShipment.pieces).toBe(5);
    // Bumps version and labelVersion
    expect(correctedShipment.labelVersion).toBe(3);

    // Verify document was bumped to v3
    const finalDoc = await db.generatedDocument.findUniqueOrThrow({ where: { id: doc!.id } });
    expect(finalDoc.version).toBe(3);
  });
});
