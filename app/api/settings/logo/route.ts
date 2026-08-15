import { requireAccess, requirePermission } from "@/lib/server/access";
import { AppError, apiFailure, apiSuccess, requestIdFrom } from "@/lib/server/api";
import { writeAudit } from "@/lib/server/audit";
import { db } from "@/lib/server/db";

const ALLOWED_MIME = new Set(["image/png", "image/jpeg", "image/svg+xml", "image/webp"]);
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB

export async function POST(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "settings.manage");

    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("multipart/form-data")) {
      throw new AppError("INVALID_REQUEST", "Expected multipart/form-data.", 400);
    }

    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      throw new AppError("MISSING_FILE", "A file field is required.", 422);
    }

    if (!ALLOWED_MIME.has(file.type)) {
      throw new AppError(
        "INVALID_FILE_TYPE",
        "Logo must be a PNG, JPEG, SVG, or WebP image.",
        422,
      );
    }

    const buffer = await file.arrayBuffer();
    if (buffer.byteLength > MAX_BYTES) {
      throw new AppError("FILE_TOO_LARGE", "Logo must be 2 MB or smaller.", 422);
    }

    // Encode as base64 data URL — works locally without an S3 bucket.
    // In production with S3, replace this with an object-storage upload
    // and store the resulting key instead of the full data URL.
    const base64 = Buffer.from(buffer).toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    const { searchParams } = new URL(request.url);
    const theme = searchParams.get("theme") === "dark" ? "dark" : "light";

    const before = await db.company.findUniqueOrThrow({
      where: { id: access.companyId },
      select: { logoObjectKey: true, logoDarkObjectKey: true },
    });

    const updated = await db.$transaction(async (tx) => {
      const dataUpdate = theme === "dark"
        ? { logoDarkObjectKey: dataUrl, updatedById: access.userId }
        : { logoObjectKey: dataUrl, updatedById: access.userId };

      const company = await tx.company.update({
        where: { id: access.companyId },
        data: dataUpdate,
        select: { id: true, logoObjectKey: true, logoDarkObjectKey: true, displayName: true },
      });

      await writeAudit(tx, {
        companyId: access.companyId,
        actorId: access.userId,
        action: "settings.logo.updated",
        entityType: "Company",
        entityId: access.companyId,
        requestId,
        before: theme === "dark" 
          ? { logoDarkObjectKey: before.logoDarkObjectKey ? "[previous dark logo]" : null }
          : { logoObjectKey: before.logoObjectKey ? "[previous logo]" : null },
        after: theme === "dark"
          ? { logoDarkObjectKey: "[new dark logo uploaded]" }
          : { logoObjectKey: "[new logo uploaded]" },
      });

      return company;
    });

    return apiSuccess(
      { logoUrl: theme === "dark" ? updated.logoDarkObjectKey : updated.logoObjectKey },
      requestId
    );
  } catch (error) {
    return apiFailure(error, requestId);
  }
}

export async function DELETE(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "settings.manage");
    const { searchParams } = new URL(request.url);
    const theme = searchParams.get("theme") === "dark" ? "dark" : "light";

    const before = await db.company.findUniqueOrThrow({
      where: { id: access.companyId },
      select: { logoObjectKey: true, logoDarkObjectKey: true },
    });

    const updated = await db.$transaction(async (tx) => {
      const dataUpdate = theme === "dark"
        ? { logoDarkObjectKey: null, updatedById: access.userId }
        : { logoObjectKey: null, updatedById: access.userId };

      const company = await tx.company.update({
        where: { id: access.companyId },
        data: dataUpdate,
        select: { id: true, logoObjectKey: true, logoDarkObjectKey: true },
      });

      await writeAudit(tx, {
        companyId: access.companyId,
        actorId: access.userId,
        action: "settings.logo.deleted",
        entityType: "Company",
        entityId: access.companyId,
        requestId,
        before: theme === "dark"
          ? { logoDarkObjectKey: before.logoDarkObjectKey }
          : { logoObjectKey: before.logoObjectKey },
        after: theme === "dark"
          ? { logoDarkObjectKey: null }
          : { logoObjectKey: null },
      });

      return company;
    });

    return apiSuccess(
      { logoUrl: theme === "dark" ? updated.logoDarkObjectKey : updated.logoObjectKey },
      requestId
    );
  } catch (error) {
    return apiFailure(error, requestId);
  }
}

