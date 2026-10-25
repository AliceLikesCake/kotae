import "server-only";
import { addDays, dayKey, localDayKey, TIME_ZONE, today as todayDate } from "./dates";
import { getDb } from "./db";
import { getAnsweredIds, getTodayQuestions } from "./question-store";
import { getReviewQueue } from "./review-store";

// 首頁資料：今日複習、今日新題、連續練習天數、本週練習狀況。

/** missed：過去沒練習的日子 */
export type DayStatus = "done" | "today" | "missed" | "future";

export type HomeData = {
  /** yesterday / older：昨天出的、更早出的題數（摘要文字由畫面依語言組合） */
  review: { total: number; doneToday: number; yesterday: number; older: number; enRewrite: number; jaCards: number };
  newQuestions: { done: number; total: number };
  streakDays: number;
  /** 星期一到星期日 */
  week: DayStatus[];
};

/** 今天是星期幾，星期一 = 0 … 星期日 = 6 */
export function weekdayIndex(date: Date): number {
  const short = new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, weekday: "short" }).format(date);
  return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(short);
}

/** 連續天數最多往回算幾天 */
const ACTIVITY_DAYS = 400;

/** 有練習的日子（台灣時間）：那天出的題目有送出作答，或那天有做複習 */
async function getActivityDays(): Promise<Set<string>> {
  const prisma = await getDb();
  const since = addDays(todayDate(), -ACTIVITY_DAYS);
  const [answered, logs] = await Promise.all([
    prisma.question.findMany({
      where: { date: { gte: since }, answer: { is: { draft: { not: null } } } },
      select: { date: true },
    }),
    prisma.reviewLog.findMany({ where: { reviewedAt: { gte: since } }, select: { reviewedAt: true } }),
  ]);
  return new Set([...answered.map((q) => dayKey(q.date)), ...logs.map((l) => localDayKey(l.reviewedAt))]);
}

/** 連續練習天數：今天還沒練習的話從昨天開始算，早上打開不會被歸零 */
function countStreak(days: Set<string>): number {
  let day = todayDate();
  if (!days.has(dayKey(day))) day = addDays(day, -1);
  let streak = 0;
  while (days.has(dayKey(day))) {
    streak += 1;
    day = addDays(day, -1);
  }
  return streak;
}

export async function getHomeData(now: Date): Promise<HomeData> {
  const [queue, questions, activity] = await Promise.all([
    getReviewQueue(),
    // 今天還沒打開作答頁時題目還沒出，會是 0 題
    getTodayQuestions(),
    getActivityDays(),
  ]);
  const answered = await getAnsweredIds(questions);

  // 複習摘要以「題」計算：同一題的英文和日文算一題
  const questionDays = new Map(queue.items.map((item) => [item.questionId, item.daysAgo]));
  const ages = [...questionDays.values()];

  // 本週：星期一到星期日
  const todayIdx = weekdayIndex(now);
  const monday = addDays(todayDate(), -todayIdx);
  const week = Array.from({ length: 7 }, (_, i): DayStatus => {
    const done = activity.has(dayKey(addDays(monday, i)));
    if (i < todayIdx) return done ? "done" : "missed";
    if (i === todayIdx) return done ? "done" : "today";
    return "future";
  });

  return {
    review: {
      total: queue.items.length,
      doneToday: queue.doneToday,
      yesterday: ages.filter((d) => d <= 1).length,
      older: ages.filter((d) => d > 1).length,
      enRewrite: queue.items.filter((item) => item.lang === "en").length,
      jaCards: queue.items.filter((item) => item.lang === "ja").length,
    },
    newQuestions: {
      done: answered.size,
      total: questions.length,
    },
    streakDays: countStreak(activity),
    week,
  };
}
