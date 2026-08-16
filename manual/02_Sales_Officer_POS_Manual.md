# A.A.U CHAMO INTERNATIONAL BUSINESS AGENCY SERVICES LIMITED
## Enterprise ERP Dedicated Manual Series
### Volume 2: Sales Officer & Point of Sale (POS) Counter Manual
**Module 02 Focus: Retail Checkout, Barcode Scanning, Split Payments & Cash Reconciliation**

---

> [!NOTE]
> **WELCOME SALES OFFICERS & CASHIERS**
> This manual provides simple, step-by-step instructions for operating the **Point of Sale (POS)** counter, handling customer checkouts, accepting split payments, printing receipts, and closing your daily cash drawer session.

---

## 1. Executive Summary & Role Definition

As a **Sales Officer** or **Cashier** at AAU Chamo, your primary responsibility is to deliver fast, accurate, and secure customer transactions at the retail counter.

### Primary Duties
1. **Drawer Session Opening**: Record the starting cash float at the start of your shift.
2. **Fast Order Processing**: Scan product barcodes, adjust item quantities, and apply authorized discounts.
3. **Customer Onboarding**: Link sales to existing customer profiles or register new customers on the fly.
4. **Payment Collection**: Accept Cash, Card Transfers, Agent Wallets, or Split Payments.
5. **Receipt Issuance**: Print official thermal receipts for every completed sale.
6. **End-of-Shift Reconciliation**: Count physical drawer cash and reconcile any variances before closing.

---

## 2. Navigating the POS Counter Interface

The POS interface is designed for speed and ease of use on both desktop screens and touch-screen POS terminals.

```
+-----------------------------------------------------------------------------------+
|  AAU CHAMO POS COUNTER                                  [Drawer Status: OPEN 🟢]   |
+---------------------------------------+-------------------------------------------+
| PRODUCT SEARCH / BARCODE SCANNER      | CURRENT CART (Order #POS-10492)           |
| [ Scan Barcode or Type Product... ]   | ----------------------------------------- |
|                                       | 1x Aviation Fuel 50L ...... ₦ 45,000.00   |
| [ Item 1 ]  [ Item 2 ]  [ Item 3 ]   | 2x Motor Oil 4L .......... ₦ 18,000.00   |
| [ Item 4 ]  [ Item 5 ]  [ Item 6 ]   | ----------------------------------------- |
|                                       | Subtotal:                  ₦ 63,000.00    |
| SELECT CUSTOMER                       | Discount (5%):            -₦  3,150.00    |
| [ Search Customer by Name/Phone... ]  | TOTAL DUE:                 ₦ 59,850.00    |
|                                       | ----------------------------------------- |
|                                       | [ CASH ] [ TRANSFER ] [ SPLIT CHECKOUT ]  |
+---------------------------------------+-------------------------------------------+
```

---

## 3. Section 1: Starting Your Shift (Opening POS Drawer)

Before processing any sales, you must open a **POS Drawer Session** to establish your starting cash float:

### Step-by-Step Instructions
1. Log in to the ERP using your **Sales Officer** credentials.
2. From the main menu, click **Point of Sale (POS)**.
3. The system will detect that no active drawer session is open and prompt you with the **Open Drawer Session** screen.
4. Count the physical cash given to you by the station manager for change.
5. Enter the **Opening Cash Float** amount (e.g., `₦ 10,000.00`).
6. Click **Start Session**.
7. The status indicator at the top right will change to **Drawer Status: OPEN 🟢**. You are now ready to make sales.

> [!WARNING]
> You cannot process sales without an open drawer session. The system enforces 1 active drawer session per cashier to prevent cash misallocations.

---

## 4. Section 2: Processing Customer Checkout

### Step 1: Adding Items to the Cart
- **Using Barcode Scanner**: Point your physical handheld barcode scanner at the product item. The barcode will automatically scan and add 1 unit to the cart.
- **Using Manual Search**: Type the product name or code (e.g., `Motor Oil`) into the search bar and tap the product card to add it to the cart.
- **Adjusting Quantities**: Tap the `+` or `-` buttons next to any cart item to change quantities.

### Step 2: Attaching Customer Profile
1. In the **Customer** section, type the customer's phone number or name.
2. If the customer exists, select their name from the drop-down list.
3. **If New Customer**: Click **+ Quick Add Customer**, enter their Name and Phone Number, and click **Save**. The customer is instantly created and linked to the order.

### Step 3: Applying Discounts (Optional)
- If authorized by management, you can apply a percentage or fixed amount discount by entering the discount figure in the **Discount Field**.
- The cart will instantly recalculate the **Total Due**.

### Step 4: Collecting Payment & Selecting Payment Method
Select the customer's preferred payment method:

#### Option A: Exact Cash Payment
1. Click **Cash Payment**.
2. Enter the **Cash Received** from the customer (e.g., `₦ 60,000.00`).
3. The screen will automatically display the exact **Change Due** to hand back to the customer (e.g., `Change: ₦ 150.00`).
4. Click **Complete Sale**.

#### Option B: Bank Transfer / POS Card Terminal
1. Click **Transfer / Card**.
2. Verify that the bank alert or POS slip is approved.
3. Enter the transaction reference code (optional).
4. Click **Complete Sale**.

#### Option C: Split Payment (Cash + Transfer)
If a customer wants to pay part in cash and part via bank transfer:
1. Click **Split Payment**.
2. Enter Cash Amount: e.g., `₦ 20,000.00`.
3. Enter Transfer Amount: e.g., `₦ 39,850.00`.
4. The system confirms `Total Paid = Total Due`.
5. Click **Complete Sale**.

---

## 5. Section 3: Receipt Issuance & Order Printing

Upon completing a sale, the ERP automatically records the transaction in the financial ledger, deducts item stock from your station's inventory balance, and generates the official receipt.

### Receipt Options
- **Auto-Print Thermal Receipt**: Sends the 80mm/58mm formatted receipt directly to your thermal receipt printer.
- **Reprint Receipt**: If paper jams or the customer requests a duplicate, click **Reprint Receipt**. The copy will be watermark-labeled **DUPLICATE COPY** for security compliance.

---

## 6. Section 4: End-of-Shift Cash Drawer Closing & Reconciliation

At the end of your working shift, you must close and reconcile your cash drawer:

### Step-by-Step Instructions
1. Click **Close Drawer Session** at the top right of the POS screen.
2. The ERP will display the **Shift Summary**:
   - Opening Cash Float (e.g., `₦ 10,000.00`)
   - Total Cash Sales Collected (e.g., `₦ 150,000.00`)
   - Total Transfers / Cards Collected (e.g., `₦ 85,000.00`)
   - **Expected Drawer Cash**: `₦ 160,000.00`
3. Physically count all cash banknotes inside your drawer.
4. Enter the **Counted Cash** figure in the input box (e.g., `₦ 160,000.00`).
5. **Variance Calculation**:
   - **Zero Variance (Balanced)**: Counted cash matches Expected cash exactly.
   - **Shortage (Negative Variance)**: Cash in drawer is less than sales recorded. Enter an explanatory note in the remarks box.
   - **Surplus (Positive Variance)**: Cash in drawer is more than sales recorded. Enter an explanatory note.
6. Click **Finalize & Close Session**.
7. Print the **Shift Closing Report** and submit it along with your cash bag to the Finance Officer or Station Manager.

---

## 7. Section 5: Troubleshooting Guide for Sales Officers

| Problem | Possible Cause | Recommended Solution |
| :--- | :--- | :--- |
| **Barcode scanner is not adding items** | Scanner unplugged or focus off search bar | Click inside the search input box before scanning. Ensure USB scanner cable is plugged in. |
| **Sale rejected with "Insufficient Stock" error** | Inventory balance is zero at station | Contact Station Manager to perform a stock transfer or inventory balance check. |
| **Thermal printer is not printing** | Printer offline, out of paper, or power off | Check green power light on printer. Insert a new 80mm thermal paper roll with thermal side facing up. Click **Reprint**. |
| **Customer requests order cancellation after payment** | Customer changed mind or wrong item | Do not issue cash manually. Click **Request Cancellation** → Select Reason. Your manager will approve it and auto-refund the customer. |

---

**© 2026 A.A.U Chamo International Business Agency Services Limited. All Rights Reserved.**
