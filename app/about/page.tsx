import type { Metadata } from "next";
import Link from "next/link";
import Logo from "../components/Logo";
import { isLoggedIn } from "../lib/auth";
import { isDemo } from "../lib/demo-session";
import DemoButton from "../login/DemoButton";
import styles from "./about.module.css";

// 「關於這個作品」：給履歷上的訪客看，不用登入。內容固定英文。

export const metadata: Metadata = {
  title: "About · Kotae",
  description: "An AI interview practice app for English and Japanese, built with Next.js and the Claude API.",
};

const GITHUB_URL = "https://github.com/AliceLikesCake/kotae";

const SCREENS = [
  ["home", "Today"],
  ["feedback", "Feedback"],
  ["japanese", "Japanese"],
  ["review", "Review"],
  ["history", "History"],
] as const;

const STEPS = [
  ["Answer", "Claude writes new questions each day from my background. I answer in English, by typing or with Apple Pencil."],
  [
    "Feedback",
    "A score, every grammar fix marked in the text with the reason, what the interviewer is really asking, and a polished answer.",
  ],
  ["Japanese", "The polished answer turned into natural interview Japanese, with furigana on every kanji and read-aloud."],
  [
    "Review",
    "Spaced repetition at 1, 3, 7, 14 and 30 days. I rewrite English answers from memory and Claude scores them; Japanese uses flashcards.",
  ],
] as const;

const AI = [
  ["The right model for each job", "Sonnet writes questions, feedback and translations. Haiku scores reviews, which is faster and cheaper."],
  [
    "Structured output",
    "Every call returns JSON that matches a schema, so the app can show grammar diffs, scores and furigana reliably. The app also checks that the grammar fixes rebuild the original answer.",
  ],
  ["Prompt caching", "The long, fixed instructions are cached. Only the question and the answer change between calls."],
  [
    "Tuned for speaking",
    "Prompts ask for short, common words that are easy to say. Capitalization and punctuation are ignored, because these answers are spoken, not written.",
  ],
  ["Cost tracking", "Every call is logged with its tokens and estimated cost. Settings shows today, this month and all time."],
] as const;

const MADE = [
  "Wrote the spec and designed all 9 screens in two color themes before writing any code",
  "Built in about 2.5 weeks with Claude Code, while learning Next.js and TypeScript for the first time",
  "Moved from SQL Server to PostgreSQL midway and migrated all the existing practice data",
  "The demo runs on a separate database schema with sample data, so visitors never touch real data or call the API",
];

const TECH = ["Next.js 16", "React 19", "TypeScript", "Prisma", "PostgreSQL (Neon)", "Claude API", "Web Speech API", "PWA", "Vercel"];

export default async function AboutPage() {
  const signedIn = (await isLoggedIn()) || (await isDemo());

  return (
    <main className={styles.page} lang="en">
      <Link href={signedIn ? "/" : "/login"} className={styles.back}>
        ← {signedIn ? "Back to the app" : "Sign-in page"}
      </Link>

      <section className={styles.hero}>
        <Logo size={88} />
        <h1 className={styles.name}>Kotae</h1>
        <div className={styles.tagline}>答え · Daily English &amp; Japanese interview practice</div>
        <p className={styles.intro}>
          I built Kotae to prepare for engineering interviews at international companies in Japan. Every day Claude writes
          questions from my background, corrects my English answers, and turns them into natural interview Japanese.
          Spaced repetition makes sure I can still say them weeks later.
        </p>
        <div className={styles.actions}>
          {signedIn ? (
            <Link href="/" className={styles.primary}>
              Open the app
            </Link>
          ) : (
            <DemoButton
              labels={{
                title: "Try the demo",
                sub: "No sign-in. Sample data, nothing is sent to Claude.",
                pending: "Preparing sample data…",
              }}
            />
          )}
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className={styles.secondary}>
            Source on GitHub ↗
          </a>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Screens</h2>
        <div className={styles.shots}>
          {SCREENS.map(([file, label]) => (
            <figure key={file} className={styles.shot}>
              {/* eslint-disable-next-line @next/next/no-img-element -- 截圖是固定尺寸的靜態檔，不需要圖片最佳化 */}
              <img src={`/screenshots/${file}.png`} alt={`${label} screen`} width={195} height={422} loading="lazy" />
              <figcaption>{label}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>The daily loop</h2>
        <ol className={styles.steps}>
          {STEPS.map(([title, text], i) => (
            <li key={title} className={styles.card}>
              <span className={styles.stepNum} aria-hidden="true">
                {i + 1}
              </span>
              <span className={styles.text}>
                <span className={styles.cardTitle}>{title}</span>
                <span className={styles.sub}>{text}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>How Claude is used</h2>
        <div className={styles.list}>
          {AI.map(([title, text]) => (
            <div key={title} className={styles.card}>
              <span className={styles.text}>
                <span className={styles.cardTitle}>{title}</span>
                <span className={styles.sub}>{text}</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>How it was made</h2>
        <ul className={styles.made}>
          {MADE.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Tech</h2>
        <div className={styles.tech}>
          {TECH.map((name) => (
            <span key={name} className={styles.tag}>
              {name}
            </span>
          ))}
        </div>
      </section>
    </main>
  );
}
