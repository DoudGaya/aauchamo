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
  const scopeKey = [input.stationId ?? "ALL", input.businessUnitId ?? "ALL"].join(":");
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
      stationId: input.stationId,
      businessUnitId: input.businessUnitId,
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
