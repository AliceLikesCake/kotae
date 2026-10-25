// npm run build 時先執行：部署到 Vercel 正式環境時，把資料表更新到最新（prisma migrate deploy）。
// 本機 build 和預覽部署（PR）跳過，避免還沒合併的 migration 改到正式資料庫。

import { execSync } from "node:child_process";
import { migrateDemo } from "./migrate-demo.mjs";

if (process.env.VERCEL_ENV !== "production") {
  console.log("[migrate] 不是 Vercel 正式環境，跳過 prisma migrate deploy");
} else if (!process.env.DATABASE_URL) {
  // 第一次部署時還沒接上 Neon：先讓部署成功，接好資料庫後重新部署就會更新資料表
  console.warn("[migrate] 還沒設定 DATABASE_URL（Neon 還沒接上），跳過 prisma migrate deploy");
} else {
  execSync("npx prisma migrate deploy", { stdio: "inherit" });
  migrateDemo(process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL);
}
