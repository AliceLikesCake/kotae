import { getT } from "../i18n/server";
import BottomNav from "./BottomNav";
import styles from "./PageSkeleton.module.css";

// 各頁的 loading.tsx 共用：一點下去馬上切到這個畫面，資料準備好再換成真正的內容。
// lines 是每張卡片裡有幾條長條；nav 是這頁有沒有底部導覽（有的話也顯示，切換時才不會閃掉）
export default async function PageSkeleton({ lines, nav = false }: { lines: number[]; nav?: boolean }) {
  const t = await getT();
  return (
    <>
      <main className={styles.page} role="status" aria-live="polite">
        <span className={styles.srOnly}>{t.common.loading}</span>
        <div className={styles.title} aria-hidden="true" />
        {lines.map((count, i) => (
          <div key={i} className={styles.card} aria-hidden="true">
            {Array.from({ length: count }, (_, j) => (
              <span key={j} className={styles.line} />
            ))}
          </div>
        ))}
      </main>
      {nav && <BottomNav />}
    </>
  );
}
