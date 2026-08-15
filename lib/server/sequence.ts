import "server-only";

import { Prisma } from "@/lib/generated/prisma/client";
import { dateKey } from "@/lib/server/time";

type TransactionClient = Prisma.TransactionClient;

type AllocateSequenceInput = {
  companyId: string;
  stationId?: string;
  businessUnitId?: string;
  documentType: string;
  prefix: string;
  date?: Date;
  timeZone?: string;
  includeDate?: boolean;
  padding?: number;
};

export async function allocateSequence(tx: TransactionClient, input: AllocateSequenceInput) {
  const period = input.includeDate === false ? "" : dateKey(input.date, input.timeZone);
  // Document numbers (saleNumber, awbNumber, entryNumber, ...) are unique per
  // company: every numbered model is constrained by @@unique([companyId, <number>]).
  // The emitted number is `PREFIX-DATE-NUMERIC` with no station/business-unit
  // segment, so the counter MUST be company-wide per (documentType, date).
  // Scoping the counter per station/business unit made each scope restart at 1,
  // producing duplicate `…-000001` numbers across stations on the same day and
  // failing the unique constraint for the second station to post. Company-wide
  // numbering keeps a single monotonic daily series that stays globally unique
  // and matches the intended format (e.g. SAL-260802-1847).
  const scopeKey = "GLOBAL";
  const padding = input.padding ?? 6;

  const sequence = await tx.sequence.upsert({
    where: {
      companyId_scopeKey_documentType_dateKey: {
        companyId: input.companyId,
        scopeKey,
        documentType: input.documentType,
        dateKey: period,
      },
    },
    create: {
      companyId: input.companyId,
      scopeKey,
      documentType: input.documentType,
      dateKey: period,
      prefix: input.prefix,
      nextValue: 2,
      padding,
    },
    update: {
      nextValue: { increment: 1 },
      version: { increment: 1 },
    },
    select: { nextValue: true, prefix: true, padding: true, dateKey: true },
  });

  const allocated = sequence.nextValue - BigInt(1);
  const numeric = allocated.toString().padStart(sequence.padding, "0");
  return [sequence.prefix, sequence.dateKey, numeric].filter(Boolean).join("-");
}
