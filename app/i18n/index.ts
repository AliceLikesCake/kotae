// 語言設定和字典。伺服器端和瀏覽器端都會用到。
// 目前語言：伺服器端用 i18n/server.ts 的 getLocale / getT，瀏覽器端用 i18n/client.tsx 的 useT。

import { en } from "./en";
import { zh, type Dict } from "./zh";

export type { Dict };
export type Locale = "zh" | "en";
export const LOCALES: Locale[] = ["zh", "en"];

/** 記住語言的 cookie（設定頁切換） */
export const LOCALE_COOKIE = "kotae-lang";

export const DICTS: Record<Locale, Dict> = { zh, en };

/** <html lang> 用的語言代碼 */
export const HTML_LANG: Record<Locale, string> = { zh: "zh-Hant", en: "en" };

export function isLocale(value: unknown): value is Locale {
  return value === "zh" || value === "en";
}
