# A.A.U CHAMO INTERNATIONAL BUSINESS AGENCY SERVICES LIMITED
## Enterprise ERP & Operations Suite — Master User Manual
**Version 1.0 (2026 Production Edition)**

---

> [!IMPORTANT]
> **CONFIDENTIALITY & OFFICIAL OPERATIONAL GUIDE**
> This Master User Manual is the comprehensive operational guide for A.A.U Chamo International Business Agency Services Limited. It covers all 14 enterprise modules, role-based authorization matrices, step-by-step operating instructions, mobile PWA punch clock guides, and audit procedures.

---

# Table of Contents
1. [Volume 1: Super Admin & System Administrator Manual](#volume-1-super-admin--system-administrator-manual)
2. [Volume 2: Sales Officer & Point of Sale (POS) Counter Manual](#volume-2-sales-officer--point-of-sale-pos-counter-manual)
3. [Volume 3: HR Officer & Mobile Attendance Punch Clock Manual](#volume-3-hr-officer--mobile-attendance-punch-clock-manual)
4. [Volume 4: Operations Manager & Station Inventory Manual](#volume-4-operations-manager--station-inventory-manual)
5. [Volume 5: Cargo Officer & Freight Logistics Manual](#volume-5-cargo-officer--freight-logistics-manual)
6. [Volume 6: Finance Officer & Accounting Manual](#volume-6-finance-officer--accounting-manual)
7. [Volume 7: Auditor & Compliance Inspection Manual](#volume-7-auditor--compliance-inspection-manual)

---

<div page-break-after="always"></div>

# Volume 1: Super Admin & System Administrator Manual
**Module 01 Focus: System Governance, Security, Access Control & Executive Dashboard**

## 1. Executive Summary & Role Definition
As a **Super Administrator** or **System Administrator** at AAU Chamo, you hold full, company-wide operational authority over the platform.

### Core Responsibilities
1. **System Governance**: Onboarding users, configuring organizational structures (Business Units and Stations), and assigning role-based permissions.
2. **Security & Compliance**: Overseeing user access, enforcing password policies, managing AES-256 data encryption keys, and revoking suspicious active sessions.
3. **Audit Chain Integrity**: Verifying the cryptographic integrity of the system's tamper-proof audit trail.
4. **Operational Oversight**: Monitoring real-time company KPIs, multi-station revenue trends, and approving high-value operational requests.

## 2. Onboarding Users & Station Scope Scoping
1. Navigate to **System Settings → User Management → Add New User**.
2. Enter Username, Email, Full Name, and Initial Password.
3. Assign Primary Role (*Super Admin*, *Admin*, *Finance*, *HR*, *Operations*, *Sales*, *Auditor*).
4. Set Station Scope (*Assigned Station* vs *Company-Wide Access*).
5. Link user login to employee profile in **HR → Staff Catalogue** to enable mobile punch clocking.

## 3. Executive Dashboard & Cryptographic Audit Verification
1. Review real-time company revenue, active sales, cargo freight, and attention queues on `/`.
2. Navigate to **Compliance → Audit Verification**.
3. Click **Execute Hash Chain Integrity Check** (`/api/audit/verify`) to verify SHA-256 hash digests and confirm 0 database tampering.

---

<div page-break-after="always"></div>

# Volume 2: Sales Officer & Point of Sale (POS) Counter Manual
**Module 02 Focus: Retail Checkout, Barcode Scanning, Split Payments & Cash Reconciliation**

## 1. Executive Summary & Role Definition
As a **Sales Officer** or **Cashier**, your primary responsibility is to deliver fast, accurate, and secure customer transactions at the retail checkout counter.

## 2. Step-by-Step Operating Instructions

### Opening POS Drawer Session
1. Navigate to **Point of Sale (POS)**.
2. Enter **Opening Cash Float** (e.g., `₦ 10,000.00`).
3. Click **Start Session**. Status becomes **Drawer Status: OPEN 🟢**.

### Processing Checkout & Split Payments
1. Scan product barcodes or search items by name.
2. Attach or create customer profile (**+ Quick Add Customer**).
3. Select Payment Method:
   - **Cash**: Enter Cash Received; system calculates exact change.
   - **Transfer / POS Card**: Enter transaction reference code.
   - **Split Payment**: Enter Cash amount + Transfer amount to equal Total Due.
4. Click **Complete Sale** to auto-deduct stock, record ledger entries, and print thermal receipt.

### Closing POS Drawer & Cash Reconciliation
1. Click **Close Drawer Session**.
2. Count physical drawer cash and enter **Counted Cash**.
3. System calculates **Variance** (*Balanced*, *Shortage*, or *Surplus*).
4. Click **Finalize & Close Session** and submit cash bag to Finance Officer.

---

<div page-break-after="always"></div>

# Volume 3: HR Officer & Mobile Attendance Punch Clock Manual
**Module 03 & 05 Focus: Staff Administration, ID Cards & PWA Attendance Punch Clock**

## 1. Executive Summary & Role Definition
As an **HR Officer**, you manage employee onboarding, department structures, staff appointment letters, official ID cards, and mobile attendance tracking.

## 2. Onboarding & ID Card Printing
1. Register staff details in **HR Management → Staff Catalogue**.
2. Select Home Station, Department, Position, Salary, and Employment Type.
3. Link system login user to enable mobile punch clocking.
4. Click **Print Documents → Appointment Letter** or **Employee ID Card** (with scannable barcode).

## 3. Mobile PWA Attendance App (`/attendance`)
1. Staff open `https://<domain>/attendance` on iOS Safari or Android Chrome.
2. Tap **Add to Home Screen** to install the **AAU Clock** app icon.
3. App acquires high-accuracy GPS lock (`GPS Lock Connected`).
4. Tap **CLOCK IN NOW** at start of shift and **CLOCK OUT NOW** at end of shift.
5. HR monitors daily logs, shift durations, IP addresses, and GPS map pin links in **HR → Attendance Logs**.

---

<div page-break-after="always"></div>

# Volume 4: Operations Manager & Station Inventory Manual
**Module 04 & 07 Focus: Station Governance, Stock Balances, Transfers & Maker-Checker Adjustments**

## 1. Executive Summary & Role Definition
As an **Operations Manager**, you oversee physical station throughput, live inventory balances, inter-station stock transfers, and stock adjustment approvals.

## 2. Inter-Station Stock Transfers (2-Step Workflow)
1. **Request**: Click **New Transfer Request** → Select Source Station, Destination Station, and quantities. Status = `PENDING DISPATCH`.
2. **Dispatch (Source Manager)**: Inspect loaded items → Click **Dispatch Lines**. Stock is deducted from Source Station and marked in-transit.
3. **Receive (Destination Manager)**: Inspect physical arrival → Click **Receive Lines**. Stock is added to Destination Station balance.

## 3. Maker-Checker Stock Adjustments
1. **Maker (Requester)**: Submits physical count delta with reason (e.g. *cycle count delta*). Status = `PENDING_APPROVAL`.
2. **Checker (Approver)**: A second manager/admin reviews and clicks **Approve Adjustment**. Status = `POSTED`. Ledger updates safely.

---

<div page-break-after="always"></div>

# Volume 5: Cargo Officer & Freight Logistics Manual
**Module 08 Focus: Air Waybills (AWB), Package Labeling, Dispatch Tracking & Corrections**

## 1. Executive Summary & Role Definition
As a **Cargo Officer**, you register cargo freight, issue Air Waybills (AWBs), print thermal package labels, manage flight/vehicle dispatch manifests, and support customer tracking.

## 2. Step-by-Step Freight Operations
1. **Book AWB**: Capture Sender, Receiver, Cargo Category, Pieces, Weight (kg), and Declared Value.
2. **Thermal Label Tagging**: Print 80mm sticky shipping tags (`AWB-902841 [Piece 1 of 3]`) and attach to packages. Scan tag barcodes to verify pieces.
3. **Dispatch Manifest**: Assign shipments to outbound flight/vehicle number and click **Confirm Dispatch**.
4. **Correction Requests**: If AWB details need post-booking edits, submit a **Cargo Correction Request** for supervisor approval.
5. **Public Live Tracking**: Senders/receivers track real-time status at `https://<domain>/track/[AWB_NUMBER]`.

---

<div page-break-after="always"></div>

# Volume 6: Finance Officer & Accounting Manual
**Module 10 & 11 Focus: Double-Entry Vouchers, Agent Wallets, Period Closing & P&L Analysis**

## 1. Executive Summary & Role Definition
As a **Finance Officer**, you maintain double-entry financial ledgers, audit cash drawer session reports, manage agent digital wallets, lock financial periods, and generate Profit & Loss (P&L) statements.

## 2. Double-Entry Vouchers & Agent Wallets
1. **Post Vouchers**: Record Income and Expense vouchers against standardized account codes with receipt attachments.
2. **Agent Wallets**: Process agent wallet deposits, set credit limits, issue reversals, and export monthly **Statement of Account** continuity reports.
3. **POS Cash Audit**: Audit cashier closing reports and post **Bank Deposit Reconciliations**.

## 3. Financial Period Closing & P&L Analysis
1. Select completed financial month in **Finance → Financial Periods** and click **Lock Period**. Prevents unauthorized backdated postings.
2. Generate **Profit & Loss Statement**: Calculates Gross Revenue - COGS - OPEX = Net Operating Profit. Export to CSV.

---

<div page-break-after="always"></div>

# Volume 7: Auditor & Compliance Inspection Manual
**Module 12 & 13 Focus: Automated Reports, Document Lineage & Cryptographic Audit Verification**

## 1. Executive Summary & Role Definition
As an **Auditor**, you possess company-wide read-only access to independently verify financial accuracy, inspect document lineages, and audit system integrity.

## 2. Compliance Audit Workflows
1. **17 Standardized Reports**: Run and export Sales, Inventory Valuation, AWB Freight, Attendance, and P&L reports to CSV format.
2. **Cryptographic Chain Verification**: Execute `/api/audit/verify` to recalculate SHA-256 hash digests and confirm 0 database tampering.
3. **Document Lineage & Reprint Audits**: Inspect `PrintEvent` logs and watermark duplicate stamps to prevent invoice/receipt fraud.

---

**© 2026 A.A.U Chamo International Business Agency Services Limited. All Rights Reserved.**
