// Prisma 命令列工具（migrate、generate）的設定。網站執行時不會用到這個檔案。

import { defineConfig } from "prisma/config";

// Prisma 不會自動讀 .env.local，這裡用 Node.js 內建功能讀進來。
// 上線環境（Vercel）沒有這個檔案，連線字串直接設在環境變數，所以讀不到就略過。
try {
  process.loadEnvFile(".env.local");
} catch {}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  // migrate 要用直連的網址（Neon 的 DATABASE_URL_UNPOOLED），網站平常用經過連線池的 DATABASE_URL。
  // 本機只有 DATABASE_URL。沒設定時 generate 仍可執行，migrate 才需要連線字串
  datasource: { url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL },
});
