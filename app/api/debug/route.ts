/**
 * 诊断API - 用于排查额度计数系统问题
 * 访问: /api/debug
 */

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/cloudbase";
import { getDeviceIdFromRequest, getAccountIdFromRequest, getAccount } from "@/lib/account";

export async function GET(req: NextRequest) {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    layers: {}
  };

  try {
    // ===== Layer 1: 请求头检查 =====
    diagnostics.layers.request_headers = {
      device_id: req.headers.get("x-device-id") || "NOT_SET",
      ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
      user_agent: req.headers.get("user-agent")?.substring(0, 50) || "unknown"
    };

    // ===== Layer 2: 设备ID提取 =====
    const deviceId = getDeviceIdFromRequest(req);
    diagnostics.layers.device_extraction = {
      extracted_device_id: deviceId,
      source: req.headers.get("x-device-id") ? "header" : "ip_hash"
    };

    // ===== Layer 3: 账号ID查询 =====
    const accountId = await getAccountIdFromRequest(req);
    diagnostics.layers.account_lookup = {
      account_id: accountId,
      is_same_as_device: accountId === deviceId
    };

    // ===== Layer 4: 设备绑定检查 =====
    const db = getDb();
    const { data: bindings } = await db.collection('device_bindings')
      .where({ device_id: deviceId })
      .get();

    diagnostics.layers.device_bindings = {
      exists: bindings && bindings.length > 0,
      count: bindings?.length || 0,
      bindings: bindings?.map(b => ({
        device_id: b.device_id,
        account_id: b.account_id,
        first_bound: b.first_bound_at
      })) || []
    };

    // ===== Layer 5: 账号信息检查 =====
    const account = await getAccount(accountId);
    diagnostics.layers.account_info = {
      exists: !!account,
      account: account ? {
        account_id: account.account_id,
        account_type: account.account_type,
        daily_limit: account.daily_limit,
        devices_count: account.devices?.length || 0,
        membership_expiry: account.membership_expiry || null
      } : null
    };

    // ===== Layer 6: 限流记录检查 =====
    const today = new Date().toISOString().slice(0, 10);
    const routes = ["query", "vocab", "analyze"];
    const rateLimits: any = {};

    for (const route of routes) {
      const key = `${accountId}:${route}:${today}`;
      const { data } = await db.collection("rate_limits").where({ key }).get();
      rateLimits[route] = {
        key: key,
        exists: data && data.length > 0,
        count: data && data.length > 0 ? data[0].count : 0,
        record: data && data.length > 0 ? data[0] : null
      };
    }

    // 付费用户的每日总限额
    const dailyKey = `${accountId}:daily:${today}`;
    const { data: dailyData } = await db.collection("rate_limits").where({ key: dailyKey }).get();
    rateLimits.daily_total = {
      key: dailyKey,
      exists: dailyData && dailyData.length > 0,
      count: dailyData && dailyData.length > 0 ? dailyData[0].count : 0,
      record: dailyData && dailyData.length > 0 ? dailyData[0] : null
    };

    diagnostics.layers.rate_limits = rateLimits;

    // ===== Layer 7: 查询历史检查 =====
    const { data: history } = await db.collection("query_history")
      .where({ account_id: accountId })
      .orderBy("createdAt", "desc")
      .limit(5)
      .get();

    diagnostics.layers.query_history = {
      total_count: history?.length || 0,
      recent_queries: history?.map(h => ({
        type: h.type,
        query: h.query?.substring(0, 20),
        created_at: h.createdAt
      })) || []
    };

    // ===== Layer 8: 数据库集合检查 =====
    const collections = ['accounts', 'device_bindings', 'rate_limits', 'query_history'];
    const collectionStatus: any = {};

    for (const collName of collections) {
      try {
        const { data } = await db.collection(collName).limit(1).get();
        collectionStatus[collName] = {
          exists: true,
          accessible: true
        };
      } catch (error: any) {
        collectionStatus[collName] = {
          exists: false,
          error: error.message
        };
      }
    }

    diagnostics.layers.database_collections = collectionStatus;

    // ===== 问题诊断 =====
    const issues: string[] = [];

    if (!diagnostics.layers.request_headers.device_id || diagnostics.layers.request_headers.device_id === "NOT_SET") {
      issues.push("❌ 前端未发送设备ID (x-device-id header缺失)");
    }

    if (!diagnostics.layers.device_bindings.exists && !diagnostics.layers.account_info.exists) {
      issues.push("⚠️ 用户既没有设备绑定，也没有账号记录（首次访问？）");
    }

    if (!diagnostics.layers.account_info.exists) {
      issues.push("⚠️ 账号记录不存在 - 免费用户应该自动创建账号");
    }

    let hasAnyRateLimit = false;
    for (const route of routes) {
      if (rateLimits[route].exists) {
        hasAnyRateLimit = true;
        break;
      }
    }

    if (diagnostics.layers.query_history.total_count > 0 && !hasAnyRateLimit) {
      issues.push("❌ 有查询历史但没有限流记录 - 限流逻辑可能未执行");
    }

    if (!collectionStatus.rate_limits.exists) {
      issues.push("❌ rate_limits 集合不存在或无法访问");
    }

    diagnostics.issues = issues;
    diagnostics.summary = {
      device_id_sent: diagnostics.layers.request_headers.device_id !== "NOT_SET",
      account_exists: diagnostics.layers.account_info.exists,
      has_rate_limits: hasAnyRateLimit,
      has_query_history: diagnostics.layers.query_history.total_count > 0,
      all_collections_accessible: Object.values(collectionStatus).every((s: any) => s.exists)
    };

    return NextResponse.json(diagnostics, { status: 200 });
  } catch (error: any) {
    diagnostics.error = {
      message: error.message,
      stack: error.stack
    };
    return NextResponse.json(diagnostics, { status: 500 });
  }
}
