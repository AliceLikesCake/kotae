"use client";

import { useEffect, useState } from "react";
import { useT } from "../i18n/client";

// 用瀏覽器內建語音合成朗讀（Web Speech API），再按一次停止。
// 有 children 就顯示成「圖示＋文字」按鈕，沒有就只有圖示（用 label 當無障礙名稱）
export default function SpeakButton({
  text,
  lang,
  rate = 1,
  label,
  className,
  children,
}: {
  text: string;
  lang: "en-US" | "ja-JP";
  rate?: number;
  label: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const t = useT();
  const [speaking, setSpeaking] = useState(false);

  // 離開頁面時停止朗讀
  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  function toggle() {
    const synth = window.speechSynthesis;
    if (!synth) return;
    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = rate;
    const voice = synth.getVoices().find((v) => v.lang.replace("_", "-") === lang);
    if (voice) utterance.voice = voice;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    synth.speak(utterance);
  }

  return (
    <button
      type="button"
      className={className}
      aria-label={children ? undefined : speaking ? t.speak.stopReading : label}
      aria-pressed={speaking}
      onClick={toggle}
    >
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
        {speaking ? (
          <rect x="7" y="7" width="10" height="10" rx="1.5" />
        ) : (
          <>
            <path d="M4 9h4l5-4v14l-5-4H4z" />
            <path d="M16.5 8.5a5 5 0 0 1 0 7" />
          </>
        )}
      </svg>
      {children && (speaking ? t.speak.stop : children)}
    </button>
  );
}
