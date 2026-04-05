import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import { validateRedeemCode, createSafeErrorResponse, checkRequestRate } from '@/lib/security';
import {
  getAccountId,
  getAccount,
  createRedeemAccount,
  bindDeviceToAccount,
  migrateToRedeemAccount,
  isRedeemCodeUsed,
  getDeviceIdFromRequest
} from '@/lib/account';
import { getDb } from '@/lib/cloudbase';

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
    const deviceId = getDeviceIdFromRequest(req);
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

    // 1. 检查兑换码是否已在账号系统中使用
    const existingAccount = await getAccount(normalizedCode);

    if (existingAccount) {
      // 兑换码已被使用，检查是否是同一个用户的其他设备
      const devices = existingAccount.devices || [];

      if (devices.includes(deviceId)) {
        return NextResponse.json({
          error: '该设备已绑定此兑换码',
          account_id: normalizedCode
        }, { status: 400 });
      }

      if (devices.length >= existingAccount.max_devices) {
        return NextResponse.json({
          error: `该兑换码已绑定${existingAccount.max_devices}个设备，请先解绑旧设备`,
          max_devices: existingAccount.max_devices
        }, { status: 400 });
      }

      // 绑定新设备到现有账号
      try {
        await bindDeviceToAccount(deviceId, normalizedCode);

        return NextResponse.json({
          success: true,
          message: '设备绑定成功！数据已同步',
          account_id: normalizedCode,
          devices: [...devices, deviceId],
          quota: existingAccount.quota_remaining || 0,
          daily_limit: existingAccount.daily_limit || 100
        });
      } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    // 2. 兑换码首次使用，检查JSON文件中的兑换码状态
    const codesPath = path.join(process.cwd(), 'lib/data/redeem_codes.json');
    let codesData: RedeemCode[] = [];

    try {
      codesData = JSON.parse(fs.readFileSync(codesPath, 'utf-8'));
    } catch (error) {
      console.error('读取兑换码文件失败:', error);
      return NextResponse.json({ error: '兑换码验证失败，请联系客服' }, { status: 500 });
    }

    // 3. 查找兑换码
    const codeIndex = codesData.findIndex(c => c.code === normalizedCode);
    if (codeIndex === -1) {
      return NextResponse.json({ error: '兑换码不存在' }, { status: 404 });
    }

    const redeemCode = codesData[codeIndex];

    // 4. 检查是否已使用（JSON文件中的状态）
    if (redeemCode.status === 'used') {
      return NextResponse.json(
        { error: `该兑换码已于 ${redeemCode.usedAt} 使用过` },
        { status: 400 }
      );
    }

    // 5. 获取当前用户的临时账号ID（设备ID）
    const oldAccountId = await getAccountId(deviceId);

    // 6. 创建兑换码账号
    try {
      await createRedeemAccount(normalizedCode, deviceId);
    } catch (error) {
      console.error('创建兑换码账号失败:', error);
      return NextResponse.json({ error: '兑换失败，请稍后重试' }, { status: 500 });
    }

    // 7. 迁移免费用户数据（如果有）
    if (oldAccountId !== deviceId && oldAccountId !== normalizedCode) {
      try {
        await migrateToRedeemAccount(oldAccountId, normalizedCode);
        console.log(`数据迁移成功: ${oldAccountId} → ${normalizedCode}`);
      } catch (error) {
        console.error('数据迁移失败:', error);
        // 迁移失败不影响兑换流程
      }
    }

    // 8. 绑定设备到账号
    try {
      await bindDeviceToAccount(deviceId, normalizedCode);
    } catch (error) {
      console.error('绑定设备失败:', error);
      // 绑定失败不影响兑换流程（账号已创建）
    }

    // 9. 标记兑换码为已使用（JSON文件）
    const now = new Date().toISOString();
    redeemCode.status = 'used';
    redeemCode.usedAt = now;
    redeemCode.usedBy = normalizedCode; // 存储账号ID
    codesData[codeIndex] = redeemCode;

    try {
      fs.writeFileSync(codesPath, JSON.stringify(codesData, null, 2), 'utf-8');
    } catch (error) {
      console.error('更新兑换码文件失败:', error);
      // 文件更新失败不影响兑换流程（数据库已更新）
    }

    // 10. 记录兑换日志到 CloudBase
    try {
      const db = getDb();
      await db.collection('redeem_logs').add({
        code: normalizedCode,
        account_id: normalizedCode,
        device_id: deviceId,
        redeemedAt: now,
        quotaAdded: 100
      });
    } catch (error) {
      console.error('记录兑换日志失败:', error);
      // 日志记录失败不影响兑换流程
    }

    return NextResponse.json({
      success: true,
      quota: 100,
      daily_limit: 100,
      message: '兑换成功！已为您开通会员',
      account_id: normalizedCode,
      membership_expiry: '2026-12-31T23:59:59Z'
    });

  } catch (error) {
    console.error('Redeem error:', error);
    const safeError = createSafeErrorResponse(error);
    return NextResponse.json(safeError, { status: 500 });
  }
}
