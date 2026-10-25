import "server-only";
import { addDays, daysBetween, startOfToday, today } from "./dates";
import { getDb } from "./db";
import { getSettings } from "./profile-store";
import { nextInterval, type Rating, type ReviewItem } from "./review";
import { applyReadingFixes, type RubyPart } from "./ruby";

// 今日複習：從 ReviewSchedule 查到期的題目，複習完寫 ReviewLog、排下次複習日。

/** 今天剩下要複習的項目，和今天已經複習了幾個 */
export async function getReviewQueue(): Promise<{ items: ReviewItem[]; doneToday: number }> {
  const prisma = await getDb();
  const [settings, doneToday] = await Promise.all([
    getSettings(),
    prisma.reviewLog.count({ where: { reviewedAt: { gte: startOfToday() } } }),
  ]);
  // 每日上限包含今天已經複習過的
  const remaining = Math.max(0, settings.reviewCap - doneToday);
  if (remaining === 0) return { items: [], doneToday };

  const rows = await prisma.reviewSchedule.findMany({
    where: {
      dueDate: { lte: today() },
      // 日文翻卡要有日文版才能複習（重新作答後日文版會清掉，要再打開日文版頁面產生）
      OR: [{ lang: "en" }, { lang: "ja", question: { answer: { is: { japaneseJson: { not: null } } } } }],
    },
    // 超過上限時優先保留：間隔短的（剛忘記的）、到期比較久的
    orderBy: [{ interval: "asc" }, { dueDate: "asc" }, { id: "asc" }],
    take: remaining,
    include: { question: { select: { en: true, date: true } } },
  });

  const items: ReviewItem[] = rows.map((row) => {
    const daysAgo = daysBetween(row.question.date, today());
    return {
      id: row.id,
      lang: row.lang === "ja" ? "ja" : "en",
      questionId: row.questionId,
      question: row.question.en,
      daysAgo,
      interval: row.interval,
    };
  });
  // 規格：每天先英文重寫、再日文翻卡（sort 不會打亂同語言內的優先順序）
  items.sort((a, b) => (a.lang === b.lang ? 0 : a.lang === "en" ? -1 : 1));
  return { items, doneToday };
}

/** 日文翻卡的答案（套用使用者改過的讀音） */
export async function getJapaneseAnswer(questionId: number): Promise<RubyPart[]> {
  const prisma = await getDb();
  const answer = await prisma.answer.findUnique({
    where: { questionId },
    select: { japaneseJson: true, readingFixesJson: true },
  });
  if (!answer?.japaneseJson) return [];
  return applyReadingFixes(JSON.parse(answer.japaneseJson), JSON.parse(answer.readingFixesJson ?? "{}"));
}

/** 記錄這次複習的結果，並排下次複習日 */
export async function recordReview(
  scheduleId: number,
  result: Rating,
  english?: { rewrite: string; aiScore: number },
) {
  const prisma = await getDb();
  const schedule = await prisma.reviewSchedule.findUnique({ where: { id: scheduleId } });
  // 還沒到期（例如按兩次）就不重複記錄
  if (!schedule || schedule.dueDate > today()) return;

  const interval = nextInterval(schedule.interval, result);
  // $transaction：兩個寫入一起成功或一起失敗（就是 SQL 的 BEGIN TRAN … COMMIT）
  await prisma.$transaction([
    prisma.reviewLog.create({
      data: {
        questionId: schedule.questionId,
        lang: schedule.lang,
        rewrite: english?.rewrite ?? null,
        aiScore: english?.aiScore ?? null,
        result,
      },
    }),
    prisma.reviewSchedule.update({
      where: { id: scheduleId },
      data: { interval, dueDate: addDays(today(), interval) },
    }),
  ]);
}
