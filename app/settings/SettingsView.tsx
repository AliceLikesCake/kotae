"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import TopBar from "../components/TopBar";
import { LOCALES, type Locale } from "../i18n";
import { setLocaleAction } from "../i18n/actions";
import { useLocale, useT } from "../i18n/client";
import type { UsageSummary } from "../lib/ai-usage";
import { leaveDemo, logout } from "../login/actions";
import type { Settings, Theme } from "../lib/settings";
import { regenerateTodayAction, saveSettingsAction } from "./actions";
import styles from "./settings.module.css";

// 主題預覽色固定寫死，這樣不管目前是哪個主題，都看得到兩種的樣子
const THEMES: { id: Theme; bg: string; ink: string; swatches: string[] }[] = [
  { id: "ink", bg: "#F5F2EA", ink: "#1F2328", swatches: ["#1F2328", "#2F45A0", "#B8432B"] },
  { id: "blue", bg: "#EEF1F3", ink: "#3C4D5C", swatches: ["#3C4D5C", "#6D8CAA", "#9A6560"] },
];

/** 語言按鈕上的名稱：用各自的語言寫，不管目前是哪個語言都認得出來 */
const LOCALE_NAMES: Record<Locale, string> = { zh: "中文", en: "English" };

function Stepper({
  value,
  min,
  max,
  step = 1,
  onChange,
  decLabel,
  incLabel,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  decLabel: string;
  incLabel: string;
}) {
  return (
    <div className={styles.stepper}>
      <button
        type="button"
        className={styles.stepButton}
        aria-label={decLabel}
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - step))}
      >
        −
      </button>
      <span className={styles.stepValue} aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className={styles.stepButton}
        aria-label={incLabel}
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + step))}
      >
        +
      </button>
    </div>
  );
}

function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={styles.switch}
      onClick={() => onChange(!checked)}
    >
      <span className={styles.knob} />
    </button>
  );
}

/** 改完設定後等多久才存（打字時不要每個字都存一次） */
const SAVE_DELAY_MS = 600;

export default function SettingsView({
  initialSettings,
  usage,
  replaceableCount,
  demo,
}: {
  initialSettings: Settings;
  /** 示範模式：語言固定英文（不顯示切換），登出改成離開示範模式 */
  demo: boolean;
  usage: UsageSummary;
  /** 今天還沒做、可以重出的題數 */
  replaceableCount: number;
}) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const [switchingLocale, startLocaleSwitch] = useTransition();
  const [settings, setSettings] = useState(initialSettings);
  /** 還沒存進資料庫的設定；null 表示都存好了 */
  const pending = useRef<Settings | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  function flush() {
    clearTimeout(timer.current);
    if (!pending.current) return;
    saveSettingsAction(pending.current).catch((error) => console.error("[設定] 儲存失敗：", error));
    pending.current = null;
  }

  // 離開設定頁時，把還沒存的設定馬上存起來
  useEffect(() => flush, []);

  function updateSettings(patch: Partial<Settings>) {
    const next = { ...settings, ...patch };
    setSettings(next);
    pending.current = next;
    clearTimeout(timer.current);
    timer.current = setTimeout(flush, SAVE_DELAY_MS);
  }

  // 切換主題時馬上換顏色，不用等存好（重新整理後由 layout 從資料庫讀取）
  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
  }, [settings.theme]);

  const [regenerating, startRegenerate] = useTransition();
  const [regenerateMessage, setRegenerateMessage] = useState<{ ok: boolean; text: string } | null>(null);

  function handleRegenerate() {
    setRegenerateMessage(null);
    // 要用的是畫面上目前的設定，所以取消還沒送出的自動儲存，一起交給伺服器
    clearTimeout(timer.current);
    pending.current = null;
    startRegenerate(async () => {
      const result = await regenerateTodayAction(settings);
      setRegenerateMessage(result.ok ? { ok: true, text: t.settings.regenerated } : { ok: false, text: result.error });
    });
  }

  function pickTheme(theme: Theme) {
    updateSettings({ theme });
  }

  function pickLocale(next: Locale) {
    if (next === locale) return;
    startLocaleSwitch(async () => {
      await setLocaleAction(next);
      router.refresh(); // 重新產生頁面，換成新語言
    });
  }

  // 每題英文、日文各一份，加上 1/3/7/14/30 天的間隔，養成習慣後大約是每日題數的 10 倍
  const reviewEstimate = settings.dailyTotal * 10;

  return (
    <main className={styles.page}>
      <TopBar backHref="/" backLabel={t.common.backHome} title={t.settings.title} />

      {!demo && (
        <section className={styles.section}>
          <div className={styles.sectionLabel}>{t.settings.language}</div>
          <div className={styles.group}>
            <div className={styles.row}>
              <span>{t.settings.language}</span>
              <div className={styles.segmented}>
                {LOCALES.map((id) => (
                  <button
                    key={id}
                    type="button"
                    lang={id === "zh" ? "zh-Hant" : "en"}
                    className={styles.segment}
                    aria-pressed={locale === id}
                    disabled={switchingLocale}
                    onClick={() => pickLocale(id)}
                  >
                    {LOCALE_NAMES[id]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <section className={styles.section}>
        <div className={styles.sectionLabel}>{t.settings.theme}</div>
        <div className={styles.themes}>
          {THEMES.map((theme) => (
            <button
              key={theme.id}
              type="button"
              className={styles.theme}
              style={{ background: theme.bg, borderColor: settings.theme === theme.id ? "var(--ink)" : "transparent" }}
              aria-pressed={settings.theme === theme.id}
              onClick={() => pickTheme(theme.id)}
            >
              <span className={styles.swatches}>
                {theme.swatches.map((c) => (
                  <span key={c} className={styles.swatch} style={{ background: c }} />
                ))}
              </span>
              <span className={styles.themeName} style={{ color: theme.ink }}>
                {t.settings.themes[theme.id]}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <label htmlFor="bio" className={styles.sectionLabel}>
          {t.settings.bio}
        </label>
        <textarea
          id="bio"
          className={styles.bio}
          value={settings.bio}
          onChange={(e) => updateSettings({ bio: e.target.value })}
        />
      </section>

      <section className={styles.section}>
        <div className={styles.sectionLabel}>{t.settings.daily}</div>
        <div className={`${styles.group} ${styles.padded}`}>
          <div className={styles.stepRow}>
            <div className={styles.rowText}>
              <span className={styles.rowTitle}>{t.settings.perDay}</span>
              <span className={styles.rowSub}>{t.settings.perDaySub}</span>
            </div>
            <Stepper
              value={settings.dailyTotal}
              min={1}
              max={10}
              decLabel={t.settings.perDayDec}
              incLabel={t.settings.perDayInc}
              onChange={(total) => updateSettings({ dailyTotal: total })}
            />
          </div>
          <div className={styles.stepRow}>
            <div className={styles.rowText}>
              <span className={styles.rowTitle}>{t.settings.cap}</span>
              <span className={styles.rowSub}>{t.settings.capSub}</span>
            </div>
            <Stepper
              value={settings.reviewCap}
              min={10}
              max={100}
              step={10}
              decLabel={t.settings.capDec}
              incLabel={t.settings.capInc}
              onChange={(cap) => updateSettings({ reviewCap: cap })}
            />
          </div>
          <div className={styles.note}>{t.settings.estimate(reviewEstimate, settings.reviewCap)}</div>
          {replaceableCount > 0 && (
            <>
              <div className={styles.divider} />
              <div className={styles.rowSub}>{t.settings.replaceable(replaceableCount)}</div>
              <button type="button" className={styles.regenerate} onClick={handleRegenerate} disabled={regenerating}>
                {regenerating ? t.settings.regenerating : t.settings.regenerate}
              </button>
              {regenerateMessage && (
                <div className={regenerateMessage.ok ? styles.note : styles.error} role="status">
                  {regenerateMessage.text}
                  {regenerateMessage.ok && (
                    <>
                      {" "}
                      <Link href="/practice">{t.settings.goPractice}</Link>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionLabel}>{t.settings.jaSection}</div>
        <div className={styles.group}>
          <div className={styles.row}>
            <span>{t.settings.furigana}</span>
            <Switch label={t.settings.furigana} checked={settings.furigana} onChange={(v) => updateSettings({ furigana: v })} />
          </div>
          <div className={styles.row}>
            <span>{t.settings.speechRate}</span>
            <div className={styles.segmented}>
              {([0.8, 1] as const).map((rate) => (
                <button
                  key={rate}
                  type="button"
                  className={styles.segment}
                  aria-pressed={settings.speechRate === rate}
                  onClick={() => updateSettings({ speechRate: rate })}
                >
                  {rate.toFixed(1)}x
                </button>
              ))}
            </div>
          </div>
          <div className={styles.row}>
            <div className={styles.rowText}>
              <span>{t.settings.reminder}</span>
              <span className={styles.rowSub}>{t.settings.reminderSub}</span>
            </div>
            {/* TODO: 做成 PWA 後接上推播通知 */}
            <Switch label={t.settings.reminder} checked={settings.reminder} onChange={(v) => updateSettings({ reminder: v })} />
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionLabel}>{t.settings.usage}</div>
        <div className={styles.group}>
          {(["today", "month", "total"] as const).map((id) => (
            <div key={id} className={styles.row}>
              <div className={styles.rowText}>
                <span>{t.settings.periods[id]}</span>
                <span className={styles.rowSub}>{t.settings.calls(usage[id].calls)}</span>
              </div>
              <span className={styles.cost}>{t.settings.cost(usage[id].cost)}</span>
            </div>
          ))}
        </div>
        <p className={styles.usageNote}>
          {t.settings.usageNote.before}
          <a href="https://console.anthropic.com/usage" target="_blank" rel="noreferrer">
            {t.settings.usageNote.link}
          </a>
          {t.settings.usageNote.after}
        </p>
      </section>

      <Link href="/about" className={styles.about}>
        {t.settings.about} →
      </Link>

      {/* 表單直接呼叫伺服器的 logout：刪掉登入 cookie，再導回登入頁 */}
      <form action={demo ? leaveDemo : logout} className={styles.logoutForm}>
        <button type="submit" className={styles.logout}>
          {demo ? t.settings.leaveDemo : t.settings.logout}
        </button>
      </form>
    </main>
  );
}
