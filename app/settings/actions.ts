"use server";

import { getT } from "../i18n/server";
import { AiError } from "../lib/ai";
import { requireLogin } from "../lib/auth";
import { saveSettings } from "../lib/profile-store";
import { regenerateTodayQuestions } from "../lib/question-store";
import { sanitizeSettings, type Settings } from "../lib/settings";

/** 設定頁改了任何設定，就把整份設定存進資料庫 */
export async function saveSettingsAction(settings: Settings) {
  await requireLogin();
  await saveSettings(sanitizeSettings(settings));
}

export type RegenerateResult = { ok: true } | { ok: false; error: string };

/** 先存好目前的設定，再用新設定重出今天還沒做的題目 */
export async function regenerateTodayAction(settings: Settings): Promise<RegenerateResult> {
  await requireLogin();
  await saveSettings(sanitizeSettings(settings));
  try {
    await regenerateTodayQuestions();
    return { ok: true };
  } catch (error) {
    const t = await getT();
    if (error instanceof AiError) return { ok: false, error: t.aiErrors[error.code] };
    console.error("[重出今天的題目] 發生錯誤：", error);
    return { ok: false, error: t.common.genericError };
  }
}
