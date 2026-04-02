import { NextRequest } from "next/server";
import { getDb } from "./cloudbase";

const DAILY_LIMIT = 20;

function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * 检查并递增 IP 限流计数
 * 超日限后消耗奖励池 (invite_bonuses)
 * @returns true = 放行，false = 已超限
 */
export async function checkRateLimit(req: NextRequest, route: string): Promise<boolean> {
  const ip = getIp(req);
  const today = new Date().toISOString().slice(0, 10);
  const key = `${ip}:${route}:${today}`;

  try {
    const db = getDb();
    const { data } = await db.collection("rate_limits").where({ key }).get();

    if (data && data.length > 0) {
      const count: number = data[0].count ?? 0;
      if (count < DAILY_LIMIT) {
        await db.collection("rate_limits").doc(data[0]._id as string).update({ count: db.command.inc(1) });
        return true;
      }
      // 超日限 → 尝试消耗奖励池
      return await consumeBonus(ip);
    } else {
      await db.collection("rate_limits").add({ key, count: 1, date: today });
      return true;
    }
  } catch {
    return true; // 数据库失败时放行
  }
}

/** 消耗 1 次奖励额度，有余量返回 true */
async function consumeBonus(ip: string): Promise<boolean> {
  try {
    const db = getDb();
    const { data } = await db.collection("invite_bonuses").where({ ip }).get();
    if (!data || data.length === 0) return false;
    const remaining: number = data[0].bonus_remaining ?? 0;
    if (remaining <= 0) return false;
    await db.collection("invite_bonuses").doc(data[0]._id as string).update({
      bonus_remaining: db.command.inc(-1),
    });
    return true;
  } catch {
    return false;
  }
}

/** 给指定 IP 增加奖励额度 */
export async function addBonus(ip: string, amount: number): Promise<void> {
  try {
    const db = getDb();
    const { data } = await db.collection("invite_bonuses").where({ ip }).get();
    if (data && data.length > 0) {
      await db.collection("invite_bonuses").doc(data[0]._id as string).update({
        bonus_remaining: db.command.inc(amount),
        total_earned: db.command.inc(amount),
      });
    } else {
      await db.collection("invite_bonuses").add({ ip, bonus_remaining: amount, total_earned: amount });
    }
  } catch (err) {
    console.error("[addBonus] error:", err);
  }
}

/** 查询奖励余量 */
export async function getBonusRemaining(ip: string): Promise<number> {
  try {
    const db = getDb();
    const { data } = await db.collection("invite_bonuses").where({ ip }).get();
    if (data && data.length > 0) return data[0].bonus_remaining ?? 0;
    return 0;
  } catch {
    return 0;
  }
}
