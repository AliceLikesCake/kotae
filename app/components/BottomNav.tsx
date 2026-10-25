"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "../i18n/client";
import styles from "./BottomNav.module.css";

const ITEMS = [
  { href: "/", label: "today", icon: "M4 11l8-7 8 7v9h-5v-6H9v6H4z" },
  { href: "/practice", label: "practice", icon: "M4 20h4L19 9l-4-4L4 16z" },
  { href: "/review", label: "review", icon: "M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5" },
  { href: "/history", label: "history", icon: "M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" },
] as const;

export default function BottomNav() {
  const pathname = usePathname();
  const t = useT();

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        {ITEMS.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={active ? `${styles.item} ${styles.active}` : styles.item}
              aria-current={active ? "page" : undefined}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d={item.icon} />
              </svg>
              {t.nav[item.label]}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
