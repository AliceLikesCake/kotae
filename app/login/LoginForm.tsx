"use client";

import { useActionState, useState } from "react";
import { useT } from "../i18n/client";
import { login } from "./actions";
import styles from "./login.module.css";

export default function LoginForm({ next }: { next?: string }) {
  const t = useT();
  const [showPassword, setShowPassword] = useState(false);
  // useActionState：送出時呼叫伺服器的 login，回傳的錯誤訊息放在 state，pending 表示正在驗證
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <form className={styles.form} action={formAction}>
      {next && <input type="hidden" name="next" value={next} />}
      <label htmlFor="pw" className={styles.label}>
        {t.login.password}
      </label>
      <div className={state?.error ? `${styles.field} ${styles.fieldError}` : styles.field}>
        <input
          id="pw"
          name="password"
          type={showPassword ? "text" : "password"}
          placeholder={t.login.placeholder}
          autoComplete="current-password"
          className={styles.input}
          aria-invalid={state?.error ? true : undefined}
          aria-describedby={state?.error ? "pw-error" : undefined}
          required
        />
        <button
          type="button"
          className={styles.toggle}
          aria-label={showPassword ? t.login.hidePassword : t.login.showPassword}
          aria-pressed={showPassword}
          onClick={() => setShowPassword((v) => !v)}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
            <circle cx="12" cy="12" r="3" />
            {showPassword && <path d="M4 4l16 16" />}
          </svg>
        </button>
      </div>
      {state?.error && (
        <div id="pw-error" className={styles.error} role="alert">
          {state.error}
        </div>
      )}
      <label className={styles.remember}>
        <input type="checkbox" name="remember" defaultChecked />
        {t.login.remember}
      </label>
      <button type="submit" className={styles.submit} disabled={pending}>
        {pending ? t.login.signingIn : t.login.signIn}
      </button>
    </form>
  );
}
