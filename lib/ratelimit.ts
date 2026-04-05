import { NextRequest } from "next/server";
import { getDb } from "./cloudbase";

const DAILY_LIMIT = 3;

function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function getUserId(req: NextRequest): string {
  // 优先使用设备ID，其次使用IP（向后兼容）
  const deviceId = req.headers.get("x-device-id");
  if (deviceId) return deviceId;

  const ip = getIp(req);
  return hashIP(ip);
}

function hashIP(ip: string): string {
  // 简单哈希（实际应用中建议使用 crypto）
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `ip_${Math.abs(hash).toString(36)}`;
}

/**
 * 检查并递增用户限流计数
 * 优先级：兑换码额度 > 每日免费额度 > 邀请奖励池
 * @returns true = 放行，false = 已超限
 */
export async function checkRateLimit(req: NextRequest, route: string): Promise<boolean> {
  const userId = getUserId(req);
  const today = new Date().toISOString().slice(0, 10);
  const key = `${userId}:${route}:${today}`;

  try {
    const db = getDb();

    // 1. 优先检查兑换码额度（永久有效）
    const hasQuota = await consumeQuota(userId);
    if (hasQuota) return true;

    // 2. 检查每日免费额度
    const { data } = await db.collection("rate_limits").where({ key }).get();

    if (data && data.length > 0) {
      const count: number = data[0].count ?? 0;
      if (count < DAILY_LIMIT) {
        await db.collection("rate_limits").doc(data[0]._id as string).update({ count: db.command.inc(1) });
        return true;
      }
      // 3. 超日限 → 尝试消耗邀请奖励池
      return await consumeBonus(userId);
    } else {
      await db.collection("rate_limits").add({ key, count: 1, date: today });
      return true;
    }
  } catch {
    return true; // 数据库失败时放行
  }
}

/** 消耗 1 次兑换码额度，有余量返回 true */
async function consumeQuota(userId: string): Promise<boolean> {
  try {
    const db = getDb();
    const { data } = await db.collection("user_quota").where({ user_id: userId }).get();
    if (!data || data.length === 0) return false;
    const remaining: number = data[0].remaining ?? 0;
    if (remaining <= 0) return false;
    await db.collection("user_quota").doc(data[0]._id as string).update({
      remaining: db.command.inc(-1),
      used: db.command.inc(1),
    });
    return true;
  } catch {
    return false;
  }
}

/** 消耗 1 次奖励额度，有余量返回 true */
async function consumeBonus(userId: string): Promise<boolean> {
  try {
    const db = getDb();
    const { data } = await db.collection("invite_bonuses").where({ user_id: userId }).get();
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

/** 给指定用户增加奖励额度 */
export async function addBonus(userId: string, amount: number): Promise<void> {
  try {
    const db = getDb();
    const { data } = await db.collection("invite_bonuses").where({ user_id: userId }).get();
    if (data && data.length > 0) {
      await db.collection("invite_bonuses").doc(data[0]._id as string).update({
        bonus_remaining: db.command.inc(amount),
        total_earned: db.command.inc(amount),
      });
    } else {
      await db.collection("invite_bonuses").add({ user_id: userId, bonus_remaining: amount, total_earned: amount });
    }
  } catch (err) {
    console.error("[addBonus] error:", err);
  }
}

/** 查询奖励余量 */
export async function getBonusRemaining(userId: string): Promise<number> {
  try {
    const db = getDb();
    const { data } = await db.collection("invite_bonuses").where({ user_id: userId }).get();
    if (data && data.length > 0) return data[0].bonus_remaining ?? 0;
    return 0;
  } catch {
    return 0;
  }
}

/** 查询兑换码额度余量 */
export async function getQuotaRemaining(userId: string): Promise<number> {
  try {
    const db = getDb();
    const { data } = await db.collection("user_quota").where({ user_id: userId }).get();
    if (data && data.length > 0) return data[0].remaining ?? 0;
    return 0;
  } catch {
    return 0;
  }
}
