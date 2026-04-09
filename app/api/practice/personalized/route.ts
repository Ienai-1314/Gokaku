import { NextRequest, NextResponse } from "next/server";
import { getAccountIdFromRequest } from "@/lib/account";
import { getUserProfile } from "@/lib/error-classification";
import { getDb } from "@/lib/cloudbase";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * 生成个性化练习题
 * 基于用户的错题画像，推荐针对性练习
 */
export async function GET(req: NextRequest) {
  try {
    const accountId = await getAccountIdFromRequest(req);

    if (!accountId) {
      return NextResponse.json(
        { error: "未登录" },
        { status: 401 }
      );
    }

    // 获取用户画像
    const profile = await getUserProfile(accountId);

    if (!profile || profile.totalErrors === 0) {
      return NextResponse.json({
        message: "暂无错题数据，请先完成一些练习",
        questions: [],
      });
    }

    // 获取用户的薄弱知识点
    const weakPoints = profile.weakAreas.slice(0, 5).map(w => w.specificPoint);

    // 从错题本中筛选相关题目
    const db = getDb();
    const { data: wrongQuestions } = await db
      .collection("wrong_questions")
      .where({ account_id: accountId })
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    if (!wrongQuestions || wrongQuestions.length === 0) {
      return NextResponse.json({
        message: "暂无错题数据",
        questions: [],
      });
    }

    // 按薄弱点分组
    const groupedByPoint = new Map<string, any[]>();

    for (const q of wrongQuestions) {
      const classification = q.classification;
      if (classification && classification.specificPoint) {
        const point = classification.specificPoint;
        if (!groupedByPoint.has(point)) {
          groupedByPoint.set(point, []);
        }
        groupedByPoint.get(point)!.push(q);
      }
    }

    // 生成练习题集（优先选择薄弱点相关的题目）
    const practiceQuestions: Array<{
      weakPoint: string;
      questions: Array<{
        id: any;
        question: string;
        userAnswer: string;
        correctAnswer: string;
        analysis: string;
        classification?: any;
      }>;
    }> = [];

    for (const weakPoint of weakPoints) {
      const questions = groupedByPoint.get(weakPoint) || [];
      if (questions.length > 0) {
        // 随机选择 2-3 道题
        const selected = questions
          .sort(() => Math.random() - 0.5)
          .slice(0, Math.min(3, questions.length));

        practiceQuestions.push({
          weakPoint,
          questions: selected.map(q => ({
            id: q._id,
            question: q.question,
            userAnswer: q.userAnswer,
            correctAnswer: q.correctAnswer,
            analysis: q.analysis,
            classification: q.classification,
          })),
        });
      }
    }

    // 如果题目不足，从其他错题中补充
    const totalQuestions = practiceQuestions.reduce((sum, p) => sum + p.questions.length, 0);
    if (totalQuestions < 10) {
      const remainingQuestions = wrongQuestions
        .filter(q => !practiceQuestions.some(p =>
          p.questions.some(pq => pq.id === q._id)
        ))
        .sort(() => Math.random() - 0.5)
        .slice(0, 10 - totalQuestions);

      if (remainingQuestions.length > 0) {
        practiceQuestions.push({
          weakPoint: "其他知识点",
          questions: remainingQuestions.map(q => ({
            id: q._id,
            question: q.question,
            userAnswer: q.userAnswer,
            correctAnswer: q.correctAnswer,
            analysis: q.analysis,
            classification: q.classification,
          })),
        });
      }
    }

    return NextResponse.json({
      profile: {
        weakAreas: profile.weakAreas.slice(0, 5),
        errorPatterns: profile.errorPatterns,
        recommendations: profile.recommendations,
        totalErrors: profile.totalErrors,
      },
      practiceQuestions,
      generatedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error("生成个性化练习失败:", error);
    return NextResponse.json(
      { error: "服务器错误" },
      { status: 500 }
    );
  }
}
