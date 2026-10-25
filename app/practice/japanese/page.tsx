import Link from "next/link";
import { notFound } from "next/navigation";
import TopBar from "../../components/TopBar";
import { getT } from "../../i18n/server";
import { AiError } from "../../lib/ai";
import { isDemo } from "../../lib/demo-session";
import { ensureJapanese, type JapaneseVersion } from "../../lib/japanese-data";
import { getReadingFixes } from "../../lib/answer-store";
import { findQuestion } from "../../lib/question-store";
import { getSettings } from "../../lib/profile-store";
import JapaneseView from "./JapaneseView";
import styles from "./japanese.module.css";

export default async function JapanesePage({ searchParams }: PageProps<"/practice/japanese">) {
  const [{ q }, t] = await Promise.all([searchParams, getT()]);
  const question = await findQuestion(q);
  if (!question) notFound();
  const backHref = `/practice/feedback?q=${question.id}`;

  // 第一次進來會請 AI 翻譯（10–20 秒，期間顯示 loading.tsx）；翻過的直接讀取
  let data: JapaneseVersion;
  try {
    data = await ensureJapanese(question);
  } catch (error) {
    if (!(error instanceof AiError)) throw error;
    return (
      <main className={styles.page}>
        <TopBar backHref={backHref} backLabel={t.japanese.back} title={t.japanese.title} />
        <section className={styles.status} role="alert">
          <div className={styles.statusTitle}>{t.japanese.failTitle}</div>
          <div className={styles.errorText}>{t.aiErrors[error.code]}</div>
          <Link href={`/practice/japanese?q=${question.id}`} prefetch={false} className={styles.retry}>
            {t.common.retry}
          </Link>
        </section>
      </main>
    );
  }

  const [{ furigana, speechRate }, corrections, demo] = await Promise.all([
    getSettings(),
    getReadingFixes(question),
    isDemo(),
  ]);
  return (
    <JapaneseView
      data={data}
      backHref={backHref}
      settings={{ furigana, speechRate }}
      initialCorrections={corrections}
      demo={demo}
    />
  );
}
