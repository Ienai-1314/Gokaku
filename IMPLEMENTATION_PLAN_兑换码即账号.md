# 兑换码即账号 - 实施计划

**制定日期**: 2026-04-05  
**预计工作量**: 3-4天  
**目标**: 实现兑换码作为账号ID，支持跨设备同步，为未来手机号注册预留扩展空间

---

## 📋 一、腾讯云数据库需要更新的集合

### 1.1 需要修改字段的集合（共8个）

#### ✅ 已使用 `user_id` 的集合（需要改为 `account_id`）
```
1. wrong_questions - 错题本
   修改: user_id → account_id
   
2. collections - 收藏
   修改: user_id → account_id
   
3. query_history - 查询历史
   修改: user_id → account_id
   
4. grammar_weakness - 语法薄弱点
   修改: user_id → account_id
   
5. user_quota - 用户额度表
   修改: user_id → account_id
   
6. rate_limits - 限流记录表
   修改: key 格式从 "user_id:route:date" → "account_id:route:date"
   
7. invite_bonuses - 邀请奖励表
   修改: user_id → account_id
   
8. redeem_logs - 兑换日志表
   修改: user_id → account_id
```

### 1.2 需要新增的集合

#### 📦 accounts - 账号主表（新建）
```json
{
  "_id": "auto_generated",
  "account_id": "GOKAKU-001",  // 兑换码作为账号ID
  "account_type": "redeem_code",  // redeem_code | free | registered
  "devices": ["device-A", "device-B"],  // 绑定的设备列表
  "max_devices": 3,  // 最多绑定3个设备
  "created_at": "2026-04-05T10:00:00Z",
  "last_active": "2026-04-05T15:30:00Z",
  
  // 付费用户字段
  "redeem_codes": ["GOKAKU-001"],  // 已兑换的码
  "quota_total": 100,  // 总额度
  "quota_remaining": 87,  // 剩余额度
  "quota_type": "daily",  // daily | unlimited
  "daily_limit": 100,  // 每天100次
  
  // 未来扩展字段（手机号注册）
  "phone": null,  // 手机号（未来）
  "email": null,  // 邮箱（未来）
  "linked_redeem_codes": [],  // 关联的兑换码（未来）
  
  // 会员信息
  "membership_expiry": "2026-12-31T23:59:59Z",  // 会员到期时间
  "total_rewards": 0  // 返现次数
}
```

**索引**:
- `account_id` (唯一索引)
- `devices` (数组索引)
- `phone` (唯一索引，未来使用)

#### 📦 device_bindings - 设备绑定表（新建）
```json
{
  "_id": "auto_generated",
  "device_id": "device-xxx",
  "account_id": "GOKAKU-001",
  "device_name": "iPhone 13",  // 可选，用户自定义
  "first_bound_at": "2026-04-05T10:00:00Z",
  "last_active": "2026-04-05T15:30:00Z",
  "is_active": true
}
```

**索引**:
- `device_id` (唯一索引)
- `account_id` (普通索引)

---

## 🔧 二、代码修改清单

### 2.1 核心函数修改

#### 📝 lib/account.ts（新建）
```typescript
/**
 * 账号管理工具库
 */

export interface Account {
  account_id: string;
  account_type: 'redeem_code' | 'free' | 'registered';
  devices: string[];
  max_devices: number;
  quota_remaining: number;
  daily_limit: number;
}

/**
 * 获取账号ID
 * 优先级：兑换码账号 > 设备ID临时账号
 */
export async function getAccountId(deviceId: string): Promise<string> {
  // 1. 查询设备绑定表
  const binding = await db.collection('device_bindings')
    .where({ device_id: deviceId })
    .get();
  
  if (binding.data.length > 0) {
    // 设备已绑定到账号
    return binding.data[0].account_id;
  }
  
  // 2. 设备未绑定，返回临时账号ID（设备ID）
  return deviceId;
}

/**
 * 绑定设备到账号
 */
export async function bindDeviceToAccount(
  deviceId: string, 
  accountId: string
): Promise<void> {
  // 1. 检查账号是否存在
  const account = await db.collection('accounts')
    .where({ account_id: accountId })
    .get();
  
  if (account.data.length === 0) {
    throw new Error('账号不存在');
  }
  
  // 2. 检查设备数量限制
  const devices = account.data[0].devices || [];
  if (devices.length >= account.data[0].max_devices) {
    throw new Error('设备数量已达上限，请先解绑旧设备');
  }
  
  // 3. 检查设备是否已绑定其他账号
  const existingBinding = await db.collection('device_bindings')
    .where({ device_id: deviceId })
    .get();
  
  if (existingBinding.data.length > 0) {
    throw new Error('设备已绑定其他账号');
  }
  
  // 4. 创建绑定记录
  await db.collection('device_bindings').add({
    device_id: deviceId,
    account_id: accountId,
    first_bound_at: new Date().toISOString(),
    last_active: new Date().toISOString(),
    is_active: true
  });
  
  // 5. 更新账号的设备列表
  await db.collection('accounts')
    .where({ account_id: accountId })
    .update({
      devices: db.command.push(deviceId)
    });
}

/**
 * 迁移免费用户数据到兑换码账号
 */
export async function migrateToRedeemAccount(
  oldAccountId: string,  // 设备ID
  newAccountId: string   // 兑换码
): Promise<void> {
  const collections = [
    'wrong_questions',
    'collections',
    'query_history',
    'grammar_weakness'
  ];
  
  for (const collectionName of collections) {
    // 更新所有数据的 account_id
    await db.collection(collectionName)
      .where({ account_id: oldAccountId })
      .update({ account_id: newAccountId });
  }
}

/**
 * 未来：升级到手机号注册账号
 */
export async function upgradeToRegisteredAccount(
  redeemCodeAccountId: string,
  phone: string
): Promise<string> {
  // 1. 生成新的账号ID
  const newAccountId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // 2. 创建注册账号
  const oldAccount = await db.collection('accounts')
    .where({ account_id: redeemCodeAccountId })
    .get();
  
  await db.collection('accounts').add({
    account_id: newAccountId,
    account_type: 'registered',
    phone: phone,
    linked_redeem_codes: [redeemCodeAccountId],
    devices: oldAccount.data[0].devices,
    quota_remaining: oldAccount.data[0].quota_remaining,
    // ... 其他字段
  });
  
  // 3. 迁移所有数据
  await migrateToRedeemAccount(redeemCodeAccountId, newAccountId);
  
  // 4. 标记旧账号为已升级
  await db.collection('accounts')
    .where({ account_id: redeemCodeAccountId })
    .update({ upgraded_to: newAccountId });
  
  return newAccountId;
}
```

#### 📝 修改所有API路由的 getUserId 函数

**修改前**:
```typescript
function getUserId(req: NextRequest): string {
  const deviceId = req.headers.get("x-device-id");
  if (deviceId) return deviceId;
  
  const ip = getClientIP(req);
  return hashIP(ip);
}
```

**修改后**:
```typescript
async function getAccountId(req: NextRequest): Promise<string> {
  const deviceId = req.headers.get("x-device-id");
  if (!deviceId) {
    // 降级到IP（向后兼容）
    const ip = getClientIP(req);
    return hashIP(ip);
  }
  
  // 查询设备绑定表
  const db = getDb();
  const { data } = await db.collection('device_bindings')
    .where({ device_id: deviceId })
    .get();
  
  if (data && data.length > 0) {
    // 设备已绑定到账号，返回账号ID
    return data[0].account_id;
  }
  
  // 设备未绑定，返回设备ID作为临时账号
  return deviceId;
}
```

### 2.2 需要修改的API路由（共11个）

```
1. app/api/query/route.ts - 语法查询
2. app/api/vocab/route.ts - 词汇查询
3. app/api/analyze/route.ts - 错题分析
4. app/api/redeem/route.ts - 兑换码（核心修改）
5. app/api/usage/route.ts - 额度查询
6. app/api/collection/route.ts - 收藏
7. app/api/progress/route.ts - 个人中心
8. app/api/history/route.ts - 查询历史
9. app/api/invite/route.ts - 邀请系统
10. app/api/quota/route.ts - 额度查询
11. lib/ratelimit.ts - 限流逻辑
```

### 2.3 兑换码API核心修改

#### 📝 app/api/redeem/route.ts

**修改前逻辑**:
```typescript
// 1. 验证兑换码
// 2. 给当前设备ID增加额度
// 3. 标记兑换码为已使用
```

**修改后逻辑**:
```typescript
export async function POST(req: NextRequest) {
  const deviceId = req.headers.get('x-device-id');
  const { code } = await req.json();
  
  // 1. 验证兑换码格式
  if (!validateRedeemCode(code)) {
    return NextResponse.json({ error: '兑换码格式不正确' }, { status: 400 });
  }
  
  // 2. 检查兑换码是否已使用
  const { data: existingAccount } = await db.collection('accounts')
    .where({ account_id: code })
    .get();
  
  if (existingAccount.length > 0) {
    // 兑换码已被使用，检查是否是同一个用户
    const account = existingAccount[0];
    
    if (account.devices.includes(deviceId)) {
      return NextResponse.json({ 
        error: '该设备已绑定此兑换码' 
      }, { status: 400 });
    }
    
    if (account.devices.length >= account.max_devices) {
      return NextResponse.json({ 
        error: '该兑换码已绑定3个设备，请先解绑旧设备' 
      }, { status: 400 });
    }
    
    // 绑定新设备到现有账号
    await bindDeviceToAccount(deviceId, code);
    
    return NextResponse.json({
      success: true,
      message: '设备绑定成功！数据已同步',
      account_id: code,
      devices: [...account.devices, deviceId]
    });
  }
  
  // 3. 兑换码首次使用，创建新账号
  const oldAccountId = await getAccountId(req);  // 获取当前临时账号ID
  
  // 创建兑换码账号
  await db.collection('accounts').add({
    account_id: code,  // 兑换码作为账号ID
    account_type: 'redeem_code',
    devices: [deviceId],
    max_devices: 3,
    redeem_codes: [code],
    quota_total: 100,
    quota_remaining: 100,
    quota_type: 'daily',
    daily_limit: 100,
    created_at: new Date().toISOString(),
    last_active: new Date().toISOString()
  });
  
  // 4. 迁移免费用户数据
  if (oldAccountId !== deviceId) {
    // 如果之前有临时账号数据，迁移过来
    await migrateToRedeemAccount(oldAccountId, code);
  }
  
  // 5. 绑定设备
  await bindDeviceToAccount(deviceId, code);
  
  // 6. 标记兑换码为已使用（JSON文件）
  markRedeemCodeAsUsed(code, deviceId);
  
  return NextResponse.json({
    success: true,
    message: '兑换成功！',
    account_id: code,
    quota: 100,
    daily_limit: 100
  });
}
```

---

## 📊 三、数据迁移脚本

### 3.1 迁移现有数据

#### 📝 scripts/migrate-to-account-system.js（新建）

```javascript
/**
 * 数据迁移脚本：user_id → account_id
 * 将现有的设备ID数据迁移到新的账号系统
 */

const cloudbase = require("@cloudbase/node-sdk");
require('dotenv').config({ path: '.env.local' });

const app = cloudbase.init({
  env: process.env.TCB_ENV_ID,
  secretId: process.env.TCB_SECRET_ID,
  secretKey: process.env.TCB_SECRET_KEY,
});

const db = app.database();

async function migrateData() {
  console.log("=== 开始数据迁移 ===\n");
  
  // 1. 创建新集合
  console.log("1. 创建新集合...");
  try {
    await db.createCollection('accounts');
    await db.createCollection('device_bindings');
    console.log("✅ 新集合创建成功\n");
  } catch (err) {
    console.log("⚠️  集合已存在，跳过创建\n");
  }
  
  // 2. 迁移 user_quota 数据到 accounts
  console.log("2. 迁移用户额度数据...");
  const { data: quotas } = await db.collection('user_quota').get();
  
  for (const quota of quotas) {
    const accountId = quota.user_id;  // 保持原有ID
    
    // 创建账号记录
    await db.collection('accounts').add({
      account_id: accountId,
      account_type: quota.redeemCodes?.length > 0 ? 'redeem_code' : 'free',
      devices: [accountId],  // 假设原有ID就是设备ID
      max_devices: 3,
      redeem_codes: quota.redeemCodes || [],
      quota_total: quota.total || 0,
      quota_remaining: quota.remaining || 0,
      quota_type: 'daily',
      daily_limit: 100,
      created_at: quota.createdAt || new Date().toISOString(),
      last_active: new Date().toISOString()
    });
    
    // 创建设备绑定记录
    await db.collection('device_bindings').add({
      device_id: accountId,
      account_id: accountId,
      first_bound_at: quota.createdAt || new Date().toISOString(),
      last_active: new Date().toISOString(),
      is_active: true
    });
  }
  
  console.log(`✅ 迁移了 ${quotas.length} 个账号\n`);
  
  // 3. 重命名字段：user_id → account_id
  console.log("3. 重命名字段...");
  const collections = [
    'wrong_questions',
    'collections',
    'query_history',
    'grammar_weakness',
    'invite_bonuses',
    'redeem_logs'
  ];
  
  for (const collectionName of collections) {
    console.log(`   处理 ${collectionName}...`);
    const { data } = await db.collection(collectionName).get();
    
    for (const doc of data) {
      if (doc.user_id) {
        await db.collection(collectionName)
          .doc(doc._id)
          .update({ account_id: doc.user_id });
      }
    }
    
    console.log(`   ✅ ${collectionName} 完成`);
  }
  
  console.log("\n=== 数据迁移完成 ===");
  console.log("注意：请手动删除旧的 user_id 字段（可选）");
}

migrateData().catch(console.error);
```

---

## 🎨 四、前端修改

### 4.1 个人中心显示账号信息

#### 📝 app/dashboard/page.tsx

```typescript
// 显示账号ID和绑定设备
<div className="bg-white rounded-lg p-6 shadow-sm">
  <h3 className="text-lg font-semibold mb-4">账号信息</h3>
  
  <div className="space-y-3">
    <div>
      <span className="text-gray-600">账号ID：</span>
      <span className="font-mono">{account.account_id}</span>
      {account.account_type === 'redeem_code' && (
        <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
          付费会员
        </span>
      )}
    </div>
    
    <div>
      <span className="text-gray-600">每日额度：</span>
      <span className="font-semibold">{account.daily_limit} 次/天</span>
    </div>
    
    <div>
      <span className="text-gray-600">已绑定设备：</span>
      <span>{account.devices.length} / {account.max_devices}</span>
    </div>
    
    <div className="pt-3 border-t">
      <button className="text-blue-600 text-sm">
        管理设备 →
      </button>
    </div>
  </div>
</div>
```

### 4.2 设备管理页面

#### 📝 app/devices/page.tsx（新建）

```typescript
"use client";

export default function DevicesPage() {
  const [devices, setDevices] = useState([]);
  
  useEffect(() => {
    // 获取绑定设备列表
    apiFetch('/api/devices')
      .then(r => r.json())
      .then(setDevices);
  }, []);
  
  async function unbindDevice(deviceId: string) {
    if (!confirm('确定要解绑此设备吗？')) return;
    
    await apiFetch('/api/devices/unbind', {
      method: 'POST',
      body: JSON.stringify({ device_id: deviceId })
    });
    
    // 刷新列表
    window.location.reload();
  }
  
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">设备管理</h1>
      
      <div className="space-y-4">
        {devices.map(device => (
          <div key={device.device_id} className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-semibold">
                  {device.device_id === getDeviceId() ? (
                    <span className="text-green-600">当前设备</span>
                  ) : (
                    <span>设备 {device.device_id.slice(-8)}</span>
                  )}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  最后活跃：{new Date(device.last_active).toLocaleString()}
                </div>
              </div>
              
              {device.device_id !== getDeviceId() && (
                <button
                  onClick={() => unbindDevice(device.device_id)}
                  className="text-red-600 text-sm"
                >
                  解绑
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 text-sm text-gray-600">
        最多可绑定 {account.max_devices} 个设备
      </div>
    </div>
  );
}
```

---

## 📝 五、定价文案修改

### 5.1 components/Pricing.tsx

**修改前**:
```typescript
<div>无限次 AI 查询</div>
```

**修改后**:
```typescript
<div>每天 100 次 AI 查询</div>
<div className="text-xs text-gray-500 mt-1">
  足够日常学习使用，每天重置
</div>
```

### 5.2 说明文案

```
考季通票 ¥29.9
- 每天 100 次 AI 查询（语法、词汇、错题分析）
- 无限错题本和收藏
- 最多绑定 3 个设备
- 做满 100 道题返现 ¥9.9
- 有效期至 2026 年 12 月 31 日
```

---

## ✅ 六、实施步骤

### Day 1: 数据库和核心函数
- [ ] 在腾讯云控制台创建 `accounts` 和 `device_bindings` 集合
- [ ] 创建 `lib/account.ts` 工具库
- [ ] 编写数据迁移脚本 `scripts/migrate-to-account-system.js`
- [ ] 测试迁移脚本（在测试环境）

### Day 2: API路由修改
- [ ] 修改 `app/api/redeem/route.ts`（核心）
- [ ] 修改所有API路由的 `getUserId` → `getAccountId`
- [ ] 修改 `lib/ratelimit.ts` 限流逻辑
- [ ] 测试兑换码兑换流程

### Day 3: 前端修改
- [ ] 修改 `app/dashboard/page.tsx` 显示账号信息
- [ ] 创建 `app/devices/page.tsx` 设备管理页面
- [ ] 创建 `app/api/devices/route.ts` 设备管理API
- [ ] 修改 `components/Pricing.tsx` 定价文案

### Day 4: 测试和部署
- [ ] 完整功能测试
  - 免费用户兑换码
  - 跨设备同步
  - 设备绑定/解绑
  - 数据迁移
- [ ] 执行生产环境数据迁移
- [ ] 部署到 Vercel
- [ ] 监控错误日志

---

## 🧪 七、测试清单

### 7.1 兑换码功能测试
- [ ] 免费用户首次兑换码
- [ ] 兑换码绑定第2个设备
- [ ] 兑换码绑定第3个设备
- [ ] 尝试绑定第4个设备（应该失败）
- [ ] 重复兑换同一个码（应该提示已使用）

### 7.2 数据同步测试
- [ ] 设备A做10道错题
- [ ] 设备B兑换同一个码
- [ ] 设备B能看到设备A的10道错题
- [ ] 设备B再做5道错题
- [ ] 设备A能看到总共15道错题

### 7.3 额度测试
- [ ] 免费用户每天3次限制
- [ ] 付费用户每天100次限制
- [ ] 跨设备额度共享（设备A用50次，设备B还剩50次）

### 7.4 设备管理测试
- [ ] 查看绑定设备列表
- [ ] 解绑旧设备
- [ ] 解绑后重新绑定新设备

---

## 🚨 八、风险和注意事项

### 8.1 数据迁移风险
- ⚠️ 迁移前务必备份数据库
- ⚠️ 先在测试环境验证迁移脚本
- ⚠️ 迁移过程中可能需要短暂停机（5-10分钟）

### 8.2 向后兼容
- ✅ 保留 `user_id` 字段（不删除），确保旧代码不报错
- ✅ API路由同时支持 `user_id` 和 `account_id`
- ✅ 前端逐步升级，不强制用户重新登录

### 8.3 性能影响
- ⚠️ 每次API调用需要额外查询 `device_bindings` 表（+50ms）
- ✅ 可以通过缓存优化（后续Phase 2）

---

## 📊 九、预期效果

### 9.1 用户体验提升
- ✅ 用户换设备后数据不丢失
- ✅ 一个兑换码可以在3个设备使用
- ✅ 数据实时同步
- ✅ 用户信任度提升

### 9.2 业务价值
- ✅ 防止兑换码滥用
- ✅ 为未来手机号注册预留扩展空间
- ✅ 提升转化率（用户敢买了）
- ✅ 降低客服成本（不会再问"换手机数据丢了"）

### 9.3 技术债务
- ✅ 用户体系架构清晰
- ✅ 数据归属权明确
- ✅ 易于扩展到手机号注册

---

## 🎯 十、未来扩展（Phase 3）

### 10.1 手机号注册
```typescript
// 用户注册手机号后
{
  account_id: "user-uuid-xxx",
  account_type: "registered",
  phone: "138****1234",
  linked_redeem_codes: ["GOKAKU-001", "GOKAKU-002"],  // 可以绑定多个兑换码
  devices: ["device-A", "device-B", "device-C"],
  quota_remaining: 200  // 多个兑换码额度叠加
}
```

### 10.2 会员等级
```typescript
{
  membership_level: "basic" | "premium" | "vip",
  daily_limit: 100 | 200 | 500,
  max_devices: 3 | 5 | 10
}
```

---

**制定人**: Claude  
**审核人**: Garo  
**开始日期**: 2026-04-05
