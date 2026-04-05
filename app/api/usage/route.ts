import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/cloudbase";
import { getAccountIdFromRequest, getAccount } from "@/lib/account";

const DAILY_LIMIT = 3; // 免费用户每个功能3次

export async function GET(req: NextRequest) {
  const accountId = await getAccountIdFromRequest(req);
  const today = new Date().toISOString().slice(0, 10);

  try {
    const db = getDb();

    // 查询账号信息
    const account = await getAccount(accountId);

    // 判断是否是付费用户
    const isPremium = account?.account_type === 'redeem_code' || account?.account_type === 'registered';
    const dailyLimit = isPremium ? (account?.daily_limit ?? 100) : DAILY_LIMIT;

    // 检查会员是否过期
    let isExpired = false;
    if (account?.membership_expiry) {
      const expiry = new Date(account.membership_expiry);
      isExpired = expiry < new Date();
    }

    if (isPremium && !isExpired) {
      // 付费用户：查询今日总用量
      const dailyKey = `${accountId}:daily:${today}`;
      const { data: dailyData } = await db.collection("rate_limits").where({ key: dailyKey }).get();
      const dailyUsed = (dailyData && dailyData.length > 0) ? (dailyData[0].count ?? 0) : 0;

      return NextResponse.json({
        account_type: account.account_type,
        is_premium: true,
        daily_limit: dailyLimit,
        daily_used: dailyUsed,
        daily_remaining: Math.max(0, dailyLimit - dailyUsed),
        membership_expiry: account.membership_expiry,
        // 为了兼容前端，也返回分类额度（都使用同一个池子）
        query: { used: dailyUsed, limit: dailyLimit },
        vocab: { used: dailyUsed, limit: dailyLimit },
        analyze: { used: dailyUsed, limit: dailyLimit },
        resetAt: today + "T23:59:59Z",
      });
    }

    // 免费用户：查询三个路由的今日用量（独立计数）
    const routes = ["query", "vocab", "analyze"];
    const usage: Record<string, { used: number; limit: number }> = {};

    for (const route of routes) {
      const key = `${accountId}:${route}:${today}`;
      const { data } = await db.collection("rate_limits").where({ key }).get();
      const used = (data && data.length > 0) ? (data[0].count ?? 0) : 0;
      usage[route] = { used, limit: DAILY_LIMIT };
    }

    return NextResponse.json({
      account_type: account?.account_type || 'free',
      is_premium: false,
      query: usage.query,
      vocab: usage.vocab,
      analyze: usage.analyze,
      resetAt: today + "T23:59:59Z",
    });
  } catch (error) {
    console.error('[/api/usage] 错误:', error);
    return NextResponse.json({
      account_type: 'free',
      is_premium: false,
      query: { used: 0, limit: DAILY_LIMIT },
      vocab: { used: 0, limit: DAILY_LIMIT },
      analyze: { used: 0, limit: DAILY_LIMIT },
    });
  }
}
