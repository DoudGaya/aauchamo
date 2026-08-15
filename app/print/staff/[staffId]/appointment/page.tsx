import { db } from "@/lib/server/db";
import { requireAccess, requirePermission } from "@/lib/server/access";
import { notFound } from "next/navigation";
import styles from "./print.module.css";
import Image from "next/image";
import { PrintButton } from "@/app/print/PrintButton";

export default async function AppointmentLetter({ params }: { params: Promise<{ staffId: string }> }) {
  const access = requirePermission(await requireAccess(), "staff.view");
  const { staffId } = await params;

  const staff = await db.staff.findFirst({
    where: { id: staffId, companyId: access.companyId },
    include: { department: true, position: true, homeStation: true, company: true }
  });

  if (!staff) return notFound();

  const logoLight = staff.company.logoObjectKey || "/logo.png";
  
  const formatter = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' });

  return (
    <div className={styles.container}>
      <div className={styles.printActions}>
        <PrintButton label="Print Letter" />
      </div>

      <div className={styles.letterWrapper}>
        <div className={styles.letterhead}>
          <Image src={logoLight} alt="Company Logo" width={150} height={50} className={styles.logo} style={{ width: "auto", height: "auto" }} />
          <div className={styles.companyInfo}>
            <strong>{staff.company.legalName}</strong><br />
            {staff.company.address || "123 Business Way, City Center"}<br />
            {staff.company.phone} | {staff.company.email}
          </div>
        </div>

        <div className={styles.content}>
          <div className={styles.headerGrid}>
            <div className={styles.recipientBlock}>
              <p><strong>{staff.firstName} {staff.middleName ? staff.middleName + ' ' : ''}{staff.lastName}</strong></p>
              <p>{staff.address || "Staff Address on File"}</p>
              <p>{staff.phone}</p>
            </div>
            <div className={styles.dateBlock}>
              <p><strong>Date:</strong> {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <p><strong>Ref:</strong> {staff.company.code}/HR/{new Date().getFullYear()}/{staff.staffNumber.replace('STF-', '')}</p>
            </div>
          </div>

          <h2 className={styles.subject}>SUBJECT: LETTER OF APPOINTMENT</h2>

          <div className={styles.body}>
            <p>Dear <strong>{staff.firstName}</strong>,</p>

            <p>Following your recent interview, we are pleased to offer you the position of <strong>{staff.position.name}</strong> in the <strong>{staff.department.name}</strong> department at <strong>{staff.company.displayName}</strong>.</p>
            
            <p>This is a <strong>{staff.employmentType.toLowerCase()}</strong> position. You will be based at our <strong>{staff.homeStation.name}</strong> station.</p>

            <h3>1. Commencement Date</h3>
            <p>Your employment will officially commence on <strong>{new Date(staff.employmentDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>.</p>

            <h3>2. Remuneration</h3>
            <p>Your starting consolidated salary will be <strong>{staff.salary ? formatter.format(Number(staff.salary)) : "TBD"}</strong>, subject to statutory deductions as mandated by law. This will be paid directly into your designated bank account.</p>

            <h3>3. Probation</h3>
            <p>You will be subject to a probationary period of six (6) months, during which your performance will be evaluated. Upon satisfactory completion, your employment will be confirmed.</p>

            <h3>4. Company Policies</h3>
            <p>You are required to strictly adhere to all company policies, procedures, and code of conduct, which may be updated from time to time.</p>

            <p>Please sign and return the enclosed copy of this letter as a token of your acceptance of these terms and conditions.</p>
            
            <p>We welcome you to the team and look forward to a mutually beneficial relationship.</p>
          </div>

          <div className={styles.signatures}>
            <div className={styles.signBlock}>
              <p>Yours faithfully,</p>
              <div className={styles.signatureLine}></div>
              <strong>Human Resources Manager</strong><br />
              {staff.company.displayName}
            </div>

            <div className={styles.signBlock}>
              <p>I accept this appointment on the terms outlined above:</p>
              <div className={styles.signatureLine}></div>
              <strong>{staff.firstName} {staff.lastName}</strong><br />
              Date: ________________________
            </div>
          </div>
        </div>
        
        <div className={styles.footer}>
          <p>Registered Office: {staff.company.address}</p>
        </div>
      </div>
    </div>
  );
}
