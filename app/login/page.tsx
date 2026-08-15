import { Building2, CheckCircle2, Gauge, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { redirect } from "next/navigation";

import { requireAccess } from "@/lib/server/access";
import { db } from "@/lib/server/db";
import LoginForm from "./login-form";
import styles from "./login.module.css";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  let hasValidSession = false;
  try {
    await requireAccess();
    hasValidSession = true;
  } catch {
    // Missing, expired and revoked sessions all remain on the login page.
  }
  if (hasValidSession) redirect("/");

  // Fetch the active company logo for the login screen. Assuming a single active tenant for now.
  const company = await db.company.findFirst({
    where: { isActive: true },
    select: { logoObjectKey: true, logoDarkObjectKey: true }
  });

  const logoLight = company?.logoObjectKey || "/logo.png";
  const logoDark = company?.logoDarkObjectKey || logoLight;

  return (
    <main className={styles.page}>
      <section className={styles.brandPanel}>
        <div className={styles.brandMark}>
          <Image src={logoDark} alt="AAU Chamo Logo" className={styles.brandLogo} width={120} height={120} priority style={{ width: "auto", height: "auto" }} />
        </div>
        <div className={styles.brandCopy}>
          <span>AAU CHAMO</span>
          <h2>Every station.<br />One operating truth.</h2>
          <p>Inventory, sales, cargo, agents and finance—controlled from one accountable workspace.</p>
        </div>
        <div className={styles.capabilities}>
          <div><Building2 size={18} /><span><strong>Multi-station control</strong><small>Scoped access across every location</small></span></div>
          <div><Gauge size={18} /><span><strong>Live operations</strong><small>Current stock, revenue and exceptions</small></span></div>
          <div><ShieldCheck size={18} /><span><strong>Built for accountability</strong><small>Approvals and immutable evidence</small></span></div>
        </div>
        <div className={styles.systemStatus}><CheckCircle2 size={15} /><span>Operations platform</span><strong>SECURE</strong></div>
      </section>
      <section className={styles.formPanel}>
        <LoginForm callbackUrl={callbackUrl} />
        <footer>AAU Chamo International Business Agency Services Limited</footer>
      </section>
    </main>
  );
}
