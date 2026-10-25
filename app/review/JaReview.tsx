"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import RubyText from "../components/RubyText";
import SpeakButton from "../components/SpeakButton";
import { useT } from "../i18n/client";
import { toSpeechText, type RubyPart } from "../lib/ruby";
import type { Rating, ReviewItem } from "../lib/review";
import type { Settings } from "../lib/settings";
import { recordReviewAction } from "./actions";
import RatingButtons from "./RatingButtons";
import styles from "./review.module.css";

// 日文翻卡：先自己用日文念，翻開答案後自評
export default function JaReview({
  item,
  answer,
  settings,
}: {
  item: ReviewItem;
  answer: RubyPart[];
  settings: Pick<Settings, "furigana" | "speechRate">;
}) {
  const t = useT();
  const router = useRouter();
  const [flipped, setFlipped] = useState(false);
  const [saving, startSaving] = useTransition();
  const [error, setError] = useState("");

  function handleRate(rating: Rating) {
    setError("");
    startSaving(async () => {
      try {
        await recordReviewAction(item.id, rating);
        router.refresh(); // 重新產生頁面，顯示下一題
        window.scrollTo(0, 0);
      } catch {
        setError(t.common.saveFailed);
      }
    });
  }

  return (
    <>
      <section className={styles.card}>
        <div className={styles.cardHead}>
          <div className={styles.smallMuted}>{t.review.answer}</div>
          {flipped && (
            <SpeakButton text={toSpeechText(answer)} lang="ja-JP" rate={settings.speechRate} label={t.japanese.play} className={styles.speak} />
          )}
        </div>
        {flipped ? (
          <p className={settings.furigana ? styles.jaText : `${styles.jaText} ${styles.noRuby}`} lang="ja">
            <RubyText parts={answer} />
          </p>
        ) : (
          <div className={styles.cardBack}>
            <div className={styles.smallMuted}>{t.review.ready}</div>
            <button type="button" className={styles.flip} onClick={() => setFlipped(true)}>
              {t.review.flip}
            </button>
          </div>
        )}
      </section>

      {flipped && (
        <section className={styles.ratingSection}>
          <h2 className={styles.ratingTitle}>{t.review.howMuch}</h2>
          <RatingButtons interval={item.interval} onSelect={handleRate} disabled={saving} />
          {error && (
            <div className={styles.error} role="alert">
              {error}
            </div>
          )}
        </section>
      )}
    </>
  );
}
