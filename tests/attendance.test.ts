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
import { GET as getAttendance, POST as postAttendance } from "@/app/api/staff/attendance/route";

afterEach(() => {
  vi.restoreAllMocks();
});

let companyId: string;
let adminUserId: string;
let staffId: string;
let hqStationId: string;

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

  const dept = await db.department.findFirst({ where: { companyId } });
  const pos = await db.position.findFirst({ where: { companyId } });
  if (!dept || !pos) throw new Error("Seed data missing department or position");

  // Create a staff record linked to adminUserId
  const existingStaff = await db.staff.findFirst({ where: { userId: adminUserId } });
  if (existingStaff) {
    staffId = existingStaff.id;
  } else {
    const created = await db.staff.create({
      data: {
        companyId,
        firstName: "Test",
        lastName: "User",
        staffNumber: "STF99999",
        phone: "1234567890",
        email: "test@aauchamo.local",
        employmentDate: new Date(),
        employmentType: "PERMANENT",
        departmentId: dept.id,
        positionId: pos.id,
        homeStationId: hqStationId,
        userId: adminUserId,
      }
    });
    staffId = created.id;
  }
});

function userAccess() {
  return {
    userId: adminUserId,
    companyId,
    sessionId: "session-user",
    name: "Test User",
    email: "test@aauchamo.local",
    username: "testuser",
    roleNames: ["STAFF"],
    permissions: new Set(["staff.view"]),
    stationIds: new Set([hqStationId]),
    operatingStationIds: new Set([hqStationId]),
    businessUnitIds: new Set([]),
    companyWide: false,
  };
}

describe("Staff Attendance Logs (Module 04 Expansion)", () => {
  it("records clock-in event with coordinates successfully", async () => {
    vi.spyOn(accessModule, "requireAccess").mockResolvedValue(userAccess() as any);
    vi.spyOn(accessModule, "requirePermission").mockReturnValue(userAccess() as any);

    // Clean today's attendance log if any
    const today = new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()));
    await db.staffAttendance.deleteMany({ where: { staffId, date: today } });

    const request = new Request("http://localhost/api/staff/attendance", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "in",
        latitude: 6.5244,
        longitude: 3.3792,
        notes: "Clocking in from Lagos HQ",
      }),
    });

    const response = await postAttendance(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.clockInLatitude).toBe(6.5244);
    expect(body.data.clockInLongitude).toBe(3.3792);
    expect(body.data.notes).toBe("Clocking in from Lagos HQ");
  });

  it("fails when attempting duplicate clock-in for the same day", async () => {
    vi.spyOn(accessModule, "requireAccess").mockResolvedValue(userAccess() as any);
    vi.spyOn(accessModule, "requirePermission").mockReturnValue(userAccess() as any);

    const request = new Request("http://localhost/api/staff/attendance", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "in",
        latitude: 6.5244,
        longitude: 3.3792,
      }),
    });

    const response = await postAttendance(request);
    const body = await response.json();

    expect(body.ok).toBe(false);
    expect(body.error?.message).toContain("already clocked in");
  });

  it("records clock-out event with coordinates successfully", async () => {
    vi.spyOn(accessModule, "requireAccess").mockResolvedValue(userAccess() as any);
    vi.spyOn(accessModule, "requirePermission").mockReturnValue(userAccess() as any);

    const request = new Request("http://localhost/api/staff/attendance", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "out",
        latitude: 6.5245,
        longitude: 3.3793,
        notes: "Leaving Lagos HQ",
      }),
    });

    const response = await postAttendance(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.clockOutAt).toBeDefined();
    expect(body.data.clockOutLatitude).toBe(6.5245);
    expect(body.data.clockOutLongitude).toBe(3.3793);
    expect(body.data.notes).toContain("Leaving Lagos HQ");
  });

  it("lists attendance logs for physical employees", async () => {
    vi.spyOn(accessModule, "requireAccess").mockResolvedValue(userAccess() as any);
    vi.spyOn(accessModule, "requirePermission").mockReturnValue(userAccess() as any);

    const request = new Request(`http://localhost/api/staff/attendance?staffId=${staffId}`);
    const response = await getAttendance(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data[0].staff.firstName).toBe("Test");
  });
});
