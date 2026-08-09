import "server-only";

import { createHash } from "node:crypto";

import { Prisma } from "@/lib/generated/prisma/client";
import { ConflictError } from "@/lib/server/api";
import { addMinutes } from "@/lib/server/time";

export function hashRequest(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export async function claimIdempotency(input: {
  tx: Prisma.TransactionClient;
  companyId: string;
  userId: string;
  route: string;
  key: string;
  requestHash: string;
}) {
  const record = await input.tx.idempotencyKey.upsert({
    where: {
      companyId_route_key: {
        companyId: input.companyId,
        route: input.route,
        key: input.key,
      },
    },
    create: {
      companyId: input.companyId,
      userId: input.userId,
      route: input.route,
      key: input.key,
      requestHash: input.requestHash,
      expiresAt: addMinutes(new Date(), 60),
    },
    update: {},
  });

  if (record.requestHash !== input.requestHash) {
    throw new ConflictError("This idempotency key was already used for another request.");
  }

  return record;
}

export function completeIdempotency(
  tx: Prisma.TransactionClient,
  id: string,
  responseCode: number,
  responseBody: Prisma.InputJsonValue,
) {
  return tx.idempotencyKey.update({
    where: { id },
    data: {
      status: "COMPLETED",
      responseCode,
      responseBody,
    },
  });
}
