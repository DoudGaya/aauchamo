import { requireAccess, requirePermission } from "@/lib/server/access";
import { apiFailure, apiSuccess, NotFoundError, requestIdFrom } from "@/lib/server/api";
import { db } from "@/lib/server/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ attachmentId: string }> }
) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "documents.view");
    const { attachmentId } = await params;

    const attachment = await db.attachment.findFirst({
      where: { id: attachmentId, companyId: access.companyId },
    });

    if (!attachment) throw new NotFoundError("Attachment not found.");

    // Generate signed download link valid for 15 minutes
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const downloadToken = Buffer.from(
      JSON.stringify({
        attachmentId: attachment.id,
        userId: access.userId,
        expires: expiresAt.getTime(),
      })
    ).toString("base64url");

    const downloadUrl = `/api/documents/download?token=${downloadToken}`;

    return apiSuccess(
      {
        id: attachment.id,
        originalName: attachment.originalName,
        mimeType: attachment.mimeType,
        sizeBytes: Number(attachment.sizeBytes),
        checksumSha256: attachment.checksumSha256,
        objectKey: attachment.objectKey,
        downloadUrl,
        expiresAt: expiresAt.toISOString(),
      },
      requestId
    );
  } catch (error) {
    return apiFailure(error, requestId);
  }
}
