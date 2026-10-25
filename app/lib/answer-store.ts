import "server-only";
import { addDays, today } from "./dates";
import { getDb } from "./db";
import type { Feedback } from "./feedback-data";
import type { JapaneseVersion } from "./japanese-data";
import type { Question } from "./practice-data";
import type { ReadingFixes } from "./ruby";

// 作答、AI 回饋、日文版存在 Answer 資料表（每題一筆，重新作答會覆蓋）。

export type SavedAnswer = { answer: string; feedback: Feedback; japanese?: JapaneseVersion };

/** 畫面用的題目 id 是字串，資料庫是數字 */
const dbId = (question: Question) => Number(question.id);

/** 讀取還沒送出的草稿；沒有就回傳空字串 */
export async function getDraft(question: Question): Promise<string> {
  const prisma = await getDb();
  const answer = await prisma.answer.findUnique({ where: { questionId: dbId(question) }, select: { pendingDraft: true } });
  return answer?.pendingDraft ?? "";
}

/** 存草稿；空白就清掉 */
export async function saveDraft(question: Question, text: string) {
  const prisma = await getDb();
  const questionId = dbId(question);
  if (!text.trim()) {
    await prisma.answer.updateMany({ where: { questionId }, data: { pendingDraft: null } });
    return;
  }
  await prisma.answer.upsert({
    where: { questionId },
    create: { questionId, pendingDraft: text },
    update: { pendingDraft: text },
  });
}

/** 存作答和回饋，並清掉草稿。重新作答時，舊的日文版和讀音修正會一起清掉（因為優化版變了） */
export async function saveAnswer(question: Question, answer: string, feedback: Feedback) {
  const prisma = await getDb();
  const questionId = dbId(question);
  const data = {
    draft: answer,
    pendingDraft: null,
    feedbackSource: feedback.source,
    scoreTotal: feedback.score.total,
    scoreJson: JSON.stringify(feedback.score),
    correctedJson: JSON.stringify(feedback.corrected),
    notesJson: JSON.stringify(feedback.notes),
    interviewerJson: JSON.stringify(feedback.interviewer),
    polished: feedback.polished,
    whyBetter: feedback.whyBetter,
    japaneseSource: null,
    japaneseJson: null,
    patternsJson: null,
    readingFixesJson: null,
  };
  // upsert：有這題的作答就 UPDATE，沒有就 INSERT（類似 SQL 的 MERGE）
  await prisma.answer.upsert({ where: { questionId }, create: { questionId, ...data }, update: data });
  await ensureSchedule(questionId, "en");
}

/** 排進複習（明天第一次複習）。已經排過的不動，重新作答不會打亂原本的排程 */
async function ensureSchedule(questionId: number, lang: "en" | "ja") {
  const prisma = await getDb();
  await prisma.reviewSchedule.upsert({
    where: { questionId_lang: { questionId, lang } },
    create: { questionId, lang, dueDate: addDays(today(), 1), interval: 1 },
    update: {},
  });
}

export async function saveJapanese(question: Question, japanese: JapaneseVersion) {
  const prisma = await getDb();
  const questionId = dbId(question);
  // updateMany：沒有符合的資料時不會出錯（update 找不到會丟錯誤）
  await prisma.answer.updateMany({
    where: { questionId },
    data: {
      japaneseSource: japanese.source,
      japaneseJson: JSON.stringify(japanese.text),
      patternsJson: JSON.stringify(japanese.patterns),
    },
  });
  if (japanese.source === "ai") await ensureSchedule(questionId, "ja");
}

export async function getSavedAnswer(question: Question): Promise<SavedAnswer | undefined> {
  const prisma = await getDb();
  const saved = await prisma.answer.findUnique({ where: { questionId: dbId(question) } });
  if (!saved?.feedbackSource || saved.draft === null) return undefined;

  const feedback: Feedback = {
    questionId: question.id,
    source: saved.feedbackSource as Feedback["source"],
    score: JSON.parse(saved.scoreJson ?? "null"),
    corrected: JSON.parse(saved.correctedJson ?? "[]"),
    notes: JSON.parse(saved.notesJson ?? "[]"),
    interviewer: JSON.parse(saved.interviewerJson ?? "null"),
    polished: saved.polished ?? "",
    whyBetter: saved.whyBetter ?? "",
  };
  const japanese: JapaneseVersion | undefined = saved.japaneseJson
    ? {
        questionId: question.id,
        source: saved.japaneseSource as JapaneseVersion["source"],
        text: JSON.parse(saved.japaneseJson),
        patterns: JSON.parse(saved.patternsJson ?? "[]"),
      }
    : undefined;
  return { answer: saved.draft, feedback, japanese };
}


export async function getReadingFixes(question: Question): Promise<ReadingFixes> {
  const prisma = await getDb();
  const answer = await prisma.answer.findUnique({
    where: { questionId: dbId(question) },
    select: { readingFixesJson: true },
  });
  const json = answer?.readingFixesJson;
  return json ? JSON.parse(json) : {};
}

/** 存讀音修正；這題還沒作答（看的是示範內容）就不存 */
export async function saveReadingFixes(question: Question, fixes: ReadingFixes) {
  const prisma = await getDb();
  const questionId = dbId(question);
  const json = Object.keys(fixes).length > 0 ? JSON.stringify(fixes) : null;
  await prisma.answer.updateMany({ where: { questionId }, data: { readingFixesJson: json } });
}
