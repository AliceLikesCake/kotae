"use client";

import { createContext, useContext } from "react";
import { DICTS, type Dict, type Locale } from ".";

// 瀏覽器端的元件從這裡拿目前語言的字典。語言由 layout 依 cookie 決定後傳進來。
const LocaleContext = createContext<Locale>("zh");

export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <LocaleContext value={locale}>{children}</LocaleContext>;
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

/** 目前語言的字典（瀏覽器元件用） */
export function useT(): Dict {
  return DICTS[useLocale()];
}
