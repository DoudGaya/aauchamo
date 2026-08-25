import Image from "next/image";

export default function ManualPrintPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @page { size: A4; margin: 15mm; }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: #fff !important; }
          .page-break { page-break-before: always; }
          .no-break { page-break-inside: avoid; }
        }
        body { font-family: "Inter", sans-serif; background: #f3f4f6; color: #111827; }
        .print-container { max-width: 210mm; margin: 0 auto; background: #fff; padding: 20mm; box-shadow: 0 4px 6px rgba(0,0,0,0.05); min-height: 297mm; }
        .header { border-bottom: 2px solid #10243d; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
        .header h1 { margin: 0; font-size: 24px; color: #10243d; }
        .header p { margin: 4px 0 0; font-size: 14px; color: #4b5563; }
        
        h2 { font-size: 20px; color: #10243d; margin-top: 30px; margin-bottom: 16px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; }
        h3 { font-size: 16px; color: #1f2937; margin-top: 24px; margin-bottom: 8px; }
        p { font-size: 14px; line-height: 1.6; color: #374151; margin-bottom: 12px; }
        ul { margin-bottom: 24px; padding-left: 20px; }
        li { font-size: 14px; line-height: 1.6; color: #374151; margin-bottom: 6px; }
        strong { color: #111827; }
      `}} />
      <div className="print-container">
        <div className="header">
          <div>
            <h1>AAU Chamo Software Manual</h1>
            <p>Comprehensive Guide & Operational Procedures</p>
          </div>
          <Image src="/logo.png" alt="AAU Chamo" width={140} height={35} style={{ objectFit: "contain" }} />
        </div>

        <div className="no-break">
          <h2>1. Introduction & Navigation Basics</h2>
          <p>Welcome to the AAU Chamo ERP system. This software is designed to manage our entire logistics, cargo, ticketing, and financial operations seamlessly across all stations.</p>
          <ul>
            <li><strong>Sidebar Navigation:</strong> On the left, you will find all the modules you have access to. Click any module to open its dashboard.</li>
            <li><strong>Global Search:</strong> Use the search bar at the top or press Ctrl + K to quickly find cargo AWBs, customer records, or flight bookings.</li>
            <li><strong>Workspace Chip:</strong> Located at the top of the sidebar. It shows your current active station. You can only process operations within your assigned station unless you have Admin privileges.</li>
            <li><strong>Theme Toggle:</strong> Click the Moon/Sun icon at the top right to switch between Dark mode and Light mode for comfortable viewing.</li>
          </ul>
        </div>

        <div className="no-break">
          <h2>2. Roles and Responsibilities</h2>
          <p>Access to features is restricted based on your assigned role to maintain security and operational integrity.</p>
          
          <h3>Administrator</h3>
          <p><strong>Responsibilities:</strong> Full oversight of all company operations, financial auditing, and staff management.</p>
          <ul>
            <li>Can view and manage data across <strong>all stations</strong> network-wide.</li>
            <li>Manage user access, invite new staff, and assign roles.</li>
            <li>Access the <strong>Correction Tools</strong> (Management module) to reverse transactions, refund sales, or override locks.</li>
            <li>View the immutable <strong>Audit Trail</strong> for security and compliance.</li>
          </ul>

          <h3>Station Manager</h3>
          <p><strong>Responsibilities:</strong> Oversight of a specific branch/station's daily operations.</p>
          <ul>
            <li>Manage station-specific inventory, stock levels, and staff attendance.</li>
            <li>Approve voided sales and monitor agent wallet balances.</li>
            <li>Can view the <strong>Live Operations</strong> dashboard to track incoming and outgoing cargo for their specific station.</li>
          </ul>
        </div>

        <div className="page-break" />

        <div className="no-break">
          <h3>Sales / Ticketing Agent</h3>
          <p><strong>Responsibilities:</strong> Customer-facing operations, processing sales, and handling cargo intake.</p>
          <ul>
            <li>Operate the <strong>Point of Sale (POS)</strong> to sell physical inventory or flight tickets.</li>
            <li>Create new <strong>Cargo AWBs</strong> (Air Waybills), input weight, and print labels (Thermal or A4).</li>
            <li>Must maintain a positive wallet balance or operate within their assigned credit limit to process transactions.</li>
            <li>Can update the status of Cargo (e.g., from Processing to Dispatched).</li>
          </ul>

          <h3>Finance Officer</h3>
          <p><strong>Responsibilities:</strong> Reconciliation of cash, agent wallets, and corporate accounts.</p>
          <ul>
            <li>Monitor the <strong>Finance</strong> module for all cash inflows and outflows.</li>
            <li>Process agent wallet deposits and credit limit adjustments.</li>
            <li>Export financial reports and reconcile daily cash drawer totals against system logs.</li>
          </ul>
        </div>

        <div className="no-break">
          <h2>3. Core Module Workflows</h2>
          
          <h3>Cargo & Air Waybills (AWB)</h3>
          <p>The Cargo module tracks shipments from origin to destination.</p>
          <ul>
            <li><strong>Creation:</strong> Click "Create AWB", select the customer, enter weight/pieces, and choose the routing.</li>
            <li><strong>Labeling:</strong> Once created, click the Printer icon to generate a barcode label. You can choose Thermal or standard A4 output.</li>
            <li><strong>Status Tracking:</strong> Cargo moves through statuses: Processing → Dispatched → In Transit → Arrived → Delivered.</li>
          </ul>

          <h3>Point of Sale (POS) & Ticketing</h3>
          <p>Used to process walk-in customer purchases.</p>
          <ul>
            <li>Select items or enter flight PNR details into the cart.</li>
            <li>Apply customer details if necessary.</li>
            <li>Process payment. The system automatically deducts from your virtual wallet or records a cash/transfer receipt.</li>
          </ul>
        </div>

        <div className="no-break">
          <h2>4. Security and Auditing</h2>
          <p>Every action you take in the system is logged immutably. Do not share your login credentials.</p>
          <ul>
            <li>If you make a mistake on a sale or cargo record, you cannot delete it. You must request a reversal or void from a Station Manager or Admin.</li>
            <li>All printed labels are versioned. Reprinting a label logs an audit event and requires you to provide a reason.</li>
          </ul>
        </div>

        <div style={{ marginTop: "40px", paddingTop: "20px", borderTop: "1px solid #e5e7eb", textAlign: "center", fontSize: "12px", color: "#6b7280" }}>
          AAU Chamo Official Documentation &middot; Generated {new Date().toLocaleDateString("en-NG")}
        </div>
      </div>
    </>
  );
}
