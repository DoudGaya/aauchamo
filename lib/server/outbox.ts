import "server-only";

import { Prisma } from "@/lib/generated/prisma/client";

type TransactionClient = Prisma.TransactionClient;

export function enqueueOutbox(
  tx: TransactionClient,
  input: {
    companyId: string;
    aggregateType: string;
    aggregateId: string;
    eventType: string;
    payload: Prisma.InputJsonValue;
    availableAt?: Date;
  },
) {
  return tx.outboxEvent.create({
    data: {
      companyId: input.companyId,
      aggregateType: input.aggregateType,
      aggregateId: input.aggregateId,
      eventType: input.eventType,
      payload: input.payload,
      availableAt: input.availableAt,
    },
  });
}
