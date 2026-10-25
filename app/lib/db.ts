import "server-only";
import { cache } from "react";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";
import { isDemo } from "./demo-session";

// 資料庫連線（Prisma + PostgreSQL）。整個網站共用 PrismaClient，裡面有連線池。
// 放在 globalThis，開發時存檔觸發重新載入程式，也不會每次都開一個新的連線池。
//
// 示範模式用同一個資料庫的另一個 schema「demo」（表格一樣，資料是範例），
// 就像 SQL Server 的 dbo.Question 和 demo.Question。查資料前用 getDb() 拿到這次該用的那一個。

function createClient(schema?: string) {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("沒有設定 DATABASE_URL，請在 .env.local（或 Vercel 的環境變數）加上資料庫連線字串");
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: url }, schema ? { schema } : undefined) });
}

const globalForPrisma = globalThis as { kotaePrisma?: PrismaClient; kotaeDemoPrisma?: PrismaClient };

// 第一次真的用到時才建立連線。這樣 next build 載入程式時，就算還沒設定 DATABASE_URL 也不會失敗。
function mainClient() {
  return (globalForPrisma.kotaePrisma ??= createClient());
}

/** demo schema 的連線（重設示範資料時直接用） */
export function demoClient() {
  return (globalForPrisma.kotaeDemoPrisma ??= createClient("demo"));
}

/** 這次請求要用的資料庫：示範模式是 demo schema，平常是正式資料 */
export const getDb = cache(async (): Promise<PrismaClient> => ((await isDemo()) ? demoClient() : mainClient()));
