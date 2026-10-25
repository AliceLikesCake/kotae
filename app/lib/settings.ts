// 使用者設定的型別和預設值。存在資料庫的 Profile 資料表（讀寫在 profile-store.ts）。
// 伺服器端和瀏覽器端都會用到，所以這裡不能放查資料庫的程式。

export type Theme = "ink" | "blue";

/** 我的背景最多幾個字 */
export const MAX_BIO = 2000;

export function isTheme(value: unknown): value is Theme {
  return value === "ink" || value === "blue";
}

export type Settings = {
  /** 主題顏色 */
  theme: Theme;
  /** 我的背景（AI 出題和修改時會參考） */
  bio: string;
  /** 每天幾題（1–10） */
  dailyTotal: number;
  /** 每日複習上限（10–100） */
  reviewCap: number;
  /** 日文預設顯示注音 */
  furigana: boolean;
  /** 日文朗讀速度 */
  speechRate: 0.8 | 1;
  /** 每日練習提醒（每天 21:00） */
  reminder: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  theme: "ink",
  bio: "電子表單流程系統開發 [年資] 年，負責簽核流程設計與維護，熟悉 MSSQL。英文：[程度]。日文：會話可以，書寫學習中。",
  dailyTotal: 5,
  reviewCap: 30,
  furigana: true,
  speechRate: 0.8,
  reminder: true,
};

function clampInt(value: unknown, min: number, max: number, fallback: number) {
  const n = Math.round(Number(value));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}

/** 檢查並修正設定值（瀏覽器送來的資料不能直接相信） */
export function sanitizeSettings(input: Settings): Settings {
  const d = DEFAULT_SETTINGS;
  return {
    theme: isTheme(input.theme) ? input.theme : d.theme,
    bio: typeof input.bio === "string" ? input.bio.slice(0, MAX_BIO) : d.bio,
    dailyTotal: clampInt(input.dailyTotal, 1, 10, d.dailyTotal),
    reviewCap: clampInt(input.reviewCap, 10, 100, d.reviewCap),
    furigana: Boolean(input.furigana),
    speechRate: input.speechRate === 1 ? 1 : 0.8,
    reminder: Boolean(input.reminder),
  };
}
