import { ArrowLeft, ShieldX } from "lucide-react";
import Link from "next/link";

import styles from "../login/login.module.css";

export default function UnauthorizedPage() {
  return <main className={styles.page}><section className={styles.brandPanel}><div className={styles.brandMark}><span>AC</span><i /></div><div className={styles.brandCopy}><span>ACCESS BOUNDARY</span><h2>This action is<br />outside your scope.</h2><p>Permissions and station visibility are enforced on the server. Ask an administrator if your responsibilities have changed.</p></div></section><section className={styles.formPanel}><div className={styles.form}><div className={styles.formHeading}><span className={styles.eyebrow}>PERMISSION REQUIRED</span><h1>Access restricted</h1><p>Your account is active, but it does not include the permission required for this area.</p></div><div className={styles.assurance}><ShieldX size={17} /><span>The denied request may be recorded for security review.</span></div><Link className={styles.submit} href="/"><ArrowLeft size={17} /> Return to workspace</Link></div></section></main>;
}
