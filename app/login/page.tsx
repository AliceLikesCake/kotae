import Link from "next/link";
import Logo from "../components/Logo";
import { getT } from "../i18n/server";
import DemoButton from "./DemoButton";
import LoginForm from "./LoginForm";
import styles from "./login.module.css";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const [{ next }, t] = await Promise.all([searchParams, getT()]);

  return (
    <main className={styles.page}>
      <div className={styles.brand}>
        <Logo size={96} />
        <div className={styles.titles}>
          <h1 className={styles.title}>Kotae</h1>
          <div className={styles.tagline}>{t.meta.tagline}</div>
        </div>
      </div>

      <div className={styles.actions}>
        <LoginForm next={typeof next === "string" ? next : undefined} />
        <DemoButton />
        <Link href="/about" className={styles.about}>
          {t.login.about} →
        </Link>
      </div>

      <div className={styles.note}>{t.login.note}</div>
    </main>
  );
}
