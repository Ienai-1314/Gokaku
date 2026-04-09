import { NextRequest, NextResponse } from 'next/headers';
import { cookies } from 'next/headers';

/**
 * POST /api/admin/logout
 * 管理员登出
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('admin_token');

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error('登出失败：', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || '登出失败',
      },
      { status: 500 }
    );
  }
}
