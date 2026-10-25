import "server-only";
import { startOfMonth, startOfToday } from "./dates";
import { getDb } from "./db";

// AI 用量紀錄：每次呼叫 Claude 都在 AiUsage 資料表加一筆。
// 這裡的金額是依公開價格估算的；正式帳單以 Anthropic Console 為準。

export type UsageRecord = {
  label: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  /** 估算費用（美金） */
  cost: number;
  seconds: number;
};

export async function recordUsage(record: UsageRecord) {
  const prisma = await getDb();
  try {
    await prisma.aiUsage.create({ data: record });
  } catch (error) {
    // 紀錄失敗不影響回饋本身
    console.warn("[AI] 用量紀錄寫入失敗：", error);
  }
}

export type UsagePeriod = { calls: number; cost: number };
export type UsageSummary = { today: UsagePeriod; month: UsagePeriod; total: UsagePeriod };

/** 某段時間內的呼叫次數和費用（類似 SELECT COUNT(*), SUM(cost) … WHERE at >= @since） */
async function sumSince(since?: Date): Promise<UsagePeriod> {
  const prisma = await getDb();
  const result = await prisma.aiUsage.aggregate({
    where: since ? { at: { gte: since } } : undefined,
    _count: true,
    _sum: { cost: true },
  });
  return { calls: result._count, cost: result._sum.cost?.toNumber() ?? 0 };
}

/** 依台灣時間算今天、這個月、累計 */
export async function getUsageSummary(): Promise<UsageSummary> {
  const [today, month, total] = await Promise.all([sumSince(startOfToday()), sumSince(startOfMonth()), sumSince()]);
  return { today, month, total };
}
