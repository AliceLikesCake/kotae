// 題目的型別和標籤。題目存在資料庫的 Question 資料表（讀寫在 question-store.ts）。
// 伺服器端和瀏覽器端都會用到，所以這裡不能放查資料庫的程式。

/** engineer＝外商工程師面試的題目；common＝任何面試都會問的通用題（自我介紹、反問題等） */
export type Track = "engineer" | "common";

export const QUESTION_TYPES = ["自我介紹", "志望動機", "經驗題", "情境題", "技術題", "個人特質", "反問題"] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export type Question = {
  /** 資料庫 Question 的 id（數字），轉成字串給網址和畫面用 */
  id: string;
  track: Track;
  type: QuestionType;
  /** AI 自動標記的主題，例如「流程改善」 */
  topic: string;
  en: string;
  zh: string;
  hint: string;
};

/** 示範題目：沒開 KOTAE_AI_LIVE 時從這裡挑，不花錢也能測試 */
export const DEMO_QUESTIONS: Omit<Question, "id">[] = [
  {
    track: "engineer",
    type: "經驗題",
    topic: "流程改善",
    en: "Tell me about a time you improved a business process at work.",
    zh: "請分享一次你在工作中改善業務流程的經驗。",
    hint: "用 STAR 結構回答，情境 → 任務 → 行動 → 結果",
  },
  {
    track: "engineer",
    type: "技術題",
    topic: "資料庫",
    en: "How do you make sure a database query stays fast as the data grows?",
    zh: "資料量變大時，你如何確保資料庫查詢維持效能？",
    hint: "可以舉實際例子：索引、執行計畫、查詢改寫",
  },
  {
    track: "engineer",
    type: "個人特質",
    topic: "學習能力",
    en: "How do you learn a new technology quickly?",
    zh: "你如何快速學會一項新技術？",
    hint: "說明你的學習方法，再舉一個最近學會的例子",
  },
  {
    track: "common",
    type: "自我介紹",
    topic: "自我介紹",
    en: "Please introduce yourself.",
    zh: "請自我介紹。",
    hint: "一分鐘內講完：現職、強項、為什麼來應徵",
  },
  {
    track: "engineer",
    type: "經驗題",
    topic: "團隊合作",
    en: "Tell me about a time you disagreed with a teammate.",
    zh: "請分享一次你和同事意見不合的經驗。",
    hint: "重點放在你怎麼溝通、最後怎麼取得共識",
  },
  {
    track: "common",
    type: "反問題",
    topic: "公司研究",
    en: "Do you have any questions for us?",
    zh: "你有什麼問題想問我們嗎？",
    hint: "準備兩三個跟職務或團隊有關的問題",
  },
  {
    track: "engineer",
    type: "個人特質",
    topic: "壓力管理",
    en: "How do you handle tight deadlines?",
    zh: "你如何面對很趕的截止期限？",
    hint: "說明你排優先順序的方法，再舉例",
  },
];
