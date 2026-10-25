// 畫面上的中文文字。英文版在 en.tsx，兩邊的 key 要一模一樣（en.tsx 用 Dict 型別檢查）。
// 需要帶數字或其他資料的文字寫成函式；少數有 <code> 這類標籤的寫成 JSX。

import type { QuestionType, Track } from "../lib/practice-data";
import type { Rating } from "../lib/review";
import { TIME_ZONE } from "../lib/dates";
import type { AiErrorCode } from "../lib/ai-errors";

const DAY_NAMES = ["一", "二", "三", "四", "五", "六", "日"];

export const zh = {
  common: {
    backHome: "返回首頁",
    home: "回首頁",
    retry: "再試一次",
    close: "關閉",
    loading: "載入中…",
    save: "儲存",
    saving: "儲存中…",
    saveFailed: "儲存失敗，請再按一次",
    genericError: "發生錯誤，請稍後再試",
    questionNotFound: "找不到這一題",
    answerRequired: "請先寫下你的回答",
    answerTooLong: (max: number) => `回答太長了，請精簡到 ${max} 字以內`,
    outOf100: "/ 100 分",
    colon: "：",
  },
  meta: {
    tagline: "答え · 每日英日面試練習",
  },
  nav: {
    today: "今日",
    practice: "練習",
    review: "複習",
    history: "紀錄",
  },
  types: {
    自我介紹: "自我介紹",
    志望動機: "志望動機",
    經驗題: "經驗題",
    情境題: "情境題",
    技術題: "技術題",
    個人特質: "個人特質",
    反問題: "反問題",
  } satisfies Record<QuestionType, string>,
  tracks: {
    engineer: "工程師",
    common: "共通",
  } satisfies Record<Track, string>,
  ratings: {
    forgot: "忘記",
    fuzzy: "模糊",
    remembered: "記得",
  } satisfies Record<Rating, string>,
  /** 下次複習是幾天後（評分按鈕底下的小字） */
  nextReview: (days: number, rating: Rating) => {
    if (days === 1) return rating === "forgot" ? "明天再練" : "明天";
    return `${days} 天後`;
  },
  aiErrors: {
    auth: "API 金鑰無效，請檢查 .env.local 的 ANTHROPIC_API_KEY",
    rateLimit: "呼叫太頻繁，請稍等一分鐘再試",
    connection: "連不到 Claude，請檢查網路後再試",
    unavailable: "AI 暫時無法回覆，請稍後再試",
    config: "AI 設定有問題，請檢查 .env.local 是否有 ANTHROPIC_API_KEY",
    refusal: "AI 無法處理這段內容，請修改後再試",
    truncated: "AI 的回覆太長被截斷了，請再試一次",
    empty: "AI 沒有回傳內容，請再試一次",
    badFormat: "AI 回傳的格式不正確，請再試一次",
  } satisfies Record<AiErrorCode, string>,
  speak: {
    stopReading: "停止朗讀",
    stop: "停止播放",
  },
  login: {
    note: "這是你的私人練習空間，只有你能登入",
    password: "密碼",
    placeholder: "輸入你的密碼",
    showPassword: "顯示密碼",
    hidePassword: "隱藏密碼",
    remember: "記住這台裝置 30 天",
    signingIn: "登入中…",
    signIn: "登入",
    passwordRequired: "請輸入密碼",
    wrongPassword: "密碼不正確",
    tryDemo: "先逛逛（示範模式）",
    tryDemoSub: "不用登入，用範例資料體驗，不會呼叫 AI",
    preparingDemo: "準備範例資料中…",
    about: "關於這個作品",
  },
  demo: {
    banner: "示範模式 · 範例資料，不會送給 AI",
    leave: "離開",
  },
  home: {
    dayNames: DAY_NAMES,
    formatDate: (date: Date) => {
      const day = new Intl.DateTimeFormat("zh-TW", { timeZone: TIME_ZONE, month: "long", day: "numeric" }).format(date);
      const weekday = new Intl.DateTimeFormat("zh-TW", { timeZone: TIME_ZONE, weekday: "long" }).format(date);
      return `${day} ${weekday}`;
    },
    /** 本週笑臉的無障礙說明；done 是有練習的那幾天，today 是今天（還沒完成時） */
    weekLabel: (done: number[], today: number | null) => {
      const parts = [done.length ? `本週已練習${done.map((i) => `星期${DAY_NAMES[i]}`).join("、")}` : "本週尚未練習"];
      if (today !== null) parts.push(`今天星期${DAY_NAMES[today]}尚未完成`);
      return parts.join("，");
    },
    settings: "設定",
    title: "今天也來練習吧",
    tag: "在日外商工程師",
    reviewTitle: "今日複習",
    // 中文的單位不分單複數，英文版才用得到題數
    questionUnit: (() => "題") as (n: number) => string,
    reviewSummary: (total: number, doneToday: number, yesterday: number, older: number) => {
      if (total === 0) return doneToday > 0 ? "今天的複習都完成了" : "今天沒有要複習的題目";
      const parts: string[] = [];
      if (yesterday > 0) parts.push(`昨天的 ${yesterday} 題`);
      if (older > 0) parts.push(`${yesterday > 0 ? "加上" : ""}到期的 ${older} 題舊題目`);
      return parts.join("，") || `今天的 ${total} 個複習`;
    },
    enRewrite: (n: number) => `英文重寫 ${n}`,
    jaCards: (n: number) => `日文翻卡 ${n}`,
    startReview: "先做複習",
    newTitle: "今日新題",
    newDone: (done: number, total: number) => `${done} / ${total} 完成`,
    newProgress: "今日新題進度",
    newHint: "AI 依你的背景出的外商工程師面試題",
    newEmpty: "第一次打開練習時，AI 會出今天的題目",
    startPractice: "開始練習",
    weekTitle: "本週",
    streak: (n: number) => `連續練習 ${n} 天`,
  },
  practice: {
    title: "今日新題",
    failTitle: "出題失敗",
    allDoneTitle: "今天的新題都完成了",
    allDoneText: (total: number) => `共 ${total} 題。想多練的話，可以請 AI 再出一題。`,
    progressTitle: (i: number, total: number) => `第 ${i} / ${total} 題`,
    progress: "今日新題進度",
    hint: (hint: string) => `提示：${hint}`,
    /** 題目底下要不要顯示中文意思（英文介面不顯示） */
    showMeaning: true,
    answerLabel: "你的回答（英文）",
    draftSaved: "草稿已自動儲存",
    draftAuto: "草稿會自動儲存",
    cleared: "已清空 ·",
    undo: "復原",
    words: (n: number) => `${n} 字`,
    clear: "清空",
    submitting: "AI 修正中…（約 10–30 秒）",
    submit: "送出給 AI 修正",
    extraPending: "AI 出題中…（約 10 秒）",
    extra: "再出一題",
    loadingTitle: "準備今天的題目…",
    loadingText: "第一次打開時，AI 會依你的設定出今天的新題。",
    loadingTime: "大約需要 10–20 秒。",
  },
  feedback: {
    dimensions: { content: "內容", grammar: "文法", structure: "結構" },
    backPractice: "返回作答",
    backHistory: "返回練習紀錄",
    title: (index: number | null) => (index === null ? "AI 回饋" : `AI 回饋 · 第 ${index} 題`),
    devDemoNote: (
      <>
        這是固定的示範內容，不是針對你的回答。在 <code>.env.local</code> 加上 <code>KOTAE_AI_LIVE=1</code>{" "}
        並重新送出作答，才會由 AI 產生真的回饋。
      </>
    ),
    demoNote: "這是示範模式的範例回饋：示範模式不會把回答送給 AI，所以不管寫什麼都會看到這份。",
    scoreLabel: "這次的評分",
    grammarTitle: "文法修正",
    changes: (n: number) => `${n} 處修改`,
    notesTitle: "修改說明",
    noNotes: "文法沒有需要修改的地方，寫得很好！",
    interviewerTitle: "面試官想聽什麼",
    audience: "在日外商 · 工程師",
    focus: (focus: string) => `這題在考：${focus}`,
    covered: "✓ 已講到",
    improve: "△ 可加強",
    keywords: "這個產業常用的關鍵字",
    polishedTitle: "面試優化版",
    readAloud: "朗讀英文",
    whyBetter: (text: string) => `為什麼更好：${text}`,
    followUpTitle: (index: number | null) => (index === null ? "追問 AI" : `追問 AI · 第 ${index} 題`),
    japanese: "看日文版",
  },
  followUp: {
    suggestions: ["這句還有別的說法嗎？", "幫我改得更口語一點", "面試官可能會怎麼追問？"],
    open: "再問 AI",
    empty: "對這題的回饋有疑問？直接問 AI。",
    thinking: "AI 思考中…",
    connectionFailed: "連線失敗，請再試一次",
    placeholder: "輸入想問的問題…",
    inputLabel: "追問內容",
    send: "送出",
    invalid: "對話內容不正確，請關閉視窗後重新提問",
    tooLong: "這次的對話太長了，請關閉視窗後重新開始",
    messageTooLong: (max: number) => `每則訊息請在 ${max} 字以內`,
  },
  japanese: {
    back: "返回 AI 回饋",
    title: "日文面試版",
    failTitle: "翻譯失敗",
    furigana: "注音",
    devDemoNote: (
      <>
        這是固定的示範內容。開啟 <code>KOTAE_AI_LIVE=1</code> 並送出作答後，這裡會顯示 AI 依你的回答翻譯的日文。
      </>
    ),
    demoNote: "這是示範模式的範例日文版：示範模式不會呼叫 AI 翻譯。",
    play: "播放日文",
    rate: (rate: number) => `播放速度 ${rate}x，按一下切換`,
    patterns: "重點句型",
    editReadings: "修改讀音",
    done: "背好了，加入複習",
    editorHint: "讀音不對的地方直接改，同一個詞會一起更新。",
    resetAll: "全部還原",
    loadingTitle: "日文翻譯中…",
    loadingText: "AI 正在把你的優化版翻成面試用的日文，並加上平假名。",
    loadingTime: "大約需要 10–20 秒。",
  },
  review: {
    title: "今日複習",
    doneTitle: (doneToday: number): string => (doneToday > 0 ? "今天的複習都完成了" : "今天沒有要複習的題目"),
    doneText: (doneToday: number) => `${doneToday > 0 ? `今天複習了 ${doneToday} 題，` : ""}明天會再排新的複習。`,
    nextPractice: "接著做新題",
    progressTitle: (current: number, total: number) => `複習 ${current} / ${total}`,
    progress: "今日複習進度",
    tagEn: "英文重寫",
    tagJa: "日文翻卡",
    age: (days: number) => {
      if (days <= 0) return "今天的題目";
      if (days === 1) return "昨天的題目";
      return `${days} 天前的題目`;
    },
    jaPrompt: "先用日文念一次，再看答案對照",
    scoreFailed: "評分失敗，請再試一次",
    rewriteLabel: "不看答案，用英文再回答一次",
    rewriteNote: "不需要一字不差，重點講到就好",
    scoring: "AI 評分中…（約 5–10 秒）",
    submit: "送出評分",
    devDemoNote: (
      <>
        這是固定的示範評分，不是針對你的重寫。在 <code>.env.local</code> 加上 <code>KOTAE_AI_LIVE=1</code>{" "}
        才會由 AI 評分（這題也要有 AI 回饋的優化版）。
      </>
    ),
    demoNote: "這是示範模式的範例評分：示範模式不會把重寫送給 AI。",
    verdict: (label: string) => `AI 判定：${label}`,
    yourRewrite: "你的重寫",
    keyPoints: "重點檢查",
    patterns: "好句型",
    resultTitle: "這次的結果",
    resultNote: "覺得不準可以自己改",
    next: "下一題",
    answer: "答案",
    ready: "想好怎麼說了嗎？",
    flip: "翻開答案",
    howMuch: "你記得多少？",
  },
  history: {
    sorts: { recent: "最近練習", count: "練習次數", weak: "最不熟的" },
    en: "英",
    ja: "日",
    mastery: (label: string, level: number) => `${label}熟練度 ${level} / 4`,
    title: "練習紀錄",
    summary: (total: number, mastered: number) => `共 ${total} 題 · 已熟記 ${mastered} 題`,
    searchPlaceholder: "搜尋題目或關鍵字",
    searchLabel: "搜尋題目",
    typeLabel: "題型",
    all: "全部",
    topicLabel: "主題",
    listTitle: "題目列表",
    sortLabel: "排序方式",
    empty: "沒有符合的題目",
    practiced: (n: number) => `練習 ${n} 次`,
  },
  settings: {
    title: "設定",
    themes: { ink: "米白墨色", blue: "莫蘭迪藍" },
    language: "語言",
    theme: "主題顏色",
    bio: "我的背景（AI 出題和修改時會參考）",
    daily: "每日新題",
    perDay: "每天幾題",
    perDaySub: "1 到 10 題",
    perDayDec: "減少每日題數",
    perDayInc: "增加每日題數",
    cap: "每日複習上限",
    capSub: "超過的自動延到隔天",
    capDec: "降低複習上限",
    capInc: "提高複習上限",
    estimate: (estimate: number, cap: number) =>
      `養成習慣後，每天約會有 ${estimate} 個複習項目（英文重寫＋日文翻卡）。` +
      (estimate > cap ? `超過上限 ${cap} 的部分會延到隔天。` : "在你的上限內。"),
    replaceable: (n: number) =>
      `改了每天的題數後，原本要隔天才生效。今天還有 ${n} 題沒做，想馬上套用的話可以重出這些題目（已作答或寫了草稿的會保留）。`,
    regenerating: "AI 出題中…（約 10–20 秒）",
    regenerate: "用新設定重出今天的題目",
    regenerated: "今天的題目已經依新設定重出了。",
    goPractice: "去練習",
    jaSection: "日文與提醒",
    furigana: "預設顯示注音",
    speechRate: "朗讀速度",
    reminder: "每日練習提醒",
    reminderSub: "每天 21:00",
    usage: "AI 用量（這台電腦）",
    periods: { today: "今天", month: "這個月", total: "累計" },
    calls: (n: number) => `呼叫 ${n} 次`,
    // 匯率用 1 美金 ≈ 32 台幣粗估
    cost: (usd: number) => `$${usd.toFixed(usd < 1 ? 3 : 2)}（約 NT$${Math.round(usd * 32)}）`,
    usageNote: {
      before: "這裡是依公開價格估算的金額，只計算這台電腦。公司和家裡加起來的正式帳單，請看",
      link: "Anthropic Console 的 Usage 頁面",
      after: "。",
    },
    logout: "登出",
    leaveDemo: "離開示範模式",
    about: "關於這個作品",
  },
};

export type Dict = typeof zh;
