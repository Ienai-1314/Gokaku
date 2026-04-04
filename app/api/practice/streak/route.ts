import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/cloudbase";
import { hashIP } from "@/lib/security";

export const dynamic = "force-dynamic";

function getClientIP(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0] ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

// 获取连续天数
export async function GET(req: NextRequest) {
  try {
    const ip = getClientIP(req);
    const hashedIP = hashIP(ip);

    const db = getDb();

    // 获取所有答题记录，按日期排序
    const { data } = await db
      .collection("practice_records")
      .where({ user_id: hashedIP })
      .orderBy("date", "desc")
      .limit(100)
      .get();

    if (!data || data.length === 0) {
      return NextResponse.json({ streak: 0 });
    }

    // 计算连续天数
    let streak = 0;
    const today = new Date().toISOString().split("T")[0];
    let currentDate = new Date(today);

    for (const record of data) {
      const recordDate = record.date;
      const expectedDate = currentDate.toISOString().split("T")[0];

      if (recordDate === expectedDate) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return NextResponse.json({ streak });
  } catch (error) {
    console.error("获取连续天数失败:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}
