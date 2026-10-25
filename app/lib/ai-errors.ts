// AI 呼叫失敗的種類。畫面上的訊息依目前語言從字典（aiErrors）取，詳細原因印在終端機。

export type AiErrorCode =
  | "auth"
  | "rateLimit"
  | "connection"
  | "unavailable"
  | "config"
  | "refusal"
  | "truncated"
  | "empty"
  | "badFormat";

/** 給使用者看的錯誤（code 對應字典裡的訊息） */
export class AiError extends Error {
  constructor(public code: AiErrorCode) {
    super(code);
  }
}
