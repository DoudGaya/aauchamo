import { requireAccess, requirePermission } from "@/lib/server/access";
import { db } from "@/lib/server/db";
import { notFound } from "next/navigation";

export default async function ReceiptPage({ params }: { params: Promise<{ saleId: string }> }) {
  const access = requirePermission(await requireAccess(), "sales.view");
  const { saleId } = await params;

  const sale = await db.sale.findFirst({
    where: { id: saleId, companyId: access.companyId },
    include: {
      company: true,
      station: true,
      customer: true,
      lines: {
        include: { product: true }
      },
      allocations: {
        include: { payment: { include: { paymentMethod: true } } }
      }
    }
  });

  if (!sale) notFound();

  return (
    <div style={{ maxWidth: "80mm", margin: "0 auto", padding: "10mm 5mm", fontFamily: "monospace", fontSize: "12px", color: "#000", lineHeight: 1.4 }}>
      <div style={{ textAlign: "center", marginBottom: "5mm" }}>
        <h1 style={{ margin: 0, fontSize: "16px", fontWeight: "bold" }}>{sale.company.displayName}</h1>
        <p style={{ margin: 0 }}>{sale.station.name}</p>
        <p style={{ margin: 0 }}>{sale.company.phone || sale.company.address}</p>
      </div>

      <div style={{ borderBottom: "1px dashed #000", marginBottom: "2mm", paddingBottom: "2mm" }}>
        <p style={{ margin: 0 }}>Receipt #: <strong>{sale.saleNumber}</strong></p>
        <p style={{ margin: 0 }}>Date: {sale.postedAt.toLocaleString()}</p>
        <p style={{ margin: 0 }}>Customer: {sale.customer.displayName}</p>
      </div>

      <table style={{ width: "100%", marginBottom: "2mm", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px dashed #000" }}>
            <th style={{ textAlign: "left", padding: "2mm 0" }}>Item</th>
            <th style={{ textAlign: "right", padding: "2mm 0" }}>Qty</th>
            <th style={{ textAlign: "right", padding: "2mm 0" }}>Price</th>
            <th style={{ textAlign: "right", padding: "2mm 0" }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {sale.lines.map((line) => (
            <tr key={line.id}>
              <td style={{ padding: "1mm 0" }}>{line.product.name}</td>
              <td style={{ textAlign: "right", padding: "1mm 0" }}>{line.quantity.toString()}</td>
              <td style={{ textAlign: "right", padding: "1mm 0" }}>{Number(line.lineTotal) / Number(line.quantity)}</td>
              <td style={{ textAlign: "right", padding: "1mm 0" }}>{line.lineTotal.toString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ borderTop: "1px dashed #000", marginTop: "2mm", paddingTop: "2mm", textAlign: "right" }}>
        <p style={{ margin: 0, fontSize: "14px", fontWeight: "bold" }}>TOTAL: {Number(sale.total).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
      </div>

      <div style={{ marginTop: "5mm" }}>
        <p style={{ margin: 0 }}><strong>Payment Methods:</strong></p>
        {sale.allocations.map((alloc) => (
          <p key={alloc.id} style={{ margin: 0 }}>
            {alloc.payment.paymentMethod.name}: {Number(alloc.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        ))}
      </div>

      <div style={{ textAlign: "center", marginTop: "10mm", fontSize: "10px" }}>
        <p style={{ margin: 0 }}>Thank you for your business!</p>
        <p style={{ margin: 0 }}>Please retain this receipt.</p>
        {sale.status === "CANCELLED" && (
          <p style={{ margin: "2mm 0 0 0", color: "red", fontWeight: "bold", border: "1px solid red", padding: "1mm" }}>*** CANCELLED ***</p>
        )}
      </div>

      {/* Auto-print script */}
      <script dangerouslySetInnerHTML={{ __html: `window.onload = function() { window.print(); }` }} />
    </div>
  );
}
