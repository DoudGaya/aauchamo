"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type SaleDetail = {
  id: string;
  saleNumber: string;
  status: string;
  subtotal: string;
  taxTotal: string;
  discountTotal: string;
  total: string;
  paidTotal: string;
  outstandingTotal: string;
  postedAt: string;
  company: { legalName: string; displayName: string; address: string; phone: string; currencyCode: string };
  station: { code: string; name: string };
  customer: { displayName: string; primaryPhone: string; primaryEmail?: string | null } | null;
  officer: { email: string } | null;
  items: Array<{ id: string; product: { code: string; name: string }; quantity: string; unitPrice: string; lineTotal: string }>;
  allocations: Array<{ paymentMethod: string; amount: string }>;
};

export default function InvoicePrintPage() {
  const params = useParams();
  const saleId = params.saleId as string;

  const [sale, setSale] = useState<SaleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/sales/${saleId}`);
        const body = await res.json();
        if (!res.ok || !body.ok) throw new Error(body.error?.message ?? "Failed to load invoice.");
        setSale(body.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load invoice.");
      } finally {
        setLoading(false);
      }
    }
    if (saleId) load();
  }, [saleId]);

  if (loading) {
    return <div style={{ padding: "40px", textAlign: "center", fontFamily: "sans-serif" }}>Loading invoice details…</div>;
  }

  if (error || !sale) {
    return <div style={{ padding: "40px", textAlign: "center", color: "red", fontFamily: "sans-serif" }}>{error ?? "Invoice not found."}</div>;
  }

  return (
    <div style={{ background: "#f5f5f5", minHeight: "100vh", padding: "30px 20px" }}>
      {/* Control Bar */}
      <div className="no-print" style={{ maxWidth: "800px", margin: "0 auto 20px auto", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", padding: "12px 20px", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <h3 style={{ margin: 0, color: "#800000" }}>Commercial Invoice Viewer (A4)</h3>
        <button
          onClick={() => window.print()}
          style={{ padding: "8px 20px", background: "#800000", color: "#fff", border: "none", borderRadius: "4px", fontWeight: "bold", cursor: "pointer" }}
        >
          Print Invoice
        </button>
      </div>

      {/* A4 Sheet Container */}
      <div
        className="printable-sheet"
        style={{
          maxWidth: "800px",
          margin: "0 auto",
          background: "#fff",
          padding: "40px 50px",
          borderRadius: "4px",
          fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
          fontSize: "13px",
          color: "#333",
          boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
        }}
      >
        {/* Header Section */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #800000", paddingBottom: "20px", marginBottom: "24px" }}>
          <div>
            <div style={{ background: "#800000", display: "inline-block", padding: "8px 12px", borderRadius: "6px", marginBottom: "8px" }}>
              <img src="/logo.png" alt="AAU Chamo Logo" style={{ height: "40px", display: "block" }} />
            </div>
            <h1 style={{ margin: "4px 0 2px 0", fontSize: "22px", color: "#800000" }}>{sale.company.displayName}</h1>
            <p style={{ margin: 0, color: "#666", fontSize: "12px" }}>{sale.company.legalName}</p>
            <p style={{ margin: "2px 0 0 0", color: "#666", fontSize: "12px" }}>{sale.company.address}</p>
            <p style={{ margin: "2px 0 0 0", color: "#666", fontSize: "12px" }}>Phone: {sale.company.phone}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <h2 style={{ margin: 0, fontSize: "28px", color: "#800000", textTransform: "uppercase", letterSpacing: "1px" }}>INVOICE</h2>
            <p style={{ margin: "6px 0 2px 0", fontSize: "14px", fontWeight: "bold" }}>#{sale.saleNumber}</p>
            <p style={{ margin: "2px 0", fontSize: "12px", color: "#666" }}>Date: {new Date(sale.postedAt).toLocaleDateString("en-NG")}</p>
            <p style={{ margin: "2px 0", fontSize: "12px", color: "#666" }}>Station: {sale.station.name} ({sale.station.code})</p>
            <span style={{ display: "inline-block", marginTop: "6px", padding: "3px 10px", borderRadius: "12px", background: sale.status === "PAID" ? "#e6f4ea" : "#fce8e6", color: sale.status === "PAID" ? "#137333" : "#c5221f", fontWeight: "bold", fontSize: "11px" }}>
              {sale.status}
            </span>
          </div>
        </div>

        {/* Bill To & Details */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "30px" }}>
          <div style={{ width: "48%" }}>
            <h4 style={{ margin: "0 0 6px 0", color: "#800000", borderBottom: "1px solid #ddd", paddingBottom: "4px" }}>Billed To:</h4>
            {sale.customer ? (
              <div>
                <strong style={{ fontSize: "14px" }}>{sale.customer.displayName}</strong>
                <p style={{ margin: "4px 0 2px 0" }}>Phone: {sale.customer.primaryPhone}</p>
                {sale.customer.primaryEmail && <p style={{ margin: 0 }}>Email: {sale.customer.primaryEmail}</p>}
              </div>
            ) : (
              <p style={{ margin: 0, color: "#666" }}>Walk-in Customer / Cash Sale</p>
            )}
          </div>
          <div style={{ width: "48%" }}>
            <h4 style={{ margin: "0 0 6px 0", color: "#800000", borderBottom: "1px solid #ddd", paddingBottom: "4px" }}>Payment Information:</h4>
            <p style={{ margin: "4px 0 2px 0" }}>Issued by: {sale.officer?.email ?? "System"}</p>
            <p style={{ margin: "2px 0" }}>Currency: {sale.company.currencyCode}</p>
            <p style={{ margin: "2px 0" }}>Terms: Settlement upon issue</p>
          </div>
        </div>

        {/* Line Items Table */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "24px" }}>
          <thead>
            <tr style={{ background: "#800000", color: "#fff", textAlign: "left" }}>
              <th style={{ padding: "10px 12px", borderRadius: "4px 0 0 0" }}>#</th>
              <th style={{ padding: "10px 12px" }}>Product Code</th>
              <th style={{ padding: "10px 12px" }}>Description</th>
              <th style={{ padding: "10px 12px", textAlign: "center" }}>Qty</th>
              <th style={{ padding: "10px 12px", textAlign: "right" }}>Unit Price</th>
              <th style={{ padding: "10px 12px", textAlign: "right", borderRadius: "0 4px 0 0" }}>Line Total</th>
            </tr>
          </thead>
          <tbody>
            {sale.items.map((item, index) => (
              <tr key={item.id} style={{ borderBottom: "1px solid #eee", background: index % 2 === 0 ? "#fafafa" : "#fff" }}>
                <td style={{ padding: "10px 12px", color: "#666" }}>{index + 1}</td>
                <td style={{ padding: "10px 12px", fontWeight: "bold" }}>{item.product.code}</td>
                <td style={{ padding: "10px 12px" }}>{item.product.name}</td>
                <td style={{ padding: "10px 12px", textAlign: "center" }}>{Number(item.quantity)}</td>
                <td style={{ padding: "10px 12px", textAlign: "right" }}>{Number(item.unitPrice).toLocaleString()}</td>
                <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: "bold" }}>{Number(item.lineTotal).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals Summary */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "40px" }}>
          <div style={{ width: "50%", background: "#f8f9fa", padding: "16px", borderRadius: "6px", border: "1px solid #e9ecef" }}>
            <h5 style={{ margin: "0 0 8px 0", color: "#800000" }}>Bank Payment Instructions</h5>
            <p style={{ margin: "2px 0", fontSize: "11px" }}>Bank: Zenith Bank PLC</p>
            <p style={{ margin: "2px 0", fontSize: "11px" }}>Account Name: A.A.U Chamo International Business Agency</p>
            <p style={{ margin: "2px 0", fontSize: "11px" }}>Account Number: 1012345678</p>
            <p style={{ margin: "6px 0 0 0", fontSize: "11px", color: "#666" }}>Please quote Invoice #{sale.saleNumber} on transfer remarks.</p>
          </div>
          <div style={{ width: "40%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #eee" }}>
              <span>Subtotal:</span>
              <span>{sale.company.currencyCode} {Number(sale.subtotal).toLocaleString()}</span>
            </div>
            {Number(sale.taxTotal) > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #eee" }}>
                <span>VAT Tax:</span>
                <span>{sale.company.currencyCode} {Number(sale.taxTotal).toLocaleString()}</span>
              </div>
            )}
            {Number(sale.discountTotal) > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #eee", color: "green" }}>
                <span>Discount:</span>
                <span>-{sale.company.currencyCode} {Number(sale.discountTotal).toLocaleString()}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "2px solid #800000", fontWeight: "bold", fontSize: "16px", color: "#800000" }}>
              <span>Grand Total:</span>
              <span>{sale.company.currencyCode} {Number(sale.total).toLocaleString()}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
              <span>Total Paid:</span>
              <span>{sale.company.currencyCode} {Number(sale.paidTotal).toLocaleString()}</span>
            </div>
            {Number(sale.outstandingTotal) > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", color: "#c5221f", fontWeight: "bold" }}>
                <span>Balance Due:</span>
                <span>{sale.company.currencyCode} {Number(sale.outstandingTotal).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: "1px solid #ddd", paddingTop: "16px", textAlign: "center", fontSize: "11px", color: "#777" }}>
          <p style={{ margin: "2px 0" }}>This is an official commercial invoice generated by AAU Chamo Enterprise ERP.</p>
          <p style={{ margin: "2px 0" }}>Questions regarding this invoice? Contact finance@aauchamo.com or call {sale.company.phone}.</p>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #fff !important; padding: 0 !important; }
          .printable-sheet { box-shadow: none !important; margin: 0 !important; max-width: none !important; width: 100% !important; padding: 20px !important; }
        }
      `}</style>
    </div>
  );
}
