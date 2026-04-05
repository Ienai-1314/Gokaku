import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/cloudbase";

const DAILY_LIMIT = 3; // 每个功能3次

function getUserId(req: NextRequest): string {
  const deviceId = req.headers.get("x-device-id");
  if (deviceId) return deviceId;

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
             req.headers.get("x-real-ip") ||
             "unknown";

  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `ip_${Math.abs(hash).toString(36)}`;
}

export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  const today = new Date().toISOString().slice(0, 10);

  try {
    const db = getDb();
    // 查询三个路由的今日用量（独立计数）
    const routes = ["query", "vocab", "analyze"];
    const usage: Record<string, { used: number; limit: number }> = {};

    for (const route of routes) {
      const key = `${userId}:${route}:${today}`;
      const { data } = await db.collection("rate_limits").where({ key }).get();
      const used = (data && data.length > 0) ? (data[0].count ?? 0) : 0;
      usage[route] = { used, limit: DAILY_LIMIT };
    }

    return NextResponse.json({
      query: usage.query,
      vocab: usage.vocab,
      analyze: usage.analyze,
      resetAt: today + "T23:59:59Z",
    });
  } catch {
    return NextResponse.json({
      query: { used: 0, limit: DAILY_LIMIT },
      vocab: { used: 0, limit: DAILY_LIMIT },
      analyze: { used: 0, limit: DAILY_LIMIT },
    });
  }
}
