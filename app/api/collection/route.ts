import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/cloudbase';
import { getAccountIdFromRequest } from '@/lib/account';

export const dynamic = 'force-dynamic';

// 添加收藏
export async function POST(req: NextRequest) {
  try {
    const { type, content } = await req.json();

    if (!type || !content) {
      return NextResponse.json({ error: '参数错误' }, { status: 400 });
    }

    const accountId = await getAccountIdFromRequest(req);
    const db = getDb();

    await db.collection('collections').add({
      account_id: accountId,
      type, // 'grammar' | 'vocab' | 'error'
      content, // 完整的查询结果对象
      createdAt: new Date().toISOString()
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Collection add error:', error);
    return NextResponse.json({ error: '收藏失败' }, { status: 500 });
  }
}

// 获取收藏列表
export async function GET(req: NextRequest) {
  try {
    const accountId = await getAccountIdFromRequest(req);
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // 可选过滤

    const db = getDb();

    // 如果是查询错题本，使用 wrong_questions 集合
    if (type === 'wrong_question') {
      const { data } = await db
        .collection('wrong_questions')
        .where({ account_id: accountId })
        .orderBy('createdAt', 'desc')
        .limit(100)
        .get();

      return NextResponse.json({ items: data || [] });
    }

    // 否则使用 collections 集合
    let query = db.collection('collections').where({ account_id: accountId });

    if (type) {
      query = query.where({ type });
    }

    const { data } = await query.orderBy('createdAt', 'desc').limit(100).get();

    return NextResponse.json({ collections: data || [] });
  } catch (error) {
    console.error('Collection get error:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

// 删除收藏
export async function DELETE(req: NextRequest) {
  try {
    const { id, type } = await req.json();

    if (!id) {
      return NextResponse.json({ error: '参数错误' }, { status: 400 });
    }

    const db = getDb();

    // 如果是删除错题，使用 wrong_questions 集合
    if (type === 'wrong_question') {
      await db.collection('wrong_questions').doc(id).remove();
    } else {
      await db.collection('collections').doc(id).remove();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Collection delete error:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}
