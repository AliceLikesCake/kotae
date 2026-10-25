// 日期小工具。「今天」一律用台灣時間算，伺服器在哪個時區都一樣（Vercel 的伺服器是 UTC）。
// 資料庫的 DATE 欄位只存年月日，這裡用「UTC 午夜」的 Date 代表某一天，加減天數比較單純。

export const TIME_ZONE = "Asia/Taipei";

const DAY_MS = 24 * 60 * 60 * 1000;

/** 台灣時間今天的日期，存進 / 比較 DATE 欄位用 */
export function today(): Date {
  // en-CA 的格式剛好是 2026-10-03
  const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(new Date());
  return new Date(`${ymd}T00:00:00Z`);
}

export function addDays(day: Date, days: number): Date {
  return new Date(day.getTime() + days * DAY_MS);
}

/** 兩個日期差幾天 */
export function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / DAY_MS);
}

/** 台灣時間今天 00:00 的那一刻，比較 DATETIME 欄位（例如複習時間）用 */
export function startOfToday(): Date {
  return startOfDay(today());
}

/** 台灣時間這個月 1 號 00:00 的那一刻 */
export function startOfMonth(): Date {
  return startOfDay(new Date(`${dayKey(today()).slice(0, 7)}-01T00:00:00Z`));
}

/** 某一天（DATE）在台灣時間 00:00 的那一刻 */
function startOfDay(day: Date): Date {
  const offset = new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, timeZoneName: "longOffset" })
    .formatToParts(day)
    .find((p) => p.type === "timeZoneName")?.value; // 例如 "GMT+08:00"
  const m = offset?.match(/GMT([+-])(\d{2}):(\d{2})/);
  const minutes = m ? (m[1] === "-" ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3])) : 0;
  return new Date(day.getTime() - minutes * 60 * 1000);
}

/** DATE 欄位的日期轉成 "2026-10-08" */
export function dayKey(day: Date): string {
  return day.toISOString().slice(0, 10);
}

/** DATETIME（某一刻）在台灣是哪一天，例如 "2026-10-08" */
export function localDayKey(instant: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(instant);
}
