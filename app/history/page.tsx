import BottomNav from "../components/BottomNav";
import { connection } from "next/server";
import { getHistory } from "../lib/history-data";
import HistoryView from "./HistoryView";

export default async function HistoryPage() {
  await connection(); // 每次請求才產生（資料每次不同，build 時不要先產生）
  const entries = await getHistory();
  return (
    <>
      <HistoryView entries={entries} />
      <BottomNav />
    </>
  );
}
