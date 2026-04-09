import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/cloudbase';
import { cookies } from 'next/headers';

/**
 * POST /api/exam/submit
 * 提交答题记录
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const accountId = cookieStore.get('account_id')?.value;

    if (!accountId) {
      return NextResponse.json(
        { success: false, error: '未登录' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { paperId, examDate, answers } = body;

    if (!paperId || !examDate || !answers) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }

    const db = getDb();
    const questionsCollection = db.collection('exam_questions');
    const recordsCollection = db.collection('user_exam_records');

    // 获取所有题目的正确答案
    const { data: questions } = await questionsCollection
      .where({ paperId })
      .get();

    if (!questions || questions.length === 0) {
      return NextResponse.json(
        { success: false, error: '试卷不存在' },
        { status: 404 }
      );
    }

    // 计算成绩
    const answerDetails = answers.map((answer: any) => {
      const question = questions.find((q: any) => q._id === answer.questionId);
      const isCorrect = question?.content.correctAnswer === answer.userAnswer;
      return {
        questionId: answer.questionId,
        userAnswer: answer.userAnswer,
        isCorrect,
        timeSpent: answer.timeSpent || 0,
      };
    });

    const totalQuestions = questions.length;
    const correctCount = answerDetails.filter((a: any) => a.isCorrect).length;
    const percentage = Math.round((correctCount / totalQuestions) * 100);

    // 按科目统计
    const scoreBySection: any = {
      vocabulary: { correct: 0, total: 0 },
      grammar: { correct: 0, total: 0 },
      reading: { correct: 0, total: 0 },
      listening: { correct: 0, total: 0 },
    };

    questions.forEach((q: any) => {
      const section = q.section;
      const answer = answerDetails.find((a: any) => a.questionId === q._id);
      scoreBySection[section].total += 1;
      if (answer?.isCorrect) {
        scoreBySection[section].correct += 1;
      }
    });

    // 保存答题记录
    const record = {
      accountId,
      paperId,
      examDate,
      progress: {
        totalQuestions,
        answeredQuestions: answers.length,
        startedAt: new Date(body.startedAt),
        completedAt: new Date(),
        timeSpent: body.timeSpent || 0,
      },
      answers: answerDetails,
      score: {
        ...scoreBySection,
        overall: {
          correct: correctCount,
          total: totalQuestions,
          percentage,
        },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await recordsCollection.add(record);

    return NextResponse.json({
      success: true,
      data: {
        recordId: result.id,
        score: record.score,
      },
    });
  } catch (error: any) {
    console.error('提交答题记录失败：', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || '提交答题记录失败',
      },
      { status: 500 }
    );
  }
}
