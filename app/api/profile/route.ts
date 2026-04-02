import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/cloudbase";

// GET /api/profile?userId=xxx  — 获取用户薄弱语法列表
// POST /api/profile             — 记录一次错题
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "缺少 userId" }, { status: 400 });
  }

  try {
    const db = getDb();
    const { data } = await db
      .collection("grammar_weakness")
      .where({ user_id: userId })
      .orderBy("error_count", "desc")
      .limit(20)
      .get();

    return NextResponse.json({ weaknesses: data });
  } catch (err) {
    console.error("[profile GET] cloudbase error:", err);
    return NextResponse.json({ error: "读取失败" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { userId, grammarId, questionText, userAnswer } = await req.json();

  if (!userId || !questionText) {
    return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
  }

  try {
    const db = getDb();

    // 写入错题记录
    await db.collection("error_records").add({
      user_id: userId,
      grammar_id: grammarId ?? null,
      question_text: questionText,
      user_answer: userAnswer ?? null,
      created_at: new Date().toISOString(),
    });

    // 更新薄弱点计数
    if (grammarId) {
      const { data } = await db
        .collection("grammar_weakness")
        .where({ user_id: userId, grammar_id: grammarId })
        .get();

      if (data && data.length > 0) {
        await db
          .collection("grammar_weakness")
          .doc(data[0]._id as string)
          .update({
            error_count: db.command.inc(1),
            last_seen: new Date().toISOString(),
          });
      } else {
        await db.collection("grammar_weakness").add({
          user_id: userId,
          grammar_id: grammarId,
          error_count: 1,
          last_seen: new Date().toISOString(),
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[profile POST] cloudbase error:", err);
    return NextResponse.json({ error: "保存失败" }, { status: 500 });
  }
}
