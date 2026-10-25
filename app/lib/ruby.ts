// 日文注音的資料格式和小工具。伺服器端和瀏覽器端都會用到，所以不能放會呼叫 AI 的程式。

/** 一般文字，或一個加注音的詞 */
export type RubyPart = string | { base: string; reading: string };

/** 把 "{現職|げんしょく}では" 這種寫法轉成注音片段 */
export function parseRuby(source: string): RubyPart[] {
  const parts: RubyPart[] = [];
  let last = 0;
  for (const m of source.matchAll(/\{([^|}]+)\|([^}]+)\}/g)) {
    if (m.index > last) parts.push(source.slice(last, m.index));
    parts.push({ base: m[1], reading: m[2] });
    last = m.index + m[0].length;
  }
  if (last < source.length) parts.push(source.slice(last));
  return parts;
}

/** 朗讀用：漢字換成讀音，改過的讀音念出來也會跟著變 */
export function toSpeechText(parts: RubyPart[]): string {
  return parts.map((p) => (typeof p === "string" ? p : p.reading)).join("");
}

/** 讀音修正：key 是「漢字|原本讀音」，value 是改過的讀音 */
export type ReadingFixes = Record<string, string>;

export const readingKey = (p: { base: string; reading: string }) => `${p.base}|${p.reading}`;

/** 套用讀音修正（日文版頁面和日文翻卡共用） */
export function applyReadingFixes(parts: RubyPart[], fixes: ReadingFixes): RubyPart[] {
  return parts.map((p) => (typeof p === "string" ? p : { ...p, reading: fixes[readingKey(p)] ?? p.reading }));
}
