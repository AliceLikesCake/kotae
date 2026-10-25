import "server-only";
import { scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isDemo } from "./demo-session";
import {
  createDemoToken,
  createSessionToken,
  DEMO_COOKIE,
  DEMO_HOURS,
  REMEMBER_DAYS,
  SESSION_COOKIE,
  SHORT_SESSION_HOURS,
  verifySessionToken,
} from "./session";

const scryptAsync = promisify(scrypt) as (password: string, salt: Buffer, keylen: number) => Promise<Buffer>;

/**
 * 比對密碼。.env.local 的 KOTAE_PASSWORD_HASH 格式是 scrypt:<salt>:<hash>（base64url），
 * 由 scripts/set-password.mjs 產生。跟資料庫存密碼雜湊是同樣的觀念：只存雜湊，不存密碼本身。
 */
export async function verifyPassword(password: string): Promise<boolean> {
  const stored = process.env.KOTAE_PASSWORD_HASH;
  if (!stored) throw new Error("缺少 KOTAE_PASSWORD_HASH，請先執行 node scripts/set-password.mjs");
  const [algorithm, saltPart, hashPart] = stored.split(":");
  if (algorithm !== "scrypt" || !saltPart || !hashPart) throw new Error("KOTAE_PASSWORD_HASH 格式不正確");
  const expected = Buffer.from(hashPart, "base64url");
  const actual = await scryptAsync(password, Buffer.from(saltPart, "base64url"), expected.length);
  return timingSafeEqual(expected, actual);
}

/** 登入成功後發 cookie。remember 為 true 時保留 30 天，否則關掉瀏覽器就失效 */
export async function createSession(remember: boolean) {
  const lifetime = remember ? REMEMBER_DAYS * 24 * 60 * 60 * 1000 : SHORT_SESSION_HOURS * 60 * 60 * 1000;
  const expiresAt = Date.now() + lifetime;
  (await cookies()).set(SESSION_COOKIE, createSessionToken(expiresAt), {
    httpOnly: true, // 瀏覽器的 JavaScript 讀不到
    secure: process.env.NODE_ENV === "production", // 正式環境只走 https；開發時用 http 也能登入
    sameSite: "lax",
    path: "/",
    // 沒給 expires 就是「工作階段 cookie」，關掉瀏覽器就消失
    expires: remember ? new Date(expiresAt) : undefined,
  });
}

export async function deleteSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function isLoggedIn() {
  return verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value);
}

/** Server Action 開頭呼叫：沒登入（也不是示範模式）就導回登入頁 */
export async function requireLogin() {
  if (!(await isLoggedIn()) && !(await isDemo())) redirect("/login");
}

/** 進入示範模式：發示範 cookie（關掉瀏覽器就失效，最長 DEMO_HOURS 小時） */
export async function startDemoSession() {
  const expiresAt = Date.now() + DEMO_HOURS * 60 * 60 * 1000;
  (await cookies()).set(DEMO_COOKIE, createDemoToken(expiresAt), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

export async function endDemoSession() {
  (await cookies()).delete(DEMO_COOKIE);
}
