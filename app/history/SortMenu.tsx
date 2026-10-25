"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useT } from "../i18n/client";
import styles from "./history.module.css";

// 自製下拉選單：原生 <select> 點開後的清單無法套樣式
export default function SortMenu<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const menuId = useId();
  const current = options.find((o) => o.id === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    // 打開時把焦點移到目前選中的項目
    optionRefs.current[options.findIndex((o) => o.id === value)]?.focus();
    // 點選單外面就關閉
    function onPointerDown(e: PointerEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open, options, value]);

  function close() {
    setOpen(false);
    buttonRef.current?.focus();
  }

  function choose(id: T) {
    onChange(id);
    close();
  }

  function handleMenuKeyDown(e: React.KeyboardEvent) {
    const items = optionRefs.current;
    const index = items.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const next = (index + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
      items[next]?.focus();
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  }

  return (
    <div ref={wrapRef} className={styles.sortWrap}>
      <button
        ref={buttonRef}
        type="button"
        className={styles.sort}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`${label}${t.common.colon}${current.label}`}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" && !open) {
            e.preventDefault();
            setOpen(true);
          }
        }}
      >
        {current.label}
        <svg
          className={styles.sortChevron}
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div id={menuId} role="menu" aria-label={label} className={styles.sortMenu} onKeyDown={handleMenuKeyDown}>
          {options.map((o, i) => (
            <button
              key={o.id}
              ref={(el) => {
                optionRefs.current[i] = el;
              }}
              type="button"
              role="menuitemradio"
              aria-checked={o.id === value}
              className={styles.sortOption}
              onClick={() => choose(o.id)}
            >
              <svg
                className={styles.sortCheck}
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 12l5 5 9-10" />
              </svg>
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
