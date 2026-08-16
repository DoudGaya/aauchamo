import { z } from "zod";
import { requireAccess, requirePermission } from "@/lib/server/access";
import { apiFailure, apiSuccess, AppError, parseJson, requestIdFrom } from "@/lib/server/api";

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "text/csv",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const presignSchema = z.object({
  filename: z.string().min(1).max(255),
  mimeType: z.string().min(1),
  sizeBytes: z.number().positive(),
  checksumSha256: z.string().regex(/^[a-fA-F0-9]{64}$/, "Must be 64-character hex SHA-256 checksum"),
  module: z.string().min(1).max(50),
  recordType: z.string().min(1).max(50),
  recordId: z.string().min(1),
});

export async function POST(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "documents.upload");
    const input = await parseJson(request, presignSchema);

    if (input.sizeBytes > MAX_FILE_SIZE) {
      throw new AppError("BAD_REQUEST", `File size exceeds 10MB limit (provided ${Math.round(input.sizeBytes / 1024 / 1024)}MB).`);
    }

    if (!ALLOWED_MIME_TYPES.has(input.mimeType.toLowerCase())) {
      throw new AppError("BAD_REQUEST", `Unsupported file MIME type: ${input.mimeType}. Allowed types: PDF, PNG, JPEG, WEBP, CSV, XLSX, TXT.`);
    }

    const safeFilename = input.filename.replaceAll(/[^a-zA-Z0-9._-]/g, "_");
    const timestamp = Date.now();
    const objectKey = `attachments/${access.companyId}/${input.module.toLowerCase()}/${timestamp}-${safeFilename}`;
    const uploadToken = `up_token_${Buffer.from(`${access.companyId}:${objectKey}:${input.checksumSha256}`).toString("base64url")}`;

    return apiSuccess(
      {
        uploadUrl: `https://storage.aauchamo.local/${objectKey}`,
        bucket: "aau-chamo-attachments",
        objectKey,
        uploadToken,
        expiresAt: new Date(timestamp + 3600 * 1000).toISOString(), // 1 hour
        maxSizeBytes: MAX_FILE_SIZE,
      },
      requestId
    );
  } catch (error) {
    return apiFailure(error, requestId);
  }
}
