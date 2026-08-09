import "server-only";

import { createHash, randomUUID } from "node:crypto";

import { Prisma, type AuditOutcome } from "@/lib/generated/prisma/client";

type TransactionClient = Prisma.TransactionClient;

export type AuditInput = {
  companyId: string;
  actorId?: string | null;
  stationId?: string | null;
  businessUnitId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  outcome?: AuditOutcome;
  reason?: string | null;
  requestId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  before?: unknown;
  after?: unknown;
  metadata?: unknown;
};

const secretKey = /(password|token|secret|credential|authorization|cookie|ciphertext|hash)$/i;

export function redactAuditValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactAuditValue);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, secretKey.test(key) ? "[REDACTED]" : redactAuditValue(child)]));
  return value;
}

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => `${JSON.stringify(key)}:${stable(child)}`).join(",")}}`;
  return JSON.stringify(value) ?? "null";
}

export function calculateAuditHash(previousHash: string | null, payload: unknown) {
  return createHash("sha256").update(`${previousHash ?? "GENESIS"}\n${stable(payload)}`).digest("hex");
}

function asJson(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(redactAuditValue(value))) as Prisma.InputJsonValue;
}

export async function writeAudit(tx: TransactionClient, input: AuditInput) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`audit:${input.companyId}`}))`;
  const previous = await tx.auditEvent.findFirst({ where: { companyId: input.companyId }, orderBy: [{ occurredAt: "desc" }, { id: "desc" }], select: { eventHash: true } });
  const id = randomUUID(); const occurredAt = new Date();
  const before = redactAuditValue(input.before); const after = redactAuditValue(input.after); const metadata = redactAuditValue(input.metadata);
  const hashPayload = { id, companyId: input.companyId, actorId: input.actorId ?? null, stationId: input.stationId ?? null, businessUnitId: input.businessUnitId ?? null, action: input.action, entityType: input.entityType, entityId: input.entityId ?? null, outcome: input.outcome ?? "SUCCESS", reason: input.reason ?? null, requestId: input.requestId ?? null, before: before ?? null, after: after ?? null, metadata: metadata ?? null, occurredAt: occurredAt.toISOString() };
  const eventHash = calculateAuditHash(previous?.eventHash ?? null, hashPayload);
  return tx.auditEvent.create({
    data: {
      id,
      companyId: input.companyId,
      actorId: input.actorId,
      stationId: input.stationId,
      businessUnitId: input.businessUnitId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      outcome: input.outcome,
      reason: input.reason,
      requestId: input.requestId,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      before: asJson(before),
      after: asJson(after),
      metadata: asJson(metadata),
      previousHash: previous?.eventHash,
      eventHash,
      occurredAt,
    },
  });
}
