import { Prisma } from "@/lib/generated/prisma/client";

export type NotificationPayload = {
  companyId: string;
  stationId?: string | null;
  businessUnitId?: string | null;
  targetRoles: string[];
  type: string;
  severity?: "INFO" | "WARNING" | "ERROR" | "SUCCESS";
  title: string;
  message: string;
  href?: string;
  entityType?: string;
  entityId?: string;
};

// We just use an `any` type for Prisma Client / Tx because passing the exact type is annoying with prisma extensions.
export async function dispatchNotification(
  dbOrTx: any,
  payload: NotificationPayload
) {
  // 1. Find all users that match the companyId, optional stationId, and have one of the targetRoles.
  const users = await dbOrTx.user.findMany({
    where: {
      companyId: payload.companyId,
      status: "ACTIVE",
      roleAssignments: {
        some: {
          role: { code: { in: payload.targetRoles } },
          // If stationId is given, they must either have this station scope, or the role is company wide
          ...(payload.stationId ? {
            OR: [
              { stationId: payload.stationId },
              { role: { scope: "COMPANY" } }
            ]
          } : {})
        }
      }
    },
    select: { id: true }
  });

  if (!users.length) return;

  // 2. Create the internal notifications
  await dbOrTx.notification.createMany({
    data: users.map((user: any) => ({
      companyId: payload.companyId,
      recipientId: user.id,
      stationId: payload.stationId,
      businessUnitId: payload.businessUnitId,
      type: payload.type,
      severity: payload.severity ?? "INFO",
      title: payload.title,
      message: payload.message,
      href: payload.href,
      entityType: payload.entityType,
      entityId: payload.entityId,
    }))
  });

  // 3. Mock Email / SMS Readiness
  // console.log(`[Notification Engine] Dispatched ${payload.title} to ${users.length} recipients.`);
}
