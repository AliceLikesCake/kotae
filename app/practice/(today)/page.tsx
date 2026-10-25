import Link from "next/link";
import { connection } from "next/server";
import BottomNav from "../../components/BottomNav";
import TopBar from "../../components/TopBar";
import { getT } from "../../i18n/server";
import { AiError } from "../../lib/ai";
import { getDraft } from "../../lib/answer-store";
import type { Question } from "../../lib/practice-data";
import { ensureTodayQuestions, getAnsweredIds } from "../../lib/question-store";
import AnswerForm from "../AnswerForm";
import ExtraQuestionButton from "../ExtraQuestionButton";
import styles from "../practice.module.css";

export default async function PracticePage() {
  await connection(); // 每次請求才產生（資料每次不同，build 時不要先產生）
  const t = await getT();
  // 今天第一次打開會請 AI 出題（10–20 秒，期間顯示 loading.tsx）
  let questions: Question[];
  try {
    questions = await ensureTodayQuestions();
  } catch (error) {
    if (!(error instanceof AiError)) throw error;
    return (
      <>
        <main className={styles.page}>
          <TopBar backHref="/" backLabel={t.common.backHome} title={t.practice.title} />
          <section className={styles.status} role="alert">
            <div className={styles.statusTitle}>{t.practice.failTitle}</div>
            <div className={styles.error}>{t.aiErrors[error.code]}</div>
            <Link href="/practice" prefetch={false} className={styles.submit}>
              {t.common.retry}
            </Link>
          </section>
        </main>
        <BottomNav />
      </>
    );
  }

  const answered = await getAnsweredIds(questions);
  const total = questions.length;
  // 依序做：顯示第一題還沒送出的
  const index = questions.findIndex((q) => !answered.has(q.id));

  if (index === -1) {
    return (
      <>
        <main className={styles.page}>
          <TopBar backHref="/" backLabel={t.common.backHome} title={t.practice.title} />
          <section className={styles.status}>
            <div className={styles.statusTitle}>{t.practice.allDoneTitle}</div>
            <div className={styles.statusText}>{t.practice.allDoneText(total)}</div>
            <ExtraQuestionButton className={styles.submit} errorClassName={styles.error} />
            <Link href="/" className={styles.outline}>
              {t.common.home}
            </Link>
          </section>
        </main>
        <BottomNav />
      </>
    );
  }

  const question = questions[index];

  return (
    <>
      <main className={styles.page}>
        <TopBar backHref="/" backLabel={t.common.backHome} title={t.practice.progressTitle(index + 1, total)} />

        <div
          className={styles.progress}
          role="progressbar"
          aria-label={t.practice.progress}
          aria-valuemin={1}
          aria-valuemax={total}
          aria-valuenow={index + 1}
        >
          {questions.map((q, i) => (
            <div key={q.id} className={answered.has(q.id) || i === index ? `${styles.bar} ${styles.barDone}` : styles.bar} />
          ))}
        </div>

        <span className={`${styles.tag} ${styles.tagEn}`}>
          {t.tracks[question.track]} · {t.types[question.type]}
        </span>
        <h1 className={styles.question} lang="en">
          {question.en}
        </h1>
        {t.practice.showMeaning && <div className={styles.translation}>{question.zh}</div>}
        <div className={styles.hint}>{t.practice.hint(question.hint)}</div>

        <AnswerForm key={question.id} questionId={question.id} initialDraft={await getDraft(question)} />
      </main>
      <BottomNav />
    </>
  );
}
