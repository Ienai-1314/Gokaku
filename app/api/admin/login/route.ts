import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * POST /api/admin/login
 * 管理员登录（简化版，硬编码账号）
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // 硬编码管理员账号（生产环境应使用数据库 + bcrypt）
    const ADMIN_USERNAME = 'admin';
    const ADMIN_PASSWORD = 'gokaku2026';

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      // 设置 cookie（简化版，生产环境应使用 JWT）
      const cookieStore = await cookies();
      cookieStore.set('admin_token', 'admin-session-token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24小时
      });

      return NextResponse.json({
        success: true,
        data: {
          username: ADMIN_USERNAME,
          role: 'admin',
        },
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: '用户名或密码错误',
        },
        { status: 401 }
      );
    }
  } catch (error: any) {
    console.error('登录失败：', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || '登录失败',
      },
      { status: 500 }
    );
  }
}
