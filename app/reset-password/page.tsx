import RecoveryForm from "../forgot-password/recovery-form";
import styles from "../login/login.module.css";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ identifier?: string; token?: string }>;
}) {
  const { identifier = "", token = "" } = await searchParams;
  return <main className={styles.page}><section className={styles.brandPanel}><div className={styles.brandMark}><span>AC</span><i /></div><div className={styles.brandCopy}><span>SECURE PASSWORD RESET</span><h2>New credential.<br />Clean session slate.</h2><p>Completing this reset invalidates existing sessions and records the security event.</p></div></section><section className={styles.formPanel}><RecoveryForm mode="reset" identifier={identifier} token={token} /></section></main>;
}
