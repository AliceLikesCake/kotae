import Link from "next/link";
import styles from "./TopBar.module.css";

// 頁面上方列：左邊返回、中間標題；右邊可放按鈕，沒有就留同寬空白讓標題置中
export default function TopBar({
  backHref,
  backLabel,
  title,
  right,
}: {
  backHref: string;
  backLabel: string;
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <div className={styles.bar}>
      <Link href={backHref} aria-label={backLabel} className={styles.back}>
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M15 5l-7 7 7 7" />
        </svg>
      </Link>
      <div className={styles.title}>{title}</div>
      {right ?? <div className={styles.spacer} />}
    </div>
  );
}
