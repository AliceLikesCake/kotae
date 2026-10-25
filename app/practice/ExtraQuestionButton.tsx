"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useT } from "../i18n/client";
import { addExtraQuestionAction } from "./actions";

// 今天的題目都做完後，請 AI 再出一題
export default function ExtraQuestionButton({ className, errorClassName }: { className: string; errorClassName: string }) {
  const t = useT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleClick() {
    setError("");
    startTransition(async () => {
      const result = await addExtraQuestionAction();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh(); // 重新產生頁面，顯示新的題目
    });
  }

  return (
    <>
      <button type="button" className={className} onClick={handleClick} disabled={pending}>
        {pending ? t.practice.extraPending : t.practice.extra}
      </button>
      {error && (
        <div className={errorClassName} role="alert">
          {error}
        </div>
      )}
    </>
  );
}
