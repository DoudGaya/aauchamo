import { requireAccess, requirePermission, requireStation } from "@/lib/server/access";
import { NotFoundError, apiFailure, apiSuccess, requestIdFrom } from "@/lib/server/api";
import { db } from "@/lib/server/db";

export async function GET(request: Request, { params }: { params: Promise<{ customerId: string }> }) {
  const requestId = requestIdFrom(request);
  try {
    const access = requirePermission(await requireAccess(), "customers.view_history");
    const { customerId } = await params;
    const customer = await db.customer.findFirst({ where: { id: customerId, companyId: access.companyId }, select: { id: true, homeStationId: true } });
    if (!customer) throw new NotFoundError("Customer not found.");
    requireStation(access, customer.homeStationId);
    const [auditEvents, merges, attachments, sales, cargo, bookings] = await Promise.all([
      db.auditEvent.findMany({ where: { companyId: access.companyId, entityType: "Customer", entityId: customerId }, orderBy: { occurredAt: "desc" }, take: 100 }),
      db.customerMerge.findMany({ where: { OR: [{ sourceCustomerId: customerId }, { targetCustomerId: customerId }] }, orderBy: { mergedAt: "desc" } }),
      db.attachment.findMany({ where: { companyId: access.companyId, recordType: "Customer", recordId: customerId, status: "ACTIVE" }, select: { id: true, originalName: true, mimeType: true, sizeBytes: true, createdAt: true } }),
      db.sale.findMany({ where: { companyId: access.companyId, customerId }, orderBy: { postedAt: "desc" }, take: 50, select: { id: true, saleNumber: true, total: true, status: true, postedAt: true, outstandingTotal: true } }),
      db.cargoShipment.findMany({ where: { companyId: access.companyId, customerId }, orderBy: { createdAt: "desc" }, take: 50, select: { id: true, awbNumber: true, receiverName: true, destination: true, weightKg: true, status: true, createdAt: true } }),
      db.ticketBooking.findMany({ where: { companyId: access.companyId, customerId }, orderBy: { createdAt: "desc" }, take: 50, select: { id: true, bookingNumber: true, pnr: true, passengerName: true, destination: true, status: true, travelDate: true, sellingPrice: true, createdAt: true } })
    ]);
    return apiSuccess({ auditEvents, merges, attachments, sales, cargo, bookings }, requestId);
  } catch (error) {
    return apiFailure(error, requestId);
  }
}
