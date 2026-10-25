import { getUsageSummary } from "../lib/ai-usage";
import { connection } from "next/server";
import { isDemo } from "../lib/demo-session";
import { getSettings } from "../lib/profile-store";
import { getReplaceableTodayIds } from "../lib/question-store";
import SettingsView from "./SettingsView";

export default async function SettingsPage() {
  await connection(); // 每次請求才產生（資料每次不同，build 時不要先產生）
  const [settings, usage, replaceable, demo] = await Promise.all([
    getSettings(),
    getUsageSummary(),
    getReplaceableTodayIds(),
    isDemo(),
  ]);
  return <SettingsView initialSettings={settings} usage={usage} replaceableCount={replaceable.length} demo={demo} />;
}
