import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { getLocale } from "../i18n/server";
import { isDemo } from "./demo-session";
import { AiError } from "./ai-errors";
import { recordUsage } from "./ai-usage";

export { AiError };

// 呼叫 Claude API 的共用工具。只在伺服器端執行，金鑰從 .env.local 的 ANTHROPIC_API_KEY 讀取。

export const MODELS = {
  /** 出題、回饋、翻譯 */
  main: "claude-sonnet-5-5",
  /** 英文複習評分 */
  light: "claude-haiku-4-5",
} as const;

/** 每 100 萬 token 的價格（美金），用來在終端機估算每次花費 */
const PRICES: Record<string, { input: number; output: number; cacheRead: number; cacheWrite: number }> = {
  "claude-sonnet-5-5": { input: 2, output: 10, cacheRead: 0.2, cacheWrite: 2.5 },
  "claude-haiku-4-5": { input: 1, output: 5, cacheRead: 0.1, cacheWrite: 1.25 },
};

/**
 * 介面是英文時加在最後的指示：各功能的指示都寫「說明文字用繁體中文」，這裡請 Claude 改用英文。
 * 放在使用者訊息（或對話背景）的最後，前面每次都一樣的指示仍然可以快取。
 */
const ENGLISH_NOTE =
  "【說明文字的語言】這位使用者的介面是英文。上面要求用繁體中文寫的說明文字（例如提示、主題、評語、修改說明、重點、句型說明、回答），這次一律改用自然、簡單的英文寫。" +
  "例外：題目的 zh 欄位仍然寫繁體中文意思；日文內容維持日文。";

async function languageNote(): Promise<string> {
  return (await getLocale()) === "en" ? `\n\n${ENGLISH_NOTE}` : "";
}

/**
 * 這次要不要真的呼叫 Claude：.env.local 設 KOTAE_AI_LIVE=1 才會；沒設就用示範內容，不花錢。
 * 示範模式一律不呼叫（訪客不會花到 API 費用）。
 */
export async function aiEnabled() {
  return process.env.KOTAE_AI_LIVE === "1" && !(await isDemo());
}

let client: Anthropic | null = null;
function getClient() {
  // 不給參數時，官方套件會自動讀 ANTHROPIC_API_KEY
  client ??= new Anthropic();
  return client;
}

/** 印出這次的用量和費用，並寫進用量紀錄（設定頁會顯示） */
async function logUsage(label: string, model: string, usage: Anthropic.Beta.BetaUsage, seconds: number) {
  const price = PRICES[model] ?? PRICES[MODELS.main];
  const cacheRead = usage.cache_read_input_tokens ?? 0;
  const cacheWrite = usage.cache_creation_input_tokens ?? 0;
  const cost =
    (usage.input_tokens * price.input +
      cacheRead * price.cacheRead +
      cacheWrite * price.cacheWrite +
      usage.output_tokens * price.output) /
    1_000_000;
  const thinking = usage.output_tokens_details?.thinking_tokens ?? 0;
  console.log(
    `[AI] ${label}｜${model}｜${seconds.toFixed(1)} 秒｜輸入 ${usage.input_tokens}（快取讀 ${cacheRead}、寫 ${cacheWrite}）` +
      `｜輸出 ${usage.output_tokens}（思考 ${thinking}）｜約 $${cost.toFixed(4)}`,
  );
  await recordUsage({
    label,
    model,
    inputTokens: usage.input_tokens + cacheRead + cacheWrite,
    outputTokens: usage.output_tokens,
    cost,
    seconds: Math.round(seconds * 10) / 10,
  });
}

type Effort = "low" | "medium" | "high";

/** Haiku 4.5 不支援思考程度（effort）和自動改由其他模型回答（fallbacks），只有主要模型才送 */
function supportsEffortAndFallback(model: string) {
  return model === MODELS.main;
}

/** 呼叫 Claude 的共用部分：送出、記錄用量、處理錯誤，回傳文字回答 */
async function callClaude(options: {
  label: string;
  model: string;
  /** 每次都一樣的指示放第一段（會被快取）；同一題會重複用到的背景可以放第二段 */
  system: string[];
  messages: Anthropic.Beta.BetaMessageParam[];
  /** Haiku 不支援，會被忽略 */
  effort?: Effort;
  maxTokens: number;
  schema?: Record<string, unknown>;
}): Promise<string> {
  let response: Anthropic.Beta.BetaMessage;
  const startedAt = performance.now();
  const advanced = supportsEffortAndFallback(options.model);
  try {
    response = await getClient().beta.messages.create({
      model: options.model,
      max_tokens: options.maxTokens,
      // 萬一 Claude 因安全規則拒答，自動改由其他模型回答
      ...(advanced && { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const }),
      system: options.system.map((text) => ({ type: "text" as const, text, cache_control: { type: "ephemeral" as const } })),
      messages: options.messages,
      output_config: {
        ...(advanced && options.effort && { effort: options.effort }),
        ...(options.schema && { format: { type: "json_schema" as const, schema: options.schema } }),
      },
    });
  } catch (error) {
    console.error(`[AI] ${options.label} 失敗：`, error);
    if (error instanceof Anthropic.AuthenticationError) throw new AiError("auth");
    if (error instanceof Anthropic.RateLimitError) throw new AiError("rateLimit");
    if (error instanceof Anthropic.APIConnectionError) throw new AiError("connection");
    if (error instanceof Anthropic.APIError) throw new AiError("unavailable");
    throw new AiError("config");
  }

  await logUsage(options.label, response.model, response.usage, (performance.now() - startedAt) / 1000);

  if (response.stop_reason === "refusal") throw new AiError("refusal");
  if (response.stop_reason === "max_tokens") throw new AiError("truncated");

  const text = response.content.find((block) => block.type === "text")?.text;
  if (!text) throw new AiError("empty");
  return text;
}

/**
 * 請 Claude 依照 JSON Schema 回答，回傳解析好的物件。
 * system 放每次都一樣的指示（會被快取，重複送比較便宜），user 放這次的題目和回答。
 */
export async function askJson<T>(options: {
  label: string;
  model: string;
  system: string;
  user: string;
  schema: Record<string, unknown>;
  /** Haiku 不支援，可以不給 */
  effort?: Effort;
  maxTokens?: number;
}): Promise<T> {
  const text = await callClaude({
    label: options.label,
    model: options.model,
    system: [options.system],
    messages: [{ role: "user", content: options.user + (await languageNote()) }],
    effort: options.effort,
    maxTokens: options.maxTokens ?? 16000,
    schema: options.schema,
  });
  try {
    return JSON.parse(text) as T;
  } catch {
    console.error(`[AI] ${options.label} 回傳的不是 JSON：`, text.slice(0, 500));
    throw new AiError("badFormat");
  }
}

/** 多輪對話：送出指示、背景和到目前為止的對話，回傳 Claude 的文字回答 */
export async function askChat(options: {
  label: string;
  model: string;
  system: string;
  context: string;
  messages: { role: "user" | "assistant"; content: string }[];
  effort: Effort;
  maxTokens?: number;
}): Promise<string> {
  return callClaude({
    label: options.label,
    model: options.model,
    system: [options.system, options.context + (await languageNote())],
    messages: options.messages,
    effort: options.effort,
    maxTokens: options.maxTokens ?? 8000,
  });
}
