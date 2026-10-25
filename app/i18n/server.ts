import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { isDemo } from "../lib/demo-session";
import { DICTS, isLocale, LOCALE_COOKIE, type Dict, type Locale } from ".";

/**
 * 目前的語言：示範模式固定英文（給履歷上的訪客看）。
 * 平常是設定頁選過就用 cookie 記住的；沒選過就看瀏覽器的語言，中文顯示中文，其他顯示英文。
 * cache：同一個請求裡只算一次。
 */
export const getLocale = cache(async (): Promise<Locale> => {
  if (await isDemo()) return "en";
  const saved = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(saved)) return saved;
  // Accept-Language 例如 "zh-TW,zh;q=0.9,en;q=0.8"，取第一個語言
  const first = (await headers()).get("accept-language")?.split(",")[0]?.trim().toLowerCase() ?? "";
  return first.startsWith("zh") ? "zh" : "en";
});

/** 目前語言的字典（伺服器元件、Server Action 用） */
export async function getT(): Promise<Dict> {
  return DICTS[await getLocale()];
}
