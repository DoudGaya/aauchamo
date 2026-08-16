# A.A.U CHAMO INTERNATIONAL BUSINESS AGENCY SERVICES LIMITED
## Enterprise ERP Dedicated Manual Series
### Volume 3: HR Officer & Mobile Attendance Punch Clock Manual
**Module 03 & 05 Focus: Staff Administration, ID Cards & PWA Attendance Punch Clock**

---

> [!NOTE]
> **WELCOME HR OFFICERS & HR MANAGERS**
> This manual provides comprehensive instructions for onboarding employees, issuing appointment letters and ID cards, configuring the **Mobile PWA Attendance App**, and inspecting staff attendance logs.

---

## 1. Executive Summary & Role Definition

As an **HR Officer** or **Human Resources Manager** at AAU Chamo, your primary responsibility is to manage the employee lifecycle, enforce attendance punctuality, and ensure physical staff profiles are properly linked to system logins.

### Primary Duties
1. **Employee Onboarding**: Register new staff with complete biographical, departmental, and station details.
2. **Account Association**: Link system user login accounts to physical employee records to enable mobile punch clocking.
3. **HR Document Generation**: Generate and print official Appointment Letters and Employee ID Cards.
4. **Mobile PWA Punch Clock Guidance**: Assist staff in installing the **AAU Clock PWA App** on their iPhones or Android devices.
5. **Attendance Audit & Punctuality Monitoring**: Monitor daily clock-in/out timestamps, IP addresses, shift durations, and GPS location pins.

---

## 2. Section 1: Staff Onboarding & Employee Records

### 2.1 Registering a New Employee
1. Log in to the ERP using your **HR Officer** credentials.
2. Navigate to **HR Management → Staff Catalogue**.
3. Click **+ Add New Employee**.
4. Fill in the Employee Master Profile:
   - **Personal Info**: First Name, Middle Name, Last Name, Phone Number, Email, Address.
   - **Staff Number**: Unique employee code (e.g., `STF-00104`).
   - **Department & Position**: Select assigned Department (e.g., *Operations*, *Finance*, *Sales*) and Position title.
   - **Home Station**: Assign physical station location (e.g., *HQ*, *Kano Station*).
   - **Employment Type**: Select *Full-Time*, *Contract*, *Part-Time*, or *Intern*.
   - **Employment Date** & **Salary Amount**.
5. Click **Save Employee Profile**.

### 2.2 Linking System Login to Employee Profile
To allow an employee to use the **Mobile Attendance App** (`/attendance`) on their phone:
1. Open the employee's profile in the **Staff Catalogue**.
2. Locate the **Linked System User** dropdown menu.
3. Select their corresponding login account (e.g., `jainab.aliyu`).
4. Click **Update Association**.

> [!IMPORTANT]
> If a staff member attempts to clock in on their phone without this link, the mobile app will display: *"Your system user account is not linked to an active employee record. Please contact HR."*

---

## 3. Section 2: Printing Appointment Letters & Employee ID Cards

### 3.1 Generating Appointment Letters
1. In the **Staff Catalogue**, click on the employee's name.
2. Click **Print Documents → Appointment Letter**.
3. The system generates a formatted, official appointment letter displaying the company header, legal name, position, salary, and employment terms.
4. Click **Print** or **Save as PDF**.

### 3.2 Printing Official Employee ID Cards
1. Open the employee's profile.
2. Click **Print Documents → Employee ID Card**.
3. The ERP generates a double-sided ID card containing:
   - Official AAU Chamo Logo & Company Colors
   - Employee Photo Placeholder / Passport Attachment
   - Staff Name, Staff Number, Position, and Department
   - Scannable Barcode / QR Code for identity verification
4. Print using any standard plastic ID card printer or laminated paper stock.

---

## 4. Section 3: Mobile PWA Attendance Punch Clock (`/attendance`)

The **AAU Clock App** is a standalone Progressive Web App (PWA) designed for staff mobile phones.

```
+-----------------------------------------------------------------------------------+
|  AAU CHAMO MOBILE ATTENDANCE APP (PWA)                                            |
|                                                                                   |
|  [ A ] AAU CHAMO                                         [ < Full ERP ]           |
|  Attendance Punch Clock                                                           |
| --------------------------------------------------------------------------------- |
|  [ User Avatar ]  ZAINAB ALIYU (STF-00088)                                        |
|                   HR Officer • Main HQ Station                                    |
| --------------------------------------------------------------------------------- |
|                         SUNDAY, AUGUST 16, 2026                                   |
|                             08:30:15 AM                                           |
|               🟢 GPS Lock (12.0024, 8.5921) ±5m [ Refresh ]                       |
| --------------------------------------------------------------------------------- |
|  [ Optional Shift Notes: Remote work, field meeting...                       ]    |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  | 🟢 CLOCK IN NOW                                                              |  |
|  +-----------------------------------------------------------------------------+  |
|                                                                                   |
|  Today's Shift Punch Logs:                                                        |
|  • Clock In:  08:30 AM  (GPS Pin Verified ↗)                                      |
|  • Clock Out: Pending...                                                          |
+-----------------------------------------------------------------------------------+
```

### 3.1 How HR Guides Staff to Install the App
Share these instructions with new employees:
1. Open your phone browser (Safari on iPhone, Chrome on Android).
2. Go to: `https://aauchamo.vercel.app/attendance`
3. **iPhone Installation**: Tap the **Share icon** (square with arrow) → tap **Add to Home Screen**.
4. **Android Installation**: Tap the **3 dots menu** → tap **Install App** or **Add to Home Screen**.
5. An icon named **AAU Clock** will appear on your phone home screen.

### 3.2 Step-by-Step Clocking Procedure for Staff
1. Tap the **AAU Clock** icon on your phone.
2. Confirm the green **GPS Lock** status.
3. Tap **CLOCK IN NOW** at the start of your shift.
4. Tap **CLOCK OUT NOW** at the end of your shift.

---

## 5. Section 4: Monitoring Attendance & Punctuality Logs

HR Officers can monitor daily attendance logs across all stations in real-time:

### Step-by-Step Instructions
1. Navigate to **HR Management → Attendance Logs**.
2. Filter logs by:
   - **Station Filter**: View logs for a specific station or All Stations.
   - **Date Filter**: Select a specific date or date range.
   - **Staff Search**: Search by employee name or staff number.
3. Review key metrics for each log entry:
   - **Clock-In Time**: Exact timestamp when employee tapped Clock In.
   - **Clock-Out Time**: Exact timestamp when employee tapped Clock Out.
   - **Shift Duration**: Calculated total working hours and minutes (e.g., `8h 15m`).
   - **GPS Map Pin**: Click **View Map Pin ↗** to open Google Maps and verify the exact physical location where the employee punched in/out.
   - **IP Address**: Verify network IP address.

---

## 6. Section 5: HR Troubleshooting & FAQ

| Issue / Error | Cause | Solution |
| :--- | :--- | :--- |
| **"Staff record not linked to user account"** | System user is missing link in Staff Catalogue | Go to **Staff Catalogue → Select Employee → Set Linked System User → Save**. |
| **"You have already clocked in for today"** | Duplicate clock-in attempt | Staff member is already clocked in. They can only tap **CLOCK OUT NOW** when shift ends. |
| **"You must clock in first before clocking out"** | Clock-out attempted without prior clock-in | Staff member missed morning clock-in. Contact HR to review audit logs. |
| **GPS location fix fails on phone** | Location permissions disabled | Go to Phone Settings → Safari/Chrome → Site Permissions → Location → **Allow**. |

---

**© 2026 A.A.U Chamo International Business Agency Services Limited. All Rights Reserved.**
