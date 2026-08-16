import { z } from "zod";
import { Prisma } from "@/lib/generated/prisma/client";
import { requireAccess, requirePermission, requireStation } from "@/lib/server/access";
import { AppError, apiFailure, apiSuccess, parseJson, parsePagination, requestIdFrom } from "@/lib/server/api";
import { writeAudit } from "@/lib/server/audit";
import { db } from "@/lib/server/db";

const openSessionSchema = z.object({
  stationId: z.string().cuid(),
  accountId: z.string().cuid(),
  openingBalance: z.string().regex(/^\d+(\.\d{1,2})?$/),
});

export async function GET(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "finance.view");
    const url = new URL(request.url);
    const { page, pageSize, skip, take } = parsePagination(url.searchParams);
    const stationId = url.searchParams.get("stationId") ?? undefined;
    if (stationId) requireStation(access, stationId);

    const where = {
      station: {
        companyId: access.companyId,
      },
      ...(stationId ? { stationId } : access.companyWide ? {} : { stationId: { in: [...access.stationIds] } }),
    };

    const [items, total] = await Promise.all([
      db.cashSession.findMany({
        where,
        include: {
          station: { select: { id: true, name: true, code: true } },
          account: true,
        },
        orderBy: { openedAt: "desc" },
        skip,
        take,
      }),
      db.cashSession.count({ where }),
    ]);

    return apiSuccess(items, requestId, { page, pageSize, total });
  } catch (error) {
    return apiFailure(error, requestId);
  }
}

export async function POST(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "finance.reconcile");
    const input = await parseJson(request, openSessionSchema);
    requireStation(access, input.stationId, true);

    const openingBalance = new Prisma.Decimal(input.openingBalance);

    // Verify account exists and belongs to company
    const account = await db.financialAccount.findFirst({
      where: { id: input.accountId, companyId: access.companyId, isActive: true },
    });
    if (!account) throw new AppError("INVALID_ACCOUNT", "Account is invalid or inactive.", 422);

    // Check if there is already an open session for this station & account
    const active = await db.cashSession.findFirst({
      where: {
        stationId: input.stationId,
        accountId: input.accountId,
        status: "OPEN",
      },
    });
    if (active) {
      throw new AppError("SESSION_ALREADY_OPEN", "There is already an open cash session for this account at this station.", 409);
    }

    const session = await db.$transaction(async (tx) => {
      const created = await tx.cashSession.create({
        data: {
          stationId: input.stationId,
          accountId: input.accountId,
          openedById: access.userId,
          openingBalance,
          status: "OPEN",
        },
      });

      await writeAudit(tx, {
        companyId: access.companyId,
        actorId: access.userId,
        stationId: input.stationId,
        action: "finance.session_opened",
        entityType: "CashSession",
        entityId: created.id,
        requestId,
        after: created,
      });

      return created;
    });

    return apiSuccess(session, requestId, { created: true });
  } catch (error) {
    return apiFailure(error, requestId);
  }
}
