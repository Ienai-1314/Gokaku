import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/cloudbase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    layers: {}
  };

  try {
    // Layer 1: 请求头检查
    diagnostics.layers.request_headers = {
      'x-device-id': request.headers.get('x-device-id'),
      'x-forwarded-for': request.headers.get('x-forwarded-for'),
      'user-agent': request.headers.get('user-agent'),
      'all_headers': Object.fromEntries(request.headers.entries())
    };

    // Layer 2: 设备ID提取
    const deviceId = request.headers.get('x-device-id');
    diagnostics.layers.device_extraction = {
      device_id: deviceId,
      has_device_id: !!deviceId,
      device_id_length: deviceId?.length || 0
    };

    // Layer 3: 数据库连接检查
    const db = getDb();
    diagnostics.layers.database_connection = {
      status: 'connected',
      collections_to_check: ['device_bindings', 'accounts', 'rate_limits']
    };

    // Layer 4: device_bindings 查询
    if (deviceId) {
      const bindingResult = await db.collection('device_bindings')
        .where({ device_id: deviceId })
        .get();

      diagnostics.layers.device_binding = {
        query: { device_id: deviceId },
        found: bindingResult.data.length > 0,
        count: bindingResult.data.length,
        data: bindingResult.data
      };

      // Layer 5: accounts 查询
      if (bindingResult.data.length > 0) {
        const accountId = bindingResult.data[0].account_id;
        const accountResult = await db.collection('accounts')
          .where({ account_id: accountId })
          .get();

        diagnostics.layers.account = {
          query: { account_id: accountId },
          found: accountResult.data.length > 0,
          count: accountResult.data.length,
          data: accountResult.data
        };
      } else {
        diagnostics.layers.account = {
          status: 'no_binding_found',
          message: 'Device not bound to any account'
        };
      }

      // Layer 6: rate_limits 查询
      const today = new Date().toISOString().split('T')[0];
      const rateLimitResult = await db.collection('rate_limits')
        .where({
          account_id: deviceId.startsWith('device_') ? deviceId : `device_${deviceId}`,
          date: today
        })
        .get();

      diagnostics.layers.rate_limits = {
        query: { account_id: deviceId.startsWith('device_') ? deviceId : `device_${deviceId}`, date: today },
        found: rateLimitResult.data.length > 0,
        count: rateLimitResult.data.length,
        data: rateLimitResult.data
      };

      // Layer 7: 检查是否有account_id字段的rate_limits记录
      const accountRateLimitResult = await db.collection('rate_limits')
        .where({ date: today })
        .get();

      const accountRateLimits = accountRateLimitResult.data.filter((r: any) =>
        r.account_id && r.account_id.startsWith('device_')
      );

      diagnostics.layers.rate_limits_with_account_id = {
        total_today: accountRateLimitResult.data.length,
        with_account_id: accountRateLimits.length,
        sample: accountRateLimits.slice(0, 3)
      };
    } else {
      diagnostics.layers.device_binding = {
        status: 'no_device_id',
        message: 'No device ID in request headers'
      };
    }

    // Layer 8: 检查数据库集合结构
    const collections = ['device_bindings', 'accounts', 'rate_limits'];
    diagnostics.layers.collection_structure = {};

    for (const collName of collections) {
      const sample = await db.collection(collName).limit(1).get();
      diagnostics.layers.collection_structure[collName] = {
        exists: true,
        sample_count: sample.data.length,
        sample_fields: sample.data.length > 0 ? Object.keys(sample.data[0]) : []
      };
    }

    // 问题分析
    diagnostics.analysis = {
      issues: [],
      recommendations: []
    };

    if (!deviceId) {
      diagnostics.analysis.issues.push('❌ 前端未发送设备ID');
      diagnostics.analysis.recommendations.push('检查前端是否正确使用apiFetch');
    }

    if (deviceId && diagnostics.layers.device_binding?.found === false) {
      diagnostics.analysis.issues.push('❌ 设备未绑定到账号');
      diagnostics.analysis.recommendations.push('getAccountId应该自动创建账号和绑定');
    }

    if (deviceId && diagnostics.layers.account?.found === false) {
      diagnostics.analysis.issues.push('❌ 账号记录不存在');
      diagnostics.analysis.recommendations.push('createFreeAccount未被调用或失败');
    }

    if (diagnostics.layers.rate_limits?.found === false) {
      diagnostics.analysis.issues.push('⚠️ 今日无限流记录');
      diagnostics.analysis.recommendations.push('可能是首次查询，或checkRateLimit未记录');
    }

    return NextResponse.json(diagnostics, { status: 200 });

  } catch (error: any) {
    diagnostics.error = {
      message: error.message,
      stack: error.stack,
      layer: 'unknown'
    };
    return NextResponse.json(diagnostics, { status: 500 });
  }
}
