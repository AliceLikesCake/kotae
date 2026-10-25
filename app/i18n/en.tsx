// 畫面上的英文文字。key 和 zh.tsx 一模一樣（少了或多了 TypeScript 會報錯）。

import { TIME_ZONE } from "../lib/dates";
import type { Dict } from "./zh";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const FULL_DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/** 1 question / 2 questions */
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export const en: Dict = {
  common: {
    backHome: "Back to home",
    home: "Back to home",
    retry: "Try again",
    close: "Close",
    loading: "Loading…",
    save: "Save",
    saving: "Saving…",
    saveFailed: "Couldn't save. Tap again.",
    genericError: "Something went wrong. Please try again later.",
    questionNotFound: "Question not found",
    answerRequired: "Write your answer first",
    answerTooLong: (max: number) => `That's too long. Keep it under ${max} characters.`,
    outOf100: "/ 100",
    colon: ": ",
  },
  meta: {
    tagline: "答え · Daily English & Japanese interview practice",
  },
  nav: {
    today: "Today",
    practice: "Practice",
    review: "Review",
    history: "History",
  },
  types: {
    自我介紹: "Self-intro",
    志望動機: "Motivation",
    經驗題: "Experience",
    情境題: "Situational",
    技術題: "Technical",
    個人特質: "Personality",
    反問題: "Your questions",
  },
  tracks: {
    engineer: "Engineer",
    common: "General",
  },
  ratings: {
    forgot: "Forgot",
    fuzzy: "Fuzzy",
    remembered: "Got it",
  },
  nextReview: (days, rating) => {
    if (days === 1) return rating === "forgot" ? "Again tomorrow" : "Tomorrow";
    return `In ${days} days`;
  },
  aiErrors: {
    auth: "Invalid API key. Check ANTHROPIC_API_KEY in .env.local.",
    rateLimit: "Too many requests. Wait a minute and try again.",
    connection: "Can't reach Claude. Check your connection and try again.",
    unavailable: "Claude can't reply right now. Please try again later.",
    config: "AI isn't set up. Check that .env.local has ANTHROPIC_API_KEY.",
    refusal: "Claude couldn't handle this text. Edit it and try again.",
    truncated: "Claude's reply was cut off. Please try again.",
    empty: "Claude didn't return anything. Please try again.",
    badFormat: "Claude's reply wasn't in the right format. Please try again.",
  },
  speak: {
    stopReading: "Stop reading",
    stop: "Stop",
  },
  login: {
    note: "This is a private practice space. Only the owner can sign in.",
    password: "Password",
    placeholder: "Enter your password",
    showPassword: "Show password",
    hidePassword: "Hide password",
    remember: "Remember this device for 30 days",
    signingIn: "Signing in…",
    signIn: "Sign in",
    passwordRequired: "Enter your password",
    wrongPassword: "Wrong password",
    tryDemo: "Try the demo",
    tryDemoSub: "No sign-in. Explore with sample data. Nothing is sent to Claude.",
    preparingDemo: "Preparing sample data…",
    about: "About this project",
  },
  demo: {
    banner: "Demo · Sample data, nothing is sent to Claude",
    leave: "Leave",
  },
  home: {
    dayNames: DAY_NAMES,
    formatDate: (date) =>
      new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, weekday: "long", month: "long", day: "numeric" }).format(date),
    weekLabel: (done, today) => {
      const parts = [
        done.length ? `Practiced this week on ${done.map((i) => FULL_DAY_NAMES[i]).join(", ")}` : "No practice yet this week",
      ];
      if (today !== null) parts.push(`not done yet today (${FULL_DAY_NAMES[today]})`);
      return parts.join("; ");
    },
    settings: "Settings",
    title: "Time to practice",
    tag: "Engineer · Global companies in Japan",
    reviewTitle: "Today's review",
    questionUnit: (n) => (n === 1 ? "question" : "questions"),
    reviewSummary: (total, doneToday, yesterday, older) => {
      if (total === 0) return doneToday > 0 ? "All of today's reviews are done" : "Nothing to review today";
      const parts: string[] = [];
      if (yesterday > 0) parts.push(`${plural(yesterday, "question", "questions")} from yesterday`);
      if (older > 0) parts.push(`${yesterday > 0 ? "plus " : ""}${plural(older, "older question", "older questions")} due`);
      return parts.join(", ") || `${plural(total, "review", "reviews")} today`;
    },
    enRewrite: (n) => `English rewrite ${n}`,
    jaCards: (n) => `Japanese cards ${n}`,
    startReview: "Start review",
    newTitle: "New questions",
    newDone: (done, total) => `${done} / ${total} done`,
    newProgress: "Today's progress",
    newHint: "Interview questions Claude wrote from your background",
    newEmpty: "Claude writes today's questions when you first open Practice",
    startPractice: "Start practice",
    weekTitle: "This week",
    streak: (n) => `${plural(n, "day", "days")} in a row`,
  },
  practice: {
    title: "New questions",
    failTitle: "Couldn't write questions",
    allDoneTitle: "All of today's questions are done",
    allDoneText: (total) => `${plural(total, "question", "questions")} today. Want more? Ask Claude for one more.`,
    progressTitle: (i, total) => `Question ${i} of ${total}`,
    progress: "Today's progress",
    hint: (hint) => `Hint: ${hint}`,
    showMeaning: false,
    answerLabel: "Your answer (in English)",
    draftSaved: "Draft saved",
    draftAuto: "Drafts save automatically",
    cleared: "Cleared ·",
    undo: "Undo",
    words: (n) => plural(n, "word", "words"),
    clear: "Clear",
    submitting: "Claude is reviewing… (10–30 s)",
    submit: "Get feedback from Claude",
    extraPending: "Claude is writing… (about 10 s)",
    extra: "One more question",
    loadingTitle: "Getting today's questions ready…",
    loadingText: "The first time you open Practice each day, Claude writes new questions from your settings.",
    loadingTime: "This takes about 10–20 seconds.",
  },
  feedback: {
    dimensions: { content: "Content", grammar: "Grammar", structure: "Structure" },
    backPractice: "Back to practice",
    backHistory: "Back to history",
    title: (index) => (index === null ? "Feedback" : `Feedback · Q${index}`),
    devDemoNote: (
      <>
        This is fixed sample content, not feedback on your answer. Add <code>KOTAE_AI_LIVE=1</code> to{" "}
        <code>.env.local</code> and submit again to get real feedback from Claude.
      </>
    ),
    demoNote:
      "This is sample feedback. The demo doesn't send answers to Claude, so you'll see this same feedback whatever you write.",
    scoreLabel: "Score",
    grammarTitle: "Grammar fixes",
    changes: (n) => plural(n, "change", "changes"),
    notesTitle: "Why these changes",
    noNotes: "No grammar fixes needed. Nicely done!",
    interviewerTitle: "What the interviewer wants",
    audience: "Engineer · Japan",
    focus: (focus) => `What it tests: ${focus}`,
    covered: "✓ Covered",
    improve: "△ Could add",
    keywords: "Useful keywords",
    polishedTitle: "Polished answer",
    readAloud: "Read aloud",
    whyBetter: (text) => `Why it's better: ${text}`,
    followUpTitle: (index) => (index === null ? "Ask Claude" : `Ask Claude · Q${index}`),
    japanese: "See the Japanese version",
  },
  followUp: {
    suggestions: ["Is there another way to say this?", "Make it sound more casual", "What might they ask next?"],
    open: "Ask a follow-up",
    empty: "Questions about this feedback? Ask Claude.",
    thinking: "Claude is thinking…",
    connectionFailed: "Connection failed. Please try again.",
    placeholder: "Type your question…",
    inputLabel: "Follow-up question",
    send: "Send",
    invalid: "Something's wrong with this chat. Close it and ask again.",
    tooLong: "This chat is too long. Close it and start over.",
    messageTooLong: (max) => `Keep each message under ${max} characters`,
  },
  japanese: {
    back: "Back to feedback",
    title: "Japanese version",
    failTitle: "Translation failed",
    furigana: "Furigana",
    devDemoNote: (
      <>
        This is fixed sample content. Turn on <code>KOTAE_AI_LIVE=1</code> and submit an answer to see Claude&apos;s
        Japanese translation of it here.
      </>
    ),
    demoNote: "This is a sample Japanese version. The demo doesn't call Claude to translate.",
    play: "Play Japanese",
    rate: (rate) => `Speed ${rate}x, tap to change`,
    patterns: "Key patterns",
    editReadings: "Fix readings",
    done: "Got it, add to review",
    editorHint: "Fix any wrong reading. Every place the word appears updates together.",
    resetAll: "Reset all",
    loadingTitle: "Translating into Japanese…",
    loadingText: "Claude is turning your polished answer into interview Japanese and adding furigana.",
    loadingTime: "This takes about 10–20 seconds.",
  },
  review: {
    title: "Today's review",
    doneTitle: (doneToday) => (doneToday > 0 ? "All of today's reviews are done" : "Nothing to review today"),
    doneText: (doneToday) =>
      `${doneToday > 0 ? `You reviewed ${plural(doneToday, "question", "questions")} today. ` : ""}New reviews come tomorrow.`,
    nextPractice: "Go to new questions",
    progressTitle: (current, total) => `Review ${current} of ${total}`,
    progress: "Review progress",
    tagEn: "English rewrite",
    tagJa: "Japanese card",
    age: (days) => {
      if (days <= 0) return "From today";
      if (days === 1) return "From yesterday";
      return `From ${days} days ago`;
    },
    jaPrompt: "Say it in Japanese first, then check the answer",
    scoreFailed: "Scoring failed. Please try again.",
    rewriteLabel: "Answer again in English, without looking",
    rewriteNote: "It doesn't have to match word for word. Just hit the key points.",
    scoring: "Claude is scoring… (5–10 s)",
    submit: "Get my score",
    devDemoNote: (
      <>
        This is a fixed sample score, not a score for your rewrite. Add <code>KOTAE_AI_LIVE=1</code> to{" "}
        <code>.env.local</code> to have Claude score it (the question also needs a polished answer from Claude).
      </>
    ),
    demoNote: "This is a sample score. The demo doesn't send your rewrite to Claude.",
    verdict: (label) => `Claude's call: ${label}`,
    yourRewrite: "Your rewrite",
    keyPoints: "Key points",
    patterns: "Phrasing",
    resultTitle: "Result",
    resultNote: "Change it if it feels off",
    next: "Next",
    answer: "Answer",
    ready: "Ready to say it?",
    flip: "Show answer",
    howMuch: "How well did you remember?",
  },
  history: {
    sorts: { recent: "Recent", count: "Most practiced", weak: "Least familiar" },
    en: "EN",
    ja: "JA",
    mastery: (label, level) => `${label} mastery ${level} of 4`,
    title: "History",
    summary: (total, mastered) => `${plural(total, "question", "questions")} · ${mastered} mastered`,
    searchPlaceholder: "Search questions or keywords",
    searchLabel: "Search questions",
    typeLabel: "Type",
    all: "All",
    topicLabel: "Topic",
    listTitle: "Questions",
    sortLabel: "Sort by",
    empty: "No matching questions",
    practiced: (n) => `Practiced ${n}×`,
  },
  settings: {
    title: "Settings",
    themes: { ink: "Ivory & Ink", blue: "Dusty Blue" },
    language: "Language",
    theme: "Theme",
    bio: "My background (Claude uses it to write questions and feedback)",
    daily: "Daily questions",
    perDay: "Questions per day",
    perDaySub: "1 to 10",
    perDayDec: "Fewer questions per day",
    perDayInc: "More questions per day",
    cap: "Daily review limit",
    capSub: "Extra reviews move to the next day",
    capDec: "Lower the review limit",
    capInc: "Raise the review limit",
    estimate: (estimate, cap) =>
      `Once it's a habit, expect about ${estimate} reviews a day (English rewrites + Japanese cards). ` +
      (estimate > cap ? `Anything over your limit of ${cap} moves to the next day.` : "That's within your limit."),
    replaceable: (n) =>
      `A new daily count normally starts tomorrow. ${plural(n, "question", "questions")} from today ${n === 1 ? "isn't" : "aren't"} started yet. Regenerate ${n === 1 ? "it" : "them"} to apply the new settings now (answered or drafted questions stay).`,
    regenerating: "Claude is writing… (10–20 s)",
    regenerate: "Regenerate today's questions",
    regenerated: "Today's questions were regenerated with the new settings.",
    goPractice: "Go practice",
    jaSection: "Japanese & reminders",
    furigana: "Show furigana by default",
    speechRate: "Reading speed",
    reminder: "Daily reminder",
    reminderSub: "Every day at 21:00",
    usage: "AI usage",
    periods: { today: "Today", month: "This month", total: "All time" },
    calls: (n) => plural(n, "call", "calls"),
    cost: (usd) => `$${usd.toFixed(usd < 1 ? 3 : 2)} (≈ NT$${Math.round(usd * 32)})`,
    usageNote: {
      before: "Estimated from public prices. For the actual bill, see the ",
      link: "Usage page in the Anthropic Console",
      after: ".",
    },
    logout: "Sign out",
    leaveDemo: "Leave the demo",
    about: "About this project",
  },
};
