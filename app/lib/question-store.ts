import "server-only";
import { aiEnabled, askJson, MODELS } from "./ai";
import { DEMO_QUESTIONS_EN } from "./demo-content";
import { isDemo } from "./demo-session";
import { today } from "./dates";
import { getDb } from "./db";
import { DEMO_QUESTIONS, QUESTION_TYPES, type Question, type QuestionType, type Track } from "./practice-data";
import { getSettings } from "./profile-store";

// 題目：每天第一次打開作答頁時，請 AI 依設定的題數出「在日外商工程師」的面試題，存進 Question 資料表。

type QuestionRow = { id: number; track: string; type: string; topic: string; en: string; zh: string; hint: string };

export function toQuestion(row: QuestionRow): Question {
  return {
    id: String(row.id),
    track: row.track === "engineer" ? "engineer" : "common",
    type: QUESTION_TYPES.find((t) => t === row.type) ?? "情境題",
    topic: row.topic,
    en: row.en,
    zh: row.zh,
    hint: row.hint,
  };
}

/** 網址上的 ?q=7 找題目；不是數字或找不到就回傳 undefined */
export async function findQuestion(id: string | string[] | undefined): Promise<Question | undefined> {
  const prisma = await getDb();
  const n = typeof id === "string" && /^\d+$/.test(id) ? Number(id) : NaN;
  if (!Number.isSafeInteger(n)) return undefined;
  const row = await prisma.question.findUnique({ where: { id: n } });
  return row ? toQuestion(row) : undefined;
}

/** 今天的題目（不會出新題） */
export async function getTodayQuestions(): Promise<Question[]> {
  const prisma = await getDb();
  const rows = await prisma.question.findMany({ where: { date: today() }, orderBy: { id: "asc" } });
  return rows.map(toQuestion);
}

/** 這些題目裡，哪些已經送出作答（有 AI 回饋） */
export async function getAnsweredIds(questions: Question[]): Promise<Set<string>> {
  const prisma = await getDb();
  const rows = await prisma.answer.findMany({
    where: { questionId: { in: questions.map((q) => Number(q.id)) }, draft: { not: null } },
    select: { questionId: true },
  });
  return new Set(rows.map((r) => String(r.questionId)));
}

// 同一時間只出一次題（例如兩個分頁同時打開），放在 globalThis 才不會因為重新載入程式而失效
const globalForLock = globalThis as { kotaeQuestionLock?: Promise<unknown> };

async function withLock<T>(task: () => Promise<T>): Promise<T> {
  const previous = globalForLock.kotaeQuestionLock ?? Promise.resolve();
  const current = previous.catch(() => {}).then(task);
  globalForLock.kotaeQuestionLock = current;
  return current;
}

/** 今天的題目；今天還沒出過題就先請 AI 出題（設定的題數隔天才生效） */
export async function ensureTodayQuestions(): Promise<Question[]> {
  return withLock(async () => {
    const existing = await getTodayQuestions();
    if (existing.length > 0) return existing;

    const settings = await getSettings();
    await createQuestions(settings.dailyTotal, settings.bio);
    return getTodayQuestions();
  });
}

/** 今天可以重出的題目：還沒送出作答、也沒寫草稿的 */
export async function getReplaceableTodayIds(): Promise<number[]> {
  const prisma = await getDb();
  const rows = await prisma.question.findMany({
    where: {
      date: today(),
      OR: [{ answer: { is: null } }, { answer: { is: { draft: null, pendingDraft: null } } }],
    },
    select: { id: true },
  });
  return rows.map((r) => r.id);
}

/** 改了設定後，用新設定重出今天還沒做的題目（已作答或寫了草稿的保留） */
export async function regenerateTodayQuestions(): Promise<void> {
  const prisma = await getDb();
  await withLock(async () => {
    const replaceable = await getReplaceableTodayIds();
    if (replaceable.length === 0) return;

    const [settings, todays] = await Promise.all([getSettings(), getTodayQuestions()]);
    // 保留的題目先算進去，剩下的名額出新題
    const count = Math.max(0, settings.dailyTotal - (todays.length - replaceable.length));

    // 先出新題再刪舊題：出題失敗時，今天的題目不會不見
    if (count > 0) await createQuestions(count, settings.bio);
    // 沒作答的題目底下只可能有空的 Answer，會跟著刪掉（Cascade）
    await prisma.question.deleteMany({ where: { id: { in: replaceable } } });
  });
}

/** 今天的題目都做完後，「再出一題」 */
export async function addExtraQuestion(): Promise<void> {
  await withLock(async () => {
    const settings = await getSettings();
    await createQuestions(1, settings.bio);
  });
}

async function createQuestions(count: number, bio: string) {
  const prisma = await getDb();
  const recent = await prisma.question.findMany({ orderBy: { id: "desc" }, take: RECENT_LIMIT, select: { en: true } });
  const recentEn = recent.map((r) => r.en);
  const questions = (await aiEnabled())
    ? await generateWithAi(count, bio, recentEn)
    : pickDemo((await isDemo()) ? DEMO_QUESTIONS_EN : DEMO_QUESTIONS, count, recentEn);
  const date = today();
  // createMany：一次 INSERT 多筆
  await prisma.question.createMany({ data: questions.map((q) => ({ ...q, date })) });
}

/** 出題時附上最近幾題，避免重複 */
const RECENT_LIMIT = 60;

// ===== AI 出題 =====

const SYSTEM = `你是面試官兼面試教練，要幫一位台灣學生出今天的英文面試練習題。學生正在準備日本的外商公司工程師職缺面試。

請依照指定的 JSON 格式出題。各欄位的規則：
- en：英文面試題，用真的面試官會問的問法，口語、自然，大多是一句話。
- zh：這題的繁體中文意思。
- hint：一句繁體中文的作答提示，告訴學生可以怎麼組織回答，例如「用 STAR 結構回答，情境 → 任務 → 行動 → 結果」。
- track：engineer＝針對工程師職缺的題目；common＝任何職缺面試都會問的通用題（例如自我介紹、反問題）。
- type：只能是 ${QUESTION_TYPES.join("、")} 其中之一。
- topic：2 到 6 個字的繁體中文主題，例如 流程改善、需求溝通、團隊合作、跨文化溝通、學習能力、公司研究、壓力管理。

出題原則：
- 同一批題目的題型和主題要多樣，不要重複。
- 不要和「最近出過的題目」重複，也不要只是換句話說。
- 參考學生的背景，出他實際可能被問到、也有經驗可以回答的題目。
- 難度像真正的第一、二輪面試，不要太冷僻。`;

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["questions"],
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["track", "type", "topic", "en", "zh", "hint"],
        properties: {
          track: { type: "string", enum: ["engineer", "common"] },
          type: { type: "string", enum: [...QUESTION_TYPES] },
          topic: { type: "string" },
          en: { type: "string" },
          zh: { type: "string" },
          hint: { type: "string" },
        },
      },
    },
  },
};

type NewQuestion = { track: Track; type: QuestionType; topic: string; en: string; zh: string; hint: string };

async function generateWithAi(total: number, bio: string, recentEn: string[]): Promise<NewQuestion[]> {
  const result = await askJson<{ questions: NewQuestion[] }>({
    label: `出題 ${total} 題`,
    model: MODELS.main,
    system: SYSTEM,
    user: [
      `【我的背景】\n${bio || "（未填寫）"}`,
      `【今天要出的題目】\n共 ${total} 題。`,
      `【最近出過的題目】\n${recentEn.length ? recentEn.map((en) => `- ${en}`).join("\n") : "（還沒有）"}`,
    ].join("\n\n"),
    schema: SCHEMA,
    effort: "medium",
  });
  return result.questions.slice(0, total);
}

// ===== 示範題目（沒開 KOTAE_AI_LIVE 時） =====

/** 從示範題目挑，先挑最近沒出過的；不夠就重複使用 */
function pickDemo(pool: Omit<Question, "id">[], count: number, recentEn: string[]): NewQuestion[] {
  const fresh = pool.filter((q) => !recentEn.includes(q.en));
  // Set 去掉重複的同一題（fresh 裡的題目也在 pool 裡）
  return [...new Set([...fresh, ...pool])].slice(0, count);
}
