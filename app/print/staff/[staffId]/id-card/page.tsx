import { db } from "@/lib/server/db";
import { requireAccess, requirePermission } from "@/lib/server/access";
import { notFound } from "next/navigation";
import styles from "./print.module.css";
import Image from "next/image";
import { PrintButton } from "@/app/print/PrintButton";

export default async function StaffIdCard({ params }: { params: Promise<{ staffId: string }> }) {
  const access = requirePermission(await requireAccess(), "staff.view");
  const { staffId } = await params;

  const staff = await db.staff.findFirst({
    where: { id: staffId, companyId: access.companyId },
    include: { department: true, position: true, homeStation: true, company: true }
  });

  if (!staff) return notFound();


  return (
    <div className={styles.container}>
      <div className={styles.printActions}>
        <PrintButton label="Print ID Card" />
      </div>

      <div className={styles.cardWrapper}>
        <div className={styles.idCardFront}>
          <div className={styles.header}>
            <img src="/logo.png" alt="AAU Chamo Logo" className={styles.logo} style={{ maxWidth: 80, maxHeight: 30 }} />
          </div>
          
          <div className={styles.photoContainer}>
            {staff.passportObjectKey ? (
              <img src={staff.passportObjectKey} alt="Passport" className={styles.photo} />
            ) : (
              <div className={styles.photoPlaceholder}>Photo</div>
            )}
          </div>
          
          <div className={styles.details}>
            <h1>{staff.firstName} {staff.lastName}</h1>
            <p className={styles.position}>{staff.position.name}</p>
            <p className={styles.department}>{staff.department.name}</p>
            <div className={styles.contactInfo}>
              <p>{staff.email || "No Email"}</p>
              <p>{staff.phone}</p>
            </div>
          </div>
          
          <div className={styles.footer}>
            <div className={styles.idNumber}>ID: {staff.staffNumber}</div>
            <div className={styles.bloodGroup}>O+</div>
          </div>
        </div>

        <div className={styles.idCardBack}>
          <div className={styles.terms}>
            <h3>AUTHORIZATION</h3>
            <p>This card is the property of <strong>{staff.company.displayName}</strong>. It must be surrendered upon termination of employment or upon request by an authorized official.</p>
            <p>If found, please return to:</p>
            <address>
              <strong>Head Office</strong><br/>
              {staff.company.address || "Address not configured"}<br/>
              {staff.company.phone && <span>Phone: {staff.company.phone}<br/></span>}
              {staff.company.email && <span>Email: {staff.company.email}</span>}
            </address>
          </div>
          
          <div className={styles.barcode}>
            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(staff.staffNumber)}`} alt="QR Code" style={{ width: "100%", maxWidth: 60, height: "auto", display: "block", margin: "0 auto 5px" }} />
            <p style={{ fontWeight: "bold" }}>{staff.staffNumber}</p>
            <p style={{ fontSize: "0.6rem", margin: "2px 0 0", color: "#444" }}>{staff.phone}</p>
            {staff.email && <p style={{ fontSize: "0.6rem", margin: "2px 0 0", color: "#444" }}>{staff.email}</p>}
          </div>
          
          <div className={styles.expiry}>
            Valid until: {new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toLocaleDateString('en-GB')}
          </div>
        </div>
      </div>
    </div>
  );
}
