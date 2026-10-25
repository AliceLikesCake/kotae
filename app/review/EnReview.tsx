"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import CorrectionText from "../components/CorrectionText";
import { useT } from "../i18n/client";
import type { Rating, ReviewItem } from "../lib/review";
import type { EnglishScore } from "../lib/review-data";
import { recordReviewAction, scoreRewriteAction } from "./actions";
import RatingButtons from "./RatingButtons";
import styles from "./review.module.css";

function CheckIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12l5 5 9-10" />
    </svg>
  );
}

/** 把 `反引號` 包起來的英文換成英文字型 */
function MixedText({ text }: { text: string }) {
  return text.split("`").map((piece, i) =>
    i % 2 ? (
      <span key={i} className="en" lang="en">
        {piece}
      </span>
    ) : (
      piece
    ),
  );
}

// 英文複習：重寫 → AI 評分 → 看結果、確認忘記 / 模糊 / 記得
/** demo：示範模式（範例評分的說明不一樣） */
export default function EnReview({ item, demo }: { item: ReviewItem; demo: boolean }) {
  const t = useT();
  const router = useRouter();
  const [rewrite, setRewrite] = useState("");
  const [scoring, setScoring] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<EnglishScore | null>(null);
  const [rating, setRating] = useState<Rating>("remembered");
  const [saving, startSaving] = useTransition();

  function handleNext() {
    if (!result) return;
    setError("");
    startSaving(async () => {
      try {
        await recordReviewAction(item.id, rating, { rewrite, aiScore: result.score });
        router.refresh(); // 重新產生頁面，顯示下一題
        window.scrollTo(0, 0);
      } catch {
        setError(t.common.saveFailed);
      }
    });
  }

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setScoring(true);
    setError("");
    try {
      const response = await scoreRewriteAction(item.id, rewrite);
      if (!response.ok) {
        setError(response.error); // 失敗時重寫的內容保留，可以直接再送一次
        return;
      }
      setResult(response.score);
      setRating(response.score.rating);
    } catch {
      setError(t.review.scoreFailed);
    } finally {
      setScoring(false);
    }
  }

  if (!result) {
    return (
      <form className={styles.form} onSubmit={handleSubmit}>
        <label htmlFor="rewrite" className={styles.label}>
          {t.review.rewriteLabel}
        </label>
        <textarea
          id="rewrite"
          lang="en"
          className={styles.textarea}
          placeholder="Write your answer again…"
          value={rewrite}
          onChange={(e) => setRewrite(e.target.value)}
          autoCapitalize="sentences"
          autoCorrect="off"
          spellCheck={false}
          disabled={scoring}
        />
        <div className={styles.metaText}>{t.review.rewriteNote}</div>
        {error && (
          <div className={styles.error} role="alert">
            {error}
          </div>
        )}
        <button type="submit" className={styles.primary} disabled={!rewrite.trim() || scoring}>
          {scoring ? t.review.scoring : t.review.submit}
        </button>
      </form>
    );
  }

  const covered = result.keyPoints.filter((p) => p.covered).length;

  return (
    <>
      {result.source === "demo" && (
        <div className={styles.demo} role="note">
          {demo ? t.review.demoNote : t.review.devDemoNote}
        </div>
      )}
      <section className={styles.scoreCard}>
        <div className={styles.score}>
          <span className={styles.scoreNum}>{result.score}</span>
          <span className={styles.scoreUnit}>{t.common.outOf100}</span>
        </div>
        <div className={styles.scoreBody}>
          <span className={styles.verdict}>{t.review.verdict(t.ratings[result.rating])}</span>
          <span className={styles.scoreSummary}>{result.summary}</span>
        </div>
      </section>

      <section className={styles.card}>
        <div className={styles.smallMuted}>{t.review.yourRewrite}</div>
        <p className={styles.enText} lang="en">
          <CorrectionText parts={result.corrected} />
        </p>
      </section>

      <section className={styles.card}>
        <div className={styles.cardHead}>
          <h2 className={styles.cardTitle}>{t.review.keyPoints}</h2>
          <div className={styles.smallMuted}>
            {covered} / {result.keyPoints.length}
          </div>
        </div>
        <ul className={styles.list}>
          {result.keyPoints.map((p) => (
            <li key={p.text} className={styles.listItem}>
              <span className={p.covered ? styles.iconGood : styles.iconWarn}>
                {p.covered ? <CheckIcon /> : "!"}
              </span>
              <span>{p.text}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>{t.review.patterns}</h2>
        <ul className={styles.list}>
          {result.patterns.map((p) => (
            <li key={p.text} className={styles.listItem}>
              <span className={p.good ? styles.iconGood : styles.iconWarn}>{p.good ? <CheckIcon /> : "!"}</span>
              <span>
                <MixedText text={p.text} />
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.ratingSection}>
        <div className={styles.cardHead}>
          <h2 className={styles.ratingTitle}>{t.review.resultTitle}</h2>
          <div className={styles.smallMuted}>{t.review.resultNote}</div>
        </div>
        <RatingButtons interval={item.interval} selected={rating} onSelect={setRating} />
      </section>

      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}
      <button type="button" className={styles.primary} onClick={handleNext} disabled={saving}>
        {saving ? t.common.saving : t.review.next}
      </button>
    </>
  );
}
