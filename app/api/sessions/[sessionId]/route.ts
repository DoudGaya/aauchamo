import { requireAccess } from "@/lib/server/access";
import { ForbiddenError, NotFoundError, apiFailure, apiSuccess, requestIdFrom } from "@/lib/server/api";
import { writeAudit } from "@/lib/server/audit";
import { db } from "@/lib/server/db";

export const runtime = "nodejs";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const requestId = requestIdFrom(request);
  try {
    const access = await requireAccess();
    const { sessionId } = await params;
    const session = await db.session.findUnique({
      where: { id: sessionId },
      include: { user: { select: { id: true, companyId: true } } },
    });
    if (!session || session.user.companyId !== access.companyId) throw new NotFoundError();
    const isOwnSession = session.userId === access.userId;
    if (!isOwnSession && !access.permissions.has("users.revoke_session")) throw new ForbiddenError();

    await db.$transaction(async (tx) => {
      await tx.session.update({
        where: { id: session.id },
        data: { revokedAt: new Date(), revokedReason: isOwnSession ? "User signed out" : "Administrator revoked" },
      });
      await writeAudit(tx, {
        companyId: access.companyId,
        actorId: access.userId,
        action: "auth.session_revoked",
        entityType: "Session",
        entityId: session.id,
        requestId,
        metadata: { targetUserId: session.userId, self: isOwnSession },
      });
    });
    return apiSuccess({ revoked: true }, requestId);
  } catch (error) {
    return apiFailure(error, requestId);
  }
}
