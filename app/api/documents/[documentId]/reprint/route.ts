import { z } from "zod";
import { requireAccess, requirePermission, requireStation } from "@/lib/server/access";
import { apiFailure, apiSuccess, NotFoundError, parseJson, requestIdFrom } from "@/lib/server/api";
import { writeAudit } from "@/lib/server/audit";
import { db } from "@/lib/server/db";

const reprintSchema = z.object({
  format: z.enum(["A4", "A5", "THERMAL_80MM", "THERMAL_58MM", "LABEL"]).default("THERMAL_80MM"),
  printerName: z.string().trim().max(120).optional(),
  reason: z.string().trim().min(3).max(500).optional().default("User requested reprint"),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "documents.view");
    const input = await parseJson(request, reprintSchema);
    const { documentId } = await params;

    const doc = await db.generatedDocument.findFirst({
      where: { id: documentId, companyId: access.companyId },
    });

    if (!doc) throw new NotFoundError("Document not found.");
    if (doc.stationId) requireStation(access, doc.stationId);

    const result = await db.$transaction(async (tx) => {
      const printEvent = await tx.printEvent.create({
        data: {
          documentId,
          printedById: access.userId,
          format: input.format,
          printerName: input.printerName,
          reason: input.reason,
        },
      });

      await writeAudit(tx, {
        companyId: access.companyId,
        actorId: access.userId,
        stationId: doc.stationId,
        action: "document.reprinted",
        entityType: "GeneratedDocument",
        entityId: doc.id,
        requestId,
        metadata: {
          documentNumber: doc.documentNumber,
          documentType: doc.documentType,
          format: input.format,
          reason: input.reason,
          printerName: input.printerName,
        },
      });

      return printEvent;
    });

    return apiSuccess(
      {
        printEvent: result,
        document: doc,
      },
      requestId,
      { created: true }
    );
  } catch (error) {
    return apiFailure(error, requestId);
  }
}
