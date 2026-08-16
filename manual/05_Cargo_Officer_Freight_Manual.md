# A.A.U CHAMO INTERNATIONAL BUSINESS AGENCY SERVICES LIMITED
## Enterprise ERP Dedicated Manual Series
### Volume 5: Cargo Officer & Freight Logistics Manual
**Module 08 Focus: Air Waybills (AWB), Package Labeling, Dispatch Tracking & Corrections**

---

> [!NOTE]
> **WELCOME CARGO OFFICERS & LOGISTICS CLERKS**
> This manual provides step-by-step instructions for registering cargo shipments, issuing Air Waybills (AWBs), printing thermal shipping tags, managing dispatch manifests, and tracking freight.

---

## 1. Executive Summary & Role Definition

As a **Cargo Officer** or **Freight Logistics Clerk** at AAU Chamo, your primary responsibility is to accept, verify, tag, and dispatch customer freight shipments accurately and securely.

### Primary Duties
1. **AWB Registration**: Capture sender details, receiver details, weight, piece count, and declared cargo value.
2. **Thermal Label Printing**: Print scannable barcode shipping tags and attach them to physical cargo boxes.
3. **Dispatch Manifesting**: Assign shipments to departure flights/vehicles and update dispatch statuses.
4. **Correction Requests**: Submit supervisor approval requests if shipment details need adjustment after booking.
5. **Customer Tracking Support**: Assist customers in tracking their shipments using AWB tracking numbers.

---

## 2. Section 1: Registering & Issuing Air Waybills (AWBs)

```
+-----------------------------------------------------------------------------------+
|  AAU CHAMO CARGO FREIGHT BOOKING                                                  |
+------------------------------------+----------------------------------------------+
| SENDER INFORMATION                 | RECEIVER INFORMATION                         |
| Name: Alhaji Ibrahim Bello         | Name: Emmanuel Chidiebere                    |
| Phone: +234 803 123 4567           | Phone: +234 802 987 6543                     |
| Address: 14 Commercial Rd, Kano    | Station: Abuja Central Freight Hub           |
+------------------------------------+----------------------------------------------+
| SHIPMENT PARTICULARS                                                              |
| Cargo Category: [ General Goods  v]  Total Pieces: [ 3 ]   Gross Weight: [ 45.5 kg ]|
| Declared Value: ₦ 250,000.00         Freight Fee:  ₦ 18,500.00                    |
| --------------------------------------------------------------------------------- |
| [ CANCEL ]                                                  [ PRINT & BOOK AWB 🖨️ ]|
+-----------------------------------------------------------------------------------+
```

### Step-by-Step AWB Booking Instructions
1. Log in to the ERP using your **Cargo Officer** credentials.
2. Navigate to **Cargo & Freight → Book Shipment**.
3. Fill in the Booking Form:
   - **Sender Details**: Full Name, Phone Number, Origin Station.
   - **Receiver Details**: Full Name, Phone Number, Destination Freight Hub.
   - **Cargo Category**: Select *General Goods*, *Perishable Goods*, *Fragile*, or *High-Value Documents*.
   - **Package Weight & Pieces**: Enter Total Weight (kg) and Number of Pieces.
   - **Declared Value**: Enter customer's declared value for insurance compliance.
4. The ERP automatically calculates the **Freight Fee** based on station rate cards and weight multipliers.
5. Select Payment Method (*Cash*, *POS Transfer*, or *Prepaid Account*) and click **Book AWB & Generate Labels**.
6. The ERP assigns a unique tracking number (e.g., `AWB-902841`).

---

## 3. Section 2: Package Labeling & Thermal Tag Printing

Every physical piece in a cargo shipment must carry a scannable **Thermal Shipping Tag**:

### Step-by-Step Tagging Instructions
1. Upon booking completion, the thermal tag print dialog will open automatically.
2. Click **Print Shipping Tags**.
3. The thermal printer prints 1 sticky label per piece (e.g., `AWB-902841 [Piece 1 of 3]`, `AWB-902841 [Piece 2 of 3]`).
4. Peel and firmly attach each thermal label to the corresponding cargo box or sack.
5. Scan each tag with your handheld barcode scanner to confirm physical piece verification.

---

## 4. Section 3: Cargo Dispatch Lifecycle & Status Updates

Cargo shipments progress through a secure status lifecycle:

```
[ DRAFT ] ---> [ BOOKED ] ---> [ DISPATCHED ] ---> [ IN TRANSIT ] ---> [ ARRIVED ] ---> [ DELIVERED ]
```

### Updating Dispatch Statuses
1. Navigate to **Cargo Management → Active Shipments**.
2. Select shipments assigned to an outbound flight or delivery vehicle.
3. Click **Create Dispatch Manifest**.
4. Enter Flight / Vehicle Number (e.g., `Flight NC-402`) and Departure Time.
5. Click **Confirm Dispatch**.
6. The status automatically updates to **DISPATCHED** and sends an automated SMS/notification to the receiver.

---

## 5. Section 4: Supervisor Correction Requests

If a mistake is discovered after an AWB is booked (e.g., wrong receiver phone number or incorrect destination station), the ERP enforces a **Supervisor Correction Approval Workflow**:

### Step-by-Step Correction Instructions
1. Open the shipment details in **Cargo Management**.
2. Click **Request Correction**.
3. Specify the proposed edits (e.g., Change Destination Station from *Abuja* to *Kaduna*).
4. Enter a detailed **Reason for Correction**.
5. Click **Submit Correction Request**.
6. The request status becomes **PENDING SUPERVISOR APPROVAL**.
7. Once your Cargo Supervisor or Admin approves the request, the AWB details are updated and audited.

---

## 6. Section 5: Public Live Shipment Tracking

Customers and staff can track shipments in real-time without logging into the ERP:

### Public Tracking Instructions
1. Navigate to the public tracking page at `https://aauchamo.vercel.app/track/[AWB_NUMBER]` (e.g., `/track/AWB-902841`).
2. The portal displays:
   - **Current Status Badge** (e.g., `IN TRANSIT 🚚`)
   - **Origin & Destination Hubs**
   - **Estimated Delivery Time**
   - **Complete Timeline Audit Log** showing timestamps for booking, dispatch, transit, and arrival.

---

## 7. Section 6: Cargo Troubleshooting Guide

| Problem | Cause | Solution |
| :--- | :--- | :--- |
| **Barcode tag will not scan** | Thermal print head dirty or paper misaligned | Clean printer head with alcohol swab. Click **Reprint Tag** from shipment detail page. |
| **Cannot edit AWB details after booking** | Shipment locked after booking confirmation | Use **Request Correction** button to submit edits for supervisor approval. |
| **Receiver lost pickup reference SMS** | Phone number typo or SMS provider delay | Lookup AWB in Cargo Search by sender/receiver phone number. Click **Resend Notification**. |

---

**© 2026 A.A.U Chamo International Business Agency Services Limited. All Rights Reserved.**
