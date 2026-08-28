import { z } from "zod";
import { Prisma } from "@/lib/generated/prisma/client";
import { requireAccess, requirePermission, requireStation } from "@/lib/server/access";
import { AppError, NotFoundError, apiFailure, apiSuccess, parseJson, requestIdFrom } from "@/lib/server/api";
import { writeAudit } from "@/lib/server/audit";
import { db } from "@/lib/server/db";

const patchAgentSchema = z.object({
  name: z.string().trim().min(2).max(180).optional(),
  contactName: z.string().trim().min(2).max(120).optional(),
  phone: z.string().trim().min(7).max(30).optional(),
  email: z.string().email().optional().nullable(),
  address: z.string().trim().max(500).optional().nullable(),
  status: z.enum(["ACTIVE", "SUSPENDED", "CLOSED"]).optional(),
  creditLimit: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
});

export async function GET(request: Request, { params }: { params: Promise<{ agentId: string }> }) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "agents.view");
    const { agentId } = await params;

    const agent = await db.agent.findFirst({
      where: { id: agentId, companyId: access.companyId },
      include: {
        homeStation: { select: { id: true, code: true, name: true } },
        company: { select: { legalName: true, displayName: true, address: true, phone: true, logoObjectKey: true, logoDarkObjectKey: true } },
        wallet: true,
        customer: { select: { id: true, customerNumber: true, displayName: true } },
      },
    });

    if (!agent) throw new NotFoundError("Agent was not found.");
    requireStation(access, agent.homeStationId);

    return apiSuccess(agent, requestId);
  } catch (error) {
    return apiFailure(error, requestId);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ agentId: string }> }) {
  const requestId = requestIdFrom(request);
  try {
    const access = await requireAccess();
    const input = await parseJson(request, patchAgentSchema);
    const { agentId } = await params;

    const agent = await db.agent.findFirst({
      where: { id: agentId, companyId: access.companyId },
    });
    if (!agent) throw new NotFoundError("Agent was not found.");
    requireStation(access, agent.homeStationId, true);

    const isChangingCredit =
      input.creditLimit !== undefined &&
      new Prisma.Decimal(input.creditLimit).cmp(agent.creditLimit) !== 0;

    if (isChangingCredit) {
      requirePermission(access, "wallet.change_credit_limit");
    } else {
      requirePermission(access, "agents.manage");
    }

    const updated = await db.$transaction(
      async (tx) => {
        const row = await tx.agent.update({
          where: { id: agent.id },
          data: {
            name: input.name,
            contactName: input.contactName,
            phone: input.phone,
            email: input.email,
            address: input.address,
            status: input.status,
            creditLimit: input.creditLimit,
            version: { increment: 1 },
          },
        });

        await writeAudit(tx, {
          companyId: access.companyId,
          actorId: access.userId,
          stationId: agent.homeStationId,
          action: "agent.updated",
          entityType: "Agent",
          entityId: agent.id,
          requestId,
          before: agent,
          after: row,
        });

        return row;
      },
      { timeout: 30000 }
    );

    return apiSuccess(updated, requestId);
  } catch (error) {
    return apiFailure(error, requestId);
  }
}
