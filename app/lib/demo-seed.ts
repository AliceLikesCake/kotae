import "server-only";
import { addDays, today } from "./dates";
import { demoClient } from "./db";
import { APPROVAL_JA, APPROVAL_PATTERNS, DEMO_FEEDBACK_EN } from "./demo-content";
import type { CorrectionPart, Feedback } from "./feedback-data";
import type { QuestionType, Track } from "./practice-data";
import type { Rating } from "./review";
import { parseRuby } from "./ruby";

// 示範模式的範例資料：放在 demo schema，訪客按「Try the demo」時準備好。
// 日期都以「今天」為基準，所以不管哪天打開，看起來都是最近在練習的樣子。
// 內容是英文（示範模式介面固定英文），題型照資料庫的格式存中文。

type SeedAnswer = {
  feedback: Omit<Feedback, "questionId" | "source" | "interviewer"> & {
    interviewer: Omit<Feedback["interviewer"], "audience">;
  };
  /** 日文版，{漢字|讀音} 是注音 */
  japanese: string;
  patterns: { pattern: string; explanation: string }[];
};

type SeedQuestion = {
  /** 幾天前出的題（0＝今天） */
  daysAgo: number;
  track: Track;
  type: QuestionType;
  topic: string;
  en: string;
  zh: string;
  hint: string;
  answer?: SeedAnswer;
  /** 複習排程：dueIn＝幾天後到期（0＝今天要複習） */
  schedules?: { lang: "en" | "ja"; interval: number; dueIn: number }[];
  /** 複習紀錄 */
  logs?: { lang: "en" | "ja"; daysAgo: number; result: Rating; aiScore?: number }[];
};

const APPROVAL = DEMO_FEEDBACK_EN;

const QUESTIONS: SeedQuestion[] = [
  {
    daysAgo: 20,
    track: "engineer",
    type: "個人特質",
    topic: "Time management",
    en: "How do you handle tight deadlines?",
    zh: "你如何面對很趕的截止期限？",
    hint: "Explain how you set priorities, then give an example.",
    answer: {
      feedback: {
        score: {
          total: 86,
          content: 4,
          grammar: 3,
          structure: 4,
          summary: "A clear process and a real example. Only a few small grammar slips.",
        },
        corrected: [
          "First I list all the tasks and ",
          { del: "decide", ins: "decide on" },
          " the priority with my manager. Then I ",
          { del: "focus", ins: "focus on" },
          " the most important ",
          { del: "part", ins: "parts" },
          " and tell the team early if something ",
          { del: "will late", ins: "will be late" },
          ". Last month we had a release in one week, and we ",
          { del: "finish", ins: "finished" },
          " on time because we moved two small features to the next release.",
        ],
        notes: [
          "Decide on and focus on need the preposition on.",
          "Late is an adjective, so say will be late.",
          "Use the past tense for last month: finished.",
        ],
        interviewer: {
          focus: "Whether you stay calm, set priorities, and speak up early under pressure.",
          points: [
            { status: "covered", text: "Agreeing on priorities with your manager shows good judgment." },
            { status: "covered", text: "Telling the team early shows you flag risks." },
            { status: "covered", text: "The example ends with a clear result: on time." },
            { status: "improve", text: "Say how you kept quality up, e.g. We still reviewed every change." },
          ],
          keywords: [
            { text: "prioritize", lang: "en" },
            { text: "scope", lang: "en" },
            { text: "heads-up", lang: "en" },
            { text: "deliver", lang: "en" },
            { text: "優先順位", lang: "ja" },
          ],
        },
        polished:
          "First, I list all the tasks and agree on priorities with my manager. Then I focus on the most important parts and give the team a heads-up early if anything might be late. Last month we had a release in one week. We finished on time because we moved two small features to the next release.",
        whyBetter:
          "“Give the team a heads-up” is natural spoken English, and the short example right after makes the answer believable.",
      },
      japanese:
        "まず、すべてのタスクを{洗|あら}い{出|だ}し、{上司|じょうし}と{優先|ゆうせん}{順位|じゅんい}を{決|き}めます。" +
        "そのうえで{重要|じゅうよう}な{部分|ぶぶん}に{集中|しゅうちゅう}し、{遅|おく}れそうなときは{早|はや}めにチームに{共有|きょうゆう}します。" +
        "{先月|せんげつ}は1{週間|しゅうかん}でリリースする{必要|ひつよう}がありましたが、{小|ちい}さな{機能|きのう}を{次|つぎ}のリリースに{回|まわ}すことで、{期限|きげん}{内|ない}に{完了|かんりょう}しました。",
      patterns: [
        { pattern: "{早|はや}めに〜します", explanation: "“I ~ early.” Shows you deal with risks before they grow." },
        { pattern: "〜ことで、〜しました", explanation: "“By ~, we ~.” Links what you did to the result." },
      ],
    },
    schedules: [
      { lang: "en", interval: 14, dueIn: 6 },
      { lang: "ja", interval: 14, dueIn: 9 },
    ],
    logs: [
      { lang: "en", daysAgo: 19, result: "remembered", aiScore: 82 },
      { lang: "ja", daysAgo: 18, result: "fuzzy" },
      { lang: "en", daysAgo: 16, result: "remembered", aiScore: 88 },
      { lang: "ja", daysAgo: 15, result: "remembered" },
      { lang: "en", daysAgo: 9, result: "remembered", aiScore: 91 },
      { lang: "ja", daysAgo: 8, result: "remembered" },
    ],
  },
  {
    daysAgo: 9,
    track: "engineer",
    type: "經驗題",
    topic: "Process improvement",
    en: "Tell me about a time you improved a business process at work.",
    zh: "請分享一次你在工作中改善業務流程的經驗。",
    hint: "Use STAR: situation, task, action, result.",
    answer: {
      feedback: {
        score: APPROVAL.score,
        corrected: APPROVAL.corrected,
        notes: APPROVAL.notes,
        interviewer: {
          focus: APPROVAL.interviewer.focus,
          points: APPROVAL.interviewer.points,
          keywords: APPROVAL.interviewer.keywords,
        },
        polished: APPROVAL.polished,
        whyBetter: APPROVAL.whyBetter,
      },
      japanese: APPROVAL_JA,
      patterns: APPROVAL_PATTERNS,
    },
    schedules: [
      { lang: "en", interval: 1, dueIn: 0 },
      { lang: "ja", interval: 3, dueIn: 0 },
    ],
    logs: [
      { lang: "en", daysAgo: 8, result: "remembered", aiScore: 80 },
      { lang: "ja", daysAgo: 7, result: "fuzzy" },
      { lang: "en", daysAgo: 4, result: "forgot", aiScore: 45 },
    ],
  },
  {
    daysAgo: 6,
    track: "engineer",
    type: "技術題",
    topic: "Databases",
    en: "How do you make sure a database query stays fast as the data grows?",
    zh: "資料量變大時，你如何確保資料庫查詢維持效能？",
    hint: "Give a real example: indexes, execution plans, rewriting queries.",
    answer: {
      feedback: {
        score: {
          total: 74,
          content: 3,
          grammar: 2,
          structure: 3,
          summary: "A strong, concrete example with a clear before-and-after number. Watch your verb tenses and articles.",
        },
        corrected: [
          "When data ",
          { del: "grow", ins: "grows" },
          ", I check the execution plan first to see which part is slow. Usually I add ",
          { ins: "an" },
          " index on the column ",
          { del: "that use", ins: "that is used" },
          " in ",
          { ins: "the" },
          " where condition. In my company, one report query ",
          { del: "take", ins: "took" },
          " 40 seconds. After I ",
          { del: "add", ins: "added an" },
          " index and ",
          { del: "rewrite", ins: "rewrote" },
          " the join, it ",
          { del: "become", ins: "went down to" },
          " 2 seconds. I also avoid select star and only get the ",
          { del: "column", ins: "columns" },
          " I need.",
        ],
        notes: [
          "Data is usually uncountable, so say data grows.",
          "Tell the example in the past tense: took, added, rewrote.",
          "Add articles: an index, the where condition.",
        ],
        interviewer: {
          focus: "Whether you understand query performance in practice, not just in theory.",
          points: [
            { status: "covered", text: "Starting with the execution plan shows a real process." },
            { status: "covered", text: "40 seconds → 2 seconds is a strong, concrete result." },
            {
              status: "improve",
              text: "Show you think about trade-offs, e.g. I also checked that inserts didn't get slower.",
            },
          ],
          keywords: [
            { text: "execution plan", lang: "en" },
            { text: "index", lang: "en" },
            { text: "bottleneck", lang: "en" },
            { text: "trade-off", lang: "en" },
            { text: "実行計画", lang: "ja" },
          ],
        },
        polished:
          "When the data grows, I start by checking the execution plan to see which step is slow. Most of the time, the fix is an index on the columns in the WHERE clause. For example, one of our report queries took 40 seconds. I added an index and rewrote the join, and it went down to 2 seconds. I also avoid SELECT * and only pull the columns I need.",
        whyBetter:
          "Starting with your process and then giving one concrete example makes it easy to follow, and “went down to 2 seconds” is easy to remember.",
      },
      japanese:
        "データが{増|ふ}えてきたときは、まず{実行|じっこう}{計画|けいかく}を{確認|かくにん}し、どこが{遅|おそ}いのかを{調|しら}べます。" +
        "{多|おお}くの{場合|ばあい}、WHERE{句|く}の{列|れつ}にインデックスを{追加|ついか}することで{改善|かいぜん}できます。" +
        "{例|たと}えば、40{秒|びょう}かかっていたレポートのクエリを、インデックスの{追加|ついか}と{結合|けつごう}の{見直|みなお}しで2{秒|びょう}まで{短縮|たんしゅく}しました。",
      patterns: [
        { pattern: "まず〜し、〜を{調|しら}べます", explanation: "“First I ~, then I look into ~.” Good for walking through your steps." },
        { pattern: "〜まで{短縮|たんしゅく}しました", explanation: "“I cut it down to ~.” A clear way to state an improvement with a number." },
      ],
    },
    schedules: [
      { lang: "en", interval: 3, dueIn: 1 },
      { lang: "ja", interval: 1, dueIn: 0 },
    ],
    logs: [{ lang: "en", daysAgo: 5, result: "remembered", aiScore: 76 }],
  },
  {
    daysAgo: 3,
    track: "common",
    type: "自我介紹",
    topic: "Self-introduction",
    en: "Please introduce yourself.",
    zh: "請自我介紹。",
    hint: "Keep it to about a minute: current role, strengths, why you're applying.",
    answer: {
      feedback: {
        score: {
          total: 81,
          content: 3,
          grammar: 3,
          structure: 4,
          summary: "Clear and well paced: current role, strength, and why Japan. Add one concrete achievement to make it stick.",
        },
        corrected: [
          "Hi, I'm Alice. I ",
          { del: "am working", ins: "have been working" },
          " as a software engineer in Taiwan for five years. I mainly build approval workflow systems with C# and SQL Server. I like ",
          { del: "to make", ins: "making" },
          " slow ",
          { del: "process", ins: "processes" },
          " faster and ",
          { del: "easy", ins: "easier" },
          " for users. Recently I ",
          { del: "study", ins: "have been studying" },
          " Japanese because I want to work in Tokyo with ",
          { ins: "an" },
          " international team.",
        ],
        notes: [
          "For something that started in the past and is still going, use have been working.",
          "Make the comparison match: faster and easier.",
          "Recently goes with have been studying, not the simple present.",
        ],
        interviewer: {
          focus: "Whether you can sum up who you are, what you're good at, and why you're here in about a minute.",
          points: [
            { status: "covered", text: "Your role, years of experience and tech stack come first." },
            { status: "covered", text: "You connect studying Japanese to why you're applying." },
            { status: "improve", text: "Add one result, e.g. My last project cut approval time from three days to one." },
          ],
          keywords: [
            { text: "background", lang: "en" },
            { text: "strength", lang: "en" },
            { text: "contribute", lang: "en" },
            { text: "motivated", lang: "en" },
            { text: "自己紹介", lang: "ja" },
          ],
        },
        polished:
          "Hi, I'm Alice. I've been working as a software engineer in Taiwan for five years, mainly building approval workflow systems with C# and SQL Server. I enjoy making slow processes faster and easier for users. I've also been studying Japanese, because I'd love to work with an international team in Tokyo.",
        whyBetter:
          "“I've been working” shows your experience is ongoing, and putting your role and tech stack in one sentence keeps the intro short.",
      },
      japanese:
        "はじめまして、アリスと{申|もう}します。" +
        "{台湾|たいわん}でソフトウェアエンジニアとして5{年|ねん}{働|はたら}いており、{主|おも}にC#とSQL Serverで{承認|しょうにん}ワークフローのシステムを{開発|かいはつ}しております。" +
        "{時間|じかん}のかかる{業務|ぎょうむ}を、{速|はや}く{使|つか}いやすくすることが{得意|とくい}です。" +
        "{東京|とうきょう}の{国際的|こくさいてき}なチームで{働|はたら}きたいと{考|かんが}え、{日本語|にほんご}も{勉強|べんきょう}しております。",
      patterns: [
        { pattern: "〜と{申|もう}します", explanation: "The polite way to give your name in an interview." },
        { pattern: "〜ことが{得意|とくい}です", explanation: "“I'm good at ~.” A simple way to state a strength." },
      ],
    },
    schedules: [
      { lang: "en", interval: 3, dueIn: 0 },
      { lang: "ja", interval: 3, dueIn: 2 },
    ],
    logs: [{ lang: "en", daysAgo: 2, result: "remembered", aiScore: 85 }],
  },
  {
    daysAgo: 1,
    track: "engineer",
    type: "經驗題",
    topic: "Teamwork",
    en: "Tell me about a time you disagreed with a teammate.",
    zh: "請分享一次你和同事意見不合的經驗。",
    hint: "Focus on how you communicated and reached an agreement.",
    answer: {
      feedback: {
        score: {
          total: 77,
          content: 3,
          grammar: 2,
          structure: 3,
          summary: "A good example of settling a disagreement with data. Keep the story in the past tense and say what you learned.",
        },
        corrected: [
          "Last year, my teammate ",
          { del: "want", ins: "wanted" },
          " to add a new approval step to every form, but I ",
          { del: "think", ins: "thought" },
          " it ",
          { del: "make", ins: "would make" },
          " the process slower. Instead of arguing, I ",
          { del: "check", ins: "checked" },
          " the data with him. We found only ",
          { ins: "the" },
          " high-value requests needed ",
          { ins: "the" },
          " extra step, so we ",
          { del: "add it only", ins: "only added it" },
          " for them.",
        ],
        notes: [
          "Tell the story in the past tense: wanted, thought, checked.",
          "For a possible result in the past, use would: it would make the process slower.",
          "Put only before the verb: we only added it for them.",
        ],
        interviewer: {
          focus: "How you handle conflict: do you listen, use facts, and keep a good relationship?",
          points: [
            { status: "covered", text: "Choosing data over arguing is exactly what interviewers want to hear." },
            { status: "covered", text: "The compromise is specific: only high-value requests." },
            { status: "improve", text: "End with what you learned, e.g. Since then, I bring data to the first meeting." },
          ],
          keywords: [
            { text: "compromise", lang: "en" },
            { text: "data-driven", lang: "en" },
            { text: "align", lang: "en" },
            { text: "perspective", lang: "en" },
            { text: "合意形成", lang: "ja" },
          ],
        },
        polished:
          "Last year, a teammate wanted to add a new approval step to every form. I thought it would slow the process down. Instead of arguing, we looked at the data together and found that only high-value requests really needed the extra step. So we added it just for those, and we were both happy with the result.",
        whyBetter:
          "“We looked at the data together” shows teamwork, and ending on a result you both liked makes the conflict sound well handled.",
      },
      japanese:
        "{昨年|さくねん}、チームの{同僚|どうりょう}がすべての{申請|しんせい}に{承認|しょうにん}ステップを{追加|ついか}したいと{提案|ていあん}しました。" +
        "{私|わたし}は{処理|しょり}が{遅|おそ}くなると{考|かんが}えましたが、{議論|ぎろん}するのではなく、{一緒|いっしょ}にデータを{確認|かくにん}しました。" +
        "その{結果|けっか}、{高額|こうがく}の{申請|しんせい}だけに{追加|ついか}することで{合意|ごうい}できました。",
      patterns: [
        { pattern: "〜のではなく、〜", explanation: "“Instead of ~, I ~.” Shows how you chose a better approach." },
        { pattern: "〜で{合意|ごうい}できました", explanation: "“We agreed on ~.” A calm way to close a conflict story." },
      ],
    },
    schedules: [
      { lang: "en", interval: 1, dueIn: 0 },
      { lang: "ja", interval: 1, dueIn: 1 },
    ],
  },
  {
    daysAgo: 0,
    track: "engineer",
    type: "志望動機",
    topic: "Motivation",
    en: "Why do you want to work at an international company in Japan?",
    zh: "你為什麼想在日本的外商公司工作？",
    hint: "Connect your reasons to what you can bring to the team.",
    answer: {
      feedback: {
        score: {
          total: 72,
          content: 3,
          grammar: 2,
          structure: 3,
          summary: "Honest and positive, with a clear link to your skills. Make the reason more specific to the company.",
        },
        corrected: [
          "I want to work in ",
          { ins: "an" },
          " international team because I ",
          { del: "can learn", ins: "can learn a lot" },
          " from people with different ",
          { del: "background", ins: "backgrounds" },
          ". Also, I ",
          { del: "interest", ins: "am interested" },
          " in Japanese culture and I ",
          { del: "study", ins: "have been studying" },
          " Japanese for two years. I think my experience ",
          { del: "of", ins: "with" },
          " workflow systems can help ",
          { ins: "the" },
          " team ",
          { del: "to work", ins: "work" },
          " more efficiently.",
        ],
        notes: [
          "Interested is the adjective: I am interested in.",
          "For something that started two years ago and is still going, use have been studying.",
          "Experience with and help someone work (no to) sound more natural.",
        ],
        interviewer: {
          focus: "Whether your reasons are genuine and tied to what you can offer, not just what you want.",
          points: [
            { status: "covered", text: "You link your workflow experience to how you would help the team." },
            { status: "improve", text: "Mention this company, e.g. I like that your team ships small releases every week." },
            { status: "improve", text: "Lead with what you'll contribute, then what you'll learn." },
          ],
          keywords: [
            { text: "diverse", lang: "en" },
            { text: "contribute", lang: "en" },
            { text: "growth", lang: "en" },
            { text: "global", lang: "en" },
            { text: "志望動機", lang: "ja" },
          ],
        },
        polished:
          "I'd like to join an international team because I can learn a lot from people with different backgrounds. I've also been studying Japanese for two years, and I'm really interested in working in Japan. I believe my experience with workflow systems can help the team work more efficiently.",
        whyBetter:
          "“I'd like to join” sounds polite and natural, and finishing with what you can offer leaves the interviewer thinking about your value.",
      },
      japanese:
        "さまざまな{背景|はいけい}を{持|も}つ{方々|かたがた}から{多|おお}くを{学|まな}べると{考|かんが}え、{国際的|こくさいてき}なチームを{志望|しぼう}しております。" +
        "また、2{年間|ねんかん}{日本語|にほんご}を{勉強|べんきょう}しており、{日本|にほん}で{働|はたら}くことに{強|つよ}い{関心|かんしん}がございます。" +
        "ワークフローシステムの{経験|けいけん}を{活|い}かし、チームの{業務|ぎょうむ}{効率化|こうりつか}に{貢献|こうけん}したいと{考|かんが}えております。",
      patterns: [
        {
          pattern: "〜を{活|い}かし、〜に{貢献|こうけん}したい",
          explanation: "“Use ~ to contribute to ~.” A classic closing line for motivation questions.",
        },
        { pattern: "〜と{考|かんが}えております", explanation: "A humble “I believe ~”, softer than 〜と思います." },
      ],
    },
    schedules: [
      { lang: "en", interval: 1, dueIn: 1 },
      { lang: "ja", interval: 1, dueIn: 1 },
    ],
  },
  {
    daysAgo: 0,
    track: "engineer",
    type: "個人特質",
    topic: "Learning",
    en: "How do you learn a new technology quickly?",
    zh: "你如何快速學會一項新技術？",
    hint: "Explain your method, then give one example of something you learned recently.",
  },
  {
    daysAgo: 0,
    track: "common",
    type: "反問題",
    topic: "Company research",
    en: "Do you have any questions for us?",
    zh: "你有什麼問題想問我們嗎？",
    hint: "Prepare two or three questions about the role or the team.",
  },
];

const PROFILE = {
  id: 1,
  bio: "Software engineer in Taiwan, 5 years building e-form approval workflows (C#, SQL Server). English: business level. Japanese: conversational, still learning to write. Looking for engineering roles at international companies in Tokyo.",
  dailyTotal: 3,
  reviewCap: 30,
  theme: "ink",
  furigana: true,
  speechRate: 0.8,
  reminder: true,
};

/** AI 用量的範例（設定頁顯示用）：[幾天前, 名稱, 模型, 輸入, 輸出, 費用, 秒數] */
const USAGE: [number, string, string, number, number, number, number][] = [
  [20, "Questions", "claude-sonnet-5-5", 1350, 820, 0.0109, 8.2],
  [20, "Feedback", "claude-sonnet-5-5", 2900, 2100, 0.0268, 18.4],
  [20, "Japanese", "claude-sonnet-5-5", 1800, 1300, 0.0166, 12.1],
  [19, "Review score", "claude-haiku-4-5", 1600, 900, 0.0061, 4.3],
  [16, "Review score", "claude-haiku-4-5", 1580, 880, 0.006, 4.1],
  [9, "Questions", "claude-sonnet-5-5", 1400, 810, 0.0109, 8.8],
  [9, "Feedback", "claude-sonnet-5-5", 3100, 2300, 0.0292, 21.0],
  [9, "Japanese", "claude-sonnet-5-5", 1900, 1350, 0.0173, 12.6],
  [8, "Review score", "claude-haiku-4-5", 1620, 910, 0.0062, 4.4],
  [6, "Feedback", "claude-sonnet-5-5", 3000, 2250, 0.0285, 19.7],
  [6, "Japanese", "claude-sonnet-5-5", 1850, 1320, 0.0169, 11.9],
  [5, "Review score", "claude-haiku-4-5", 1590, 870, 0.006, 4.0],
  [3, "Feedback", "claude-sonnet-5-5", 2950, 2150, 0.0274, 18.8],
  [3, "Japanese", "claude-sonnet-5-5", 1820, 1290, 0.0165, 11.7],
  [2, "Review score", "claude-haiku-4-5", 1610, 890, 0.0061, 4.2],
  [1, "Feedback", "claude-sonnet-5-5", 3050, 2200, 0.028, 19.2],
  [1, "Follow-up", "claude-sonnet-5-5", 3400, 450, 0.0113, 5.6],
  [1, "Japanese", "claude-sonnet-5-5", 1870, 1310, 0.0168, 12.0],
  [0, "Questions", "claude-sonnet-5-5", 1380, 790, 0.0107, 8.5],
  [0, "Feedback", "claude-sonnet-5-5", 3020, 2180, 0.0278, 19.5],
  [0, "Japanese", "claude-sonnet-5-5", 1840, 1300, 0.0167, 11.8],
];

/** 文法修正的原文：把沒改的字和刪掉的字接起來 */
function originalText(parts: CorrectionPart[]) {
  return parts
    .map((p) => (typeof p === "string" ? p : (p.del ?? "")))
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

/** 某一天台灣時間中午那一刻（複習紀錄、用量的時間） */
function noonOf(daysAgo: number) {
  return new Date(addDays(today(), -daysAgo).getTime() + 4 * 60 * 60 * 1000);
}

/** 重設示範資料的間隔：有人在這段時間內準備過就沿用，避免同時在看的訪客資料突然被清掉 */
const RESET_AFTER_MINUTES = 30;
/** PostgreSQL 的 advisory lock 編號：兩個訪客同時按下時只重設一次 */
const LOCK_ID = 5_282_301;

/** 訪客進入示範模式前呼叫：資料太舊（不是今天的，或超過 30 分鐘）就整份重建 */
export async function prepareDemoData() {
  const db = demoClient();
  await db.$transaction(
    async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${LOCK_ID})`;
      const [profile, latest] = await Promise.all([
        tx.profile.findUnique({ where: { id: PROFILE.id } }),
        tx.question.findFirst({ orderBy: { date: "desc" }, select: { date: true } }),
      ]);
      const fresh =
        profile &&
        latest?.date.getTime() === today().getTime() &&
        Date.now() - profile.updatedAt.getTime() < RESET_AFTER_MINUTES * 60 * 1000;
      if (fresh) return;

      // 刪題目時，作答、複習排程和紀錄會跟著刪掉（Cascade）
      await tx.question.deleteMany();
      await tx.aiUsage.deleteMany();
      await tx.profile.deleteMany();

      await tx.profile.create({ data: PROFILE });
      for (const q of QUESTIONS) {
        const answer = q.answer;
        await tx.question.create({
          data: {
            track: q.track,
            type: q.type,
            topic: q.topic,
            en: q.en,
            zh: q.zh,
            hint: q.hint,
            date: addDays(today(), -q.daysAgo),
            answer: answer && {
              create: {
                draft: originalText(answer.feedback.corrected),
                feedbackSource: "ai",
                scoreTotal: answer.feedback.score.total,
                scoreJson: JSON.stringify(answer.feedback.score),
                correctedJson: JSON.stringify(answer.feedback.corrected),
                notesJson: JSON.stringify(answer.feedback.notes),
                interviewerJson: JSON.stringify({ audience: APPROVAL.interviewer.audience, ...answer.feedback.interviewer }),
                polished: answer.feedback.polished,
                whyBetter: answer.feedback.whyBetter,
                japaneseSource: "ai",
                japaneseJson: JSON.stringify(parseRuby(answer.japanese)),
                patternsJson: JSON.stringify(
                  answer.patterns.map((p) => ({ pattern: parseRuby(p.pattern), explanation: p.explanation })),
                ),
              },
            },
            reviewSchedules: q.schedules && {
              create: q.schedules.map((s) => ({ lang: s.lang, interval: s.interval, dueDate: addDays(today(), s.dueIn) })),
            },
            reviewLogs: q.logs && {
              create: q.logs.map((l) => ({
                lang: l.lang,
                result: l.result,
                aiScore: l.aiScore ?? null,
                rewrite: l.lang === "en" ? answer?.feedback.polished : null,
                reviewedAt: noonOf(l.daysAgo),
              })),
            },
          },
        });
      }
      await tx.aiUsage.createMany({
        data: USAGE.map(([daysAgo, label, model, inputTokens, outputTokens, cost, seconds]) => ({
          at: noonOf(daysAgo),
          label,
          model,
          inputTokens,
          outputTokens,
          cost,
          seconds,
        })),
      });
    },
    { timeout: 30_000 },
  );
}
