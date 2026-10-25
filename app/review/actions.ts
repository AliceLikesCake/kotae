"use server";

import { getT } from "../i18n/server";
import { AiError } from "../lib/ai";
import { requireLogin } from "../lib/auth";
import { isRating, type Rating } from "../lib/review";
import { scoreRewrite, type EnglishScore } from "../lib/review-data";
import { recordReview } from "../lib/review-store";

const MAX_REWRITE = 5000;

export type ScoreResult = { ok: true; score: EnglishScore } | { ok: false; error: string };

/** 英文重寫送出：請 AI 評分 */
export async function scoreRewriteAction(scheduleId: number, rewrite: string): Promise<ScoreResult> {
  // Server Action 可以被直接呼叫，所以這裡也要確認已登入
  await requireLogin();
  const t = await getT();
  const text = rewrite.trim();
  if (!text) return { ok: false, error: t.common.answerRequired };
  if (text.length > MAX_REWRITE) return { ok: false, error: t.common.answerTooLong(MAX_REWRITE) };

  try {
    return { ok: true, score: await scoreRewrite(scheduleId, text) };
  } catch (error) {
    if (error instanceof AiError) return { ok: false, error: t.aiErrors[error.code] };
    console.error("[英文複習評分] 發生錯誤：", error);
    return { ok: false, error: t.review.scoreFailed };
  }
}

/** 按下忘記 / 模糊 / 記得（英文是確認結果後按「下一題」）：記錄結果並排下次複習 */
export async function recordReviewAction(
  scheduleId: number,
  result: Rating,
  english?: { rewrite: string; aiScore: number },
): Promise<void> {
  await requireLogin();
  if (!Number.isInteger(scheduleId) || !isRating(result)) throw new Error("資料格式不正確");
  const checked = english && {
    rewrite: String(english.rewrite).slice(0, MAX_REWRITE),
    aiScore: Math.min(100, Math.max(0, Math.round(Number(english.aiScore) || 0))),
  };
  await recordReview(scheduleId, result, checked);
}
