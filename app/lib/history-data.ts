import "server-only";
import { dayKey, localDayKey } from "./dates";
import { getDb } from "./db";
import type { HistoryEntry } from "./history";
import { toQuestion } from "./question-store";
import { INTERVALS } from "./review";

// 練習紀錄：送出過作答的題目，加上複習的熟練度和次數。

/** 複習間隔是第幾階：1 天＝0 … 30 天＝4；還沒排複習也是 0 */
function level(interval: number | undefined): number {
  return Math.max(0, INTERVALS.findIndex((d) => d >= (interval ?? 1)));
}

export async function getHistory(): Promise<HistoryEntry[]> {
  const prisma = await getDb();
  const rows = await prisma.question.findMany({
    where: { answer: { is: { draft: { not: null } } } },
    include: {
      reviewSchedules: { select: { lang: true, interval: true } },
      reviewLogs: { orderBy: { reviewedAt: "desc" }, take: 1, select: { reviewedAt: true } },
      _count: { select: { reviewLogs: true } },
    },
  });

  return rows.map((row) => {
    const interval = (lang: string) => row.reviewSchedules.find((s) => s.lang === lang)?.interval;
    const lastReview = row.reviewLogs[0]?.reviewedAt;
    return {
      ...toQuestion(row),
      enLevel: level(interval("en")),
      jaLevel: level(interval("ja")),
      // 最近一次複習的日子；還沒複習過就用出題那天
      lastPracticed: lastReview ? localDayKey(lastReview) : dayKey(row.date),
      // 作答算 1 次，之後每複習一次（英文或日文）加 1
      practiceCount: 1 + row._count.reviewLogs,
    };
  });
}
