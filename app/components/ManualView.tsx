import { Panel } from "../erp-workspace";
import { navigation, moduleMeta } from "@/lib/erp-data";

export function ManualView() {
  return (
    <div className="content-stack">
      <Panel>
        <div className="manual-content" style={{ padding: "40px", maxWidth: "800px", margin: "0 auto", lineHeight: 1.6 }}>
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
             <h1 style={{ fontSize: "32px", color: "var(--text-primary)", marginBottom: "8px" }}>AAU Chamo Software Manual</h1>
             <p style={{ color: "var(--text-secondary)", fontSize: "16px" }}>Comprehensive Guide & Operational Procedures</p>
          </div>
          
          <h2 style={{ fontSize: "22px", marginTop: "32px", marginBottom: "16px", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px" }}>1. Introduction & Navigation Basics</h2>
          <p>Welcome to the AAU Chamo ERP system. This software is designed to manage our entire logistics, cargo, ticketing, and financial operations seamlessly across all stations.</p>
          <ul style={{ paddingLeft: "24px", marginTop: "12px", marginBottom: "24px" }}>
            <li style={{ marginBottom: "8px" }}><strong>Sidebar Navigation:</strong> On the left, you will find all the modules you have access to. Click any module to open its dashboard.</li>
            <li style={{ marginBottom: "8px" }}><strong>Global Search:</strong> Use the search bar at the top or press <kbd>Ctrl</kbd> + <kbd>K</kbd> to quickly find cargo AWBs, customer records, or flight bookings.</li>
            <li style={{ marginBottom: "8px" }}><strong>Workspace Chip:</strong> Located at the top of the sidebar. It shows your current active station. You can only process operations within your assigned station unless you have Admin privileges.</li>
            <li style={{ marginBottom: "8px" }}><strong>Theme Toggle:</strong> Click the Moon/Sun icon at the top right to switch between Dark mode and Light mode for comfortable viewing.</li>
          </ul>

          <h2 style={{ fontSize: "22px", marginTop: "32px", marginBottom: "16px", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px" }}>2. Roles and Responsibilities</h2>
          <p>Access to features is restricted based on your assigned role to maintain security and operational integrity.</p>
          
          <h3 style={{ fontSize: "18px", marginTop: "24px", marginBottom: "12px" }}>Administrator</h3>
          <p><strong>Responsibilities:</strong> Full oversight of all company operations, financial auditing, and staff management.</p>
          <ul style={{ paddingLeft: "24px", marginBottom: "24px" }}>
            <li style={{ marginBottom: "8px" }}>Can view and manage data across <strong>all stations</strong> network-wide.</li>
            <li style={{ marginBottom: "8px" }}>Manage user access, invite new staff, and assign roles.</li>
            <li style={{ marginBottom: "8px" }}>Access the <strong>Correction Tools</strong> (Management module) to reverse transactions, refund sales, or override locks.</li>
            <li style={{ marginBottom: "8px" }}>View the immutable <strong>Audit Trail</strong> for security and compliance.</li>
          </ul>

          <h3 style={{ fontSize: "18px", marginTop: "24px", marginBottom: "12px" }}>Station Manager</h3>
          <p><strong>Responsibilities:</strong> Oversight of a specific branch/station's daily operations.</p>
          <ul style={{ paddingLeft: "24px", marginBottom: "24px" }}>
            <li style={{ marginBottom: "8px" }}>Manage station-specific inventory, stock levels, and staff attendance.</li>
            <li style={{ marginBottom: "8px" }}>Approve voided sales and monitor agent wallet balances.</li>
            <li style={{ marginBottom: "8px" }}>Can view the <strong>Live Operations</strong> dashboard to track incoming and outgoing cargo for their specific station.</li>
          </ul>

          <h3 style={{ fontSize: "18px", marginTop: "24px", marginBottom: "12px" }}>Sales / Ticketing Agent</h3>
          <p><strong>Responsibilities:</strong> Customer-facing operations, processing sales, and handling cargo intake.</p>
          <ul style={{ paddingLeft: "24px", marginBottom: "24px" }}>
            <li style={{ marginBottom: "8px" }}>Operate the <strong>Point of Sale (POS)</strong> to sell physical inventory or flight tickets.</li>
            <li style={{ marginBottom: "8px" }}>Create new <strong>Cargo AWBs</strong> (Air Waybills), input weight, and print labels (Thermal or A4).</li>
            <li style={{ marginBottom: "8px" }}>Must maintain a positive wallet balance or operate within their assigned credit limit to process transactions.</li>
            <li style={{ marginBottom: "8px" }}>Can update the status of Cargo (e.g., from Processing to Dispatched).</li>
          </ul>

          <h3 style={{ fontSize: "18px", marginTop: "24px", marginBottom: "12px" }}>Finance Officer</h3>
          <p><strong>Responsibilities:</strong> Reconciliation of cash, agent wallets, and corporate accounts.</p>
          <ul style={{ paddingLeft: "24px", marginBottom: "24px" }}>
            <li style={{ marginBottom: "8px" }}>Monitor the <strong>Finance</strong> module for all cash inflows and outflows.</li>
            <li style={{ marginBottom: "8px" }}>Process agent wallet deposits and credit limit adjustments.</li>
            <li style={{ marginBottom: "8px" }}>Export financial reports and reconcile daily cash drawer totals against system logs.</li>
          </ul>

          <h2 style={{ fontSize: "22px", marginTop: "32px", marginBottom: "16px", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px" }}>3. Module Directory & Capabilities</h2>
          <p>The system is divided into operational areas. Below is a comprehensive explanation of every section available in the sidebar (depending on your permissions).</p>

          {navigation.map((group) => (
            <div key={group.label} style={{ marginBottom: "32px" }}>
              <h3 style={{ fontSize: "20px", marginTop: "24px", marginBottom: "16px", color: "var(--accent)" }}>{group.label}</h3>
              {group.items.map((item) => {
                const meta = moduleMeta[item.id];
                const Icon = item.icon;
                return (
                  <div key={item.id} style={{ marginBottom: "20px", padding: "16px", background: "var(--panel-bg-hover)", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                      <div style={{ background: "var(--accent-subtle)", color: "var(--accent)", padding: "8px", borderRadius: "6px" }}>
                        <Icon size={20} />
                      </div>
                      <div>
                        <h4 style={{ fontSize: "16px", margin: 0 }}>{item.label}</h4>
                        <span style={{ fontSize: "12px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{meta?.eyebrow}</span>
                      </div>
                    </div>
                    <p style={{ margin: 0, fontSize: "14px", color: "var(--text-secondary)", paddingLeft: "44px" }}>
                      {meta?.description || "Access and manage items in this module."}
                    </p>
                  </div>
                );
              })}
            </div>
          ))}

          <h2 style={{ fontSize: "22px", marginTop: "32px", marginBottom: "16px", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px" }}>4. Security and Auditing</h2>
          <p>Every action you take in the system is logged immutably. Do not share your login credentials.</p>
          <ul style={{ paddingLeft: "24px", marginBottom: "24px" }}>
            <li style={{ marginBottom: "8px" }}>If you make a mistake on a sale or cargo record, you cannot delete it. You must request a reversal or void from a Station Manager or Admin.</li>
            <li style={{ marginBottom: "8px" }}>All printed labels are versioned. Reprinting a label logs an audit event and requires you to provide a reason.</li>
          </ul>
        </div>
      </Panel>
    </div>
  );
}
