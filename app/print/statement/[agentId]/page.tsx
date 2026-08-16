"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

type WalletEntryRecord = {
  id: string;
  type: string;
  amount: string;
  balanceAfter: string;
  reason: string | null;
  postedAt: string;
};

type AgentStatementDetail = {
  id: string;
  agentNumber: string;
  name: string | null;
  creditLimit: string;
  status: string;
  homeStation: { code: string; name: string };
  company: { legalName: string; displayName: string; address: string; phone: string; currencyCode: string };
  account: { id: string; balance: string } | null;
  entries: WalletEntryRecord[];
};

export default function StatementPrintPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const agentId = params.agentId as string;
  const startDate = searchParams.get("startDate") ?? "";
  const endDate = searchParams.get("endDate") ?? "";

  const [agent, setAgent] = useState<AgentStatementDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/agents/${agentId}`);
        const body = await res.json();
        if (!res.ok || !body.ok) throw new Error(body.error?.message ?? "Failed to load agent statement.");
        setAgent(body.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load agent statement.");
      } finally {
        setLoading(false);
      }
    }
    if (agentId) load();
  }, [agentId]);

  if (loading) {
    return <div style={{ padding: "40px", textAlign: "center", fontFamily: "sans-serif" }}>Loading agent statement…</div>;
  }

  if (error || !agent) {
    return <div style={{ padding: "40px", textAlign: "center", color: "red", fontFamily: "sans-serif" }}>{error ?? "Agent record not found."}</div>;
  }

  const entries = agent.entries ?? [];
  const currentBalance = Number(agent.account?.balance ?? 0);
  const totalDeposits = entries
    .filter((e) => e.type === "DEPOSIT" || e.type === "CREDIT")
    .reduce((sum, e) => sum + Number(e.amount), 0);
  const totalDebits = entries
    .filter((e) => e.type === "DEBIT" || e.type === "COMMISSION_PAYOUT")
    .reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div style={{ background: "#f5f5f5", minHeight: "100vh", padding: "30px 20px" }}>
      {/* Control Bar */}
      <div className="no-print" style={{ maxWidth: "800px", margin: "0 auto 20px auto", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", padding: "12px 20px", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <h3 style={{ margin: 0, color: "#800000" }}>Agent Ledger Statement Viewer (A4)</h3>
        <button
          onClick={() => window.print()}
          style={{ padding: "8px 20px", background: "#800000", color: "#fff", border: "none", borderRadius: "4px", fontWeight: "bold", cursor: "pointer" }}
        >
          Print Statement
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
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #800000", paddingBottom: "20px", marginBottom: "24px" }}>
          <div>
            <div style={{ background: "#800000", display: "inline-block", padding: "8px 12px", borderRadius: "6px", marginBottom: "8px" }}>
              <img src="/logo.png" alt="AAU Chamo Logo" style={{ height: "40px", display: "block" }} />
            </div>
            <h1 style={{ margin: "4px 0 2px 0", fontSize: "22px", color: "#800000" }}>{agent.company.displayName}</h1>
            <p style={{ margin: 0, color: "#666", fontSize: "12px" }}>{agent.company.legalName}</p>
            <p style={{ margin: "2px 0 0 0", color: "#666", fontSize: "12px" }}>{agent.company.address}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <h2 style={{ margin: 0, fontSize: "24px", color: "#800000", textTransform: "uppercase" }}>AGENT LEDGER STATEMENT</h2>
            <p style={{ margin: "6px 0 2px 0", fontSize: "13px", fontWeight: "bold" }}>Agent #: {agent.agentNumber}</p>
            <p style={{ margin: "2px 0", fontSize: "12px", color: "#666" }}>Station: {agent.homeStation.name} ({agent.homeStation.code})</p>
            <p style={{ margin: "2px 0", fontSize: "12px", color: "#666" }}>
              Period: {startDate || "Beginning"} to {endDate || "Today"}
            </p>
          </div>
        </div>

        {/* Agent Info & Summary Cards */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "24px" }}>
          <div style={{ width: "48%", background: "#fafafa", padding: "14px", borderRadius: "6px", border: "1px solid #eee" }}>
            <h4 style={{ margin: "0 0 8px 0", color: "#800000" }}>Agent Details</h4>
            <p style={{ margin: "2px 0" }}><strong>Name:</strong> {agent.name ?? "Unnamed Agent"}</p>
            <p style={{ margin: "2px 0" }}><strong>Credit Limit:</strong> {agent.company.currencyCode} {Number(agent.creditLimit).toLocaleString()}</p>
            <p style={{ margin: "2px 0" }}><strong>Status:</strong> {agent.status}</p>
          </div>
          <div style={{ width: "48%", background: "#fafafa", padding: "14px", borderRadius: "6px", border: "1px solid #eee" }}>
            <h4 style={{ margin: "0 0 8px 0", color: "#800000" }}>Statement Summary</h4>
            <div style={{ display: "flex", justifyContent: "space-between", margin: "2px 0" }}>
              <span>Total Credits / Deposits:</span>
              <span style={{ color: "green", fontWeight: "bold" }}>+{agent.company.currencyCode} {totalDeposits.toLocaleString()}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", margin: "2px 0" }}>
              <span>Total Debits / Payouts:</span>
              <span style={{ color: "#c5221f", fontWeight: "bold" }}>-{agent.company.currencyCode} {totalDebits.toLocaleString()}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", margin: "6px 0 0 0", borderTop: "1px solid #ccc", paddingTop: "4px", fontWeight: "bold" }}>
              <span>Current Balance:</span>
              <span style={{ fontSize: "15px", color: "#800000" }}>{agent.company.currencyCode} {currentBalance.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "30px" }}>
          <thead>
            <tr style={{ background: "#800000", color: "#fff", textAlign: "left" }}>
              <th style={{ padding: "10px 12px" }}>Date & Time</th>
              <th style={{ padding: "10px 12px" }}>Type</th>
              <th style={{ padding: "10px 12px" }}>Description</th>
              <th style={{ padding: "10px 12px", textAlign: "right" }}>Amount</th>
              <th style={{ padding: "10px 12px", textAlign: "right" }}>Balance After</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: "20px", textAlign: "center", color: "#777" }}>
                  No wallet entries recorded for this period.
                </td>
              </tr>
            ) : (
              entries.map((entry, index) => {
                const isCredit = entry.type === "DEPOSIT" || entry.type === "CREDIT";
                return (
                  <tr key={entry.id} style={{ borderBottom: "1px solid #eee", background: index % 2 === 0 ? "#fafafa" : "#fff" }}>
                    <td style={{ padding: "10px 12px", fontSize: "12px" }}>{new Date(entry.postedAt).toLocaleString("en-NG")}</td>
                    <td style={{ padding: "10px 12px", fontWeight: "bold", fontSize: "11px", color: isCredit ? "green" : "#c5221f" }}>
                      {entry.type}
                    </td>
                    <td style={{ padding: "10px 12px" }}>{entry.reason ?? "N/A"}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: "bold", color: isCredit ? "green" : "#c5221f" }}>
                      {isCredit ? "+" : "-"}{agent.company.currencyCode} {Number(entry.amount).toLocaleString()}
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: "bold" }}>
                      {agent.company.currencyCode} {Number(entry.balanceAfter).toLocaleString()}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Authorization Signatures */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "50px", paddingTop: "20px", borderTop: "1px solid #ddd" }}>
          <div style={{ textAlign: "center", width: "40%" }}>
            <div style={{ borderBottom: "1px solid #000", height: "40px", marginBottom: "6px" }} />
            <span style={{ fontSize: "12px", color: "#666" }}>Prepared By (Finance Officer)</span>
          </div>
          <div style={{ textAlign: "center", width: "40%" }}>
            <div style={{ borderBottom: "1px solid #000", height: "40px", marginBottom: "6px" }} />
            <span style={{ fontSize: "12px", color: "#666" }}>Agent Signature & Date</span>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: "30px", textAlign: "center", fontSize: "11px", color: "#777" }}>
          <p style={{ margin: "2px 0" }}>This is an audited statement of account generated by AAU Chamo ERP.</p>
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
