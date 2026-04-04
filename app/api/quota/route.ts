import { NextRequest, NextResponse } from 'next/server';
import { getQuotaRemaining } from '@/lib/ratelimit';

export const dynamic = 'force-dynamic';

function getClientIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0] ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

export async function GET(req: NextRequest) {
  try {
    const clientIP = getClientIP(req);
    const remaining = await getQuotaRemaining(clientIP);

    return NextResponse.json({
      remaining,
      hasQuota: remaining > 0
    });
  } catch (error) {
    console.error('Get quota error:', error);
    return NextResponse.json(
      { error: '查询失败' },
      { status: 500 }
    );
  }
}
