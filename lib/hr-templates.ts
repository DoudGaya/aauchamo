export type OfferLetterClause = {
  title: string;
  text: string;
};

export type OfferLetterTemplate = {
  subject: string;
  salutation: string;
  openingText: string;
  clauses: OfferLetterClause[];
  closingText: string;
  signatoryLeft: string;
  signatoryRight: string;
  fullBodyOverride?: string | null;
};

export const DEFAULT_OFFER_LETTER_TEMPLATE: OfferLetterTemplate = {
  subject: "OFFER OF EMPLOYMENT & LETTER OF APPOINTMENT",
  salutation: "Dear {firstName},",
  openingText:
    "On behalf of the Management of A.A.U Chamo International Business Agency Services Limited, we are pleased to offer you formal employment for the position of {position} in the {department} department. Your primary base station assignment will be at {station}.\n\nThis appointment is subject to the terms and conditions outlined in our corporate employee handbook and the following summary clauses:",
  clauses: [
    {
      title: "1. Commencement and Duties",
      text: "Your employment will commence on {employmentDate}. In your capacity as {position}, you will report directly to the Head of Department or any designated supervisor. You will be responsible for executing your duties diligently and complying with operational protocols and directives.",
    },
    {
      title: "2. Hours of Work",
      text: "Your standard working hours shall be forty (40) hours per week, normally scheduled from Monday to Friday. Due to the service-oriented nature of our operations, you may be required to work additional hours or shift assignments as operational demands require.",
    },
    {
      title: "3. Remuneration",
      text: "You will receive a base salary of {salary} per month, payable in arrears on or before the 28th day of each calendar month. This compensation is subject to standard statutory tax deductions, pension contributions, and other government-mandated levies.",
    },
    {
      title: "4. Probationary Period",
      text: "Your employment is subject to a probationary period of six (6) months from your commencement date. Upon successful performance review, your employment will be confirmed in writing. During probation, either party may terminate this agreement by giving one (1) week's notice.",
    },
    {
      title: "5. Leave Entitlement",
      text: "Upon confirmation, you will be entitled to twenty (20) working days of annual paid leave for each completed year of service, to be scheduled in consultation with your supervisor. You are also entitled to public holidays observed in Nigeria.",
    },
    {
      title: "6. Confidentiality and Code of Conduct",
      text: "You shall not disclose any confidential information, trade secrets, passenger databases, or proprietary operational structures of AAU Chamo to any third parties. Strict adherence to our Code of Conduct and Anti-Bribery policies is a condition of continued service.",
    },
    {
      title: "7. Termination of Appointment",
      text: "After confirmation, either party may terminate this agreement by providing one (1) month's written notice or payment of one month's basic salary in lieu of notice. The company reserves the right to terminate your employment summarily for gross misconduct.",
    },
  ],
  closingText:
    "If you accept this offer and its terms, please sign and return the duplicate copy of this letter to the Human Resources department within seven (7) days.\n\nWe welcome you to AAU Chamo and look forward to a successful professional journey together.\n\nYours faithfully,\nFor: A.A.U Chamo International Business Agency Services Limited",
  signatoryLeft: "Head of Human Resources\nAAU Chamo Groups",
  signatoryRight: "Employee Signature & Date\nI accept the terms of this appointment",
  fullBodyOverride: null,
};

export function renderOfferLetterPlaceholders(
  text: string,
  vars: {
    firstName?: string;
    lastName?: string;
    middleName?: string;
    fullName?: string;
    staffNumber?: string;
    positionName?: string;
    departmentName?: string;
    stationName?: string;
    salaryFormatted?: string;
    employmentDateFormatted?: string;
    address?: string;
    phone?: string;
    email?: string;
  }
): string {
  if (!text) return "";
  const firstName = vars.firstName || "Umar";
  const lastName = vars.lastName || "Aliyu";
  const middleName = vars.middleName || "";
  const fullName = vars.fullName || [firstName, middleName, lastName].filter(Boolean).join(" ");
  const staffNumber = vars.staffNumber || "STF-00001";
  const positionName = vars.positionName || "Operations Officer";
  const departmentName = vars.departmentName || "Operations";
  const stationName = vars.stationName || "Mallam Aminu Kano International Airport (KAN)";
  const salaryFormatted = vars.salaryFormatted || "₦[Negotiated]";
  const employmentDateFormatted =
    vars.employmentDateFormatted ||
    new Date().toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" });
  const address = vars.address || "Nigeria";
  const phone = vars.phone || "N/A";
  const email = vars.email || "info@aauchamo.com";

  return text
    .replace(/\{firstName\}|\$\{firstName\}/g, firstName)
    .replace(/\{lastName\}|\$\{lastName\}/g, lastName)
    .replace(/\{middleName\}|\$\{middleName\}/g, middleName)
    .replace(/\{name\}|\$\{name\}|\{fullName\}|\$\{fullName\}/g, fullName)
    .replace(/\{staffNumber\}|\$\{staffNumber\}/g, staffNumber)
    .replace(/\{position\}|\$\{position\}|\{positionName\}|\$\{positionName\}/g, positionName)
    .replace(/\{department\}|\$\{department\}|\{departmentName\}|\$\{departmentName\}/g, departmentName)
    .replace(/\{station\}|\$\{station\}|\{homeStation\}|\$\{homeStation\}/g, stationName)
    .replace(/\{salary\}|\$\{salary\}/g, salaryFormatted)
    .replace(/\{employmentDate\}|\$\{employmentDate\}|\{date\}|\$\{date\}/g, employmentDateFormatted)
    .replace(/\{residentialAddress\}|\$\{residentialAddress\}|\{address\}|\$\{address\}/g, address)
    .replace(/\{companyName\}|\$\{companyName\}/g, "A.A.U Chamo International Business Agency Services Limited")
    .replace(/\{phone\}|\$\{phone\}/g, phone)
    .replace(/\{email\}|\$\{email\}/g, email);
}
