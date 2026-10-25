import Link from "next/link";
import { notFound } from "next/navigation";
import CorrectionText from "../../components/CorrectionText";
import SpeakButton from "../../components/SpeakButton";
import TopBar from "../../components/TopBar";
import { getT } from "../../i18n/server";
import { isDemo } from "../../lib/demo-session";
import { getFeedback } from "../../lib/feedback-data";
import { findQuestion, getTodayQuestions } from "../../lib/question-store";
import FollowUpChat from "./FollowUpChat";
import styles from "./feedback.module.css";

const SCORE_DIMENSIONS = ["content", "grammar", "structure"] as const;

export default async function FeedbackPage({ searchParams }: PageProps<"/practice/feedback">) {
  const [{ q }, t] = await Promise.all([searchParams, getT()]);
  const question = await findQuestion(q);
  if (!question) notFound();
  // 今天的題目從作答頁來；以前的題目從練習紀錄來
  const todayIndex = (await getTodayQuestions()).findIndex((t) => t.id === question.id);
  const isToday = todayIndex >= 0;
  const number = isToday ? todayIndex + 1 : null;
  const feedback = await getFeedback(question);

  const changeCount = feedback.corrected.filter((part) => typeof part !== "string").length;
  const { interviewer } = feedback;

  return (
    <main className={styles.page}>
      <TopBar
        backHref={isToday ? "/practice" : "/history"}
        backLabel={isToday ? t.feedback.backPractice : t.feedback.backHistory}
        title={t.feedback.title(number)}
      />

      {feedback.source === "demo" && (
        <div className={styles.demo} role="note">
          {(await isDemo()) ? t.feedback.demoNote : t.feedback.devDemoNote}
        </div>
      )}

      {/* 加分數之前存的回饋沒有 score，所以要先確認有沒有 */}
      {feedback.score && (
        <section className={styles.scoreCard} aria-label={t.feedback.scoreLabel}>
          <div className={styles.score}>
            <span className={styles.scoreNum}>{feedback.score.total}</span>
            <span className={styles.scoreUnit}>{t.common.outOf100}</span>
          </div>
          <div className={styles.scoreBody}>
            <div className={styles.dimensions}>
              {SCORE_DIMENSIONS.map((key) => (
                <span key={key} className={styles.dimension}>
                  {t.feedback.dimensions[key]}{" "}
                  <span className={styles.dots} aria-label={`${feedback.score[key]} / 4`}>
                    <span aria-hidden="true">{"●".repeat(feedback.score[key]) + "○".repeat(4 - feedback.score[key])}</span>
                  </span>
                </span>
              ))}
            </div>
            <p className={styles.scoreSummary}>{feedback.score.summary}</p>
          </div>
        </section>
      )}

      <section className={styles.card}>
        <div className={styles.cardHead}>
          <h2 className={styles.cardTitle}>{t.feedback.grammarTitle}</h2>
          <div className={styles.small}>{t.feedback.changes(changeCount)}</div>
        </div>
        <p className={styles.corrected} lang="en">
          <CorrectionText parts={feedback.corrected} />
        </p>
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>{t.feedback.notesTitle}</h2>
        {feedback.notes.length === 0 && <p className={styles.noNotes}>{t.feedback.noNotes}</p>}
        <ol className={styles.notes}>
          {feedback.notes.map((note, i) => (
            <li key={i} className={styles.note}>
              <span className={styles.noteNum} aria-hidden="true">
                {i + 1}
              </span>
              <span>{note}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className={`${styles.card} ${styles.interviewer}`}>
        <div className={styles.cardHead}>
          <h2 className={styles.cardTitle}>{t.feedback.interviewerTitle}</h2>
          <span className={`${styles.pill} ${styles.pillEn}`}>{t.feedback.audience}</span>
        </div>
        <div className={styles.focus}>{t.feedback.focus(interviewer.focus)}</div>
        <ul className={styles.points}>
          {interviewer.points.map((point, i) => (
            <li key={i} className={styles.point}>
              <span className={point.status === "covered" ? styles.covered : styles.improve}>
                {point.status === "covered" ? t.feedback.covered : t.feedback.improve}
              </span>
              <span className={styles.pointText}>{point.text}</span>
            </li>
          ))}
        </ul>
        <div className={styles.keywords}>
          <div className={styles.small}>{t.feedback.keywords}</div>
          <div className={styles.keywordList}>
            {interviewer.keywords.map((k) => (
              <span key={k.text} lang={k.lang} className={`${styles.keyword} ${k.lang === "ja" ? "ja" : "en"}`}>
                {k.text}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.polished}>
        <div className={styles.cardHead}>
          <h2 className={styles.cardTitle}>{t.feedback.polishedTitle}</h2>
          <SpeakButton text={feedback.polished} lang="en-US" label={t.feedback.readAloud} className={styles.speak} />
        </div>
        <p className={styles.polishedText} lang="en">
          {feedback.polished}
        </p>
        <div className={styles.whyBetter}>{t.feedback.whyBetter(feedback.whyBetter)}</div>
      </section>

      <div className={styles.actions}>
        <FollowUpChat
          questionId={question.id}
          title={t.feedback.followUpTitle(number)}
          buttonClassName={`${styles.button} ${styles.outlineButton}`}
        />
        {/* 不預先載入：日文版第一次打開會呼叫 AI 翻譯，要等使用者真的點了才開始 */}
        <Link
          href={`/practice/japanese?q=${question.id}`}
          prefetch={false}
          className={`${styles.button} ${styles.jaButton}`}
        >
          {t.feedback.japanese}
        </Link>
      </div>
    </main>
  );
}
