"use client";

import { ArrowRight, Eye, EyeOff, LoaderCircle, LockKeyhole, ShieldCheck } from "lucide-react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import styles from "./login.module.css";

export default function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const result = await signIn("credentials", {
      identifier: formData.get("identifier"),
      password: formData.get("password"),
      redirect: false,
    });

    if (result?.error) {
      setSubmitting(false);
      setError("Sign-in failed. Check your details or contact an administrator if your account is locked.");
      return;
    }

    router.replace(callbackUrl?.startsWith("/") ? callbackUrl : "/");
    router.refresh();
  }

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <div className={styles.formHeading}>
        <span className={styles.eyebrow}>SECURE OPERATIONS ACCESS</span>
        <h1>Sign in to command</h1>
        <p>Use your assigned AAU Chamo username or work email.</p>
      </div>

      <label className={styles.field}>
        <span>Email or username</span>
        <input name="identifier" autoComplete="username" placeholder="name@aauchamo.com" required />
      </label>

      <label className={styles.field}>
        <span>Password</span>
        <span className={styles.passwordControl}>
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Enter your password"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </span>
      </label>

      <div className={styles.formMeta}>
        <label><input type="checkbox" name="remember" /> Keep me signed in on this device</label>
        <Link href="/forgot-password">Forgot password?</Link>
      </div>

      {error && <div className={styles.error} role="alert">{error}</div>}

      <button className={styles.submit} type="submit" disabled={submitting}>
        {submitting ? <LoaderCircle className={styles.spin} size={18} /> : <LockKeyhole size={18} />}
        {submitting ? "Verifying access…" : "Sign in securely"}
        {!submitting && <ArrowRight size={17} />}
      </button>

      <div className={styles.assurance}>
        <ShieldCheck size={17} />
        <span>Access is permission-scoped and every sensitive action is audited.</span>
      </div>
    </form>
  );
}
