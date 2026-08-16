# A.A.U CHAMO INTERNATIONAL BUSINESS AGENCY SERVICES LIMITED
## Enterprise ERP Dedicated Manual Series
### Volume 1: Super Admin & System Administrator Manual
**Module 01 Focus: System Governance, Security, Access Control & Executive Dashboard**

---

> [!IMPORTANT]
> **CONFIDENTIALITY & SECURITY NOTICE**
> This manual is intended strictly for authorized **Super Administrators** and **System Owners** of A.A.U Chamo International Business Agency Services Limited. It contains step-by-step procedures for managing system security, user permissions, audit chains, and enterprise configurations.

---

## 1. Executive Summary & Role Definition

As a **Super Administrator** or **System Administrator** in the AAU Chamo ERP system, you hold full, company-wide operational authority over the platform. Your primary responsibilities include:

1. **System Governance**: Onboarding users, configuring organizational structures (Business Units and Stations), and assigning role-based permissions.
2. **Security & Compliance**: Overseeing user access, enforcing password policies, managing AES-256 data encryption keys, and revoking suspicious active sessions.
3. **Audit Chain Integrity**: Verifying the cryptographic integrity of the system's tamper-proof audit trail.
4. **Operational Oversight**: Monitoring real-time company KPIs, multi-station revenue trends, and approving high-value operational requests (inventory adjustments, cancellations, and financial vouchers).

---

## 2. Super Admin Navigation Map & Access Scope

Super Admins possess **Company-Wide Scope**, giving you unrestricted visibility across all physical stations (HQ, Branches, Regional Outlets) and all 14 system modules.

### Top Navigation Areas for Administrators
- **Executive Dashboard** (`/`): Real-time analytics, revenue trends, and attention queues.
- **User & Access Management** (`/settings/users`): Account creation, role assignments, station scope bindings.
- **Roles & Permissions** (`/settings/roles`): Granular permission key definitions and custom role creation.
- **Audit & Compliance Center** (`/audit`): Cryptographic hash-chain verification and audit log exports.
- **Company & Business Units** (`/settings`): Legal branding, logo management, payment gateways, and business unit structures.

---

## 3. Section 1: System Onboarding & User Administration

### 3.1 Creating New User Accounts
To onboard a new employee or manager onto the platform:

1. Navigate to **System Settings → User Management**.
2. Click **Add New User**.
3. Fill in the required user details:
   - **Username**: Unique login identifier (e.g., `john.doe`).
   - **Email Address**: Official company email (e.g., `j.doe@aauchamo.local`).
   - **Full Name**: First Name and Last Name.
   - **Initial Password**: Set a strong temporary password meeting security requirements (min 8 characters, uppercase, number, symbol).
4. Select the **Primary Role** (e.g., *Operations Manager*, *Finance Officer*, *Sales Officer*).
5. Assign **Station Operating Scopes**:
   - For location-bound staff: Select their specific assigned station (e.g., `Kano Station`).
   - For company-wide staff: Check **Company-Wide Access** (enables visibility across all stations).
6. Click **Save & Activate User Account**.

### 3.2 Linking User Accounts to Physical Staff Records
To enable staff members to use the **Mobile PWA Attendance Punch Clock App**, their system user account must be linked to a physical **Staff Employee Record**:

1. Navigate to **HR & Staff Management → Staff Catalogue**.
2. Edit or create the employee's physical profile.
3. In the **System User Account** dropdown, select the created user login (`john.doe`).
4. Click **Save Staff Profile**. The employee can now use their mobile phone to clock in/out.

### 3.3 Deactivating or Restricting User Accounts
If an employee leaves the company or changes operational roles:
1. Navigate to **User Management** and locate the user profile.
2. Click **Change Status → Deactivate Account**.
3. Deactivation immediately revokes all active JWT session tokens. The user will be logged out automatically and blocked from future logins.

---

## 4. Section 2: Security Controls & Session Management

### 4.1 Automated Account Locking Policy
To protect against brute-force password guessing attacks:
- The system tracks failed login attempts per username and IP address.
- After **5 consecutive failed password attempts**, the account is automatically locked for **15 minutes**.
- As a Super Admin, you can manually unlock a user account before the 15-minute timer expires by clicking **Unlock User** in the User Management panel.

### 4.2 Managing Active User Sessions
Super Admins can view and manage all active logged-in sessions across the enterprise:

1. Navigate to **Security → Active Sessions**.
2. View active user sessions, including:
   - User Name & Role
   - Login Timestamp & Device User-Agent
   - IP Address & Location
3. To force-logout a suspicious session or lost device, click **Revoke Session**.

### 4.3 Data Encryption Standard
- Sensitive employee national IDs, salary figures, and payment tokens are encrypted at rest using **AES-256-GCM authenticated encryption**.
- The 32-byte encryption key is managed via the environment variable `DATA_ENCRYPTION_KEY`.

---

## 5. Section 3: Executive Dashboard Operations (Module 01)

The **Executive Dashboard** is the command center for Super Admins to monitor real-time company performance.

```
+-----------------------------------------------------------------------------------+
|  AAU CHAMO EXECUTIVE DASHBOARD                                                    |
+--------------------------+--------------------------+-----------------------------+
| TOTAL REVENUE TODAY      | ACTIVE SALES ORDERS      | TOTAL CARGO SHIPMENTS       |
| ₦ 4,850,000.00           | 142 Orders Completed     | 68 Freight AWBs Dispatched  |
+--------------------------+--------------------------+-----------------------------+
| REVENUE TREND ANALYTICS  | STATION PERFORMANCE      | ACTION ATTENTION QUEUE      |
| [Line Chart: 7-Day Trend]| HQ: ₦ 2.4M \| Kano: 1.8M | 3 Pending Inventory Adjust  |
+--------------------------+--------------------------+-----------------------------+
```

### 5.1 Real-Time Executive KPIs
- **Total Revenue (Today & MTD)**: Consolidated sales across POS counters, cargo freight, and ticket bookings.
- **Active Sales Volume**: Total transactions completed today.
- **Cargo Freight Volume**: Total AWBs booked and dispatched.
- **Pending Approvals Count**: High-priority tasks awaiting management decision.

### 5.2 Multi-Station Performance Comparison
Super Admins can filter dashboard analytics by:
- **All Stations (Consolidated)**: Company-wide totals.
- **Individual Station Scope**: Filter metrics specifically for HQ, Kano, Abuja, or regional stations to compare productivity and revenue contribution.

### 5.3 Action Attention Queue Management
The Attention Queue alerts Super Admins to items needing authorization:
1. **Maker-Checker Inventory Adjustments**: Stock count deltas submitted by station managers.
2. **High-Value Expense Vouchers**: Financial payout requests exceeding station limits.
3. **Cargo Shipment Correction Requests**: Modifications requested after AWB dispatch.

---

## 6. Section 4: Audit Trail & Integrity Verification

AAU Chamo ERP implements a **Cryptographic Hash-Chain Audit System**. Every transaction, stock movement, user login, and price change creates an immutable `AuditEvent` entry.

### 6.1 Inspecting Audit Logs
1. Navigate to **Compliance → Audit Trail**.
2. Filter audit events by:
   - **Actor**: Specific employee who performed the action.
   - **Action Type**: E.g., `sales.create`, `inventory.adjust`, `auth.login_failed`.
   - **Date Range** & **Station ID**.
3. Click any audit entry to view the **Before** and **After** state snapshots.

### 6.2 Verifying Audit Chain Cryptographic Integrity
To verify that no database record has been altered or deleted directly by unauthorized database access:

1. Navigate to **Audit Trail → Verification**.
2. Click **Run Audit Chain Integrity Verification**.
3. The system recalculates SHA-256 hash digests sequentially from the genesis block to the current record.
4. **Verification Outcome**:
   - **PASS (Green)**: The audit chain is unbroken and 100% tamper-free.
   - **ALERT (Red)**: Indicates a hash mismatch or broken chain sequence, pin-pointing the exact record ID affected.

### 6.3 Exporting Audit Reports
Click **Export Audit Log (CSV)** to generate an officially timestamped audit report for board reviews or external financial auditors.

---

## 7. Section 5: Step-by-Step Daily Super Admin Operating Procedures

### Morning Operational Readiness Routine (08:00 AM)
1. Log in to the ERP using your Super Admin credentials.
2. Check the **Executive Dashboard**:
   - Verify all physical stations have logged in and opened POS cash sessions.
   - Review the **Attention Queue** for overnight notifications or pending approvals.
3. Check the **Attendance Portal** (`/api/staff/attendance`) to ensure key station managers have clocked in via their mobile PWA app.

### Mid-Day Operational Oversight (01:00 PM)
1. Review **Station Performance Cards** to identify any low-performing stations or inventory shortages.
2. Process pending **Maker-Checker Requests** (inventory adjustments or credit limit increases).
3. Monitor **Active Sessions** to ensure remote users are operating securely.

### End-of-Day Closing & Governance (06:00 PM)
1. Verify that all station POS cash sessions have been closed and reconciled with 0 cash variance.
2. Run **Audit Chain Verification** to confirm database integrity.
3. Review consolidated daily sales summary reports.

---

## 8. Section 6: Emergency Administration & Troubleshooting Guide

| Issue / Scenario | Root Cause | Admin Solution Step |
| :--- | :--- | :--- |
| **User locked out ("Too many failed attempts")** | 5 invalid password attempts | Go to **User Management → Select User → Click Unlock Account**. |
| **POS Cash Drawer cannot close** | Unclosed pending sales orders | Navigate to **Sales Management → Filter Pending → Cancel or Complete Open Drafts**. |
| **Mobile Punch Clock GPS Error on Phone** | Browser location permission denied | Guide user to phone settings: **Settings → Safari/Chrome → Permissions → Location → Allow**. |
| **Stale Version Conflict Error (409)** | Simultaneous editing by 2 managers | Refresh the record view to load the latest optimistic locking version before editing. |

---

**© 2026 A.A.U Chamo International Business Agency Services Limited. All Rights Reserved.**
