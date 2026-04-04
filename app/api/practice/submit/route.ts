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

// 提交答案
export async function POST(req: NextRequest) {
  try {
    const { questionId, answer, correct } = await req.json();
    const ip = getClientIP(req);
    const hashedIP = hashIP(ip);
    const today = new Date().toISOString().split("T")[0];

    const db = getDb();

    // 检查今天是否已提交
    const { data: existingData } = await db
      .collection("practice_records")
      .where({ user_id: hashedIP, date: today })
      .get();

    if (existingData && existingData.length > 0) {
      return NextResponse.json({ message: "今日已完成" });
    }

    // 记录答题
    await db.collection("practice_records").add({
      user_id: hashedIP,
      date: today,
      questionId,
      answer,
      correct,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("提交答案失败:", error);
    return NextResponse.json({ error: "提交失败" }, { status: 500 });
  }
}
