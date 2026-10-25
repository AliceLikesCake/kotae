"use server";

import { saveReadingFixes } from "../../lib/answer-store";
import { requireLogin } from "../../lib/auth";
import { findQuestion } from "../../lib/question-store";
import type { ReadingFixes } from "../../lib/ruby";

const MAX_FIXES = 200;
const MAX_LENGTH = 50;

/** 存讀音修正（修改讀音視窗按「儲存」時呼叫） */
export async function saveReadingFixesAction(questionId: string, fixes: ReadingFixes): Promise<void> {
  await requireLogin();
  const question = await findQuestion(questionId);
  if (!question) return;
  // 瀏覽器送來的資料不能直接相信：只留字串，限制數量和長度
  const cleaned: ReadingFixes = {};
  for (const [key, value] of Object.entries(fixes ?? {}).slice(0, MAX_FIXES)) {
    if (typeof key === "string" && typeof value === "string" && key.length <= MAX_LENGTH * 2 && value.length <= MAX_LENGTH) {
      cleaned[key] = value;
    }
  }
  await saveReadingFixes(question, cleaned);
}
