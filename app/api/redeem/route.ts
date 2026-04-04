import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import tcb from '@cloudbase/node-sdk';
import { validateRedeemCode, hashIP, createSafeErrorResponse, checkRequestRate } from '@/lib/security';

// 初始化 CloudBase
const app = tcb.init({
  env: process.env.TCB_ENV_ID!,
  secretId: process.env.TCB_SECRET_ID,
  secretKey: process.env.TCB_SECRET_KEY,
});
const db = app.database();

interface RedeemCode {
  code: string;
  status: 'unused' | 'used';
  usedAt?: string;
  usedBy?: string;
  createdAt: string;
}

// 获取客户端IP
function getClientIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0] ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

export async function POST(req: NextRequest) {
  try {
    const clientIP = getClientIP(req);

    // 请求频率限制：每分钟最多5次（防止暴力破解）
    if (!checkRequestRate(`redeem:${clientIP}`, 5, 60000)) {
      return NextResponse.json({ error: '请求过于频繁，请稍后再试' }, { status: 429 });
    }

    const { code } = await req.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: '请输入有效的兑换码' }, { status: 400 });
    }

    const normalizedCode = code.trim().toUpperCase();

    // 验证兑换码格式
    if (!validateRedeemCode(normalizedCode)) {
      return NextResponse.json({ error: '兑换码格式不正确' }, { status: 400 });
    }

    // 1. 读取兑换码数据
    const codesPath = path.join(process.cwd(), 'lib/data/redeem_codes.json');
    const codesData: RedeemCode[] = JSON.parse(fs.readFileSync(codesPath, 'utf-8'));

    // 2. 查找兑换码
    const codeIndex = codesData.findIndex(c => c.code === normalizedCode);
    if (codeIndex === -1) {
      return NextResponse.json({ error: '兑换码不存在' }, { status: 404 });
    }

    const redeemCode = codesData[codeIndex];

    // 3. 检查是否已使用
    if (redeemCode.status === 'used') {
      return NextResponse.json(
        { error: `该兑换码已于 ${redeemCode.usedAt} 使用过` },
        { status: 400 }
      );
    }

    // 4. 检查该IP是否已有额度记录
    const quotaCollection = db.collection('user_quota');
    const hashedIP = hashIP(clientIP); // IP脱敏
    const existingQuota = await quotaCollection.where({ ip: hashedIP }).get();

    const quotaToAdd = 100;
    const now = new Date().toISOString();

    if (existingQuota.data.length > 0) {
      // 已有记录，增加额度
      const currentQuota = existingQuota.data[0];
      await quotaCollection.doc(currentQuota._id).update({
        remaining: currentQuota.remaining + quotaToAdd,
        total: currentQuota.total + quotaToAdd,
        lastRedeemAt: now,
        redeemCodes: db.command.push(normalizedCode)
      });
    } else {
      // 新用户，创建记录
      await quotaCollection.add({
        ip: hashedIP,
        remaining: quotaToAdd,
        total: quotaToAdd,
        used: 0,
        createdAt: now,
        lastRedeemAt: now,
        redeemCodes: [normalizedCode]
      });
    }

    // 5. 标记兑换码为已使用
    redeemCode.status = 'used';
    redeemCode.usedAt = now;
    redeemCode.usedBy = hashedIP; // 存储脱敏后的IP
    codesData[codeIndex] = redeemCode;

    // 6. 写回文件
    fs.writeFileSync(codesPath, JSON.stringify(codesData, null, 2), 'utf-8');

    // 7. 记录兑换日志到 CloudBase
    await db.collection('redeem_logs').add({
      code: normalizedCode,
      ip: hashedIP,
      redeemedAt: now,
      quotaAdded: quotaToAdd
    });

    return NextResponse.json({
      success: true,
      quota: quotaToAdd,
      message: '兑换成功！'
    });

  } catch (error) {
    console.error('Redeem error:', error);
    const safeError = createSafeErrorResponse(error);
    return NextResponse.json(safeError, { status: 500 });
  }
}
