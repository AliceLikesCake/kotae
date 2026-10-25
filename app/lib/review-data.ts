import "server-only";
import { aiEnabled, askJson, MODELS } from "./ai";
import { DEMO_SCORE_EN } from "./demo-content";
import { isDemo } from "./demo-session";
import { getDb } from "./db";
import { matchesOriginal, type CorrectionPart } from "./feedback-data";
import { scoreToRating, type Rating } from "./review";

// 英文複習的評分：不看答案重寫一次，由 Claude Haiku 依「重點是否講到、文法、好句型」評分。

export type EnglishScore = {
  /** ai：Claude 評分；demo：固定的示範內容 */
  source: "ai" | "demo";
  score: number;
  rating: Rating;
  summary: string;
  corrected: CorrectionPart[];
  keyPoints: { text: string; covered: boolean }[];
  /** 文字裡用 `反引號` 包起來的是英文 */
  patterns: { good: boolean; text: string }[];
};

// ===== 給 Claude 的指示（每次都一樣） =====

const SYSTEM = `你是英文面試教練，學生是台灣人，正在複習以前練習過的英文面試題。
學生會給你：面試題目、之前整理好的「參考回答」，以及這次「不看答案、憑記憶重寫」的回答。請依照指定的 JSON 格式評分，所有說明文字一律用「繁體中文」，提到的英文字詞保留英文。

複習的目的是確認學生能不能自己把重點講出來，不是背誦。所以：
- 不需要和參考回答一字不差。換了說法、順序不同，只要意思對就算講到。
- 參考回答以外、合理的內容也可以，不扣分。

學生是用打字寫下「面試時要說的話」，所以只看說出口時聽得到的部分：
- 大小寫、標點符號、空格、換行一律不修正，也不因此扣分。例如句首沒有大寫、少了逗號或句點、多了空格，都當作沒有錯。
- 要看的是：用字、文法（時態、單複數、介系詞等）、句子怎麼說、表達方式是否自然清楚。

各欄位的規則：

score（分數）
- 0 到 100 的整數，代表這次能不能把這題答好。請誠實評分，不要灌水：
  80 以上＝重點大致都講到，文法沒有大問題；50–79＝只講到一部分重點，或文法錯誤多到影響理解；50 以下＝大部分重點沒講到，或答非所問。

summary（總結）
- 一句話，先講做得好的地方，再講最需要加強的一點。

keyPoints（重點檢查）
- 從參考回答整理出 2 到 4 個重點，用繁體中文寫，例如「成果：縮短到當天完成」。
- 依序標出這次重寫有沒有講到（covered）。

corrected（文法修正）
- 把這次重寫的原文切成一段段，依序放進陣列。每段有 text、del、ins 三個欄位，沒有的填空字串。
- 沒有錯的部分：text 放原文，del 和 ins 留空。
- 要修改的部分：text 留空，del 放原文中要刪掉的字，ins 放改成的字。只加字時 del 留空；只刪字時 ins 留空。
- 非常重要：把每段的 text 和 del 依序接起來，必須和這次重寫的原文「完全一樣」（包含空白和標點）。
- 只修正用字和文法錯誤（拼錯的字也修）。大小寫、標點符號、空格維持原文，不要修改。不要為了好聽而改寫。

patterns（好句型）
- 1 到 3 條關於句型的觀察。good 為 true 是這次用得好的句型，false 是可以說得更自然的地方。
- 英文句型或字詞用反引號包起來，例如：有用到 \`As a result\`，成果講得很清楚。
- 建議的英文要口語、好念，用常見的單字，聽起來像面試時自然說話。`;

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["score", "summary", "keyPoints", "corrected", "patterns"],
  properties: {
    score: { type: "integer" },
    summary: { type: "string" },
    keyPoints: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["text", "covered"],
        properties: { text: { type: "string" }, covered: { type: "boolean" } },
      },
    },
    corrected: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["text", "del", "ins"],
        properties: { text: { type: "string" }, del: { type: "string" }, ins: { type: "string" } },
      },
    },
    patterns: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["good", "text"],
        properties: { good: { type: "boolean" }, text: { type: "string" } },
      },
    },
  },
};

type AiScore = {
  score: number;
  summary: string;
  keyPoints: EnglishScore["keyPoints"];
  corrected: { text: string; del: string; ins: string }[];
  patterns: EnglishScore["patterns"];
};

/** 請 Claude Haiku 評分；沒開 KOTAE_AI_LIVE，或這題沒有參考回答時，回傳示範內容 */
export async function scoreRewrite(scheduleId: number, rewrite: string): Promise<EnglishScore> {
  const prisma = await getDb();
  const schedule = await prisma.reviewSchedule.findUnique({
    where: { id: scheduleId },
    select: { question: { select: { en: true, answer: { select: { polished: true } } } } },
  });
  const reference = schedule?.question.answer?.polished;
  if (await isDemo()) return DEMO_SCORE_EN;
  if (!(await aiEnabled()) || !schedule || !reference) return DEMO;

  const result = await askJson<AiScore>({
    label: `英文複習評分 ${scheduleId}`,
    model: MODELS.light,
    system: SYSTEM,
    user: [`【面試題目】\n${schedule.question.en}`, `【參考回答】\n${reference}`, `【這次重寫】\n${rewrite}`].join("\n\n"),
    schema: SCHEMA,
    maxTokens: 4000,
  });

  if (!matchesOriginal(result.corrected, rewrite)) {
    console.warn(`[AI] 英文複習評分 ${scheduleId}：文法修正接起來和原文不一致，畫面上的原文可能有出入`);
  }

  // JSON Schema 不能限制數字範圍，所以在這裡夾到 0–100
  const score = Math.min(100, Math.max(0, Math.round(result.score)));
  return {
    source: "ai",
    score,
    rating: scoreToRating(score),
    summary: result.summary,
    corrected: result.corrected.map((p) => (p.del || p.ins ? { del: p.del || undefined, ins: p.ins || undefined } : p.text)),
    keyPoints: result.keyPoints,
    patterns: result.patterns,
  };
}

// ===== 示範內容（沒開 KOTAE_AI_LIVE，或這題沒有參考回答時顯示） =====

const DEMO_SCORE = 82;

const DEMO: EnglishScore = {
  source: "demo",
  score: DEMO_SCORE,
  rating: scoreToRating(DEMO_SCORE),
  summary: "重點都講到了，換了說法也沒關係。只有兩個小地方可以更自然。",
  corrected: [
    "In my current role, I build electronic approval workflows. Before, every approval used paper and took about three days. I ",
    { del: "changed the process to online", ins: "moved the process online" },
    " so managers can approve from ",
    { ins: "their" },
    " phones. As a result, most requests ",
    { del: "finish", ins: "are completed" },
    " on the same day.",
  ],
  keyPoints: [
    { text: "改善前的問題：紙本簽核要 3 天", covered: true },
    { text: "你的行動：改成線上簽核流程", covered: true },
    { text: "成果：縮短到當天完成", covered: true },
  ],
  patterns: [
    { good: true, text: "有用到 `As a result`，成果講得很清楚" },
    { good: false, text: "可以把 Before 換成 `Previously`，面試聽起來更正式" },
  ],
};
