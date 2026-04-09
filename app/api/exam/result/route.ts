import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/cloudbase';

/**
 * GET /api/exam/result?recordId=xxx
 * 获取答题记录和错题解析
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const recordId = searchParams.get('recordId');

    if (!recordId) {
      return NextResponse.json(
        { success: false, error: '缺少 recordId 参数' },
        { status: 400 }
      );
    }

    const db = getDb();
    const recordsCollection = db.collection('user_exam_records');
    const questionsCollection = db.collection('exam_questions');

    // 获取答题记录
    const { data: records } = await recordsCollection
      .where({ _id: recordId })
      .get();

    if (!records || records.length === 0) {
      return NextResponse.json(
        { success: false, error: '记录不存在' },
        { status: 404 }
      );
    }

    const record = records[0];

    // 获取所有题目（用于显示解析）
    const { data: questions } = await questionsCollection
      .where({ paperId: record.paperId })
      .get();

    return NextResponse.json({
      success: true,
      data: {
        record,
        questions: questions || [],
      },
    });
  } catch (error: any) {
    console.error('获取成绩失败：', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || '获取成绩失败',
      },
      { status: 500 }
    );
  }
}
