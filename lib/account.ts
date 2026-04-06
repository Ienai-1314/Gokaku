/**
 * 账号管理工具库
 * 实现兑换码即账号的核心逻辑
 */

import { getDb } from "./cloudbase";
import { NextRequest } from "next/server";

export interface Account {
  _id?: string;
  account_id: string;
  account_type: 'redeem_code' | 'free' | 'registered';
  devices: string[];
  max_devices: number;
  created_at: string;
  last_active: string;

  // 付费用户字段
  redeem_codes?: string[];
  quota_total?: number;
  quota_remaining?: number;
  quota_type?: 'daily' | 'unlimited';
  daily_limit?: number;

  // 未来扩展字段
  phone?: string | null;
  email?: string | null;
  linked_redeem_codes?: string[];

  // 会员信息
  membership_expiry?: string;
  total_rewards?: number;

  // 邀请系统字段
  invite_code?: string;           // 邀请码 INV-XXXXXX
  invited_by?: string | null;     // 被谁邀请（邀请人的 account_id）
  invite_count?: number;          // 邀请人数
  invite_rewards?: number;        // 获得的奖励月数
}

export interface DeviceBinding {
  _id?: string;
  device_id: string;
  account_id: string;
  device_name?: string;
  first_bound_at: string;
  last_active: string;
  is_active: boolean;
}

/**
 * 从请求中提取设备ID
 */
export function getDeviceIdFromRequest(req: NextRequest): string {
  const deviceId = req.headers.get("x-device-id");
  if (deviceId) return deviceId;

  // 降级到IP识别
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
             req.headers.get('x-real-ip') ||
             'unknown';

  // 简单哈希IP
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `ip_${Math.abs(hash).toString(36)}`;
}

/**
 * 从请求中获取账号ID（便捷方法）
 */
export async function getAccountIdFromRequest(req: NextRequest): Promise<string> {
  const deviceId = getDeviceIdFromRequest(req);
  return getAccountId(deviceId);
}

/**
 * 获取账号ID
 * 优先级：兑换码账号 > 设备ID临时账号
 * 如果是首次访问，自动创建免费账号
 */
export async function getAccountId(deviceId: string): Promise<string> {
  if (!deviceId) {
    throw new Error('设备ID不能为空');
  }

  try {
    const db = getDb();

    // 1. 查询设备绑定表
    const { data } = await db.collection('device_bindings')
      .where({ device_id: deviceId })
      .limit(1)
      .get();

    if (data && data.length > 0) {
      // 设备已绑定到账号，返回账号ID
      return data[0].account_id;
    }

    // 2. 设备未绑定，检查是否已有临时账号
    const accountId = deviceId;
    const { data: accountData } = await db.collection('accounts')
      .where({ account_id: accountId })
      .limit(1)
      .get();

    if (!accountData || accountData.length === 0) {
      // 3. 首次访问，自动创建免费账号
      console.log(`[getAccountId] 首次访问，创建免费账号: ${accountId}`);
      await createFreeAccount(deviceId);
    }

    // 返回临时账号ID（设备ID本身）
    return accountId;
  } catch (error) {
    console.error('[getAccountId] 查询失败:', error);
    // 出错时降级到设备ID
    return deviceId;
  }
}

/**
 * 获取账号信息
 */
export async function getAccount(accountId: string): Promise<Account | null> {
  try {
    const db = getDb();
    const { data } = await db.collection('accounts')
      .where({ account_id: accountId })
      .limit(1)
      .get();

    if (data && data.length > 0) {
      return data[0] as Account;
    }

    return null;
  } catch (error) {
    console.error('[getAccount] 查询失败:', error);
    return null;
  }
}

/**
 * 创建免费账号（临时账号）
 */
export async function createFreeAccount(deviceId: string): Promise<Account> {
  const db = getDb();
  const now = new Date().toISOString();

  const account: Account = {
    account_id: deviceId,
    account_type: 'free',
    devices: [deviceId],
    max_devices: 1,  // 免费用户只能1个设备
    created_at: now,
    last_active: now,
    quota_total: 0,
    quota_remaining: 0,
    daily_limit: 3  // 每天3次
  };

  await db.collection('accounts').add(account);

  // 创建设备绑定
  await db.collection('device_bindings').add({
    device_id: deviceId,
    account_id: deviceId,
    first_bound_at: now,
    last_active: now,
    is_active: true
  });

  return account;
}

/**
 * 创建兑换码账号（付费账号）
 */
export async function createRedeemAccount(redeemCode: string, deviceId: string): Promise<Account> {
  const db = getDb();
  const now = new Date().toISOString();

  // 会员到期时间：2026年12月31日
  const membershipExpiry = new Date('2026-12-31T23:59:59Z').toISOString();

  const account: Account = {
    account_id: redeemCode,  // 兑换码作为账号ID
    account_type: 'redeem_code',
    devices: [deviceId],
    max_devices: 3,  // 付费用户可以绑定3个设备
    created_at: now,
    last_active: now,
    redeem_codes: [redeemCode],
    quota_total: 100,
    quota_remaining: 100,
    quota_type: 'daily',
    daily_limit: 100,  // 每天100次
    membership_expiry: membershipExpiry,
    total_rewards: 0
  };

  await db.collection('accounts').add(account);

  return account;
}

/**
 * 绑定设备到账号
 */
export async function bindDeviceToAccount(
  deviceId: string,
  accountId: string
): Promise<void> {
  const db = getDb();

  // 1. 检查账号是否存在
  const account = await getAccount(accountId);
  if (!account) {
    throw new Error('账号不存在');
  }

  // 2. 检查设备数量限制
  const devices = account.devices || [];
  if (devices.includes(deviceId)) {
    // 设备已绑定，更新活跃时间
    await db.collection('device_bindings')
      .where({ device_id: deviceId })
      .update({
        last_active: new Date().toISOString()
      });
    return;
  }

  if (devices.length >= account.max_devices) {
    throw new Error(`设备数量已达上限（${account.max_devices}个），请先解绑旧设备`);
  }

  // 3. 检查设备是否已绑定其他账号
  const { data: existingBinding } = await db.collection('device_bindings')
    .where({ device_id: deviceId })
    .get();

  if (existingBinding && existingBinding.length > 0) {
    const oldAccountId = existingBinding[0].account_id;
    if (oldAccountId !== accountId) {
      throw new Error('设备已绑定其他账号，请先解绑');
    }
  }

  // 4. 创建绑定记录
  const now = new Date().toISOString();
  await db.collection('device_bindings').add({
    device_id: deviceId,
    account_id: accountId,
    first_bound_at: now,
    last_active: now,
    is_active: true
  });

  // 5. 更新账号的设备列表
  await db.collection('accounts')
    .where({ account_id: accountId })
    .update({
      devices: db.command.push(deviceId),
      last_active: now
    });
}

/**
 * 解绑设备
 */
export async function unbindDevice(deviceId: string, accountId: string): Promise<void> {
  const db = getDb();

  // 1. 删除绑定记录
  await db.collection('device_bindings')
    .where({ device_id: deviceId, account_id: accountId })
    .remove();

  // 2. 从账号的设备列表中移除
  const account = await getAccount(accountId);
  if (account) {
    const newDevices = account.devices.filter(d => d !== deviceId);
    await db.collection('accounts')
      .where({ account_id: accountId })
      .update({ devices: newDevices });
  }
}

/**
 * 获取账号的所有绑定设备
 */
export async function getAccountDevices(accountId: string): Promise<DeviceBinding[]> {
  try {
    const db = getDb();
    const { data } = await db.collection('device_bindings')
      .where({ account_id: accountId })
      .orderBy('last_active', 'desc')
      .get();

    return (data || []) as DeviceBinding[];
  } catch (error) {
    console.error('[getAccountDevices] 查询失败:', error);
    return [];
  }
}

/**
 * 迁移免费用户数据到兑换码账号
 * 将设备ID临时账号的数据迁移到兑换码账号
 */
export async function migrateToRedeemAccount(
  oldAccountId: string,  // 设备ID
  newAccountId: string   // 兑换码
): Promise<void> {
  const db = getDb();

  console.log(`[migrateToRedeemAccount] 开始迁移: ${oldAccountId} → ${newAccountId}`);

  // 需要迁移的集合
  const collections = [
    'wrong_questions',
    'collections',
    'query_history',
    'grammar_weakness'
  ];

  for (const collectionName of collections) {
    try {
      // 查询旧账号的数据
      const { data } = await db.collection(collectionName)
        .where({ user_id: oldAccountId })
        .get();

      if (data && data.length > 0) {
        console.log(`[migrateToRedeemAccount] 迁移 ${collectionName}: ${data.length} 条记录`);

        // 更新所有数据的 user_id 为新的 account_id
        for (const doc of data) {
          await db.collection(collectionName)
            .doc(doc._id as string)
            .update({
              user_id: newAccountId,
              account_id: newAccountId  // 同时添加 account_id 字段
            });
        }
      }
    } catch (error) {
      console.error(`[migrateToRedeemAccount] 迁移 ${collectionName} 失败:`, error);
      // 继续迁移其他集合
    }
  }

  console.log(`[migrateToRedeemAccount] 迁移完成`);
}

/**
 * 检查兑换码是否已被使用
 */
export async function isRedeemCodeUsed(redeemCode: string): Promise<boolean> {
  const account = await getAccount(redeemCode);
  return account !== null;
}

/**
 * 更新账号活跃时间
 */
export async function updateAccountActivity(accountId: string): Promise<void> {
  try {
    const db = getDb();
    const now = new Date().toISOString();

    await db.collection('accounts')
      .where({ account_id: accountId })
      .update({ last_active: now });
  } catch (error) {
    console.error('[updateAccountActivity] 更新失败:', error);
  }
}

/**
 * 未来扩展：升级到手机号注册账号
 */
export async function upgradeToRegisteredAccount(
  redeemCodeAccountId: string,
  phone: string
): Promise<string> {
  const db = getDb();

  // 1. 生成新的账号ID
  const newAccountId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // 2. 获取旧账号信息
  const oldAccount = await getAccount(redeemCodeAccountId);
  if (!oldAccount) {
    throw new Error('原账号不存在');
  }

  // 3. 创建注册账号
  const now = new Date().toISOString();
  await db.collection('accounts').add({
    account_id: newAccountId,
    account_type: 'registered',
    phone: phone,
    linked_redeem_codes: [redeemCodeAccountId],
    devices: oldAccount.devices,
    max_devices: oldAccount.max_devices,
    quota_total: oldAccount.quota_total,
    quota_remaining: oldAccount.quota_remaining,
    quota_type: oldAccount.quota_type,
    daily_limit: oldAccount.daily_limit,
    membership_expiry: oldAccount.membership_expiry,
    total_rewards: oldAccount.total_rewards,
    created_at: now,
    last_active: now
  });

  // 4. 迁移所有数据
  await migrateToRedeemAccount(redeemCodeAccountId, newAccountId);

  // 5. 更新设备绑定
  await db.collection('device_bindings')
    .where({ account_id: redeemCodeAccountId })
    .update({ account_id: newAccountId });

  // 6. 标记旧账号为已升级
  await db.collection('accounts')
    .where({ account_id: redeemCodeAccountId })
    .update({
      upgraded_to: newAccountId,
      is_upgraded: true
    });

  return newAccountId;
}

/**
 * 生成邀请码
 */
export function generateInviteCode(): string {
  // 去掉易混淆字符 O/0/I/1
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const code = Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
  return `INV-${code}`;
}

/**
 * 获取或创建账号的邀请码
 */
export async function getOrCreateInviteCode(accountId: string): Promise<string> {
  const db = getDb();

  // 1. 查询账号是否已有邀请码
  const account = await getAccount(accountId);
  if (!account) {
    throw new Error('账号不存在');
  }

  if (account.invite_code) {
    return account.invite_code;
  }

  // 2. 生成唯一邀请码（碰撞重试）
  let inviteCode: string;
  let attempts = 0;

  do {
    inviteCode = generateInviteCode();
    const { data: existing } = await db.collection('accounts')
      .where({ invite_code: inviteCode })
      .get();

    if (!existing || existing.length === 0) break;
    attempts++;
  } while (attempts < 10);

  if (attempts >= 10) {
    throw new Error('生成邀请码失败，请稍后重试');
  }

  // 3. 更新账号的邀请码
  await db.collection('accounts')
    .where({ account_id: accountId })
    .update({
      invite_code: inviteCode,
      invite_count: 0,
      invite_rewards: 0
    });

  return inviteCode;
}

/**
 * 记录邀请关系
 */
export async function recordInvitation(
  inviterAccountId: string,
  inviteeAccountId: string,
  inviteCode: string
): Promise<void> {
  const db = getDb();
  const now = new Date().toISOString();

  // 1. 检查是否已有邀请记录
  const { data: existing } = await db.collection('invite_records')
    .where({ invitee_id: inviteeAccountId })
    .get();

  if (existing && existing.length > 0) {
    console.log(`[recordInvitation] 账号 ${inviteeAccountId} 已有邀请记录，跳过`);
    return;
  }

  // 2. 创建邀请记录
  await db.collection('invite_records').add({
    inviter_id: inviterAccountId,
    invitee_id: inviteeAccountId,
    invite_code: inviteCode,
    reward_granted: false,
    created_at: now,
    redeemed_at: null
  });

  // 3. 更新被邀请人的 invited_by 字段
  await db.collection('accounts')
    .where({ account_id: inviteeAccountId })
    .update({
      invited_by: inviterAccountId
    });

  console.log(`[recordInvitation] 记录邀请关系: ${inviterAccountId} -> ${inviteeAccountId}`);
}

/**
 * 发放邀请奖励（延长会员1个月）
 */
export async function grantInviteReward(inviteeAccountId: string): Promise<void> {
  const db = getDb();

  // 1. 查询被邀请人的邀请记录
  const { data: records } = await db.collection('invite_records')
    .where({ invitee_id: inviteeAccountId, reward_granted: false })
    .get();

  if (!records || records.length === 0) {
    console.log(`[grantInviteReward] 没有待发放的邀请奖励: ${inviteeAccountId}`);
    return;
  }

  const record = records[0];
  const inviterAccountId = record.inviter_id;

  // 2. 查询邀请人账号
  const inviter = await getAccount(inviterAccountId);
  if (!inviter) {
    console.error(`[grantInviteReward] 邀请人账号不存在: ${inviterAccountId}`);
    return;
  }

  // 3. 延长邀请人的会员到期时间1个月
  let newExpiry: string;
  if (inviter.membership_expiry) {
    const currentExpiry = new Date(inviter.membership_expiry);
    currentExpiry.setMonth(currentExpiry.getMonth() + 1);
    newExpiry = currentExpiry.toISOString();
  } else {
    // 如果没有会员到期时间，从现在开始加1个月
    const now = new Date();
    now.setMonth(now.getMonth() + 1);
    newExpiry = now.toISOString();
  }

  // 4. 更新邀请人账号
  await db.collection('accounts')
    .where({ account_id: inviterAccountId })
    .update({
      membership_expiry: newExpiry,
      invite_count: db.command.inc(1),
      invite_rewards: db.command.inc(1)
    });

  // 5. 标记奖励已发放
  const now = new Date().toISOString();
  await db.collection('invite_records')
    .doc(record._id as string)
    .update({
      reward_granted: true,
      redeemed_at: now
    });

  console.log(`[grantInviteReward] 发放邀请奖励: ${inviterAccountId} 会员延长至 ${newExpiry}`);
}

/**
 * 获取邀请统计
 */
export async function getInviteStats(accountId: string): Promise<{
  invite_code: string;
  invite_count: number;
  invite_rewards: number;
  invite_records: any[];
}> {
  const db = getDb();

  // 1. 获取账号信息
  const account = await getAccount(accountId);
  if (!account) {
    throw new Error('账号不存在');
  }

  // 2. 获取邀请码（如果没有则创建）
  const inviteCode = account.invite_code || await getOrCreateInviteCode(accountId);

  // 3. 获取邀请记录
  const { data: records } = await db.collection('invite_records')
    .where({ inviter_id: accountId })
    .orderBy('created_at', 'desc')
    .get();

  return {
    invite_code: inviteCode,
    invite_count: account.invite_count || 0,
    invite_rewards: account.invite_rewards || 0,
    invite_records: records || []
  };
}
