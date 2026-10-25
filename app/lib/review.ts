// 複習排程規則（間隔 1、3、7、14、30 天，英文和日文分開排程）

export type Rating = "forgot" | "fuzzy" | "remembered";

export const RATINGS: Rating[] = ["forgot", "fuzzy", "remembered"];

export function isRating(value: unknown): value is Rating {
  return RATINGS.includes(value as Rating);
}

/** 今日複習的一個項目（對應 ReviewSchedule 的一筆） */
export type ReviewItem = {
  /** ReviewSchedule 的 id */
  id: number;
  lang: "en" | "ja";
  questionId: number;
  question: string;
  /** 題目是幾天前出的 */
  daysAgo: number;
  /** 目前的複習間隔（天） */
  interval: number;
};

export const INTERVALS = [1, 3, 7, 14, 30] as const;

/** 下次幾天後複習：記得往下一階、模糊退一階、忘記回到 1 天 */
export function nextInterval(current: number, rating: Rating): number {
  const idx = Math.max(0, INTERVALS.findIndex((d) => d >= current));
  if (rating === "forgot") return INTERVALS[0];
  if (rating === "fuzzy") return INTERVALS[Math.max(0, idx - 1)];
  return INTERVALS[Math.min(INTERVALS.length - 1, idx + 1)];
}

/** 英文重寫的 AI 分數對應結果（使用者可以手動改） */
export function scoreToRating(score: number): Rating {
  if (score >= 80) return "remembered";
  if (score >= 50) return "fuzzy";
  return "forgot";
}
