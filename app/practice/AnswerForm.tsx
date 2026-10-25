"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useT } from "../i18n/client";
import { saveDraftAction, submitAnswerAction } from "./actions";
import styles from "./practice.module.css";

function countWords(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

/** 打字停下來多久後存草稿 */
const SAVE_DELAY_MS = 600;

export default function AnswerForm({ questionId, initialDraft }: { questionId: string; initialDraft: string }) {
  const t = useT();
  const router = useRouter();
  const [answer, setAnswer] = useState(initialDraft);
  const [saved, setSaved] = useState(initialDraft.trim() !== "");
  /** 最後一次存進資料庫的內容，沒變就不用再存 */
  const lastSaved = useRef(initialDraft);
  /** 剛清掉的內容，讓使用者可以復原；null 表示沒有可復原的 */
  const [undoText, setUndoText] = useState<string | null>(null);
  const submitted = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [submitting, startSubmit] = useTransition();
  const [error, setError] = useState("");

  // 打字停下來後，把草稿存進資料庫（換到別台裝置也能接著寫）
  useEffect(() => {
    if (answer === lastSaved.current) return;
    const timer = setTimeout(() => {
      if (submitted.current) return; // 送出中或已送出，就不再存回草稿
      lastSaved.current = answer;
      saveDraftAction(questionId, answer)
        .then(() => setSaved(answer.trim() !== ""))
        .catch((error) => console.error("[草稿] 儲存失敗：", error));
    }, SAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [answer, questionId]);

  // 清空後 6 秒內可以復原
  useEffect(() => {
    if (undoText === null) return;
    const timer = setTimeout(() => setUndoText(null), 6000);
    return () => clearTimeout(timer);
  }, [undoText]);

  function handleClear() {
    setUndoText(answer);
    setAnswer("");
    setSaved(false);
    textareaRef.current?.focus();
  }

  function handleUndo() {
    if (undoText === null) return;
    setAnswer(undoText);
    setUndoText(null);
    textareaRef.current?.focus();
  }

  function handleChange(value: string) {
    setAnswer(value);
    // 開始打新內容就不能復原了，免得蓋掉新寫的
    if (undoText !== null) setUndoText(null);
  }

  function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    submitted.current = true;
    startSubmit(async () => {
      // 呼叫伺服器的 submitAnswerAction：請 AI 產生回饋
      const result = await submitAnswerAction(questionId, answer);
      if (!result.ok) {
        submitted.current = false;
        setError(result.error); // 失敗時草稿保留，可以直接再送一次
        return;
      }
      // 草稿已在伺服器端清掉（存進 Answer 的初稿）
      router.push(`/practice/feedback?q=${questionId}`);
    });
  }

  const words = countWords(answer);

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label htmlFor="answer" className={styles.label}>
        {t.practice.answerLabel}
      </label>
      <textarea
        ref={textareaRef}
        id="answer"
        name="answer"
        lang="en"
        className={styles.textarea}
        placeholder="Write your answer in English…"
        value={answer}
        onChange={(e) => handleChange(e.target.value)}
        readOnly={submitting}
        autoCapitalize="sentences"
        autoCorrect="off"
        spellCheck={false}
      />
      <div className={styles.meta}>
        <span aria-live="polite">{saved ? t.practice.draftSaved : t.practice.draftAuto}</span>
        {undoText !== null ? (
          <span className={styles.metaRight} role="status">
            {t.practice.cleared}
            <button type="button" className={`${styles.clear} ${styles.undo}`} onClick={handleUndo}>
              {t.practice.undo}
            </button>
          </span>
        ) : (
          <span className={styles.metaRight}>
            {t.practice.words(words)}
            <button type="button" className={styles.clear} disabled={!answer || submitting} onClick={handleClear}>
              {t.practice.clear}
            </button>
          </span>
        )}
      </div>
      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}
      <button type="submit" className={styles.submit} disabled={!answer.trim() || submitting}>
        {submitting ? t.practice.submitting : t.practice.submit}
      </button>
    </form>
  );
}
