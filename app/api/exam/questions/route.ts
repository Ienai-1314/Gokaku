import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/cloudbase';

/**
 * GET /api/exam/questions?paperId=xxx
 * 获取指定试卷的题目列表
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paperId = searchParams.get('paperId');

    if (!paperId) {
      return NextResponse.json(
        { success: false, error: '缺少 paperId 参数' },
        { status: 400 }
      );
    }

    const db = getDb();
    const collection = db.collection('exam_questions');

    // 获取指定试卷的所有题目，按题号排序
    const { data } = await collection
      .where({ paperId })
      .orderBy('questionNumber', 'asc')
      .get();

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (error: any) {
    console.error('获取题目列表失败：', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || '获取题目列表失败',
      },
      { status: 500 }
    );
  }
}
