import { requireAccess, requirePermission, requireStation } from "@/lib/server/access";
import { apiFailure, apiSuccess, NotFoundError, requestIdFrom } from "@/lib/server/api";
import { db } from "@/lib/server/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "documents.view");
    const { documentId } = await params;

    const doc = await db.generatedDocument.findFirst({
      where: { id: documentId, companyId: access.companyId },
      include: {
        station: { select: { id: true, code: true, name: true } },
        prints: {
          orderBy: { printedAt: "desc" },
          take: 50,
        },
      },
    });

    if (!doc) throw new NotFoundError("Document not found.");
    if (doc.stationId) requireStation(access, doc.stationId);

    // Fetch version lineage for the same source entity
    const versions = await db.generatedDocument.findMany({
      where: {
        companyId: access.companyId,
        sourceType: doc.sourceType,
        sourceId: doc.sourceId,
        documentType: doc.documentType,
      },
      select: { id: true, version: true, documentNumber: true, createdAt: true, status: true },
      orderBy: { version: "desc" },
    });

    return apiSuccess({ document: doc, lineage: versions }, requestId);
  } catch (error) {
    return apiFailure(error, requestId);
  }
}
