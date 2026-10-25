import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

// 登入 cookie：內容是「到期時間.簽章」，簽章用 .env.local 的 KOTAE_SESSION_SECRET 計算。
// 沒有密鑰就算不出正確簽章，所以無法偽造。proxy.ts 和 auth.ts 共用這個檔案。

export const SESSION_COOKIE = "kotae-session";
export const REMEMBER_DAYS = 30;
/** 沒勾「記住這台裝置」時，最長有效時間 */
export const SHORT_SESSION_HOURS = 12;

/** 示範模式的 cookie：不用密碼，進去看的是 demo schema 的範例資料 */
export const DEMO_COOKIE = "kotae-demo";
export const DEMO_HOURS = 3;

function secret() {
  const value = process.env.KOTAE_SESSION_SECRET;
  if (!value) throw new Error("缺少 KOTAE_SESSION_SECRET，請先執行 node scripts/set-password.mjs");
  return value;
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

/** 比對簽章（用固定時間比對，避免從回應時間猜出簽章） */
function sameSignature(signature: string, payload: string) {
  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(signature);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function createSessionToken(expiresAt: number) {
  return `${expiresAt}.${sign(String(expiresAt))}`;
}

/** cookie 有效（簽章正確且沒過期）就回傳 true */
export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const [expiresPart, signature] = token.split(".");
  const expiresAt = Number(expiresPart);
  if (!Number.isFinite(expiresAt) || !signature || expiresAt < Date.now()) return false;
  return sameSignature(signature, String(expiresAt));
}

// 示範模式的 cookie 內容是「demo.到期時間.簽章」，簽的內容多了 demo，所以不能拿來當登入 cookie 用

export function createDemoToken(expiresAt: number) {
  return `demo.${expiresAt}.${sign(`demo.${expiresAt}`)}`;
}

export function verifyDemoToken(token: string | undefined): boolean {
  if (!token) return false;
  const [prefix, expiresPart, signature] = token.split(".");
  const expiresAt = Number(expiresPart);
  if (prefix !== "demo" || !Number.isFinite(expiresAt) || !signature || expiresAt < Date.now()) return false;
  return sameSignature(signature, `demo.${expiresAt}`);
}
