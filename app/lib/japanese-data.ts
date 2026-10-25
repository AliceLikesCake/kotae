// 日文面試版：把 AI 回饋的「面試優化版」翻成日文面試用語，並附上平假名注音。
// 注音由 Claude 翻譯時一起產生（依句意判斷讀音），讀錯可以在頁面上「修改讀音」。

import "server-only";
import { aiEnabled, askJson, MODELS } from "./ai";
import { DEMO_JAPANESE_EN } from "./demo-content";
import { isDemo } from "./demo-session";
import type { Question } from "./practice-data";
import { parseRuby, type RubyPart } from "./ruby";
import { getSavedAnswer, saveJapanese } from "./answer-store";

export type JapaneseVersion = {
  questionId: string;
  /** ai：Claude 翻譯；demo：固定的示範內容 */
  source: "ai" | "demo";
  text: RubyPart[];
  patterns: { pattern: RubyPart[]; explanation: string }[];
};

// ===== 給 Claude 的指示（每次都一樣，會被快取） =====

const SYSTEM = `你是日語面試教練，學生是台灣人，正在準備日本的外商公司工程師職缺面試。
學生會給你一道英文面試題，和一段已經修改好的英文回答。請把回答改寫成日文面試時可以直接說出口的版本，依照指定的 JSON 格式回覆。說明文字一律用「繁體中文」。

翻譯原則：
- 用です・ます的禮貌體，自然地用常見的謙讓語（例如「しております」「いたしました」）。
- 學生的目標是「面試時能自然說出口」：用常見、好念、好記的說法和句型，句子短一點，避免艱深、少見的敬語或書面用語。
- 不要逐字直譯，要像日本人面試時自然說的話。意思要和英文一致，不可以加入英文沒有的事實或數字。

text（日文全文，切成一段段）
- 每段有 text 和 reading 兩個欄位。
- 含漢字的詞：text 只放「連在一起的漢字」，reading 放這些漢字的平假名讀音。送假名（後面的平假名）放到下一段，不要放進同一段。
  例：「行われ」要切成 {text:"行", reading:"おこな"}、{text:"われ", reading:""}。
- 不含漢字的部分（平假名、片假名、標點、英文、數字）：reading 留空字串。
- 讀音要依照句子的意思判斷（例如「三日」是「みっか」，「行」在這裡是「おこな」還是「い」）。
- 把所有段的 text 依序接起來，就是完整的日文。

patterns（重點句型）
- 挑 2 到 3 個這段日文裡，面試時常用、值得背下來的句型。
- pattern 的切法和 text 一樣（漢字標讀音），可以用「〜」代表可替換的部分。
- explanation 用繁體中文一句話說明意思和使用時機。`;

const SEGMENTS = {
  type: "array",
  items: {
    type: "object",
    additionalProperties: false,
    required: ["text", "reading"],
    properties: { text: { type: "string" }, reading: { type: "string" } },
  },
};

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["text", "patterns"],
  properties: {
    text: SEGMENTS,
    patterns: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["pattern", "explanation"],
        properties: { pattern: SEGMENTS, explanation: { type: "string" } },
      },
    },
  },
};

type Segment = { text: string; reading: string };
type AiJapanese = { text: Segment[]; patterns: { pattern: Segment[]; explanation: string }[] };

const KANJI = /[㐀-鿿々〆]/;
const HIRAGANA_ONLY = /^[ぁ-ゟー]+$/;

/** 片假名轉平假名（AI 偶爾會把讀音寫成片假名） */
const toHiragana = (s: string) => s.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));

/** AI 的片段轉成畫面用的格式；讀音不是平假名、或文字裡沒有漢字的，就不標注音 */
function toRubyParts(segments: Segment[]): RubyPart[] {
  const parts: RubyPart[] = [];
  for (const s of segments) {
    if (!s.text) continue;
    const reading = toHiragana(s.reading.trim());
    const part: RubyPart = reading && KANJI.test(s.text) && HIRAGANA_ONLY.test(reading) ? { base: s.text, reading } : s.text;
    const last = parts.at(-1);
    // 相鄰的一般文字合併，畫面比較乾淨
    if (typeof part === "string" && typeof last === "string") parts[parts.length - 1] = last + part;
    else parts.push(part);
  }
  return parts;
}

/** 讀取日文版：有翻譯過就回傳翻譯，沒有就回傳示範內容（不會呼叫 AI） */
export async function getJapanese(question: Question): Promise<JapaneseVersion> {
  return (await getSavedAnswer(question))?.japanese ?? demoJapanese(question);
}

/** 日文版頁面用：這題作答過、還沒翻譯，而且開了 KOTAE_AI_LIVE，就請 AI 翻譯並存起來 */
export async function ensureJapanese(question: Question): Promise<JapaneseVersion> {
  const saved = await getSavedAnswer(question);
  if (saved?.japanese) return saved.japanese;
  if (!saved || saved.feedback.source !== "ai" || !(await aiEnabled())) return demoJapanese(question);

  const result = await askJson<AiJapanese>({
    label: `日文翻譯 ${question.id}`,
    model: MODELS.main,
    system: SYSTEM,
    user: [`【面試題目】\n${question.en}`, `【修改好的英文回答】\n${saved.feedback.polished}`].join("\n\n"),
    schema: SCHEMA,
    effort: "medium",
  });

  const japanese: JapaneseVersion = {
    questionId: question.id,
    source: "ai",
    text: toRubyParts(result.text),
    patterns: result.patterns.map((p) => ({ pattern: toRubyParts(p.pattern), explanation: p.explanation })),
  };
  await saveJapanese(question, japanese);
  return japanese;
}

/** 示範內容：示範模式（訪客）用英文說明的版本，本機沒開 KOTAE_AI_LIVE 時用中文版 */
async function demoJapanese(question: Question): Promise<JapaneseVersion> {
  return { ...((await isDemo()) ? DEMO_JAPANESE_EN : DEMO), questionId: question.id };
}

// ===== 示範內容 =====

const DEMO_TEXT =
  "{現職|げんしょく}では、{電子|でんし}{承認|しょうにん}ワークフローの{開発|かいはつ}を{担当|たんとう}しております。" +
  "{以前|いぜん}は、すべての{承認|しょうにん}が{紙|かみ}の{書類|しょるい}で{行|おこな}われ、{三日|みっか}ほどかかっておりました。" +
  "そこで、{管理職|かんりしょく}がスマートフォンから{承認|しょうにん}できるよう、{業務|ぎょうむ}フローをオンライン{化|か}いたしました。" +
  "その{結果|けっか}、{現在|げんざい}ではほとんどの{申請|しんせい}が{当日中|とうじつちゅう}に{完了|かんりょう}しております。";

const DEMO: JapaneseVersion = {
  questionId: "",
  source: "demo",
  text: parseRuby(DEMO_TEXT),
  patterns: [
    {
      pattern: parseRuby("〜を{担当|たんとう}しております"),
      explanation: "「我負責～」的謙遜說法，比「〜をしています」更適合面試。",
    },
    {
      pattern: parseRuby("その{結果|けっか}、〜"),
      explanation: "「結果～」，用來帶出成果，講經驗題時很好用。",
    },
  ],
};
