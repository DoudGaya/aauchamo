# A.A.U CHAMO INTERNATIONAL BUSINESS AGENCY SERVICES LIMITED
## Enterprise ERP Dedicated Manual Series
### Volume 6: Finance Officer & Accounting Manual
**Module 10 & 11 Focus: Double-Entry Vouchers, Agent Wallets, Period Closing & P&L Analysis**

---

> [!NOTE]
> **WELCOME FINANCE OFFICERS & ACCOUNTANTS**
> This manual provides step-by-step instructions for managing double-entry financial ledgers, agent digital wallets, POS cash session reconciliations, financial period locking, and Profit & Loss (P&L) statements.

---

## 1. Executive Summary & Role Definition

As a **Finance Officer** or **Accountant** at AAU Chamo, your primary responsibility is to maintain complete financial accuracy, enforce double-entry ledger controls, manage agent credit lines, and verify station cash flows.

### Primary Duties
1. **Double-Entry Voucher Posting**: Record income and expense vouchers against standardized financial accounts.
2. **Agent Digital Wallet Management**: Process wallet deposits, credit limit adjustments, reversals, and monthly continuity statements.
3. **POS Cash Reconciliation**: Audit cashier shift reports, verify cash-to-bank deposits, and resolve drawer variances.
4. **Financial Period Closing**: Lock past accounting periods to prevent unauthorized backdated entries.
5. **P&L & Financial Reporting**: Generate real-time Profit & Loss statements and financial summary ledgers.

---

## 2. Section 1: Double-Entry Financial Vouchers

AAU Chamo ERP enforces strict **Double-Entry Bookkeeping Principles**. Every financial entry automatically updates corresponding Debit and Credit ledger accounts.

```
+-----------------------------------------------------------------------------------+
|  POST FINANCIAL VOUCHER                                                           |
+-----------------------------------------------------------------------------------+
| Voucher Type: [ Expense Voucher  v]   Transaction Date: [ 2026-08-16 ]             |
| Station: [ HQ Main Warehouse     v]   Category: [ Operating Utilities   v]        |
| --------------------------------------------------------------------------------- |
| Account Debited:   [ 5010 - Generator Fuel Expense   v]  Amount: ₦ 120,000.00     |
| Account Credited:  [ 1010 - HQ Main Petty Cash Bank  v]  Amount: ₦ 120,000.00     |
| --------------------------------------------------------------------------------- |
| Description / Memo: Purchase of 150L Diesel fuel for HQ backup generator.         |
| Supporting Document: [ Upload Receipt Attachment (Max 10MB) ]                    |
| --------------------------------------------------------------------------------- |
| [ CANCEL ]                                               [ POST ENTRY VOUCHER 💳 ]|
+-----------------------------------------------------------------------------------+
```

### 2.1 Posting an Income Voucher
1. Navigate to **Financial Management → Post Voucher**.
2. Select Voucher Type: **Income Voucher**.
3. Select Category (e.g., *Cargo Service Fee*, *Freight Revenue*, *Commission Income*).
4. Enter Amount, Description, and Account Code.
5. Click **Post Entry Voucher**.

### 2.2 Posting an Expense Voucher
1. Select Voucher Type: **Expense Voucher**.
2. Select Category (e.g., *Utilities*, *Station Maintenance*, *Staff Transport*, *Office Supplies*).
3. Enter Amount, Description, and Debit/Credit accounts.
4. Attach vendor receipt scan or bill PDF.
5. Click **Post Entry Voucher**.

---

## 3. Section 2: Agent Digital Wallets & Credit Line Controls

The ERP provides commercial agents with **Digital Wallets** used for automated booking payments.

### 3.1 Processing an Agent Wallet Top-Up (Deposit)
1. Navigate to **Agent Management → Select Agent**.
2. Click **Wallet Actions → Deposit / Top-Up**.
3. Select Payment Source (*Bank Transfer*, *Cash Deposit*, *Cheque*).
4. Enter **Deposit Amount** (e.g., `₦ 500,000.00`) and Bank Reference Number.
5. Click **Confirm Top-Up**. The agent's available wallet balance increases immediately.

### 3.2 Reversing Erroneous Wallet Adjustments
If an incorrect deposit amount was posted in error:
1. Open the Agent Wallet ledger.
2. Click **Reverse Transaction** on the specific ledger row.
3. Enter mandatory **Reversal Reason**.
4. The ERP posts an exact offsetting reversal entry, maintaining audit trail continuity.

### 3.3 Generating Agent Statement of Account
1. Open the Agent profile and click **Generate Statement**.
2. Select Date Range (e.g., *Month-to-Date* or *Custom Period*).
3. The statement displays:
   - Opening Wallet Balance
   - Itemized Deposits & Credits
   - Itemized Sales & Booking Debits
   - **Closing Wallet Balance**
4. Click **Print Statement** or **Export PDF**.

---

## 4. Section 3: Cash Session Reconciliations & Drawer Audits

### 4.1 Auditing Cashier Shift Closings
1. Navigate to **Finance → POS Cash Sessions**.
2. Review shift closing reports submitted by Sales Officers.
3. Verify:
   - Opening Cash Float
   - Recorded Cash Sales
   - **Counted Physical Cash**
   - Calculated Variance
4. If balanced, click **Approve Cash Session**.

### 4.2 Posting Bank Deposit Reconciliations
When station managers deposit accumulated cash into the company bank account:
1. Navigate to **Finance → Cash Reconciliations**.
2. Click **Post Bank Deposit**.
3. Select Source Cashbook and Target Bank Account.
4. Enter Bank Deposit Teller Number and Amount.
5. Click **Confirm Deposit Reconciliation**.

---

## 5. Section 4: Financial Period Closing & Profit & Loss (P&L)

### 5.1 Locking Past Accounting Periods
To ensure past financial reports cannot be tampered with after monthly closing:

1. Navigate to **Financial Management → Financial Periods**.
2. Select the completed period (e.g., `July 2026`).
3. Click **Lock Financial Period**.
4. Once locked, the ERP will reject any future attempts to post, edit, or backdate entries in that period.

### 5.2 Generating Profit & Loss (P&L) Statements
1. Navigate to **Finance → P&L Statement**.
2. Select Station Filter (*All Stations* or *Specific Location*) and Date Range.
3. The system calculates:
   - **Gross Revenue**: POS Sales + Cargo Freight + Booking Fees.
   - **Cost of Goods Sold (COGS)**: Direct product acquisition costs.
   - **Gross Operating Margin**.
   - **Operating Expenses (OPEX)**: Salaries, utilities, maintenance, fuel.
   - **NET OPERATING PROFIT / LOSS**.
4. Click **Export P&L Report (CSV)** for board presentations.

---

## 6. Section 5: Finance Troubleshooting Guide

| Problem | Cause | Solution |
| :--- | :--- | :--- |
| **"Posting blocked in closed period" Error (422)** | Entry date falls within a locked financial month | Adjust transaction date to current open period, or ask Admin to temporarily unlock period. |
| **Agent booking rejected for "Credit Limit Exceeded"** | Agent wallet balance + credit line insufficient | Have Agent deposit funds or submit a Credit Limit Extension Request for Admin approval. |
| **Cash session closing displays negative variance** | Cashier drawer is short on physical cash | Audit cashier receipt logs. Record variance as an Employee Shortage Receivable if uncorrected. |

---

**© 2026 A.A.U Chamo International Business Agency Services Limited. All Rights Reserved.**
