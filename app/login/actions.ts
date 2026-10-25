"use server";

import { redirect } from "next/navigation";
import { getT } from "../i18n/server";
import { createSession, deleteSession, endDemoSession, startDemoSession, verifyPassword } from "../lib/auth";
import { prepareDemoData } from "../lib/demo-seed";

export type LoginState = { error: string } | undefined;

/** 只接受站內路徑，避免被利用導到外部網站 */
function safeNext(value: FormDataEntryValue | null) {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const t = await getT();
  const password = formData.get("password");
  if (typeof password !== "string" || !password) return { error: t.login.passwordRequired };

  if (!(await verifyPassword(password))) {
    // 密碼錯誤時稍微等一下，讓人沒辦法快速一直猜
    await new Promise((resolve) => setTimeout(resolve, 800));
    return { error: t.login.wrongPassword };
  }

  await createSession(formData.get("remember") === "on");
  redirect(safeNext(formData.get("next")));
}

/** 「Try the demo」：準備好範例資料，發示範模式的 cookie，進首頁 */
export async function startDemo() {
  await prepareDemoData();
  await startDemoSession();
  redirect("/");
}

/** 離開示範模式，回登入頁 */
export async function leaveDemo() {
  await endDemoSession();
  redirect("/login");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
