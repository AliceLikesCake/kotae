"use client";

import { useFormStatus } from "react-dom";
import { useT } from "../i18n/client";
import { startDemo } from "./actions";
import styles from "./login.module.css";

type Labels = { title: string; sub: string; pending: string };

function Submit({ labels }: { labels: Labels }) {
  // useFormStatus：外層表單送出中時 pending 為 true（準備範例資料要一兩秒）
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={styles.demo} disabled={pending}>
      <span className={styles.demoTitle}>{pending ? labels.pending : labels.title}</span>
      <span className={styles.demoSub}>{labels.sub}</span>
    </button>
  );
}

// 給履歷上的訪客：不用密碼，用範例資料逛逛（示範模式）。
// labels 沒給就用目前語言（About 頁固定英文，會自己給）
export default function DemoButton({ labels }: { labels?: Labels }) {
  const t = useT();
  return (
    <form action={startDemo}>
      <Submit labels={labels ?? { title: t.login.tryDemo, sub: t.login.tryDemoSub, pending: t.login.preparingDemo }} />
    </form>
  );
}
