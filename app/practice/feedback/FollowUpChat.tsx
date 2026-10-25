"use client";

import { useEffect, useRef, useState } from "react";
import BottomSheet from "../../components/BottomSheet";
import { useT } from "../../i18n/client";
import type { ChatMessage } from "../../lib/followup";
import { askFollowUpAction } from "./actions";
import styles from "./FollowUpChat.module.css";

// 「再問 AI」：從底部滑出的追問視窗，不會讓回饋頁變長。對話只存在這個視窗，離開頁面就清空
export default function FollowUpChat({
  questionId,
  title,
  buttonClassName,
}: {
  questionId: string;
  title: string;
  buttonClassName?: string;
}) {
  const t = useT();
  const endRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ block: "end" });
  }, [open, messages, waiting, error]);

  async function send(text: string) {
    const question = text.trim();
    if (!question || waiting) return;
    const next: ChatMessage[] = [...messages, { role: "user", content: question }];
    setMessages(next);
    setInput("");
    setError("");
    setWaiting(true);
    // 呼叫伺服器的 askFollowUpAction：AI 會看到題目、你的回答、回饋，以及這次的對話
    const result = await askFollowUpAction(questionId, next).catch(() => ({ ok: false as const, error: t.followUp.connectionFailed }));
    if (result.ok) {
      setMessages([...next, { role: "assistant", content: result.reply }]);
    } else {
      // 失敗時把提問放回輸入框，可以直接再送一次
      setMessages(messages);
      setInput(question);
      setError(result.error);
    }
    setWaiting(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // 中文 / 日文輸入法選字時按 Enter 不送出；Shift+Enter 換行
    // keyCode 229 雖已淘汰，但 Safari 選字的 Enter 只能靠它判斷（isComposing 會是 false）
    if (e.key !== "Enter" || e.shiftKey || e.nativeEvent.isComposing || e.keyCode === 229) return;
    e.preventDefault();
    send(input);
  }

  return (
    <>
      <button type="button" className={buttonClassName} onClick={() => setOpen(true)}>
        {t.followUp.open}
      </button>

      <BottomSheet open={open} onClose={() => setOpen(false)} title={title} className={styles.tall}>
        <div className={styles.messages} aria-live="polite">
          {messages.length === 0 && (
            <div className={styles.empty}>
              <div>{t.followUp.empty}</div>
              <div className={styles.suggestions}>
                {t.followUp.suggestions.map((s) => (
                  <button key={s} type="button" className={styles.suggestion} onClick={() => send(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? styles.user : styles.ai}>
              {m.content}
            </div>
          ))}
          {waiting && <div className={`${styles.ai} ${styles.thinking}`}>{t.followUp.thinking}</div>}
          {error && (
            <div className={styles.error} role="alert">
              {error}
            </div>
          )}
          <div ref={endRef} />
        </div>

        <form
          className={styles.composer}
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <textarea
            className={styles.input}
            rows={1}
            placeholder={t.followUp.placeholder}
            aria-label={t.followUp.inputLabel}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button type="submit" className={styles.send} aria-label={t.followUp.send} disabled={!input.trim() || waiting}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </button>
        </form>
      </BottomSheet>
    </>
  );
}
