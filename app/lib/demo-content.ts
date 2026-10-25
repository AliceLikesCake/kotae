// 示範模式（訪客）用的英文範例內容：示範模式不呼叫 Claude，原本要問 AI 的地方改顯示這些。
// 沒開 KOTAE_AI_LIVE 時（本機開發）用的是各檔案裡的中文示範內容。

import type { Feedback } from "./feedback-data";
import type { JapaneseVersion } from "./japanese-data";
import type { Question } from "./practice-data";
import type { EnglishScore } from "./review-data";
import { scoreToRating } from "./review";
import { parseRuby } from "./ruby";

/** 示範模式送出作答時顯示的回饋（不管寫了什麼都一樣，畫面上會註明） */
export const DEMO_FEEDBACK_EN: Feedback = {
  questionId: "",
  source: "demo",
  score: {
    total: 68,
    content: 3,
    grammar: 2,
    structure: 3,
    summary:
      "The before-and-after contrast is clear and the result has a real number. The main thing to fix is tense: use the past tense for past events.",
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
    "A singular countable noun needs an article: an electronic form system.",
    "Use the past tense for how things used to be: needed, took, moved.",
    "With phones, the preposition is on: on their phones.",
  ],
  interviewer: {
    audience: "Engineer · Japan",
    focus: "Whether you can spot a problem, fix it on your own initiative, and show a visible result.",
    points: [
      { status: "covered", text: "The problem is clear: paper approvals took 3 days." },
      { status: "covered", text: "The result has a concrete number: down to the same day." },
      {
        status: "improve",
        text: "How did you learn what users needed? For example: I interviewed the managers first to understand their pain points.",
      },
      { status: "improve", text: "Mention the platform you used and how many people it affected, so the result carries more weight." },
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
    "Opening with “In my current role” sounds more professional, and ending with “As a result” lands on the change you made, which is what the interviewer most wants to hear.",
};

/** 上面那段優化版的日文面試版（{漢字|讀音} 是注音） */
export const APPROVAL_JA =
  "{現職|げんしょく}では、{電子|でんし}{承認|しょうにん}ワークフローの{開発|かいはつ}を{担当|たんとう}しております。" +
  "{以前|いぜん}は、すべての{承認|しょうにん}が{紙|かみ}の{書類|しょるい}で{行|おこな}われ、{三日|みっか}ほどかかっておりました。" +
  "そこで、{管理職|かんりしょく}がスマートフォンから{承認|しょうにん}できるよう、{業務|ぎょうむ}フローをオンライン{化|か}いたしました。" +
  "その{結果|けっか}、{現在|げんざい}ではほとんどの{申請|しんせい}が{当日中|とうじつちゅう}に{完了|かんりょう}しております。";

export const APPROVAL_PATTERNS = [
  {
    pattern: "〜を{担当|たんとう}しております",
    explanation: "A humble way to say “I'm in charge of ~”. It sounds better in an interview than 〜をしています.",
  },
  {
    pattern: "その{結果|けっか}、〜",
    explanation: "“As a result, ~”. Use it to bring in your results when you answer experience questions.",
  },
];

export const DEMO_JAPANESE_EN: JapaneseVersion = {
  questionId: "",
  source: "demo",
  text: parseRuby(APPROVAL_JA),
  patterns: APPROVAL_PATTERNS.map((p) => ({ pattern: parseRuby(p.pattern), explanation: p.explanation })),
};

const DEMO_SCORE = 82;

/** 示範模式英文複習的評分 */
export const DEMO_SCORE_EN: EnglishScore = {
  source: "demo",
  score: DEMO_SCORE,
  rating: scoreToRating(DEMO_SCORE),
  summary: "You hit every key point, even in your own words. Just two small spots could sound more natural.",
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
    { text: "The problem: paper approvals took 3 days", covered: true },
    { text: "Your action: moved approvals online", covered: true },
    { text: "The result: done on the same day", covered: true },
  ],
  patterns: [
    { good: true, text: "You used `As a result`, which makes the outcome clear" },
    { good: false, text: "Try `Previously` instead of `Before` to sound a bit more formal" },
  ],
};

/** 示範模式的「再問 AI」回覆 */
export const DEMO_FOLLOWUP_EN =
  "(Demo reply) In the demo, follow-up questions aren't sent to Claude. In the real app, Claude answers here using the question, your answer and the feedback, so you can ask things like “What else could I say?”";

/** 示範模式重出題目時用的題目（題型照資料庫存中文，畫面會翻成英文） */
export const DEMO_QUESTIONS_EN: Omit<Question, "id">[] = [
  {
    track: "engineer",
    type: "經驗題",
    topic: "Ownership",
    en: "Tell me about a project you led from start to finish.",
    zh: "請分享一個你從頭到尾負責的專案。",
    hint: "Use STAR: situation, task, action, result. End with a number if you can.",
  },
  {
    track: "engineer",
    type: "技術題",
    topic: "Debugging",
    en: "How do you find the cause of a bug you can't reproduce?",
    zh: "遇到無法重現的錯誤時，你怎麼找出原因？",
    hint: "Walk through your steps: logs, narrowing it down, and how you confirmed the fix.",
  },
  {
    track: "common",
    type: "個人特質",
    topic: "Feedback",
    en: "Tell me about a time you got critical feedback.",
    zh: "請分享一次你收到負面回饋的經驗。",
    hint: "Show what you changed afterwards, not just how you felt.",
  },
];
