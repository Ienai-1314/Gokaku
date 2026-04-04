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

// 添加历史记录
export async function POST(req: NextRequest) {
  try {
    const { type, query, result } = await req.json();

    if (!type || !query) {
      return NextResponse.json({ error: '参数错误' }, { status: 400 });
    }

    const ip = getClientIP(req);
    const db = getDb();

    // 检查是否已存在相同查询（去重）
    const existing = await db.collection('query_history')
      .where({ ip, type, query })
      .get();

    if (existing.data && existing.data.length > 0) {
      // 更新时间戳
      await db.collection('query_history')
        .doc(existing.data[0]._id as string)
        .update({ lastQueryAt: new Date().toISOString() });
    } else {
      // 新增记录
      await db.collection('query_history').add({
        ip,
        type, // 'grammar' | 'vocab' | 'analyze'
        query,
        result: result || null,
        createdAt: new Date().toISOString(),
        lastQueryAt: new Date().toISOString()
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('History add error:', error);
    return NextResponse.json({ error: '记录失败' }, { status: 500 });
  }
}

// 获取历史记录
export async function GET(req: NextRequest) {
  try {
    const ip = getClientIP(req);
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    const db = getDb();
    let query = db.collection('query_history').where({ ip });

    if (type) {
      query = query.where({ type });
    }

    const { data } = await query.orderBy('lastQueryAt', 'desc').limit(50).get();

    return NextResponse.json({ history: data || [] });
  } catch (error) {
    console.error('History get error:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

// 清空历史记录
export async function DELETE(req: NextRequest) {
  try {
    const ip = getClientIP(req);
    const db = getDb();

    const { data } = await db.collection('query_history').where({ ip }).get();

    if (data && data.length > 0) {
      for (const item of data) {
        await db.collection('query_history').doc(item._id as string).remove();
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('History delete error:', error);
    return NextResponse.json({ error: '清空失败' }, { status: 500 });
  }
}
