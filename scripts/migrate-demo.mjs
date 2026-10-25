// 把 demo schema（示範模式的範例資料）的資料表更新到最新，用的是和正式資料一樣的 migration。
// 本機：node scripts/migrate-demo.mjs（讀 .env.local 的 DATABASE_URL）
// 上線：migrate-production.mjs 會在更新正式資料表之後呼叫這裡。

import { execSync } from "node:child_process";
import { pathToFileURL } from "node:url";

/** 連線字串加上 ?schema=demo，Prisma 就會在 demo schema 建表（沒有這個 schema 會自動建立） */
export function migrateDemo(baseUrl) {
  const url = new URL(baseUrl);
  url.searchParams.set("schema", "demo");
  console.log("[migrate] 更新 demo schema（示範模式）");
  // prisma.config.ts 優先用 DATABASE_URL_UNPOOLED，所以把它換成 demo 的網址
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL_UNPOOLED: url.toString() },
  });
}

// 直接執行這個檔案時（本機）
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    process.loadEnvFile(".env.local");
  } catch {}
  const base = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
  if (!base) throw new Error("沒有設定 DATABASE_URL");
  migrateDemo(base);
}
