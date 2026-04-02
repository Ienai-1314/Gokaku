import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/cloudbase";

function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

/** GET /api/blessing — 获取今日祈福数 + 总祈福数 + 当前 IP 今日是否已祈福 */
export async function GET(req: NextRequest) {
  const ip = getIp(req);
  const today = new Date().toISOString().slice(0, 10);
  try {
    const db = getDb();
    const [todayRes, totalRes, myRes] = await Promise.all([
      db.collection("blessings").where({ date: today }).count(),
      db.collection("blessings").count(),
      db.collection("blessings").where({ ip, date: today }).count(),
    ]);
    return NextResponse.json({
      today: todayRes.total ?? 0,
      total: totalRes.total ?? 0,
      blessed: (myRes.total ?? 0) > 0,
    });
  } catch {
    return NextResponse.json({ today: 0, total: 0, blessed: false });
  }
}

/** POST /api/blessing — 签到祈福（每 IP 每天一次） */
export async function POST(req: NextRequest) {
  const ip = getIp(req);
  const today = new Date().toISOString().slice(0, 10);
  try {
    const db = getDb();
    const { data } = await db.collection("blessings").where({ ip, date: today }).get();
    if (data && data.length > 0) {
      return NextResponse.json({ already: true });
    }
    await db.collection("blessings").add({ ip, date: today, created_at: new Date().toISOString() });
    const [todayRes, totalRes] = await Promise.all([
      db.collection("blessings").where({ date: today }).count(),
      db.collection("blessings").count(),
    ]);
    return NextResponse.json({
      success: true,
      today: todayRes.total ?? 0,
      total: totalRes.total ?? 0,
    });
  } catch {
    return NextResponse.json({ error: "祈福失败" }, { status: 500 });
  }
}
