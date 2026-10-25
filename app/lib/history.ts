// 練習紀錄的型別和小工具。伺服器端和瀏覽器端都會用到，所以這裡不能放查資料庫的程式。

import type { Question } from "./practice-data";

export type HistoryEntry = Question & {
  /** 熟練度 0–4（複習間隔走到第幾階） */
  enLevel: number;
  jaLevel: number;
  /** 最近一次練習，YYYY-MM-DD */
  lastPracticed: string;
  practiceCount: number;
};

/** 英文、日文都到第 3 階（間隔 14 天以上）就算熟記 */
export function isMastered(entry: { enLevel: number; jaLevel: number }) {
  return entry.enLevel >= 3 && entry.jaLevel >= 3;
}
