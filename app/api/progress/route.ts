import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/cloudbase';

export const dynamic = 'force-dynamic';

function getClientIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0] ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

// 获取学习进度统计
export async function GET(req: NextRequest) {
  try {
    const ip = getClientIP(req);
    const db = getDb();

    // 并行查询多个数据
    const [
      historyResult,
      collectionsResult,
      errorsResult,
      quotaResult
    ] = await Promise.all([
      db.collection('query_history').where({ ip }).get(),
      db.collection('collections').where({ ip }).get(),
      db.collection('grammar_weakness').where({ ip }).get(),
      db.collection('user_quota').where({ ip }).get()
    ]);

    const history = historyResult.data || [];
    const collections = collectionsResult.data || [];
    const errors = errorsResult.data || [];
    const quota = quotaResult.data?.[0] || null;

    // 统计数据
    const stats = {
      // 查询统计
      totalQueries: history.length,
      grammarQueries: history.filter((h: any) => h.type === 'grammar').length,
      vocabQueries: history.filter((h: any) => h.type === 'vocab').length,
      analyzeQueries: history.filter((h: any) => h.type === 'analyze').length,

      // 收藏统计
      totalCollections: collections.length,
      grammarCollections: collections.filter((c: any) => c.type === 'grammar').length,
      vocabCollections: collections.filter((c: any) => c.type === 'vocab').length,

      // 错题统计
      totalErrors: errors.reduce((sum: number, e: any) => sum + (e.error_count || 0), 0),
      weaknessCount: errors.length,

      // 额度统计
      quotaUsed: quota?.used || 0,
      quotaRemaining: quota?.remaining || 0,

      // 学习天数（基于最早的历史记录）
      studyDays: history.length > 0
        ? Math.ceil((Date.now() - new Date(history[history.length - 1].createdAt).getTime()) / (1000 * 60 * 60 * 24)) + 1
        : 0,

      // 掌握度估算（基于查询和收藏）
      grammarMastery: Math.min(Math.round((history.filter((h: any) => h.type === 'grammar').length / 210) * 100), 100),
      vocabMastery: Math.min(Math.round((history.filter((h: any) => h.type === 'vocab').length / 1311) * 100), 100)
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Progress get error:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}
