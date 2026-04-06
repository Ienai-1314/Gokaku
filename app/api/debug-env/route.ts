import { NextRequest, NextResponse } from "next/server";

/**
 * 诊断API：检查环境变量是否正确配置
 * 访问：GET /api/debug-env
 */
export async function GET(req: NextRequest) {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,

    // 检查环境变量是否存在
    env_vars: {
      TCB_ENV_ID: {
        exists: !!process.env.TCB_ENV_ID,
        value: process.env.TCB_ENV_ID ? `${process.env.TCB_ENV_ID.slice(0, 10)}...` : 'NOT SET',
        length: process.env.TCB_ENV_ID?.length || 0
      },
      TCB_SECRET_ID: {
        exists: !!process.env.TCB_SECRET_ID,
        value: process.env.TCB_SECRET_ID ? `${process.env.TCB_SECRET_ID.slice(0, 10)}...` : 'NOT SET',
        length: process.env.TCB_SECRET_ID?.length || 0
      },
      TCB_SECRET_KEY: {
        exists: !!process.env.TCB_SECRET_KEY,
        value: process.env.TCB_SECRET_KEY ? `${process.env.TCB_SECRET_KEY.slice(0, 10)}...` : 'NOT SET',
        length: process.env.TCB_SECRET_KEY?.length || 0
      }
    },

    // 检查是否有前导/尾随空格
    whitespace_check: {
      TCB_ENV_ID: process.env.TCB_ENV_ID ? {
        has_leading_space: process.env.TCB_ENV_ID !== process.env.TCB_ENV_ID.trimStart(),
        has_trailing_space: process.env.TCB_ENV_ID !== process.env.TCB_ENV_ID.trimEnd(),
      } : null,
      TCB_SECRET_ID: process.env.TCB_SECRET_ID ? {
        has_leading_space: process.env.TCB_SECRET_ID !== process.env.TCB_SECRET_ID.trimStart(),
        has_trailing_space: process.env.TCB_SECRET_ID !== process.env.TCB_SECRET_ID.trimEnd(),
      } : null,
      TCB_SECRET_KEY: process.env.TCB_SECRET_KEY ? {
        has_leading_space: process.env.TCB_SECRET_KEY !== process.env.TCB_SECRET_KEY.trimStart(),
        has_trailing_space: process.env.TCB_SECRET_KEY !== process.env.TCB_SECRET_KEY.trimEnd(),
      } : null
    },

    // 测试 CloudBase 初始化
    cloudbase_init: null as any
  };

  // 尝试初始化 CloudBase
  try {
    const cloudbase = require("@cloudbase/node-sdk");
    const app = cloudbase.init({
      env: process.env.TCB_ENV_ID,
      secretId: process.env.TCB_SECRET_ID,
      secretKey: process.env.TCB_SECRET_KEY,
    });

    diagnostics.cloudbase_init = {
      success: true,
      message: "CloudBase 初始化成功"
    };

    // 尝试查询数据库
    try {
      const db = app.database();
      const result = await db.collection('accounts').limit(1).get();
      diagnostics.cloudbase_init.database_query = {
        success: true,
        message: "数据库查询成功",
        record_count: result.data?.length || 0
      };
    } catch (dbError: any) {
      diagnostics.cloudbase_init.database_query = {
        success: false,
        error: dbError.message,
        code: dbError.code
      };
    }
  } catch (initError: any) {
    diagnostics.cloudbase_init = {
      success: false,
      error: initError.message,
      code: initError.code
    };
  }

  return NextResponse.json(diagnostics, { status: 200 });
}
