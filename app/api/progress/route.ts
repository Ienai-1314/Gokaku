import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/cloudbase';
import { getAccountIdFromRequest } from '@/lib/account';

export const dynamic = 'force-dynamic';

// 获取学习进度统计
export async function GET(req: NextRequest) {
  try {
    const accountId = await getAccountIdFromRequest(req);
    const db = getDb();

    // 并行查询多个数据
    const [
      historyResult,
      collectionsResult,
      weaknessResult,
      wrongQuestionsResult,
      accountResult
    ] = await Promise.all([
      db.collection('query_history').where({ account_id: accountId }).get(),
      db.collection('collections').where({ account_id: accountId }).get(),
      db.collection('grammar_weakness').where({ account_id: accountId }).get(),
      db.collection('wrong_questions').where({ account_id: accountId }).get(),
      db.collection('accounts').where({ account_id: accountId }).limit(1).get()
    ]);

    const history = historyResult.data || [];
    const collections = collectionsResult.data || [];
    const weakness = weaknessResult.data || [];
    const wrongQuestions = wrongQuestionsResult.data || [];
    const account = accountResult.data?.[0] || null;

    // 统计数据
    const stats = {
      // 账号信息
      accountId: accountId,
      accountType: account ? 'redeem' : 'free',
      expiresAt: account?.expires_at || null,
      dailyQuota: account?.daily_limit || 100,

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
      totalErrors: wrongQuestions.length,
      weaknessCount: weakness.length,

      // 额度统计（保留兼容性）
      quotaUsed: 0,
      quotaRemaining: account ? account.daily_limit : 0,

      // 学习天数（基于最早的历史记录）
      studyDays: history.length > 0
        ? Math.ceil((Date.now() - new Date(history.sort((a: any, b: any) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          )[0].createdAt).getTime()) / (1000 * 60 * 60 * 24)) + 1
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
