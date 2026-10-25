"use client";

import { useState } from "react";
import Link from "next/link";
import BottomSheet from "../../components/BottomSheet";
import RubyText from "../../components/RubyText";
import SpeakButton from "../../components/SpeakButton";
import TopBar from "../../components/TopBar";
import { useT } from "../../i18n/client";
import type { JapaneseVersion } from "../../lib/japanese-data";
import { applyReadingFixes, readingKey, toSpeechText, type ReadingFixes } from "../../lib/ruby";
import type { Settings } from "../../lib/settings";
import { saveReadingFixesAction } from "./actions";
import styles from "./japanese.module.css";

export default function JapaneseView({
  data,
  backHref,
  settings,
  initialCorrections,
  demo,
}: {
  data: JapaneseVersion;
  /** 示範模式（範例內容的說明不一樣） */
  demo: boolean;
  backHref: string;
  initialCorrections: ReadingFixes;
  settings: Pick<Settings, "furigana" | "speechRate">;
}) {
  const t = useT();
  // 沒有手動切換前，跟著設定頁的注音預設和朗讀速度
  const [furiganaOverride, setFurigana] = useState<boolean | null>(null);
  const [rateOverride, setRate] = useState<number | null>(null);
  const furigana = furiganaOverride ?? settings.furigana;
  const rate = rateOverride ?? settings.speechRate;
  const [corrections, setCorrections] = useState<ReadingFixes>(initialCorrections);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ReadingFixes>({});

  const text = applyReadingFixes(data.text, corrections);
  // 修改讀音清單：本文裡的每個詞只列一次
  const words = data.text.filter(
    (p, i, all): p is { base: string; reading: string } =>
      typeof p !== "string" && all.findIndex((q) => typeof q !== "string" && readingKey(q) === readingKey(p)) === i,
  );

  function openEditor() {
    setDraft(corrections);
    setEditing(true);
  }

  function saveEditor() {
    // 跟原本讀音一樣或空白的就不算修正
    const cleaned: ReadingFixes = {};
    for (const w of words) {
      const value = draft[readingKey(w)]?.trim();
      if (value && value !== w.reading) cleaned[readingKey(w)] = value;
    }
    setCorrections(cleaned);
    saveReadingFixesAction(data.questionId, cleaned).catch((error) => console.error("[讀音修正] 儲存失敗：", error));
    setEditing(false);
  }

  return (
    <main className={`${styles.page} ${furigana ? "" : styles.hideRuby}`}>
      <TopBar
        backHref={backHref}
        backLabel={t.japanese.back}
        title={t.japanese.title}
        right={
          <button
            type="button"
            className={styles.toggle}
            aria-pressed={furigana}
            onClick={() => setFurigana(!furigana)}
          >
            {t.japanese.furigana}
            <span className={styles.switch} aria-hidden="true">
              <span className={styles.knob} />
            </span>
          </button>
        }
      />

      {data.source === "demo" && (
        <div className={styles.demo} role="note">
          {demo ? t.japanese.demoNote : t.japanese.devDemoNote}
        </div>
      )}

      <section className={styles.card}>
        <p className={styles.text} lang="ja">
          <RubyText parts={text} />
        </p>
        <div className={styles.playRow}>
          <SpeakButton text={toSpeechText(text)} lang="ja-JP" rate={rate} label={t.japanese.play} className={styles.play}>
            {t.japanese.play}
          </SpeakButton>
          <button
            type="button"
            className={styles.rate}
            aria-label={t.japanese.rate(rate)}
            onClick={() => setRate(rate === 0.8 ? 1 : 0.8)}
          >
            {rate}x
          </button>
        </div>
      </section>

      <section className={styles.patterns}>
        <h2 className={styles.sectionTitle}>{t.japanese.patterns}</h2>
        {data.patterns.map((p, i) => (
          <div key={i} className={styles.pattern}>
            <div className={styles.patternText} lang="ja">
              <RubyText parts={applyReadingFixes(p.pattern, corrections)} />
            </div>
            <div className={styles.explanation}>{p.explanation}</div>
          </div>
        ))}
      </section>

      <div className={styles.actions}>
        <button type="button" className={`${styles.button} ${styles.outlineButton}`} onClick={openEditor}>
          {t.japanese.editReadings}
        </button>
        {/* TODO: 建立日文複習排程（ReviewSchedule），並把這題標記為完成 */}
        <Link href="/" className={`${styles.button} ${styles.jaButton}`}>
          {t.japanese.done}
        </Link>
      </div>

      <BottomSheet open={editing} onClose={() => setEditing(false)} title={t.japanese.editReadings}>
        <div className={styles.editorList}>
          <p className={styles.editorHint}>{t.japanese.editorHint}</p>
          {words.map((w) => (
            <label key={readingKey(w)} className={styles.editorRow}>
              <span className={styles.editorBase} lang="ja">
                {w.base}
              </span>
              <input
                className={styles.editorInput}
                lang="ja"
                value={draft[readingKey(w)] ?? w.reading}
                onChange={(e) => setDraft((d) => ({ ...d, [readingKey(w)]: e.target.value }))}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
              />
            </label>
          ))}
        </div>
        <div className={styles.editorActions}>
          <button
            type="button"
            className={`${styles.button} ${styles.outlineButton}`}
            onClick={() => setDraft({})}
          >
            {t.japanese.resetAll}
          </button>
          <button type="button" className={`${styles.button} ${styles.saveButton}`} onClick={saveEditor}>
            {t.common.save}
          </button>
        </div>
      </BottomSheet>
    </main>
  );
}
