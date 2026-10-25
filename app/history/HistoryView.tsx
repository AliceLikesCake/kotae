"use client";

import { useState } from "react";
import Link from "next/link";
import type { Dict } from "../i18n";
import { useT } from "../i18n/client";
import { isMastered, type HistoryEntry } from "../lib/history";
import { QUESTION_TYPES, type QuestionType } from "../lib/practice-data";
import styles from "./history.module.css";
import SortMenu from "./SortMenu";

const SORTS = {
  recent: (a: HistoryEntry, b: HistoryEntry) => b.lastPracticed.localeCompare(a.lastPracticed),
  count: (a: HistoryEntry, b: HistoryEntry) => b.practiceCount - a.practiceCount,
  weak: (a: HistoryEntry, b: HistoryEntry) => a.enLevel + a.jaLevel - (b.enLevel + b.jaLevel),
};

type SortId = keyof typeof SORTS;
const SORT_IDS = Object.keys(SORTS) as SortId[];

type Filters = { query: string; type: QuestionType | "all"; topic: string | null };

function matches(t: Dict, e: HistoryEntry, f: Filters, skip?: "type" | "topic") {
  const q = f.query.trim().toLowerCase();
  // 題型用中文存，所以也比對目前語言的題型名稱
  if (q && ![e.en, e.zh, e.topic, e.type, t.types[e.type]].some((s) => s.toLowerCase().includes(q))) return false;
  if (skip !== "type" && f.type !== "all" && e.type !== f.type) return false;
  if (skip !== "topic" && f.topic && e.topic !== f.topic) return false;
  return true;
}

function Dots({ level, label }: { level: number; label: string }) {
  const t = useT();
  return (
    <span aria-label={t.history.mastery(label, level)}>
      {label} <span aria-hidden="true">{"●".repeat(level) + "○".repeat(4 - level)}</span>
    </span>
  );
}

function shortDate(iso: string) {
  const [, m, d] = iso.split("-");
  return `${Number(m)}/${Number(d)}`;
}

export default function HistoryView({ entries }: { entries: HistoryEntry[] }) {
  const t = useT();
  const [filters, setFilters] = useState<Filters>({ query: "", type: "all", topic: null });
  const [sort, setSort] = useState<SortId>("recent");
  const set = (patch: Partial<Filters>) => setFilters((f) => ({ ...f, ...patch }));

  // 各篩選按鈕上的數字：套用「其他」條件後的題數
  const forTypes = entries.filter((e) => matches(t, e, filters, "type"));
  const forTopics = entries.filter((e) => matches(t, e, filters, "topic"));
  const topics = [...new Set(entries.map((e) => e.topic))];
  const list = entries.filter((e) => matches(t, e, filters)).sort(SORTS[sort]);
  const sortOptions = SORT_IDS.map((id) => ({ id, label: t.history.sorts[id] }));

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t.history.title}</h1>
        <div className={styles.summary}>{t.history.summary(entries.length, entries.filter(isMastered).length)}</div>
      </div>

      <label className={styles.search}>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4" />
        </svg>
        <input
          type="search"
          className={styles.searchInput}
          placeholder={t.history.searchPlaceholder}
          aria-label={t.history.searchLabel}
          value={filters.query}
          onChange={(e) => set({ query: e.target.value })}
        />
      </label>

      <div className={styles.filterGroup}>
        <div className={styles.filterLabel}>{t.history.typeLabel}</div>
        <div className={styles.types}>
          {(["all", ...QUESTION_TYPES] as const).map((type) => (
            <button
              key={type}
              type="button"
              className={styles.type}
              aria-pressed={filters.type === type}
              onClick={() => set({ type })}
            >
              <span className={styles.typeCount}>
                {type === "all" ? forTypes.length : forTypes.filter((e) => e.type === type).length}
              </span>
              <span className={styles.typeName}>{type === "all" ? t.history.all : t.types[type]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.filterGroup}>
        <div className={styles.filterLabel}>{t.history.topicLabel}</div>
        <div className={styles.topics}>
          {topics.map((topic) => (
            <button
              key={topic}
              type="button"
              className={styles.topic}
              aria-pressed={filters.topic === topic}
              onClick={() => set({ topic: filters.topic === topic ? null : topic })}
            >
              {topic} {forTopics.filter((e) => e.topic === topic).length}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.listHead}>
        <h2 className={styles.listTitle}>{t.history.listTitle}</h2>
        <SortMenu label={t.history.sortLabel} options={sortOptions} value={sort} onChange={setSort} />
      </div>

      <div className={styles.list}>
        {list.length === 0 && <div className={styles.empty}>{t.history.empty}</div>}
        {list.map((e) => (
          <Link key={e.id} href={`/practice/feedback?q=${e.id}`} className={styles.item}>
            <div className={styles.itemQuestion} lang="en">
              {e.en}
            </div>
            <div className={styles.itemTags}>
              <span className={`${styles.itemTag} ${styles.tagType}`}>{t.types[e.type]}</span>
              <span className={styles.itemTag}>{e.topic}</span>
              <span className={`${styles.itemTag} ${styles.tagEn}`}>
                {t.tracks[e.track]}
              </span>
            </div>
            <div className={styles.itemMeta}>
              <span>
                <Dots level={e.enLevel} label={t.history.en} />　<Dots level={e.jaLevel} label={t.history.ja} />
              </span>
              <span>
                {shortDate(e.lastPracticed)} · {t.history.practiced(e.practiceCount)}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
