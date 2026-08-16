# A.A.U CHAMO INTERNATIONAL BUSINESS AGENCY SERVICES LIMITED
## Enterprise ERP Dedicated Manual Series
### Volume 4: Operations Manager & Station Inventory Manual
**Module 04 & 07 Focus: Station Governance, Stock Balances, Transfers & Maker-Checker Adjustments**

---

> [!NOTE]
> **WELCOME OPERATIONS MANAGERS & STATION MANAGERS**
> This manual provides step-by-step instructions for managing station operations, product catalogs, inter-station stock transfers, and maker-checker inventory adjustments.

---

## 1. Executive Summary & Role Definition

As an **Operations Manager** or **Station Manager** at AAU Chamo, your primary responsibility is to ensure seamless physical station workflows, optimal inventory availability, and strict stock integrity.

### Primary Duties
1. **Station Oversight**: Monitor station performance KPIs, active drawers, and operational throughput.
2. **Stock Balance Maintenance**: Track live stock quantities across product lines and batch keys.
3. **Inter-Station Stock Transfers**: Manage stock movement requests, dispatching, and physical receipts between stations.
4. **Maker-Checker Inventory Adjustments**: Submit and approve inventory count adjustments with mandatory audit reasons.
5. **Purchase Order Approval**: Review and authorize stock replenishment purchases from external suppliers.

---

## 2. Section 1: Station Governance & Performance Monitoring

### 2.1 Understanding Station Isolation
To maintain strict operational boundaries, Station Managers operate under **Station Scope Isolation**:
- You will see sales, inventory, and staff data specifically for your assigned station (e.g., `Kano Station`).
- If you have multi-station or company-wide scope, you can switch between assigned stations using the **Station Scope Selector** at the top bar.

### 2.2 Monitoring Station Performance Metrics
Navigate to **Dashboard → Station Performance** to review:
- **Daily Sales Volume & Revenue**: Total checkout revenue generated at your station.
- **Stock Movement Activity**: Inbound transfers, outbound transfers, and sales deductions.
- **Active POS Drawers**: Number of open cash drawers currently operating at retail counters.

---

## 3. Section 2: Inventory Catalog & Live Stock Tracking

### 3.1 Viewing Live Stock Balances
1. Navigate to **Inventory Management → Stock Balances**.
2. Search by product name, product code, or scan a physical barcode.
3. View real-time inventory metrics:
   - **Product Code & Name**
   - **Batch Key / Expiry Lot**
   - **Current Quantity On Hand**
   - **Reorder Threshold Level**

```
+-----------------------------------------------------------------------------------+
|  STOCK BALANCES OVERVIEW (Station: Kano Branch)                                  |
+-----------+--------------------+------------+-------------------+-----------------+
| Code      | Product Description| Batch Key  | Quantity On Hand  | Stock Status    |
+-----------+--------------------+------------+-------------------+-----------------+
| PRD-00101 | Aviation Fuel 50L  | BATCH-2026 | 1,450 Units       | 🟢 Optimal      |
| PRD-00104 | Motor Engine Oil 4L| BATCH-2025 |    42 Units       | 🟠 Reorder Low  |
| PRD-00202 | Cargo Packing Box  | GENERAL    |   890 Units       | 🟢 Optimal      |
+-----------+--------------------+------------+-------------------+-----------------+
```

---

## 4. Section 3: Inter-Station Stock Transfers

When stock needs to be moved from one station to another (e.g., from *HQ Main Warehouse* to *Kano Station*), the system enforces a secure **2-Step Dispatch & Receive Workflow**:

### Step 1: Creating a Transfer Request
1. Navigate to **Inventory → Stock Transfers**.
2. Click **+ New Transfer Request**.
3. Select:
   - **Source Station**: Station sending the goods (e.g., `HQ Warehouse`).
   - **Destination Station**: Station receiving the goods (e.g., `Kano Station`).
   - **Transfer Line Items**: Select products and specify quantity to transfer.
4. Click **Submit Transfer Request**. Status becomes **PENDING DISPATCH**.

### Step 2: Dispatching the Transfer (Source Station Manager)
1. The Source Station Manager opens the transfer request.
2. Verify physical items loaded onto delivery vehicle.
3. Click **Dispatch Transfer Lines**.
4. Status becomes **DISPATCHED**. Inventory is immediately deducted from the Source Station's balance and marked in-transit.

### Step 3: Receiving the Transfer (Destination Station Manager)
1. Upon physical arrival of the delivery truck, the Destination Station Manager opens the transfer request.
2. Inspect physical items and verify quantities.
3. Click **Receive Transfer Lines**.
4. Status becomes **RECEIVED**. Inventory is immediately added to the Destination Station's live balance.

---

## 5. Section 4: Maker-Checker Stock Adjustments

To prevent inventory shrinkage, theft, or unauthorized stock tampering, all inventory balance adjustments require **Maker-Checker Dual Approval**.

> [!IMPORTANT]
> **Maker-Checker Rule**: The manager who creates the adjustment request (**Maker**) CANNOT approve their own request (**Checker**). A second manager or admin must review and approve it.

### Step 1: Submitting an Adjustment Request (Maker)
1. Navigate to **Inventory → Stock Adjustments**.
2. Click **+ Request Stock Adjustment**.
3. Select Station and enter **Reason for Adjustment** (e.g., *Physical cycle count delta*, *Container damage during transit*).
4. Add line items and enter the **Counted Physical Quantity** (e.g., Ledger expected = 50, Counted physical = 48).
5. Click **Submit Adjustment Request**.
6. Status becomes **PENDING_APPROVAL**. Ledger balances remain unchanged until approved.

### Step 2: Approving an Adjustment Request (Checker)
1. A second authorized Manager or Admin opens **Stock Adjustments → Pending Approval**.
2. Review physical count delta, attached notes, and reason.
3. Click **Approve Adjustment**.
4. Status becomes **POSTED**. The ERP automatically updates inventory ledger balances and logs an immutable audit event.

---

## 6. Section 5: Operations Troubleshooting & FAQ

| Problem | Cause | Solution |
| :--- | :--- | :--- |
| **"Self-Approval Forbidden" Error (403)** | Same user attempting to approve own adjustment | Ask a second authorized Manager or Admin to log in and approve the request. |
| **"Counted quantities already match ledger" (422)** | Counted quantity equals expected ledger quantity | No adjustment is needed if physical count matches expected ledger balance exactly. |
| **Transfer status stuck in "DISPATCHED"** | Destination station has not clicked Receive Lines | Have Destination Station Manager open **Inventory Transfers → Select Transfer → Click Receive Lines**. |

---

**© 2026 A.A.U Chamo International Business Agency Services Limited. All Rights Reserved.**
