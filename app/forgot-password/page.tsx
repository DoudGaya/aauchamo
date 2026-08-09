import RecoveryForm from "./recovery-form";
import styles from "../login/login.module.css";

export default function ForgotPasswordPage() {
  return <main className={styles.page}><section className={styles.brandPanel}><div className={styles.brandMark}><span>AC</span><i /></div><div className={styles.brandCopy}><span>CONTROLLED RECOVERY</span><h2>Restore access.<br />Preserve control.</h2><p>Recovery links expire quickly, existing sessions can be revoked, and every reset is auditable.</p></div></section><section className={styles.formPanel}><RecoveryForm mode="request" /></section></main>;
}
