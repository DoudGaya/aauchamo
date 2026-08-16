# A.A.U CHAMO INTERNATIONAL BUSINESS AGENCY SERVICES LIMITED
## Enterprise ERP Dedicated Manual Series
### Volume 7: Auditor & Compliance Inspection Manual
**Module 12 & 13 Focus: Automated Reports, Document Lineage & Cryptographic Audit Verification**

---

> [!NOTE]
> **WELCOME AUDITORS & COMPLIANCE OFFICERS**
> This manual provides step-by-step instructions for conducting internal and external compliance audits, generating 17 automated reports, tracking document lineage, and verifying database cryptographic hash chain integrity.

---

## 1. Executive Summary & Role Definition

As an **Auditor** or **Compliance Officer** at AAU Chamo, your primary responsibility is to independently verify financial accuracy, inspect operational audit trails, and ensure system compliance across all physical stations.

### Primary Duties
1. **Read-Only Inspection**: Possess company-wide read-only visibility across ledgers, inventory, sales, and attendance without risk of accidental data mutation.
2. **Automated Reporting**: Run and export the 17 standardized operational and financial reports into CSV format for independent analysis.
3. **Document Lineage Verification**: Track original document creation, version lineages, and reprint event logs.
4. **Cryptographic Chain Audit**: Verify the SHA-256 hash digest chain to confirm zero database tampering.

---

## 2. Section 1: Read-Only Audit Scope & Security Controls

Auditors operate under strict **Read-Only Authority**:
- You can inspect every screen, transaction, cash drawer report, and inventory balance across all stations.
- The ERP interface automatically hides or disables all action buttons (*Create*, *Edit*, *Delete*, *Approve*, *Post*) for Auditor logins.

---

## 3. Section 2: Executing & Exporting 17 Standardized Reports

The **Reporting & Analytics Module** provides 17 pre-built reports covering every operational division:

### 3.1 Step-by-Step Report Execution
1. Log in to the ERP using your **Auditor** credentials.
2. Navigate to **Reporting & Analytics → Report Centre**.
3. Select the desired Report Category:
   - **Sales & Revenue Reports**: Consolidated Sales, Sales by Station, Profit Margin Analysis.
   - **Inventory & Stock Reports**: Stock On Hand Valuation, Movement Ledgers, Transfer Audits.
   - **Cargo & Freight Reports**: AWB Tonnage Summary, Freight Revenue by Destination Hub.
   - **HR & Punctuality Reports**: Attendance Punctuality Log, Staff Shift Hours.
   - **Financial Reports**: Cashbook Reconciliation, P&L Statement, Trial Balance Summary.
4. Set Filters: Select Date Range and Station Scope (*All Stations* or *Specific Location*).
5. Click **Run Report**.
6. Click **Export Report (CSV)** to download raw data for Microsoft Excel or audit software analysis.

---

## 4. Section 3: Cryptographic Audit Chain Verification

AAU Chamo ERP incorporates an append-only **Cryptographic Hash Chain** for all system transactions (`AuditEvent`).

```
[ Genesis Block ] -> [ AuditEvent #1001 (Hash A) ] -> [ AuditEvent #1002 (Hash B) ] -> [ Current ]
```

### 3.1 Step-by-Step Integrity Audit
1. Navigate to **Compliance → Audit Verification**.
2. Click **Execute Hash Chain Integrity Check**.
3. The system recalculates SHA-256 hash digests sequentially from the initial system event to the latest record.
4. **Audit Result Interpretation**:
   - **Status 200 (OK)**: 100% Chain Integrity Verified. No records have been modified, backdated, or deleted.
   - **Status 409 (Mismatch)**: Identifies the exact record ID where chain continuity was broken, alerting you to unauthorized direct database intervention.

---

## 5. Section 4: Document Lineage & Reprint Fraud Auditing

To prevent fraud associated with duplicate invoices or unauthorized document reprinting:

### 4.1 Inspecting Document Lineage
1. Navigate to **Document Center → Document Search**.
2. Search by Document ID or Order Reference (e.g., `DOC-89012`).
3. View the **Document Lineage Tree**:
   - Original Creator ID & Timestamp
   - Attached Version History
   - Digital Signature Hash

### 4.2 Auditing Document Reprint Logs
1. Open **Document Center → Reprint Audit Log**.
2. Filter by Document Type (*POS Receipt*, *Invoice*, *AWB Shipping Tag*).
3. Review every reprint request:
   - **Requester Name** & Station ID
   - **Reason Provided for Reprint** (e.g., *Printer paper jam*)
   - **Reprint Count Number** (Duplicate copies carry mandatory watermark stamps)

---

## 6. Section 5: Auditor Inspection Checklist

Perform these routine checks during monthly or quarterly compliance audits:

- [ ] **Step 1**: Execute Cryptographic Hash Chain Verification (`/api/audit/verify`).
- [ ] **Step 2**: Reconcile Total POS Sales with Total Bank Cash Deposits across all stations.
- [ ] **Step 3**: Inspect Maker-Checker Stock Adjustment logs for unapproved delta entries.
- [ ] **Step 4**: Verify Agent Wallet Continuity Statements (Opening Balance + Deposits - Bookings = Closing Balance).
- [ ] **Step 5**: Export Staff Attendance Punctuality Log and cross-reference GPS location pins.

---

**© 2026 A.A.U Chamo International Business Agency Services Limited. All Rights Reserved.**
