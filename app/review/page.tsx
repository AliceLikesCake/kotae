import Link from "next/link";
import { connection } from "next/server";
import BottomNav from "../components/BottomNav";
import TopBar from "../components/TopBar";
import { getT } from "../i18n/server";
import { isDemo } from "../lib/demo-session";
import { getSettings } from "../lib/profile-store";
import { getJapaneseAnswer, getReviewQueue } from "../lib/review-store";
import EnReview from "./EnReview";
import JaReview from "./JaReview";
import styles from "./review.module.css";

// 每次都顯示「剩下的第一題」：複習完一題後下次複習日往後排，它就不在清單裡了
export default async function ReviewPage() {
  await connection(); // 每次請求才產生（資料每次不同，build 時不要先產生）
  const [{ items, doneToday }, t] = await Promise.all([getReviewQueue(), getT()]);
  const item = items[0];
  const total = doneToday + items.length;
  const current = doneToday + 1;

  if (!item) {
    return (
      <>
        <main className={styles.page}>
          <TopBar backHref="/" backLabel={t.common.backHome} title={t.review.title} />
          <section className={styles.done}>
            <div className={styles.doneTitle}>{t.review.doneTitle(doneToday)}</div>
            <div className={styles.smallMuted}>{t.review.doneText(doneToday)}</div>
            <Link href="/practice" className={styles.primary}>
              {t.review.nextPractice}
            </Link>
            <Link href="/" className={styles.outline}>
              {t.common.home}
            </Link>
          </section>
        </main>
        <BottomNav />
      </>
    );
  }

  const percent = Math.round((current / total) * 100);

  return (
    <>
      <main className={styles.page}>
        <TopBar backHref="/" backLabel={t.common.backHome} title={t.review.progressTitle(current, total)} />
        <div
          className={styles.progress}
          role="progressbar"
          aria-label={t.review.progress}
          aria-valuemin={1}
          aria-valuemax={total}
          aria-valuenow={current}
        >
          <div className={styles.progressFill} style={{ width: `${percent}%` }} />
        </div>

        <span className={`${styles.tag} ${item.lang === "en" ? styles.tagEn : styles.tagJa}`}>
          {item.lang === "en" ? t.review.tagEn : t.review.tagJa} · {t.review.age(item.daysAgo)}
        </span>

        {item.lang === "en" ? (
          <>
            <div className={styles.question} lang="en">
              {item.question}
            </div>
            <EnReview key={item.id} item={item} demo={await isDemo()} />
          </>
        ) : (
          <>
            <div className={styles.questionBlock}>
              <div className={`${styles.question} ${styles.questionJa}`} lang="en">
                {item.question}
              </div>
              <div className={styles.muted}>{t.review.jaPrompt}</div>
            </div>
            <JaReview
              key={item.id}
              item={item}
              answer={await getJapaneseAnswer(item.questionId)}
              settings={await getSettings()}
            />
          </>
        )}
      </main>
      <BottomNav />
    </>
  );
}
