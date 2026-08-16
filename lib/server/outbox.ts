import { Prisma } from "@/lib/generated/prisma/client";
import { db } from "@/lib/server/db";
import { dispatchNotification } from "@/lib/server/notifications";
import { sendEmail, sendSms } from "@/lib/server/notification-providers";

export type OutboxPayload = {
  companyId: string;
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  payload: Record<string, unknown>;
  availableAt?: Date;
};

/**
 * Emits an OutboxEvent atomically inside any Prisma client transaction.
 */
export async function emitOutboxEvent(
  dbOrTx: any,
  data: OutboxPayload
) {
  return await dbOrTx.outboxEvent.create({
    data: {
      companyId: data.companyId,
      aggregateType: data.aggregateType,
      aggregateId: data.aggregateId,
      eventType: data.eventType,
      payload: data.payload as Prisma.InputJsonValue,
      status: "PENDING",
      availableAt: data.availableAt ?? new Date(),
    },
  });
}

export const enqueueOutbox = emitOutboxEvent;

/**
 * Background outbox processor worker.
 * Reads pending outbox events, deduplicates threshold alerts, and dispatches notifications.
 */
export async function processOutboxEvents(batchSize = 50) {
  const now = new Date();
  const workerId = `worker_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  // 1. Claim pending events
  const pending = await db.outboxEvent.findMany({
    where: {
      status: "PENDING",
      availableAt: { lte: now },
      OR: [{ lockedAt: null }, { lockedAt: { lte: new Date(now.getTime() - 5 * 60 * 1000) } }],
    },
    orderBy: { createdAt: "asc" },
    take: batchSize,
  });

  if (!pending.length) return { processed: 0, published: 0, failed: 0 };

  const eventIds = pending.map((e) => e.id);
  await db.outboxEvent.updateMany({
    where: { id: { in: eventIds } },
    data: {
      lockedAt: now,
      lockedBy: workerId,
      attempts: { increment: 1 },
    },
  });

  let published = 0;
  let failed = 0;

  for (const event of pending) {
    try {
      const payloadData = (event.payload as Record<string, unknown>) ?? {};

      // Deduplication check: Suppress repeated threshold alerts for same aggregateId within 1 hour
      if (["inventory.low_stock", "agents.low_balance"].includes(event.eventType)) {
        const recentDuplicate = await db.outboxEvent.findFirst({
          where: {
            id: { not: event.id },
            companyId: event.companyId,
            aggregateId: event.aggregateId,
            eventType: event.eventType,
            status: "PUBLISHED",
            publishedAt: { gte: new Date(now.getTime() - 60 * 60 * 1000) },
          },
        });
        if (recentDuplicate) {
          // Mark deduplicated without resending
          await db.outboxEvent.update({
            where: { id: event.id },
            data: {
              status: "PUBLISHED",
              publishedAt: now,
              lockedAt: null,
              lockedBy: null,
              lastError: "Suppressed as recent duplicate threshold noise",
            },
          });
          published++;
          continue;
        }
      }

      // Map eventType to target roles & title/message
      let targetRoles: string[] = ["SUPER_ADMIN", "STATION_MANAGER"];
      let severity: "INFO" | "WARNING" | "ERROR" | "SUCCESS" = "INFO";
      let title = `System Alert: ${event.eventType}`;
      let message = String(payloadData.message ?? `Outbox event triggered for ${event.aggregateType}`);
      let href = "/";

      if (event.eventType === "inventory.low_stock") {
        targetRoles = ["SUPER_ADMIN", "STATION_MANAGER", "INVENTORY_OFFICER"];
        severity = "WARNING";
        title = `Low Stock Alert: ${payloadData.productName ?? event.aggregateId}`;
        message = `Stock level for ${payloadData.productName ?? "item"} is at ${payloadData.currentQty} (reorder level: ${payloadData.reorderLevel}).`;
        href = "/?module=inventory";
      } else if (event.eventType === "agents.low_balance") {
        targetRoles = ["SUPER_ADMIN", "STATION_MANAGER", "FINANCE_OFFICER"];
        severity = "WARNING";
        title = `Low Agent Wallet Balance: ${payloadData.agentName ?? event.aggregateId}`;
        message = `Agent ${payloadData.agentNumber} balance has fallen to ₦${Number(payloadData.balance ?? 0).toLocaleString()}.`;
        href = "/?module=agents";
      } else if (event.eventType === "sales.large_transaction") {
        targetRoles = ["SUPER_ADMIN", "STATION_MANAGER", "FINANCE_OFFICER"];
        severity = "INFO";
        title = `Large Sale Transaction: ₦${Number(payloadData.amount ?? 0).toLocaleString()}`;
        message = `Sale #${payloadData.saleNumber} posted for ₦${Number(payloadData.amount ?? 0).toLocaleString()} at station ${payloadData.stationCode}.`;
        href = "/?module=sales";
      } else if (event.eventType === "auth.login_failed") {
        targetRoles = ["SUPER_ADMIN"];
        severity = "ERROR";
        title = `Security Alert: Failed Login Attempt`;
        message = `Multiple failed login attempts for username "${payloadData.username}" from IP ${payloadData.ipAddress ?? "unknown"}.`;
        href = "/?module=audit";
      } else if (event.eventType === "users.created") {
        targetRoles = ["SUPER_ADMIN"];
        severity = "INFO";
        title = `Security Event: New User Account`;
        message = `User "${payloadData.username}" (${payloadData.email}) was created with roles: ${Array.isArray(payloadData.roles) ? payloadData.roles.join(", ") : "Staff"}.`;
        href = "/?module=access";
      } else if (event.eventType === "approvals.pending") {
        targetRoles = ["SUPER_ADMIN", "STATION_MANAGER"];
        severity = "WARNING";
        title = `Approval Required: ${payloadData.action ?? "Pending Action"}`;
        message = `Approval request from ${payloadData.requestedBy} requires authorization.`;
        href = "/?module=approvals";
      }

      // Dispatch in-app notifications to target users
      await dispatchNotification(db, {
        companyId: event.companyId,
        stationId: (payloadData.stationId as string) ?? null,
        targetRoles,
        type: event.eventType,
        severity,
        title,
        message,
        href,
        entityType: event.aggregateType,
        entityId: event.aggregateId,
      });

      // Also trigger Email & SMS provider delivery (asynchronously / provider-ready)
      await sendEmail({
        companyId: event.companyId,
        eventType: event.eventType,
        title,
        message,
      });

      await sendSms({
        companyId: event.companyId,
        eventType: event.eventType,
        message: `${title}: ${message.slice(0, 120)}`,
      });

      // Mark event as PUBLISHED
      await db.outboxEvent.update({
        where: { id: event.id },
        data: {
          status: "PUBLISHED",
          publishedAt: new Date(),
          lockedAt: null,
          lockedBy: null,
          lastError: null,
        },
      });

      published++;
    } catch (err) {
      failed++;
      const errorMessage = err instanceof Error ? err.message : "Processing failed";
      await db.outboxEvent.update({
        where: { id: event.id },
        data: {
          status: event.attempts >= 5 ? "FAILED" : "PENDING",
          lockedAt: null,
          lockedBy: null,
          lastError: errorMessage,
          availableAt: new Date(Date.now() + Math.pow(2, event.attempts) * 1000 * 60), // Exponential backoff
        },
      });
    }
  }

  return { processed: pending.length, published, failed };
}
