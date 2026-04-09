import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/cloudbase';
import { cookies } from 'next/headers';

/**
 * 验证管理员权限
 */
async function checkAdminAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  return token === 'admin-session-token';
}

/**
 * GET /api/admin/codes/stats
 * 获取兑换码统计信息
 */
export async function GET(request: NextRequest) {
  try {
    // 验证权限
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: '未授权' },
        { status: 401 }
      );
    }

    const db = getDb();
    const collection = db.collection('redeem_codes');

    // 获取各状态数量
    const { total: totalCount } = await collection.count();
    const { total: availableCount } = await collection
      .where({ status: 'available' })
      .count();
    const { total: deliveredCount } = await collection
      .where({ status: 'delivered' })
      .count();
    const { total: usedCount } = await collection
      .where({ status: 'used' })
      .count();

    // 获取最近发放记录
    const { data: recentDelivered } = await collection
      .where({ status: 'delivered' })
      .orderBy('deliveredAt', 'desc')
      .limit(5)
      .get();

    // 获取最近使用记录
    const { data: recentUsed } = await collection
      .where({ status: 'used' })
      .orderBy('usedAt', 'desc')
      .limit(5)
      .get();

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          total: totalCount,
          available: availableCount,
          delivered: deliveredCount,
          used: usedCount,
        },
        recentDelivered: recentDelivered || [],
        recentUsed: recentUsed || [],
      },
    });
  } catch (error: any) {
    console.error('获取统计信息失败：', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || '获取统计信息失败',
      },
      { status: 500 }
    );
  }
}
