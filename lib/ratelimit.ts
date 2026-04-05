import { NextRequest } from "next/server";
import { getDb } from "./cloudbase";
import { getAccountIdFromRequest } from "./account";

const DAILY_LIMIT = 3;

function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
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
  const accountId = await getAccountIdFromRequest(req);
  const today = new Date().toISOString().slice(0, 10);
  const key = `${accountId}:${route}:${today}`;

  try {
    const db = getDb();

    // 1. 优先检查兑换码额度（付费用户）
    const hasQuota = await consumeQuota(accountId);
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
      return await consumeBonus(accountId);
    } else {
      await db.collection("rate_limits").add({ key, count: 1, date: today });
      return true;
    }
  } catch (error) {
    console.error('[checkRateLimit] 错误:', error);
    return true; // 数据库失败时放行
  }
}

/** 消耗 1 次兑换码额度，有余量返回 true */
async function consumeQuota(accountId: string): Promise<boolean> {
  try {
    const db = getDb();

    // 查询账号信息
    const { data } = await db.collection("accounts").where({ account_id: accountId }).get();
    if (!data || data.length === 0) return false;

    const account = data[0];

    // 检查是否是付费账号
    if (account.account_type !== 'redeem_code' && account.account_type !== 'registered') {
      return false;
    }

    // 检查会员是否过期
    if (account.membership_expiry) {
      const expiry = new Date(account.membership_expiry);
      if (expiry < new Date()) {
        return false; // 会员已过期
      }
    }

    // 检查每日限额（付费用户每天100次）
    const today = new Date().toISOString().slice(0, 10);
    const dailyKey = `${accountId}:daily:${today}`;

    const { data: dailyData } = await db.collection("rate_limits").where({ key: dailyKey }).get();

    if (dailyData && dailyData.length > 0) {
      const dailyCount = dailyData[0].count ?? 0;
      const dailyLimit = account.daily_limit ?? 100;

      if (dailyCount >= dailyLimit) {
        return false; // 今日额度已用完
      }

      // 递增今日使用次数
      await db.collection("rate_limits").doc(dailyData[0]._id as string).update({
        count: db.command.inc(1)
      });
    } else {
      // 创建今日使用记录
      await db.collection("rate_limits").add({
        key: dailyKey,
        count: 1,
        date: today
      });
    }

    return true;
  } catch (error) {
    console.error('[consumeQuota] 错误:', error);
    return false;
  }
}

/** 消耗 1 次奖励额度，有余量返回 true */
async function consumeBonus(accountId: string): Promise<boolean> {
  try {
    const db = getDb();
    const { data } = await db.collection("invite_bonuses").where({ account_id: accountId }).get();
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
export async function addBonus(accountId: string, amount: number): Promise<void> {
  try {
    const db = getDb();
    const { data } = await db.collection("invite_bonuses").where({ account_id: accountId }).get();
    if (data && data.length > 0) {
      await db.collection("invite_bonuses").doc(data[0]._id as string).update({
        bonus_remaining: db.command.inc(amount),
        total_earned: db.command.inc(amount),
      });
    } else {
      await db.collection("invite_bonuses").add({
        account_id: accountId,
        bonus_remaining: amount,
        total_earned: amount
      });
    }
  } catch (err) {
    console.error("[addBonus] error:", err);
  }
}

/** 查询奖励余量 */
export async function getBonusRemaining(accountId: string): Promise<number> {
  try {
    const db = getDb();
    const { data } = await db.collection("invite_bonuses").where({ account_id: accountId }).get();
    if (data && data.length > 0) return data[0].bonus_remaining ?? 0;
    return 0;
  } catch {
    return 0;
  }
}

/** 查询账号剩余额度 */
export async function getQuotaRemaining(accountId: string): Promise<number> {
  try {
    const db = getDb();
    const { data } = await db.collection("accounts").where({ account_id: accountId }).get();
    if (data && data.length > 0) {
      const account = data[0];

      // 检查会员是否过期
      if (account.membership_expiry) {
        const expiry = new Date(account.membership_expiry);
        if (expiry < new Date()) {
          return 0; // 会员已过期
        }
      }

      // 返回每日限额
      return account.daily_limit ?? 0;
    }
    return 0;
  } catch {
    return 0;
  }
}
