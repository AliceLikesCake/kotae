"use server";

import { cookies } from "next/headers";
import { isLocale, LOCALE_COOKIE, type Locale } from ".";

/** 設定頁切換語言：記在 cookie（一年），畫面由呼叫的地方 router.refresh() 重新產生 */
export async function setLocaleAction(locale: Locale) {
  if (!isLocale(locale)) return;
  (await cookies()).set(LOCALE_COOKIE, locale, {
    path: "/",
    sameSite: "lax",
    maxAge: 365 * 24 * 60 * 60,
  });
}
