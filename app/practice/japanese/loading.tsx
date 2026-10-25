import { getT } from "../../i18n/server";
import styles from "./japanese.module.css";

// 日文版還在翻譯時先顯示這個畫面（Next.js 會自動用 loading.tsx 當等待畫面）
export default async function Loading() {
  const t = await getT();
  return (
    <main className={styles.page}>
      <section className={styles.status} role="status" aria-live="polite">
        <div className={styles.statusTitle}>{t.japanese.loadingTitle}</div>
        <div className={styles.statusText}>
          {t.japanese.loadingText}
          <br />
          {t.japanese.loadingTime}
        </div>
        <div className={styles.skeleton} aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </section>
    </main>
  );
}
