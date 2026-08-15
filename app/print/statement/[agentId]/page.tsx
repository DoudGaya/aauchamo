import { requireAccess, requirePermission } from "@/lib/server/access";
import { db } from "@/lib/server/db";
import { notFound } from "next/navigation";

export default async function AgentStatementPage({ params }: { params: Promise<{ agentId: string }> }) {
  const access = requirePermission(await requireAccess(), "wallet.view");
  const { agentId } = await params;

  const agent = await db.agent.findFirst({
    where: { id: agentId, companyId: access.companyId },
    include: {
      company: true,
      homeStation: true,
      wallet: {
        include: {
          entries: {
            include: { paymentMethod: true },
            orderBy: { postedAt: "desc" },
            take: 200, // Reasonable limit for a single print statement
          }
        }
      }
    }
  });

  if (!agent || !agent.wallet) notFound();

  const entries = [...agent.wallet.entries].reverse(); // Oldest first for logical ledger order

  return (
    <div style={{ maxWidth: "210mm", minHeight: "297mm", margin: "0 auto", padding: "20mm", fontFamily: "sans-serif", fontSize: "12px", color: "#333", backgroundColor: "#fff" }}>
      <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid #000", paddingBottom: "10mm", marginBottom: "10mm" }}>
        <div>
          <h1 style={{ margin: "0 0 5px 0", fontSize: "24px", color: "#000" }}>{agent.company.displayName}</h1>
          <p style={{ margin: 0, color: "#666" }}>{agent.company.phone || "Head Office"}</p>
          <p style={{ margin: 0, color: "#666" }}>{agent.company.address}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <h2 style={{ margin: "0 0 5px 0", fontSize: "20px", color: "#000" }}>AGENT ACCOUNT STATEMENT</h2>
          <p style={{ margin: 0 }}><strong>Date Printed:</strong> {new Date().toLocaleDateString()}</p>
          <p style={{ margin: 0 }}><strong>Currency:</strong> NGN</p>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15mm" }}>
        <div>
          <h3 style={{ margin: "0 0 5px 0", fontSize: "14px" }}>Agent Information</h3>
          <p style={{ margin: 0 }}><strong>Name:</strong> {agent.name}</p>
          <p style={{ margin: 0 }}><strong>Agent ID:</strong> {agent.agentNumber}</p>
          <p style={{ margin: 0 }}><strong>Contact:</strong> {agent.contactName} ({agent.phone})</p>
          <p style={{ margin: 0 }}><strong>Base Station:</strong> {agent.homeStation.name}</p>
        </div>
        <div style={{ padding: "10px", border: "1px solid #ccc", backgroundColor: "#f9f9f9", minWidth: "200px" }}>
          <h3 style={{ margin: "0 0 10px 0", fontSize: "14px" }}>Account Summary</h3>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
            <span>Credit Limit:</span>
            <strong>{Number(agent.creditLimit).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #ddd", paddingTop: "5px" }}>
            <span>Current Balance:</span>
            <strong style={{ color: Number(agent.wallet.balance) < 0 ? "red" : "green" }}>
              {Number(agent.wallet.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </strong>
          </div>
        </div>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
        <thead>
          <tr style={{ backgroundColor: "#f0f0f0", borderBottom: "2px solid #ccc" }}>
            <th style={{ textAlign: "left", padding: "8px" }}>Date</th>
            <th style={{ textAlign: "left", padding: "8px" }}>Reference</th>
            <th style={{ textAlign: "left", padding: "8px" }}>Description</th>
            <th style={{ textAlign: "left", padding: "8px" }}>Method</th>
            <th style={{ textAlign: "right", padding: "8px" }}>Debit</th>
            <th style={{ textAlign: "right", padding: "8px" }}>Credit</th>
            <th style={{ textAlign: "right", padding: "8px" }}>Balance</th>
          </tr>
        </thead>
        <tbody>
          {entries.length === 0 ? (
            <tr>
              <td colSpan={7} style={{ textAlign: "center", padding: "20px", color: "#666" }}>No transactions recorded on this account.</td>
            </tr>
          ) : (
            entries.map((entry) => (
              <tr key={entry.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "8px" }}>{entry.postedAt.toLocaleString()}</td>
                <td style={{ padding: "8px", fontWeight: "bold" }}>{entry.entryNumber}</td>
                <td style={{ padding: "8px" }}>{entry.reason || entry.referenceType} ({entry.externalRef || "N/A"})</td>
                <td style={{ padding: "8px" }}>{entry.paymentMethod?.name || "System"}</td>
                <td style={{ padding: "8px", textAlign: "right", color: "red" }}>
                  {entry.type.includes("DEBIT") ? Number(entry.amount).toLocaleString(undefined, { minimumFractionDigits: 2 }) : ""}
                </td>
                <td style={{ padding: "8px", textAlign: "right", color: "green" }}>
                  {!entry.type.includes("DEBIT") ? Number(entry.amount).toLocaleString(undefined, { minimumFractionDigits: 2 }) : ""}
                </td>
                <td style={{ padding: "8px", textAlign: "right", fontWeight: "bold" }}>
                  {Number(entry.balanceAfter).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div style={{ marginTop: "20mm", textAlign: "center", fontSize: "10px", color: "#888", borderTop: "1px solid #ccc", paddingTop: "5mm" }}>
        <p style={{ margin: 0 }}>This is a computer-generated document. No signature is required.</p>
        <p style={{ margin: 0 }}>Report generated by AAU Chamo ERP System.</p>
      </div>

      <script dangerouslySetInnerHTML={{ __html: `window.onload = function() { window.print(); }` }} />
    </div>
  );
}
