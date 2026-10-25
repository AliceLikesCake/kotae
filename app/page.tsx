import Link from "next/link";
import { connection } from "next/server";
import BottomNav from "./components/BottomNav";
import type { Dict } from "./i18n";
import { getT } from "./i18n/server";
import { getHomeData, type DayStatus } from "./lib/home-data";
import styles from "./home.module.css";

function weekLabel(t: Dict, week: DayStatus[]) {
  const done = week.flatMap((s, i) => (s === "done" ? [i] : []));
  const todayIdx = week.indexOf("today");
  return t.home.weekLabel(done, todayIdx >= 0 ? todayIdx : null);
}

// 已練習＝實心笑臉，今天未完成＝空心平嘴臉，沒練習和未來＝淡色圓
function DayFace({ status }: { status: DayStatus }) {
  return (
    <svg width="30" height="30" viewBox="0 0 28 28" aria-hidden="true">
      {status === "done" && (
        <>
          <circle cx="14" cy="14" r="14" fill="var(--en)" />
          <circle cx="10" cy="11.5" r="1.6" fill="#FFFFFF" />
          <circle cx="18" cy="11.5" r="1.6" fill="#FFFFFF" />
          <path d="M9 16.5c1.3 2 3 3 5 3s3.7-1 5-3" fill="none" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
        </>
      )}
      {status === "today" && (
        <>
          <circle cx="14" cy="14" r="13" fill="none" stroke="var(--en)" strokeWidth="2" />
          <circle cx="10" cy="11.5" r="1.6" fill="var(--en)" />
          <circle cx="18" cy="11.5" r="1.6" fill="var(--en)" />
          <path d="M10 17.5h8" fill="none" stroke="var(--en)" strokeWidth="1.8" strokeLinecap="round" />
        </>
      )}
      {(status === "missed" || status === "future") && <circle cx="14" cy="14" r="14" fill="var(--neutral)" />}
    </svg>
  );
}

export default async function Home() {
  await connection(); // 每次請求才產生，日期才會是今天
  const today = new Date();
  const [data, t] = await Promise.all([getHomeData(today), getT()]);
  const { review, newQuestions } = data;

  return (
    <>
      <main className={styles.page}>
        <header className={styles.header}>
          <div className={styles.topRow}>
            <div className={styles.date}>{t.home.formatDate(today)}</div>
            <Link href="/settings" aria-label={t.home.settings} className={styles.settings}>
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
                <path d="M4 7h9M17 7h3M4 17h3M11 17h9M15 5v4M9 15v4" />
              </svg>
            </Link>
          </div>
          <h1 className={styles.title}>{t.home.title}</h1>
          <div className={styles.tags}>
            <span className={`${styles.tag} ${styles.tagEn}`}>{t.home.tag}</span>
          </div>
        </header>

        <section className={`${styles.card} ${styles.hero}`}>
          <div className={styles.cardHead}>
            <h2 className={styles.cardTitle}>{t.home.reviewTitle}</h2>
            <div className={styles.count}>
              {review.total}
              <span className={styles.countUnit}>{t.home.questionUnit(review.total)}</span>
            </div>
          </div>
          <div className={styles.heroText}>
            {t.home.reviewSummary(review.total, review.doneToday, review.yesterday, review.older)}
          </div>
          <div className={styles.chips}>
            <span className={styles.chip}>{t.home.enRewrite(review.enRewrite)}</span>
            <span className={styles.chip}>{t.home.jaCards(review.jaCards)}</span>
          </div>
          <Link href="/review" className={`${styles.button} ${styles.heroButton}`}>
            {t.home.startReview}
          </Link>
        </section>

        <section className={`${styles.card} ${styles.panel}`}>
          <div className={styles.cardHead}>
            <h2 className={styles.cardTitle}>{t.home.newTitle}</h2>
            <div className={styles.muted}>{t.home.newDone(newQuestions.done, newQuestions.total)}</div>
          </div>
          <div
            className={styles.progress}
            role="progressbar"
            aria-label={t.home.newProgress}
            aria-valuemin={0}
            aria-valuemax={newQuestions.total}
            aria-valuenow={newQuestions.done}
          >
            {Array.from({ length: newQuestions.total }, (_, i) => (
              <div key={i} className={i < newQuestions.done ? `${styles.bar} ${styles.barDone}` : styles.bar} />
            ))}
          </div>
          <div className={styles.muted}>
            {newQuestions.total > 0 ? t.home.newHint : t.home.newEmpty}
          </div>
          <Link href="/practice" className={`${styles.button} ${styles.outlineButton}`}>
            {t.home.startPractice}
          </Link>
        </section>

        <section className={`${styles.card} ${styles.panel} ${styles.week}`}>
          <div className={styles.weekHead}>
            <h2 className={styles.weekTitle}>{t.home.weekTitle}</h2>
            <span className={styles.date}>{t.home.streak(data.streakDays)}</span>
          </div>
          <div className={styles.days} role="img" aria-label={weekLabel(t, data.week)}>
            {data.week.map((status, i) => (
              <div key={i} className={styles.day}>
                <DayFace status={status} />
                {t.home.dayNames[i]}
              </div>
            ))}
          </div>
        </section>
      </main>
      <BottomNav />
    </>
  );
}
