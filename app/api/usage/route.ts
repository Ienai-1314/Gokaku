import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/cloudbase";

const DAILY_LIMIT = 20;

export async function GET(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  const today = new Date().toISOString().slice(0, 10);

  try {
    const db = getDb();
    // 查询三个路由的今日用量
    const routes = ["query", "analyze", "ocr"];
    let total = 0;
    for (const route of routes) {
      const key = `${ip}:${route}:${today}`;
      const { data } = await db.collection("rate_limits").where({ key }).get();
      if (data && data.length > 0) {
        total += data[0].count ?? 0;
      }
    }

    return NextResponse.json({
      used: total,
      limit: DAILY_LIMIT * routes.length, // 60 次/天总量
      resetAt: today + "T23:59:59Z",
    });
  } catch {
    return NextResponse.json({ used: 0, limit: 60 });
  }
}
