import "dotenv/config";
import { vi, describe, it, expect, beforeAll } from "vitest";
vi.mock("@/auth", () => ({
  auth: vi.fn(),
  handlers: { GET: vi.fn(), POST: vi.fn() },
}));

import { db } from "@/lib/server/db";
import { POST as generateDocument } from "@/app/api/documents/generate/route";
import { GET as getDocuments } from "@/app/api/documents/route";
import { GET as getDocumentDetail } from "@/app/api/documents/[documentId]/route";
import { POST as reprintDocument } from "@/app/api/documents/[documentId]/reprint/route";
import { POST as presignAttachment } from "@/app/api/documents/attachments/presign/route";
import { POST as finalizeAttachment } from "@/app/api/documents/attachments/finalize/route";
import { GET as getAttachmentLink } from "@/app/api/documents/attachments/[attachmentId]/route";
import * as accessModule from "@/lib/server/access";

function mockAccessContext(
  userId: string,
  companyId: string,
  stationId: string,
  permissions: string[] = ["documents.view", "documents.upload"]
) {
  return {
    userId,
    companyId,
    sessionId: "test-session-docs",
    name: "Documents User",
    email: "docs@user.local",
    username: "docsuser",
    roleNames: ["SUPER_ADMIN"],
    permissions: new Set(permissions),
    stationIds: new Set([stationId]),
    operatingStationIds: new Set([stationId]),
    businessUnitIds: new Set([]),
    companyWide: true,
  };
}

describe("Printing & Documents Integration Tests (Module 13)", () => {
  let companyId: string;
  let stationId: string;
  let userId: string;
  let saleId: string;
  let createdDocumentId: string;
  let createdAttachmentId: string;

  beforeAll(async () => {
    const company = await db.company.findFirstOrThrow({ where: { code: "AAU-CHAMO" } });
    companyId = company.id;

    const station = await db.station.findFirst({ where: { companyId, status: "ACTIVE" } });
    if (!station) throw new Error("Seed missing active station.");
    stationId = station.id;

    const admin = await db.user.findFirst({ where: { companyId, email: "admin@aauchamo.local" } });
    if (!admin) throw new Error("Seed missing admin user.");
    userId = admin.id;

    const sale = await db.sale.findFirst({ where: { companyId } });
    if (!sale) throw new Error("Seed missing sale for testing.");
    saleId = sale.id;
  });

  it("should generate a new document record and write audit trail", async () => {
    const access = mockAccessContext(userId, companyId, stationId);
    vi.spyOn(accessModule, "requireAccess").mockResolvedValue(access as any);
    vi.spyOn(accessModule, "requirePermission").mockImplementation((ctx) => ctx as any);

    const req = new Request("http://localhost/api/documents/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sourceType: "Sale",
        sourceId: saleId,
        documentType: "SALES_RECEIPT",
        format: "THERMAL_80MM",
      }),
    });

    const res = await generateDocument(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.id).toBeDefined();
    expect(body.data.documentType).toBe("SALES_RECEIPT");
    expect(body.data.version).toBeGreaterThanOrEqual(1);

    createdDocumentId = body.data.id;
  });

  it("should fetch generated documents list with station and type filters", async () => {
    const access = mockAccessContext(userId, companyId, stationId);
    vi.spyOn(accessModule, "requireAccess").mockResolvedValue(access as any);
    vi.spyOn(accessModule, "requirePermission").mockImplementation((ctx) => ctx as any);

    const req = new Request(`http://localhost/api/documents?type=SALES_RECEIPT&stationId=${stationId}`);
    const res = await getDocuments(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
  });

  it("should fetch document detail with version history lineage", async () => {
    const access = mockAccessContext(userId, companyId, stationId);
    vi.spyOn(accessModule, "requireAccess").mockResolvedValue(access as any);
    vi.spyOn(accessModule, "requirePermission").mockImplementation((ctx) => ctx as any);

    const req = new Request(`http://localhost/api/documents/${createdDocumentId}`);
    const res = await getDocumentDetail(req, { params: Promise.resolve({ documentId: createdDocumentId }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.document.id).toBe(createdDocumentId);
    expect(Array.isArray(body.data.lineage)).toBe(true);
  });

  it("should audit reprint request and create PrintEvent record", async () => {
    const access = mockAccessContext(userId, companyId, stationId);
    vi.spyOn(accessModule, "requireAccess").mockResolvedValue(access as any);
    vi.spyOn(accessModule, "requirePermission").mockImplementation((ctx) => ctx as any);

    const req = new Request(`http://localhost/api/documents/${createdDocumentId}/reprint`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        format: "THERMAL_80MM",
        reason: "Customer paper copy request",
      }),
    });

    const res = await reprintDocument(req, { params: Promise.resolve({ documentId: createdDocumentId }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.printEvent).toBeDefined();
    expect(body.data.printEvent.documentId).toBe(createdDocumentId);
    expect(body.data.printEvent.format).toBe("THERMAL_80MM");
  });

  it("should presign attachment upload with valid metadata", async () => {
    const access = mockAccessContext(userId, companyId, stationId);
    vi.spyOn(accessModule, "requireAccess").mockResolvedValue(access as any);
    vi.spyOn(accessModule, "requirePermission").mockImplementation((ctx) => ctx as any);

    const req = new Request("http://localhost/api/documents/attachments/presign", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        filename: "test-invoice.pdf",
        mimeType: "application/pdf",
        sizeBytes: 1024 * 500, // 500 KB
        checksumSha256: "a".repeat(64),
        module: "sales",
        recordType: "Sale",
        recordId: saleId,
      }),
    });

    const res = await presignAttachment(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.objectKey).toContain(`attachments/${companyId}/sales/`);
    expect(body.data.uploadToken).toBeDefined();
  });

  it("should reject attachment presign exceeding 10MB limit", async () => {
    const access = mockAccessContext(userId, companyId, stationId);
    vi.spyOn(accessModule, "requireAccess").mockResolvedValue(access as any);
    vi.spyOn(accessModule, "requirePermission").mockImplementation((ctx) => ctx as any);

    const req = new Request("http://localhost/api/documents/attachments/presign", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        filename: "oversized-file.pdf",
        mimeType: "application/pdf",
        sizeBytes: 15 * 1024 * 1024, // 15 MB (over 10MB limit)
        checksumSha256: "b".repeat(64),
        module: "sales",
        recordType: "Sale",
        recordId: saleId,
      }),
    });

    const res = await presignAttachment(req);
    expect(res.status).toBe(400);
  });

  it("should finalize attachment upload and save database record", async () => {
    const access = mockAccessContext(userId, companyId, stationId);
    vi.spyOn(accessModule, "requireAccess").mockResolvedValue(access as any);
    vi.spyOn(accessModule, "requirePermission").mockImplementation((ctx) => ctx as any);

    const objectKey = `attachments/${companyId}/sales/test-${Date.now()}.pdf`;

    const req = new Request("http://localhost/api/documents/attachments/finalize", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        objectKey,
        originalName: "test-invoice.pdf",
        mimeType: "application/pdf",
        sizeBytes: 1024 * 500,
        checksumSha256: "c".repeat(64),
        module: "sales",
        recordType: "Sale",
        recordId: saleId,
      }),
    });

    const res = await finalizeAttachment(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.id).toBeDefined();
    expect(body.data.objectKey).toBe(objectKey);

    createdAttachmentId = body.data.id;
  });

  it("should generate signed download link for valid attachment", async () => {
    const access = mockAccessContext(userId, companyId, stationId);
    vi.spyOn(accessModule, "requireAccess").mockResolvedValue(access as any);
    vi.spyOn(accessModule, "requirePermission").mockImplementation((ctx) => ctx as any);

    const req = new Request(`http://localhost/api/documents/attachments/${createdAttachmentId}`);
    const res = await getAttachmentLink(req, { params: Promise.resolve({ attachmentId: createdAttachmentId }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.downloadUrl).toContain("/api/documents/download?token=");
    expect(body.data.expiresAt).toBeDefined();
  });
});
