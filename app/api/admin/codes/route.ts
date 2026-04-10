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
 * GET /api/admin/codes
 * 获取兑换码列表
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status'); // available/delivered/used
    const search = searchParams.get('search'); // 搜索兑换码

    const db = getDb();
    const collection = db.collection('redeem_codes');

    // 构建查询条件
    let query: any = collection;

    if (status && status !== 'all') {
      query = query.where({ status });
    }

    if (search) {
      // 模糊搜索兑换码
      query = query.where({
        code: db.RegExp({
          regexp: search,
          options: 'i',
        }),
      });
    }

    // 获取总数
    const { total } = await query.count();

    // 分页查询
    const skip = (page - 1) * limit;
    const { data } = await query
      .orderBy('createdAt', 'desc')
      .skip(skip)
      .limit(limit)
      .get();

    return NextResponse.json({
      success: true,
      data: {
        codes: data || [],
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('获取兑换码列表失败：', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || '获取兑换码列表失败',
      },
      { status: 500 }
    );
  }
}
