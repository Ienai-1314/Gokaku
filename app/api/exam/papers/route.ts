import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/cloudbase';

/**
 * GET /api/exam/papers
 * 获取真题试卷列表
 */
export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const collection = db.collection('exam_papers');

    // 获取所有试卷，按考试日期倒序
    const { data } = await collection
      .where({ status: 'active' })
      .orderBy('examDate', 'desc')
      .get();

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (error: any) {
    console.error('获取试卷列表失败：', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || '获取试卷列表失败',
      },
      { status: 500 }
    );
  }
}
