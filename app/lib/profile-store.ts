import "server-only";
import { getDb } from "./db";
import { DEFAULT_SETTINGS, isTheme, type Settings } from "./settings";

// 使用者設定存在 Profile 資料表。只有一位使用者，所以固定讀寫 Id = 1 這一筆。

const PROFILE_ID = 1;

/** 讀取設定；還沒存過就回傳預設值 */
export async function getSettings(): Promise<Settings> {
  const prisma = await getDb();
  const row = await prisma.profile.findUnique({ where: { id: PROFILE_ID } });
  if (!row) return DEFAULT_SETTINGS;
  return {
    theme: isTheme(row.theme) ? row.theme : DEFAULT_SETTINGS.theme,
    bio: row.bio,
    dailyTotal: row.dailyTotal,
    reviewCap: row.reviewCap,
    furigana: row.furigana,
    // DECIMAL 欄位讀出來是 Decimal 物件，要轉成一般數字
    speechRate: row.speechRate.toNumber() === 1 ? 1 : 0.8,
    reminder: row.reminder,
  };
}

/** 存整份設定（呼叫前要先用 sanitizeSettings 檢查過） */
export async function saveSettings(settings: Settings) {
  const prisma = await getDb();
  const data = {
    theme: settings.theme,
    bio: settings.bio,
    dailyTotal: settings.dailyTotal,
    reviewCap: settings.reviewCap,
    furigana: settings.furigana,
    speechRate: settings.speechRate,
    reminder: settings.reminder,
  };
  await prisma.profile.upsert({ where: { id: PROFILE_ID }, create: { id: PROFILE_ID, ...data }, update: data });
}
