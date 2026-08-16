import { z } from "zod";
import { Prisma } from "@/lib/generated/prisma/client";
import { requireAccess, requirePermission, requireStation } from "@/lib/server/access";
import { AppError, NotFoundError, apiFailure, apiSuccess, requestIdFrom } from "@/lib/server/api";
import { db } from "@/lib/server/db";

export async function GET(request: Request, { params }: { params: Promise<{ agentId: string }> }) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "wallet.view");
    const { agentId } = await params;
    const url = new URL(request.url);
    const startDateParam = url.searchParams.get("startDate");
    const endDateParam = url.searchParams.get("endDate");

    if (!startDateParam || !endDateParam) {
      throw new AppError("DATES_REQUIRED", "Both startDate and endDate query parameters are required.", 422);
    }

    const start = new Date(startDateParam);
    const end = new Date(endDateParam);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new AppError("INVALID_DATES", "Specified startDate or endDate format is invalid.", 422);
    }

    const agent = await db.agent.findFirst({
      where: { id: agentId, companyId: access.companyId },
      include: { wallet: true },
    });
    if (!agent || !agent.wallet) throw new NotFoundError("Agent wallet was not found.");
    requireStation(access, agent.homeStationId);

    // Calculate opening balance at startDate
    const lastEntryBefore = await db.walletEntry.findFirst({
      where: {
        walletAccountId: agent.wallet.id,
        postedAt: { lt: start },
      },
      orderBy: { postedAt: "desc" },
    });
    const openingBalance = lastEntryBefore ? lastEntryBefore.balanceAfter.toString() : "0.00";

    // Fetch entries in range
    const entries = await db.walletEntry.findMany({
      where: {
        walletAccountId: agent.wallet.id,
        postedAt: { gte: start, lte: end },
      },
      include: {
        paymentMethod: { select: { id: true, name: true } },
      },
      orderBy: { postedAt: "asc" },
    });

    // Calculate closing balance at endDate
    const lastEntryInRange = await db.walletEntry.findFirst({
      where: {
        walletAccountId: agent.wallet.id,
        postedAt: { gte: start, lte: end },
      },
      orderBy: { postedAt: "desc" },
    });
    const closingBalance = lastEntryInRange ? lastEntryInRange.balanceAfter.toString() : openingBalance;

    return apiSuccess(
      {
        range: { from: start, to: end },
        openingBalance,
        closingBalance,
        entries,
      },
      requestId
    );
  } catch (error) {
    return apiFailure(error, requestId);
  }
}
