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
    let total = 0;
    for (const route of routes) {
      const key = `${userId}:${route}:${today}`;
      const { data } = await db.collection("rate_limits").where({ key }).get();
      if (data && data.length > 0) {
        total += data[0].count ?? 0;
      }
    }

    return NextResponse.json({
      used: total,
      limit: DAILY_LIMIT * routes.length, // 9 次/天总量（3+3+3）
      resetAt: today + "T23:59:59Z",
    });
  } catch {
    return NextResponse.json({ used: 0, limit: 9 });
  }
}
