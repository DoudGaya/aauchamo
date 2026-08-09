import { requireAccess, requirePermission } from "@/lib/server/access";
import { apiFailure, apiSuccess, requestIdFrom } from "@/lib/server/api";
import { db } from "@/lib/server/db";

export async function GET(request: Request) { const requestId = requestIdFrom(request); try { const access = requirePermission(await requireAccess(), "stations.manage"); return apiSuccess({ businessUnits: await db.businessUnit.findMany({ where: { companyId: access.companyId, isActive: true }, select: { id: true, code: true, name: true }, orderBy: { name: "asc" } }) }, requestId); } catch (error) { return apiFailure(error, requestId); } }
