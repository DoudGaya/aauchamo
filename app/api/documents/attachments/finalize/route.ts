import { z } from "zod";
import { requireAccess, requirePermission } from "@/lib/server/access";
import { apiFailure, apiSuccess, AppError, parseJson, requestIdFrom } from "@/lib/server/api";
import { writeAudit } from "@/lib/server/audit";
import { db } from "@/lib/server/db";

const finalizeSchema = z.object({
  objectKey: z.string().min(1),
  originalName: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().positive(),
  checksumSha256: z.string().min(1),
  module: z.string().min(1),
  recordType: z.string().min(1),
  recordId: z.string().min(1),
  stationId: z.string().optional(),
});

export async function POST(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "documents.upload");
    const input = await parseJson(request, finalizeSchema);

    // Validate key prefix matches companyId
    const expectedPrefix = `attachments/${access.companyId}/`;
    if (!input.objectKey.startsWith(expectedPrefix)) {
      throw new AppError("BAD_REQUEST", `Invalid objectKey prefix. Must begin with ${expectedPrefix}`);
    }

    const attachment = await db.$transaction(async (tx) => {
      const created = await tx.attachment.create({
        data: {
          companyId: access.companyId,
          stationId: input.stationId ?? null,
          uploadedById: access.userId,
          module: input.module,
          recordType: input.recordType,
          recordId: input.recordId,
          bucket: "aau-chamo-attachments",
          objectKey: input.objectKey,
          originalName: input.originalName,
          mimeType: input.mimeType,
          sizeBytes: BigInt(input.sizeBytes),
          checksumSha256: input.checksumSha256,
        },
      });

      await writeAudit(tx, {
        companyId: access.companyId,
        actorId: access.userId,
        stationId: input.stationId ?? null,
        action: "document.attachment_uploaded",
        entityType: "Attachment",
        entityId: created.id,
        requestId,
        metadata: {
          originalName: input.originalName,
          sizeBytes: input.sizeBytes,
          checksumSha256: input.checksumSha256,
          module: input.module,
          recordType: input.recordType,
          recordId: input.recordId,
        },
      });

      return created;
    });

    return apiSuccess(
      {
        ...attachment,
        sizeBytes: Number(attachment.sizeBytes),
      },
      requestId,
      { created: true }
    );
  } catch (error) {
    return apiFailure(error, requestId);
  }
}
