"use server";

import { getT } from "../../i18n/server";
import { AiError } from "../../lib/ai";
import { requireLogin } from "../../lib/auth";
import { askFollowUp, type ChatMessage } from "../../lib/followup";
import { findQuestion } from "../../lib/question-store";

const MAX_MESSAGES = 20;
const MAX_LENGTH = 2000;

export type FollowUpResult = { ok: true; reply: string } | { ok: false; error: string };

/** 再問 AI：送出到目前為止的對話（最後一則是這次的提問），回傳 AI 的回答 */
export async function askFollowUpAction(questionId: string, messages: ChatMessage[]): Promise<FollowUpResult> {
  await requireLogin();
  const t = await getT();

  const question = await findQuestion(questionId);
  if (!question) return { ok: false, error: t.common.questionNotFound };

  // Server Action 可以被直接呼叫，所以對話內容要自己檢查一遍
  const valid =
    Array.isArray(messages) &&
    messages.length > 0 &&
    messages.every(
      (m, i) =>
        m &&
        m.role === (i % 2 === 0 ? "user" : "assistant") &&
        typeof m.content === "string" &&
        m.content.trim() !== "",
    ) &&
    messages.at(-1)?.role === "user";
  if (!valid) return { ok: false, error: t.followUp.invalid };
  if (messages.length > MAX_MESSAGES) return { ok: false, error: t.followUp.tooLong };
  if (messages.some((m) => m.content.length > MAX_LENGTH)) return { ok: false, error: t.followUp.messageTooLong(MAX_LENGTH) };

  try {
    const reply = await askFollowUp(
      question,
      messages.map((m) => ({ role: m.role, content: m.content.trim() })),
    );
    return { ok: true, reply };
  } catch (error) {
    if (error instanceof AiError) return { ok: false, error: t.aiErrors[error.code] };
    console.error("[追問] 發生錯誤：", error);
    return { ok: false, error: t.common.genericError };
  }
}
