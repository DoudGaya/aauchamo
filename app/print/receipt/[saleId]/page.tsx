"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

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
  company: { legalName: string; displayName: string; address: string; phone: string; currencyCode: string; logoObjectKey?: string | null; logoDarkObjectKey?: string | null };
  station: { code: string; name: string };
  customer: { displayName: string; primaryPhone: string } | null;
  officer: { email: string } | null;
  items: Array<{ id: string; product: { code: string; name: string }; quantity: string; unitPrice: string; lineTotal: string }>;
  allocations: Array<{ paymentMethod: string; amount: string }>;
};

export default function ReceiptPrintPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const saleId = params.saleId as string;
  const initialFormat = (searchParams.get("format") as "80mm" | "58mm" | "a4") || "80mm";

  const [sale, setSale] = useState<SaleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [format, setFormat] = useState<"80mm" | "58mm" | "a4">(initialFormat);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/sales/${saleId}`);
        const body = await res.json();
        if (!res.ok || !body.ok) throw new Error(body.error?.message ?? "Failed to load receipt.");
        setSale(body.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load receipt.");
      } finally {
        setLoading(false);
      }
    }
    if (saleId) load();
  }, [saleId]);

  if (loading) {
    return <div style={{ padding: "40px", textAlign: "center", fontFamily: "sans-serif" }}>Loading receipt details…</div>;
  }

  if (error || !sale) {
    return <div style={{ padding: "40px", textAlign: "center", color: "red", fontFamily: "sans-serif" }}>{error ?? "Sale not found."}</div>;
  }

  const isThermal = format === "80mm" || format === "58mm";
  const widthPx = format === "58mm" ? "240px" : format === "80mm" ? "340px" : "100%";

  return (
    <div style={{ background: "#f5f5f5", minHeight: "100vh", padding: "20px" }}>
      {/* Control bar (hidden when printing) */}
      <div className="no-print" style={{ maxWidth: "800px", margin: "0 auto 20px auto", display: "flex", gap: "10px", alignItems: "center", justifyContent: "space-between", background: "#fff", padding: "12px 16px", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <span style={{ fontSize: "14px", fontWeight: "bold" }}>Format:</span>
          {(["80mm", "58mm", "a4"] as const).map((fmt) => (
            <button
              key={fmt}
              onClick={() => setFormat(fmt)}
              style={{
                padding: "6px 12px",
                borderRadius: "4px",
                border: "1px solid #ccc",
                background: format === fmt ? "#800000" : "#fff",
                color: format === fmt ? "#fff" : "#333",
                fontWeight: format === fmt ? "bold" : "normal",
                cursor: "pointer",
              }}
            >
              {fmt === "80mm" ? "Thermal (80mm)" : fmt === "58mm" ? "Thermal (58mm)" : "A4 Standard"}
            </button>
          ))}
        </div>
        <button
          onClick={() => window.print()}
          style={{ padding: "8px 16px", background: "#800000", color: "#fff", border: "none", borderRadius: "4px", fontWeight: "bold", cursor: "pointer" }}
        >
          Print Receipt
        </button>
      </div>

      {/* Printable Sheet */}
      <div
        className="printable-sheet"
        style={{
          maxWidth: widthPx,
          margin: "0 auto",
          background: "#fff",
          padding: isThermal ? "16px 12px" : "40px",
          borderRadius: "4px",
          fontFamily: isThermal ? "'Courier New', Courier, monospace" : "'Helvetica Neue', Helvetica, Arial, sans-serif",
          fontSize: isThermal ? "12px" : "14px",
          color: "#000",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        {/* Header with Logo */}
        <div style={{ textAlign: "center", borderBottom: isThermal ? "1px dashed #000" : "2px solid #800000", paddingBottom: "12px", marginBottom: "12px" }}>
          <div style={{ display: "inline-block", background: "#800000", padding: "6px", borderRadius: "4px", marginBottom: "6px" }}>
            <img src={sale.company.logoDarkObjectKey || sale.company.logoObjectKey || "/logo.png"} alt="AAU Chamo Logo" style={{ height: isThermal ? "30px" : "44px", display: "block" }} />
          </div>
          <h2 style={{ margin: "4px 0", fontSize: isThermal ? "14px" : "20px", color: "#800000" }}>{sale.company.displayName}</h2>
          <p style={{ margin: "2px 0", fontSize: isThermal ? "10px" : "12px", color: "#555" }}>{sale.company.legalName}</p>
          <p style={{ margin: "2px 0", fontSize: isThermal ? "10px" : "12px" }}>{sale.company.address}</p>
          <p style={{ margin: "2px 0", fontSize: isThermal ? "10px" : "12px" }}>Tel: {sale.company.phone}</p>
        </div>

        {/* Metadata */}
        <div style={{ marginBottom: "12px", fontSize: isThermal ? "11px" : "13px" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span><strong>Receipt #:</strong> {sale.saleNumber}</span>
            <span><strong>Station:</strong> {sale.station.code}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
            <span><strong>Date:</strong> {new Date(sale.postedAt).toLocaleString("en-NG")}</span>
            <span><strong>Status:</strong> {sale.status}</span>
          </div>
          {sale.customer && (
            <div style={{ marginTop: "4px" }}>
              <span><strong>Customer:</strong> {sale.customer.displayName} ({sale.customer.primaryPhone})</span>
            </div>
          )}
          {sale.officer && (
            <div style={{ marginTop: "2px" }}>
              <span><strong>Cashier:</strong> {sale.officer.email}</span>
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }} />

        {/* Line Items */}
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: isThermal ? "11px" : "13px", marginBottom: "12px" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #000", textAlign: "left" }}>
              <th style={{ padding: "4px 0" }}>Item</th>
              <th style={{ padding: "4px 0", textAlign: "center" }}>Qty</th>
              <th style={{ padding: "4px 0", textAlign: "right" }}>Price</th>
              <th style={{ padding: "4px 0", textAlign: "right" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {sale.items.map((item) => (
              <tr key={item.id} style={{ borderBottom: "1px undefined #eee" }}>
                <td style={{ padding: "4px 0", wordBreak: "break-word" }}>{item.product.name}</td>
                <td style={{ padding: "4px 0", textAlign: "center" }}>{Number(item.quantity)}</td>
                <td style={{ padding: "4px 0", textAlign: "right" }}>{Number(item.unitPrice).toLocaleString()}</td>
                <td style={{ padding: "4px 0", textAlign: "right" }}>{Number(item.lineTotal).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ borderTop: "1px dashed #000", paddingTop: "8px", fontSize: isThermal ? "11px" : "13px" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Subtotal:</span>
            <span>{sale.company.currencyCode} {Number(sale.subtotal).toLocaleString()}</span>
          </div>
          {Number(sale.taxTotal) > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Tax (VAT):</span>
              <span>{sale.company.currencyCode} {Number(sale.taxTotal).toLocaleString()}</span>
            </div>
          )}
          {Number(sale.discountTotal) > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", color: "green" }}>
              <span>Discount:</span>
              <span>-{sale.company.currencyCode} {Number(sale.discountTotal).toLocaleString()}</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: isThermal ? "13px" : "16px", marginTop: "4px", borderTop: "1px solid #000", paddingTop: "4px" }}>
            <span>Total:</span>
            <span>{sale.company.currencyCode} {Number(sale.total).toLocaleString()}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
            <span>Amount Paid:</span>
            <span>{sale.company.currencyCode} {Number(sale.paidTotal).toLocaleString()}</span>
          </div>
          {Number(sale.outstandingTotal) > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", color: "red", fontWeight: "bold" }}>
              <span>Outstanding:</span>
              <span>{sale.company.currencyCode} {Number(sale.outstandingTotal).toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Payments Breakdown */}
        {sale.allocations && sale.allocations.length > 0 && (
          <div style={{ marginTop: "10px", borderTop: "1px dashed #000", paddingTop: "6px", fontSize: isThermal ? "10px" : "12px" }}>
            <strong>Payment Method(s):</strong>
            {sale.allocations.map((alloc, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between" }}>
                <span>{alloc.paymentMethod}</span>
                <span>{sale.company.currencyCode} {Number(alloc.amount).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}

        {/* Footer & QR */}
        <div style={{ textAlign: "center", marginTop: "16px", borderTop: "1px dashed #000", paddingTop: "12px", fontSize: isThermal ? "10px" : "12px" }}>
          <p style={{ margin: "2px 0", fontWeight: "bold" }}>Thank you for doing business with us!</p>
          <p style={{ margin: "2px 0", color: "#555" }}>Goods sold in good condition are not returnable.</p>
          <div style={{ marginTop: "8px" }}>
            <span style={{ fontSize: "9px", fontFamily: "monospace", color: "#777" }}>* {sale.saleNumber} *</span>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #fff !important; padding: 0 !important; }
          .printable-sheet { box-shadow: none !important; margin: 0 !important; width: 100% !important; max-width: none !important; }
        }
      `}</style>
    </div>
  );
}
