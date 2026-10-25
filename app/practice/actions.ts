"use server";

import { getT } from "../i18n/server";
import { AiError } from "../lib/ai";
import { requireLogin } from "../lib/auth";
import { generateFeedback } from "../lib/feedback-data";
import { addExtraQuestion, findQuestion } from "../lib/question-store";
import { getSettings } from "../lib/profile-store";
import { saveAnswer, saveDraft } from "../lib/answer-store";

const MAX_ANSWER = 5000;

export type SubmitResult = { ok: true } | { ok: false; error: string };

/** 送出作答：請 AI 產生回饋並存起來，成功後由畫面導到回饋頁 */
export async function submitAnswerAction(questionId: string, answer: string): Promise<SubmitResult> {
  await requireLogin();
  const t = await getT();

  const question = await findQuestion(questionId);
  if (!question) return { ok: false, error: t.common.questionNotFound };
  const text = answer.trim();
  if (!text) return { ok: false, error: t.common.answerRequired };
  if (text.length > MAX_ANSWER) return { ok: false, error: t.common.answerTooLong(MAX_ANSWER) };

  try {
    // 我的背景（設定頁）讓 AI 修改時參考
    const { bio } = await getSettings();
    const feedback = await generateFeedback(question, text, bio.trim());
    await saveAnswer(question, text, feedback);
    return { ok: true };
  } catch (error) {
    if (error instanceof AiError) return { ok: false, error: t.aiErrors[error.code] };
    console.error("[作答送出] 發生錯誤：", error);
    return { ok: false, error: t.common.genericError };
  }
}

/** 自動儲存草稿（作答頁打字停下來後呼叫） */
export async function saveDraftAction(questionId: string, draft: string): Promise<void> {
  await requireLogin();
  const question = await findQuestion(questionId);
  if (!question) return;
  await saveDraft(question, draft.slice(0, MAX_ANSWER));
}

/** 今天的題目都做完後，「再出一題」 */
export async function addExtraQuestionAction(): Promise<SubmitResult> {
  await requireLogin();
  const t = await getT();
  try {
    await addExtraQuestion();
    return { ok: true };
  } catch (error) {
    if (error instanceof AiError) return { ok: false, error: t.aiErrors[error.code] };
    console.error("[再出一題] 發生錯誤：", error);
    return { ok: false, error: t.common.genericError };
  }
}
