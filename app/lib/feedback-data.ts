// AI 回饋：送出作答後，請 Claude 產生文法修正、修改說明、面試官想聽什麼、優化版。

import { aiEnabled, askJson, MODELS } from "./ai";
import { DEMO_FEEDBACK_EN } from "./demo-content";
import { isDemo } from "./demo-session";
import type { Question } from "./practice-data";
import { getSavedAnswer } from "./answer-store";

/** 文法修正：一般文字，或一處刪改（del 刪掉的字、ins 改成的字，可只有其中一個） */
export type CorrectionPart = string | { del?: string; ins?: string };

export type Feedback = {
  questionId: string;
  /** ai：Claude 針對你的回答產生；demo：固定的示範內容 */
  source: "ai" | "demo";
  /** total 0–100；content / grammar / structure 各 1–4 顆 */
  score: { total: number; content: number; grammar: number; structure: number; summary: string };
  corrected: CorrectionPart[];
  notes: string[];
  interviewer: {
    audience: string;
    focus: string;
    points: { status: "covered" | "improve"; text: string }[];
    keywords: { text: string; lang: "en" | "ja" }[];
  };
  polished: string;
  whyBetter: string;
};

const AUDIENCE: Record<Question["track"], string> = {
  engineer: "在日外商 · 工程師",
  common: "在日外商 · 工程師",
};

// ===== 給 Claude 的指示（每次都一樣，會被快取） =====

const SYSTEM = `你是一位英文面試教練，學生是台灣人，正在準備日本的外商公司工程師職缺面試。

學生會給你一道英文面試題，以及他用英文寫的回答。請依照指定的 JSON 格式回覆，所有說明文字一律用「繁體中文」，提到的英文字詞保留英文。

學生的目標是「面試時能自然地說出口」，不是寫出漂亮的文章。所以你建議的英文一律要口語、好念、好記：
- 用常見的單字（大約是英檢中級到中高級的程度），不用艱深、少見或太書面的字。例如用 use 而不用 utilize，用 help 而不用 facilitate。
- 句子短一點，一句講一件事，避免一長串的子句。
- 聽起來像一個人在面試時自然地說話，不像在念稿。

學生是用打字寫下「面試時要說的話」，所以只看說出口時聽得到的部分：
- 大小寫、標點符號、空格、換行一律不修正，也不因此扣分。例如句首沒有大寫、少了逗號或句點、多了空格，都當作沒有錯。
- 要看的是：用字、文法（時態、單複數、介系詞等）、句子怎麼說、表達方式是否自然清楚。

各欄位的規則：

score（評分）
- total：0 到 100 的整數，代表這段回答「拿到真正的面試上」的完成度。請誠實評分，不要灌水：
  90 以上＝可以直接用在面試；75–89＝不錯，小修即可；50–74＝方向對，但內容或文法要再加強；50 以下＝沒有回答到問題，或錯誤多到影響理解。
- content、grammar、structure：各 1 到 4 的整數。
  content（內容）：有沒有回答到問題、有沒有具體的例子或數字、和應徵的職缺有沒有關係。
  grammar（文法）：1＝錯誤多到影響理解；2＝錯誤不少但看得懂；3＝少數小錯；4＝幾乎沒有錯。大小寫、標點、空格不算錯誤。
  structure（結構）：順序是否清楚、開頭和結尾是否明確；經驗題要看有沒有照 STAR（情境、任務、行動、結果）。
- summary：用繁體中文一句話總結這次的表現，先講做得好的地方，再講最需要加強的一點。

corrected（文法修正）
- 把學生的原文切成一段段，依序放進陣列。每段有 text、del、ins 三個欄位，沒有的填空字串。
- 沒有錯的部分：text 放原文，del 和 ins 留空。
- 要修改的部分：text 留空，del 放原文中要刪掉的字，ins 放改成的字。只加字時 del 留空；只刪字時 ins 留空。
- 非常重要：把每段的 text 和 del 依序接起來，必須和學生的原文「完全一樣」（包含空白和標點），不可以改動或省略原文。
- 只修正用字和文法錯誤（拼錯的字也修），讓句子正確即可。大小寫、標點符號、空格維持原文，不要修改。不要為了好聽而改寫，改寫留給 polished。

notes（修改說明）
- 針對 corrected 裡的修改，用繁體中文逐條說明為什麼要改，最多 5 條，相同類型的錯誤合併成一條。
- 沒有需要修改的地方時，回傳空陣列。

focus（這題在考什麼）
- 一句話說明面試官問這題想確認什麼能力。

points（已講到 / 可加強）
- 2 到 5 條。covered 是回答中已經做到的好地方，improve 是可以加強的地方。
- improve 要具體，可以附上一句可以直接用的英文例句。

keywords（產業關鍵字）
- 3 到 6 個這題適合用、而且口說時常用的英文關鍵字或片語，lang 填 "en"。挑面試官聽得懂、學生也念得出來的，不要挑冷僻的術語。
- 可以加 1 個相關的日文商業用語，lang 填 "ja"。

polished（面試優化版）
- 改寫成自然、口語、適合面試時直接說出口的英文，長度大約和原文相當，最多 1.5 倍。
- 遵守上面「口語、好念、好記」的原則：盡量保留學生原本用的字，只換掉錯的或不自然的地方，讓學生容易記住。
- 只能使用學生原文提到的事實，不可以編造數字、公司名稱或經歷。想補充的細節放在 points 的 improve，不要寫進 polished。

whyBetter（為什麼更好）
- 用繁體中文一到兩句話，說明優化版好在哪裡，例如哪個說法比較自然、比較好記。`;

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["score", "corrected", "notes", "focus", "points", "keywords", "polished", "whyBetter"],
  properties: {
    score: {
      type: "object",
      additionalProperties: false,
      required: ["total", "content", "grammar", "structure", "summary"],
      properties: {
        total: { type: "integer" },
        content: { type: "integer" },
        grammar: { type: "integer" },
        structure: { type: "integer" },
        summary: { type: "string" },
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
    notes: { type: "array", items: { type: "string" } },
    focus: { type: "string" },
    points: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["status", "text"],
        properties: { status: { type: "string", enum: ["covered", "improve"] }, text: { type: "string" } },
      },
    },
    keywords: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["text", "lang"],
        properties: { text: { type: "string" }, lang: { type: "string", enum: ["en", "ja"] } },
      },
    },
    polished: { type: "string" },
    whyBetter: { type: "string" },
  },
};

type AiFeedback = {
  score: Feedback["score"];
  corrected: { text: string; del: string; ins: string }[];
  notes: string[];
  focus: string;
  points: Feedback["interviewer"]["points"];
  keywords: Feedback["interviewer"]["keywords"];
  polished: string;
  whyBetter: string;
};

/** 把 text 和 del 接起來，比對是不是學生的原文（空白差異不計） */
export function matchesOriginal(parts: { text: string; del: string }[], answer: string) {
  const squash = (s: string) => s.replace(/\s+/g, " ").trim();
  return squash(parts.map((p) => p.text + p.del).join("")) === squash(answer);
}

/** 請 Claude 產生回饋；沒開 KOTAE_AI_LIVE 時回傳示範內容 */
export async function generateFeedback(question: Question, answer: string, bio: string): Promise<Feedback> {
  if (!(await aiEnabled())) return demoFeedback(question);

  const result = await askJson<AiFeedback>({
    label: `AI 回饋 ${question.id}`,
    model: MODELS.main,
    system: SYSTEM,
    user: [
      `【我的背景】\n${bio || "（未填寫）"}`,
      `【應徵的職缺】\n${AUDIENCE[question.track]}`,
      `【面試題目】\n${question.en}`,
      `【我的回答】\n${answer}`,
    ].join("\n\n"),
    schema: SCHEMA,
    effort: "medium",
  });

  if (!matchesOriginal(result.corrected, answer)) {
    console.warn(`[AI] AI 回饋 ${question.id}：文法修正接起來和原文不一致，畫面上的原文可能有出入`);
  }

  // JSON Schema 不能限制數字範圍，所以在這裡夾到合法範圍內
  const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, Math.round(n)));
  const { score } = result;

  return {
    questionId: question.id,
    source: "ai",
    score: {
      total: clamp(score.total, 0, 100),
      content: clamp(score.content, 1, 4),
      grammar: clamp(score.grammar, 1, 4),
      structure: clamp(score.structure, 1, 4),
      summary: score.summary,
    },
    corrected: result.corrected.map((p) => (p.del || p.ins ? { del: p.del || undefined, ins: p.ins || undefined } : p.text)),
    notes: result.notes,
    interviewer: {
      audience: AUDIENCE[question.track],
      focus: result.focus,
      points: result.points,
      keywords: result.keywords,
    },
    polished: result.polished,
    whyBetter: result.whyBetter,
  };
}

/** 回饋頁讀取：有作答過就回傳那份回饋，沒有就回傳示範內容 */
export async function getFeedback(question: Question): Promise<Feedback> {
  return (await getSavedAnswer(question))?.feedback ?? demoFeedback(question);
}

/** 示範內容：示範模式（訪客）用英文版，本機沒開 KOTAE_AI_LIVE 時用中文版 */
async function demoFeedback(question: Question): Promise<Feedback> {
  return { ...((await isDemo()) ? DEMO_FEEDBACK_EN : DEMO), questionId: question.id };
}

// ===== 示範內容（沒開 KOTAE_AI_LIVE，或這題還沒作答時顯示） =====

const DEMO: Feedback = {
  questionId: "",
  source: "demo",
  score: {
    total: 68,
    content: 3,
    grammar: 2,
    structure: 3,
    summary: "改善前後的對比很清楚，成果也有具體數字；最需要加強的是時態，過去的事要用過去式。",
  },
  corrected: [
    "At my current company, I develop ",
    { ins: "an" },
    " electronic form system for approval ",
    { del: "process", ins: "processes" },
    ". Before, all ",
    { del: "approval need", ins: "approvals needed" },
    " paper and ",
    { del: "it take", ins: "took" },
    " about 3 days. I ",
    { del: "make", ins: "moved" },
    " the flow online, so ",
    { del: "manager", ins: "managers" },
    " can approve ",
    { del: "in phone", ins: "on their phones" },
    ". Now most ",
    { del: "request finish in", ins: "requests are completed on the" },
    " same day.",
  ],
  notes: [
    "可數名詞單數前要加冠詞，所以是 an electronic form system。",
    "描述以前的狀況要用過去式：needed、took、moved。",
    "「用手機」的介系詞是 on，說 on their phones。",
  ],
  interviewer: {
    audience: "在日外商 · 工程師",
    focus: "你能不能發現問題、主動改善，並帶來看得見的成果。",
    points: [
      { status: "covered", text: "改善前的問題很清楚：紙本簽核要 3 天" },
      { status: "covered", text: "成果有具體數字：縮短到當天完成" },
      {
        status: "improve",
        text: "你怎麼了解使用者需求？例如補一句 I interviewed the managers first to understand their pain points.",
      },
      { status: "improve", text: "提到用了什麼平台或技術，以及影響多少人，讓成果更有份量。" },
    ],
    keywords: [
      { text: "streamline", lang: "en" },
      { text: "stakeholders", lang: "en" },
      { text: "lead time", lang: "en" },
      { text: "ownership", lang: "en" },
      { text: "業務効率化", lang: "ja" },
    ],
  },
  polished:
    "In my current role, I build electronic approval workflows. Previously, every approval relied on paper forms and took about three days. I redesigned the process as an online workflow so managers could approve requests from their phones. As a result, most requests are now completed on the same day.",
  whyBetter:
    "用 In my current role 開頭更專業；最後用 As a result 點出成果，面試官最想聽的是你帶來的改變。",
};
