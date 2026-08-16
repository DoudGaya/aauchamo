import { z } from "zod";
import { requireAccess, requirePermission } from "@/lib/server/access";
import { apiFailure, apiSuccess, NotFoundError, parseJson, requestIdFrom } from "@/lib/server/api";
import { writeAudit } from "@/lib/server/audit";
import { db } from "@/lib/server/db";

const generateSchema = z.object({
  sourceType: z.enum(["Sale", "CargoShipment", "WalletAccount", "Report", "Customer"]),
  sourceId: z.string().min(1),
  documentType: z.enum([
    "SALES_RECEIPT",
    "SALES_INVOICE",
    "PAYMENT_RECEIPT",
    "CARGO_LABEL",
    "AGENT_STATEMENT",
    "FINANCIAL_REPORT",
    "INVENTORY_REPORT",
  ]),
  templateKey: z.string().optional(),
  format: z.enum(["THERMAL_80MM", "THERMAL_58MM", "A4"]).optional().default("A4"),
});

export async function POST(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "documents.view");
    const input = await parseJson(request, generateSchema);

    let stationId: string | null = null;
    let documentNumber = "";

    // Verify source entity exists and extract stationId & documentNumber
    if (input.sourceType === "Sale") {
      const sale = await db.sale.findFirst({
        where: { id: input.sourceId, companyId: access.companyId },
        select: { id: true, saleNumber: true, stationId: true },
      });
      if (!sale) throw new NotFoundError("Sale transaction not found.");
      stationId = sale.stationId;
      documentNumber = `DOC-${sale.saleNumber}`;
    } else if (input.sourceType === "CargoShipment") {
      const shipment = await db.cargoShipment.findFirst({
        where: { id: input.sourceId, companyId: access.companyId },
        select: { id: true, awbNumber: true, stationId: true },
      });
      if (!shipment) throw new NotFoundError("Cargo shipment not found.");
      stationId = shipment.stationId;
      documentNumber = `DOC-${shipment.awbNumber}`;
    } else if (input.sourceType === "WalletAccount") {
      const account = await db.walletAccount.findFirst({
        where: { id: input.sourceId, agent: { companyId: access.companyId } },
        include: { agent: { select: { agentNumber: true, homeStationId: true } } },
      });
      if (!account) throw new NotFoundError("Wallet account not found.");
      stationId = account.agent.homeStationId;
      documentNumber = `STMT-${account.agent.agentNumber}-${Date.now().toString().slice(-6)}`;
    } else {
      documentNumber = `DOC-${input.sourceType.toUpperCase()}-${Date.now().toString().slice(-6)}`;
    }

    const templateKey = input.templateKey ?? `${input.documentType.toLowerCase()}_default_v1`;

    // Check existing document count for versioning
    const existingCount = await db.generatedDocument.count({
      where: {
        companyId: access.companyId,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        documentType: input.documentType,
      },
    });

    const version = existingCount + 1;

    const doc = await db.$transaction(async (tx) => {
      const created = await tx.generatedDocument.create({
        data: {
          companyId: access.companyId,
          stationId,
          documentType: input.documentType,
          documentNumber,
          sourceType: input.sourceType,
          sourceId: input.sourceId,
          templateKey,
          version,
          status: "READY",
          mimeType: "text/html",
          objectKey: `docs/${access.companyId}/${input.documentType.toLowerCase()}/${documentNumber}-v${version}.html`,
          checksum: `sha256-${Date.now().toString(16)}`,
          generatedById: access.userId,
          generatedAt: new Date(),
        },
      });

      await writeAudit(tx, {
        companyId: access.companyId,
        actorId: access.userId,
        stationId,
        action: "document.generated",
        entityType: "GeneratedDocument",
        entityId: created.id,
        requestId,
        metadata: {
          documentType: input.documentType,
          sourceType: input.sourceType,
          sourceId: input.sourceId,
          version,
          format: input.format,
        },
      });

      return created;
    });

    return apiSuccess(doc, requestId, { created: true });
  } catch (error) {
    return apiFailure(error, requestId);
  }
}
