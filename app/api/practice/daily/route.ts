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

// 获取每日一练题目
export async function GET(req: NextRequest) {
  try {
    const ip = getClientIP(req);
    const hashedIP = hashIP(ip);
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    const db = getDb();

    // 检查今天是否已完成
    const { data: completedData } = await db
      .collection("practice_records")
      .where({ user_id: hashedIP, date: today })
      .get();

    const completed = completedData && completedData.length > 0;

    // 获取今日题目（基于日期生成固定题目）
    const question = generateDailyQuestion(today);

    return NextResponse.json({ question, completed });
  } catch (error) {
    console.error("获取每日一练失败:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}

// 生成每日题目（基于日期的伪随机）
function generateDailyQuestion(date: string) {
  // 题库（实际应该从数据库读取）
  const questions = [
    {
      id: "q1",
      question: "彼は仕事が忙しい___、毎日運動している。\n1. にもかかわらず\n2. にしたがって\n3. に対して\n4. について",
      options: ["にもかかわらず", "にしたがって", "に対して", "について"],
      correctAnswer: "にもかかわらず",
      explanation: "**にもかかわらず** 表示「尽管...但是...」，用于逆接关系。\n\n这道题考查逆接表达，前句说工作很忙，后句说每天运动，两者是相反的关系，所以用「にもかかわらず」。",
      grammarPoint: "にもかかわらず（逆接）",
      difficulty: "N1" as const,
    },
    {
      id: "q2",
      question: "この問題は難しくて、私___解けない。\n1. には\n2. では\n3. とは\n4. からは",
      options: ["には", "では", "とは", "からは"],
      correctAnswer: "には",
      explanation: "**には** 在这里表示「对于...来说」，强调主体的能力或状态。\n\n「私には解けない」= 对我来说解不了。这是N2常考的助词用法。",
      grammarPoint: "には（对象/能力）",
      difficulty: "N2" as const,
    },
    {
      id: "q3",
      question: "彼女は日本語___、英語も話せる。\n1. はもちろん\n2. にしては\n3. に対して\n4. について",
      options: ["はもちろん", "にしては", "に対して", "について"],
      correctAnswer: "はもちろん",
      explanation: "**はもちろん** 表示「不用说...，连...也...」，用于列举。\n\n这道题表示她不仅会日语，英语也会，所以用「はもちろん」。",
      grammarPoint: "はもちろん（列举）",
      difficulty: "N2" as const,
    },
    {
      id: "q4",
      question: "雨が降る___降らない___、試合は行います。\n1. と・と\n2. か・か\n3. と・にかかわらず\n4. と・にもかかわらず",
      options: ["と・と", "か・か", "と・にかかわらず", "と・にもかかわらず"],
      correctAnswer: "と・にかかわらず",
      explanation: "**と～にかかわらず** 表示「无论...还是...都...」。\n\n这是N1的固定句型，表示无论下不下雨，比赛都会进行。",
      grammarPoint: "と～にかかわらず",
      difficulty: "N1" as const,
    },
    {
      id: "q5",
      question: "彼は優秀な学生___、努力家でもある。\n1. であるとともに\n2. であるにもかかわらず\n3. であるに対して\n4. であるについて",
      options: ["であるとともに", "であるにもかかわらず", "であるに対して", "であるについて"],
      correctAnswer: "であるとともに",
      explanation: "**であるとともに** 表示「既是...同时也是...」，用于并列。\n\n这道题说他既是优秀学生，同时也是努力的人，两者是并列关系。",
      grammarPoint: "とともに（并列）",
      difficulty: "N1" as const,
    },
  ];

  // 基于日期生成索引（确保有效）
  const dateNum = parseInt(date.replace(/-/g, ""));
  const index = Math.abs(dateNum) % questions.length;

  console.log(`[每日一练] 日期: ${date}, 索引: ${index}, 题目ID: ${questions[index].id}`);

  return questions[index];
}
