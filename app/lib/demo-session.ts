import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { DEMO_COOKIE, verifyDemoToken } from "./session";

// 目前的請求是不是示範模式。示範模式讀寫 demo schema、不呼叫 Claude、介面固定英文。
// cache：同一個請求裡只讀一次 cookie。
export const isDemo = cache(async (): Promise<boolean> => {
  return verifyDemoToken((await cookies()).get(DEMO_COOKIE)?.value);
});
