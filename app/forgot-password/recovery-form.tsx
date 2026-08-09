"use client";

import { ArrowLeft, ArrowRight, CheckCircle2, KeyRound, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";

import styles from "../login/login.module.css";

type RecoveryFormProps =
  | { mode: "request" }
  | { mode: "reset"; identifier: string; token: string };

export default function RecoveryForm(props: RecoveryFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const endpoint = props.mode === "request" ? "/api/auth/forgot-password" : "/api/auth/reset-password";
    const payload =
      props.mode === "request"
        ? values
        : { ...values, identifier: props.identifier, token: props.token };
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = (await response.json()) as { ok: boolean; error?: { message?: string } };
    setSubmitting(false);
    if (!response.ok || !result.ok) {
      setError(result.error?.message ?? "The request could not be completed.");
      return;
    }
    setComplete(true);
  }

  if (complete) {
    return (
      <div className={styles.form}>
        <div className={styles.formHeading}>
          <span className={styles.eyebrow}>ACCOUNT RECOVERY</span>
          <h1>{props.mode === "request" ? "Check your inbox" : "Password updated"}</h1>
          <p>
            {props.mode === "request"
              ? "If the account exists, a short-lived reset link has been queued for delivery."
              : "All existing sessions were revoked. Sign in again with your new password."}
          </p>
        </div>
        <div className={styles.assurance}><CheckCircle2 size={17} /><span>The recovery event has been recorded in the security audit trail.</span></div>
        <Link className={styles.submit} href="/login"><ArrowLeft size={17} /> Return to sign in</Link>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <div className={styles.formHeading}>
        <span className={styles.eyebrow}>ACCOUNT RECOVERY</span>
        <h1>{props.mode === "request" ? "Reset access" : "Choose a new password"}</h1>
        <p>
          {props.mode === "request"
            ? "Enter your assigned email or username. We never disclose whether an account exists."
            : "Use at least 12 characters with uppercase, lowercase, number and symbol."}
        </p>
      </div>
      {props.mode === "request" ? (
        <label className={styles.field}>
          <span>Email or username</span>
          <input name="identifier" autoComplete="username" required />
        </label>
      ) : (
        <>
          <label className={styles.field}>
            <span>New password</span>
            <input name="password" type="password" autoComplete="new-password" required />
          </label>
          <label className={styles.field}>
            <span>Confirm password</span>
            <input name="confirmPassword" type="password" autoComplete="new-password" required />
          </label>
        </>
      )}
      {error && <div className={styles.error} role="alert">{error}</div>}
      <button className={styles.submit} disabled={submitting}>
        {submitting ? <LoaderCircle className={styles.spin} size={18} /> : <KeyRound size={18} />}
        {submitting ? "Securing request…" : props.mode === "request" ? "Send reset instructions" : "Update password"}
        {!submitting && <ArrowRight size={17} />}
      </button>
      <div className={styles.assurance}><ArrowLeft size={17} /><Link href="/login">Return to secure sign in</Link></div>
    </form>
  );
}
