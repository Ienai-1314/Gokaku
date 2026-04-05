# Gokaku 代码全面复盘与优化计划

**复盘日期**: 2026-04-05  
**目标**: 确保用户体系准确无误，优化搜索返回速度

---

## 📊 一、当前架构总览

### 1.1 技术栈
- **前端**: Next.js 14 (App Router) + React + TypeScript + Tailwind CSS
- **后端**: Next.js API Routes (Serverless)
- **数据库**: 腾讯云 CloudBase (NoSQL)
- **AI服务**: DeepSeek API
- **部署**: Vercel

### 1.2 核心功能模块
```
Gokaku
├── 用户识别系统 (设备ID + IP + 兑换码)
├── 限流和额度系统 (免费3次/功能 + 付费100次)
├── AI查询系统 (语法、词汇、错题分析)
├── 数据存储系统 (错题本、收藏、历史)
├── 兑换码系统 (购买解锁)
└── 个人中心 (学习统计、返现进度)
```

---

## 🔍 二、用户识别系统复盘

### 2.1 当前实现

#### **设备ID识别** (`lib/device.ts`)
```typescript
// 前端生成设备ID，存储在LocalStorage
getDeviceId() → "device-{timestamp}-{random}"
```

**优点**:
- ✅ 同一设备永久识别
- ✅ 换网络不影响
- ✅ 无需注册登录

**缺点**:
- ❌ 清除浏览器数据会丢失
- ❌ 无法跨设备同步（免费用户）

#### **用户ID获取逻辑** (所有API路由)
```typescript
function getUserId(req: NextRequest): string {
  // 优先使用设备ID
  const deviceId = req.headers.get("x-device-id");
  if (deviceId) return deviceId;

  // 降级到IP哈希（向后兼容）
  const ip = getClientIP(req);
  return hashIP(ip);
}
```

**一致性检查**: ✅ 所有API路由都使用相同的getUserId逻辑
- `/api/query` ✅
- `/api/vocab` ✅
- `/api/analyze` ✅
- `/api/redeem` ✅
- `/api/usage` ✅
- `/api/collection` ✅
- `/api/progress` ✅

#### **前端API调用** (`lib/api-client.ts`)
```typescript
// 自动添加设备ID到请求头
apiFetch(url, options) {
  const deviceId = getDeviceId();
  headers.set('x-device-id', deviceId);
  return fetch(url, { ...options, headers });
}
```

**一致性检查**: ✅ 所有前端页面都使用apiFetch
- `app/tool/page.tsx` ✅
- `app/dashboard/page.tsx` ✅
- `app/collection/page.tsx` ✅
- `app/practice/page.tsx` ✅
- `app/wrongbook/page.tsx` ✅

### 2.2 发现的问题

#### ❌ **问题1: 兑换码不是账号ID**
**现状**:
```typescript
// 兑换码只是充值卡，不是账号
user_quota: {
  user_id: "device-xxx",  // 绑定到设备ID
  redeemCodes: ["GOKAKU-001"],
  remaining: 100
}
```

**问题**:
- 用户在设备A兑换码 → 数据绑定到device-A
- 用户在设备B输入同一个码 → 系统认为是新用户，再次扣除兑换码
- 无法实现跨设备同步

**影响**: 🔴 严重 - 用户换设备后数据丢失，兑换码可能被重复使用

#### ❌ **问题2: 数据归属权混乱**
**现状**:
```typescript
// 免费用户
wrong_questions: { user_id: "device-A" }  // 设备A的数据

// 付费用户兑换码后
user_quota: { user_id: "device-A", redeemCodes: ["GOKAKU-001"] }
wrong_questions: { user_id: "device-A" }  // 数据仍然绑定到设备A

// 用户换到设备B
wrong_questions: { user_id: "device-B" }  // 新设备的数据，无法访问设备A的数据
```

**问题**:
- 数据归属于设备ID，而不是账号
- 兑换码无法关联多个设备的数据
- 用户换设备后，之前的错题、收藏全部丢失

**影响**: 🔴 严重 - 护城河数据（错题本）可能丢失

#### ⚠️ **问题3: 兑换码可能被重复使用**
**现状**:
```typescript
// app/api/redeem/route.ts
// 兑换码存储在本地JSON文件
const codesData = JSON.parse(fs.readFileSync('redeem_codes.json'));

// 标记为已使用
redeemCode.status = 'used';
redeemCode.usedBy = userId;  // 存储设备ID
fs.writeFileSync('redeem_codes.json', JSON.stringify(codesData));
```

**问题**:
- 用户在设备A兑换 → usedBy = "device-A"
- 用户在设备B再次输入同一个码 → 系统检查发现已使用，拒绝
- **但是**：用户清除浏览器数据 → 生成新的device-C → 可能绕过检测

**影响**: 🟡 中等 - 可能被滥用，但需要主动清除浏览器数据

#### ⚠️ **问题4: 免费用户换设备数据丢失**
**现状**:
```typescript
// 用户在设备A做了50道题
wrong_questions: [
  { user_id: "device-A", question: "..." },
  { user_id: "device-A", question: "..." },
  // ... 50条记录
]

// 用户换到设备B
// 新的设备ID = "device-B"
// 查询 wrong_questions.where({ user_id: "device-B" }) → 空数组
```

**问题**:
- 免费用户换设备后，所有数据丢失
- 没有提示用户"购买会员可跨设备同步"
- 用户体验差，可能流失

**影响**: 🟡 中等 - 影响用户体验和转化率

---

## 🔧 三、限流和额度系统复盘

### 3.1 当前实现

#### **限流逻辑** (`lib/ratelimit.ts`)
```typescript
checkRateLimit(req, route) {
  // 1. 优先消耗兑换码额度（永久有效）
  if (consumeQuota(userId)) return true;

  // 2. 消耗每日免费额度（3次/功能）
  if (dailyCount < DAILY_LIMIT) return true;

  // 3. 消耗邀请奖励池
  if (consumeBonus(userId)) return true;

  return false; // 超限
}
```

**优先级**: 兑换码额度 > 每日免费额度 > 邀请奖励池

#### **额度查询** (`app/api/usage/route.ts`)
```typescript
GET /api/usage
→ {
  query: { used: 2, limit: 3 },
  vocab: { used: 1, limit: 3 },
  analyze: { used: 0, limit: 3 }
}
```

#### **前端额度检查** (`app/tool/page.tsx`)
```typescript
// 查询前检查额度
if (usage.query.used >= usage.query.limit && !quota?.hasQuota) {
  setShowPaywall(true);
  return;
}

// 查询后刷新额度
await refreshUsage();
```

### 3.2 发现的问题

#### ✅ **问题已修复: 前端localStorage计数 vs 后端数据库计数不同步**
**之前的问题**:
- 前端用localStorage计数，后端用CloudBase计数
- 两套系统完全独立，导致显示不准确

**修复方案**:
- 删除所有前端localStorage计数器
- 完全依赖后端API (`/api/usage`)
- 每次查询后自动刷新额度

**状态**: ✅ 已修复（commit 5db7d43）

#### ⚠️ **问题5: 兑换码额度和免费额度混淆**
**现状**:
```typescript
// 用户兑换码后
user_quota: { user_id: "device-A", remaining: 100 }

// 前端显示
"剩余额度: 100次"  // 但没有说明这是兑换码额度还是免费额度
```

**问题**:
- 用户不知道100次是永久的还是每日的
- 没有区分"兑换码额度"和"免费额度"
- 用户可能误以为100次用完就没了

**影响**: 🟡 中等 - 用户体验不清晰

#### ⚠️ **问题6: 邀请奖励池未实现**
**现状**:
```typescript
// lib/ratelimit.ts 中有 consumeBonus() 函数
// 但邀请系统未完整实现
```

**问题**:
- 邀请系统只有部分代码
- 没有邀请码生成页面
- 没有邀请奖励发放逻辑

**影响**: 🟢 低 - 功能未上线，不影响现有用户

---

## 💾 四、数据存储结构复盘

### 4.1 CloudBase 集合设计

#### **已创建的集合** (`scripts/init-database.js`)
```
1. users - 用户信息表
2. wrong_questions - 错题本
3. query_history - 查询历史
4. collections - 收藏
5. grammar_weakness - 语法薄弱点
6. redeem_codes - 兑换码（未使用，实际用JSON文件）
7. blessing_records - 祈福记录
8. practice_records - 练习记录
```

#### **缺失的集合**
```
❌ user_quota - 用户额度表（代码中使用，但未在init脚本中定义）
❌ rate_limits - 限流记录表（代码中使用，但未在init脚本中定义）
❌ invite_bonuses - 邀请奖励表（代码中使用，但未在init脚本中定义）
❌ redeem_logs - 兑换日志表（代码中使用，但未在init脚本中定义）
```

### 4.2 数据字段一致性检查

#### ✅ **user_id 字段统一**
所有集合都使用 `user_id` 字段存储用户标识：
- `wrong_questions.user_id` ✅
- `collections.user_id` ✅
- `query_history.user_id` ✅
- `grammar_weakness.user_id` ✅
- `user_quota.user_id` ✅

#### ❌ **问题7: 数据库初始化脚本不完整**
**现状**:
- `scripts/init-database.js` 只定义了8个集合
- 实际代码中使用了12+个集合
- 新部署时可能缺少必要的集合

**影响**: 🟡 中等 - 部署时可能出错

---

## 🚀 五、性能瓶颈分析

### 5.1 API响应时间分析

#### **语法查询流程** (`/api/query`)
```
1. 获取用户ID (1ms)
2. 检查限流 (50-100ms) ← CloudBase查询
3. 本地搜索语法库 (5-10ms) ← 文件读取+缓存
4. 调用DeepSeek API (1000-2000ms) ← 主要瓶颈
5. 返回结果 (1ms)
---
总耗时: 1050-2110ms
```

**瓶颈**: DeepSeek API调用占95%时间

#### **错题分析流程** (`/api/analyze`)
```
1. 获取用户ID (1ms)
2. 检查限流 (50-100ms) ← CloudBase查询
3. Prompt注入检测 (1ms)
4. 调用DeepSeek API (1500-3000ms) ← 主要瓶颈
5. 保存错题本 (100-200ms) ← CloudBase写入（异步）
6. 记录薄弱点 (100-200ms) ← CloudBase写入（异步）
7. 返回结果 (1ms)
---
总耗时: 1550-3300ms
```

**瓶颈**: DeepSeek API调用占90%时间

### 5.2 数据库查询性能

#### **限流检查** (`checkRateLimit`)
```typescript
// 每次API调用都要查询3次数据库
1. 查询 user_quota (50ms)
2. 查询 rate_limits (50ms)
3. 查询 invite_bonuses (50ms)
---
总耗时: 150ms
```

**优化机会**: 🟡 可以合并查询或使用缓存

#### **额度查询** (`/api/usage`)
```typescript
// 查询3个路由的今日用量
for (const route of ["query", "vocab", "analyze"]) {
  await db.collection("rate_limits").where({ key }).get(); // 50ms × 3
}
---
总耗时: 150ms
```

**优化机会**: 🟡 可以使用批量查询

### 5.3 文件读取性能

#### **语法库加载** (`/api/query`)
```typescript
// 首次加载读取文件，后续使用缓存
let grammarCache: GrammarEntry[] | null = null;

function loadGrammar() {
  if (grammarCache) return grammarCache; // 缓存命中: 0ms
  const raw = readFileSync('grammar_231.json'); // 首次: 10-20ms
  grammarCache = JSON.parse(raw);
  return grammarCache;
}
```

**性能**: ✅ 已优化（进程内缓存）

---

## 📋 六、优化计划

### 6.1 用户体系优化（高优先级）

#### **方案A: 兑换码即账号（推荐）**

**核心改动**:
```typescript
// 1. 修改数据结构
{
  account_id: "GOKAKU-001",  // 兑换码作为账号ID
  account_type: "premium",   // premium | free
  devices: ["device-A", "device-B"],  // 绑定的设备列表
  quota: 100,
  wrong_questions: [...],  // 数据归属于账号
  created_at: "2026-04-05"
}

// 2. 免费用户
{
  account_id: "device-xxx",  // 临时账号
  account_type: "free",
  devices: ["device-xxx"],
  quota: 0
}

// 3. 兑换码升级流程
免费用户兑换码 → 数据迁移到兑换码账号 → account_id = "GOKAKU-001"
```

**实施步骤**:
1. 修改 `getUserId()` 函数，优先返回兑换码账号ID
2. 修改 `/api/redeem` 逻辑，兑换码作为账号ID
3. 实现数据迁移函数，将设备ID数据迁移到兑换码账号
4. 修改所有API路由，支持多设备绑定
5. 添加设备管理页面（查看/解绑设备）

**预期效果**:
- ✅ 兑换码 = 账号，概念清晰
- ✅ 数据归属于账号，不会丢失
- ✅ 跨设备同步自然而然
- ✅ 防止兑换码重复使用

**工作量**: 3-4天

---

### 6.2 性能优化（中优先级）

#### **优化1: 限流检查缓存**
```typescript
// 当前: 每次API调用查询3次数据库
// 优化: 使用Redis或内存缓存

const rateLimitCache = new Map<string, {
  hasQuota: boolean,
  dailyUsed: number,
  bonusRemaining: number,
  expireAt: number
}>();

async function checkRateLimitCached(userId: string, route: string) {
  const cacheKey = `${userId}:${route}`;
  const cached = rateLimitCache.get(cacheKey);
  
  if (cached && Date.now() < cached.expireAt) {
    return cached; // 缓存命中，0ms
  }
  
  // 缓存未命中，查询数据库
  const result = await checkRateLimit(userId, route);
  rateLimitCache.set(cacheKey, { ...result, expireAt: Date.now() + 60000 });
  return result;
}
```

**预期效果**:
- 限流检查从150ms降低到0-5ms
- 减少90%的数据库查询

**工作量**: 1天

#### **优化2: 批量查询额度**
```typescript
// 当前: 循环查询3次
for (const route of routes) {
  await db.collection("rate_limits").where({ key }).get();
}

// 优化: 一次查询所有
const keys = routes.map(r => `${userId}:${r}:${today}`);
const { data } = await db.collection("rate_limits")
  .where({ key: db.command.in(keys) })
  .get();
```

**预期效果**:
- 额度查询从150ms降低到50ms
- 减少66%的数据库查询

**工作量**: 0.5天

#### **优化3: DeepSeek API流式响应**
```typescript
// 当前: 等待完整响应后返回（2000ms）
const response = await fetch(DEEPSEEK_API_URL, { ... });
const data = await response.json();
return NextResponse.json({ result: data.choices[0].message.content });

// 优化: 流式返回（用户感知延迟降低）
const response = await fetch(DEEPSEEK_API_URL, {
  ...options,
  stream: true
});

return new Response(response.body, {
  headers: { 'Content-Type': 'text/event-stream' }
});
```

**预期效果**:
- 用户感知延迟从2000ms降低到200ms（首字延迟）
- 更好的用户体验

**工作量**: 2天

---

### 6.3 数据库优化（低优先级）

#### **优化4: 添加索引**
```sql
-- 当前: 没有索引，全表扫描
-- 优化: 添加复合索引

rate_limits: 索引(user_id, route, date)
wrong_questions: 索引(user_id, createdAt)
collections: 索引(user_id, type)
```

**预期效果**:
- 查询速度提升50-80%
- 特别是数据量大时效果明显

**工作量**: 0.5天（需要在腾讯云控制台手动创建）

#### **优化5: 完善数据库初始化脚本**
```javascript
// 添加缺失的集合
const collections = [
  // ... 现有8个集合
  { name: "user_quota", description: "用户额度表" },
  { name: "rate_limits", description: "限流记录表" },
  { name: "invite_bonuses", description: "邀请奖励表" },
  { name: "redeem_logs", description: "兑换日志表" }
];
```

**预期效果**:
- 新部署时不会缺少集合
- 更容易维护

**工作量**: 0.5天

---

## 🎯 七、实施优先级

### Phase 1: 紧急修复（1周）
```
1. ✅ 修复前端localStorage计数问题（已完成）
2. 🔴 实现兑换码即账号方案（3-4天）
   - 修改用户识别逻辑
   - 实现数据迁移
   - 添加设备管理
3. 🟡 完善数据库初始化脚本（0.5天）
```

### Phase 2: 性能优化（1周）
```
1. 🟡 限流检查缓存（1天）
2. 🟡 批量查询额度（0.5天）
3. 🟡 DeepSeek API流式响应（2天）
4. 🟡 添加数据库索引（0.5天）
```

### Phase 3: 功能完善（1-2周）
```
1. 🟢 实现邀请系统（2-3天）
2. 🟢 添加数据导出功能（1天）
3. 🟢 优化个人中心UI（1-2天）
```

---

## 📊 八、预期效果

### 8.1 用户体系优化后
- ✅ 兑换码 = 账号，用户概念清晰
- ✅ 数据永久保存，不会丢失
- ✅ 跨设备同步完美
- ✅ 防止兑换码滥用
- ✅ 提升用户信任度和转化率

### 8.2 性能优化后
- ✅ API响应时间降低30-50%
- ✅ 数据库查询减少60-90%
- ✅ 用户感知延迟降低80%（流式响应）
- ✅ 支持更高并发

### 8.3 数据安全性
- ✅ 用户数据不会因换设备丢失
- ✅ 兑换码不会被重复使用
- ✅ 数据归属权清晰
- ✅ 符合用户预期

---

## 🔐 九、安全性检查

### 9.1 已实现的安全措施
- ✅ Prompt注入攻击检测 (`detectPromptInjection`)
- ✅ 输入验证和清洗 (`sanitizeInput`)
- ✅ 请求频率限制 (`checkRequestRate`)
- ✅ XSS防护（清理AI响应）
- ✅ 兑换码格式验证

### 9.2 需要加强的安全措施
- ⚠️ 兑换码存储在JSON文件（应该存CloudBase）
- ⚠️ 没有CSRF防护
- ⚠️ 没有API签名验证
- ⚠️ 设备ID可以伪造（需要指纹识别）

---

## 📝 十、总结

### 10.1 核心问题
1. **兑换码不是账号ID** - 导致跨设备同步失败
2. **数据归属权混乱** - 数据绑定到设备而非账号
3. **免费用户换设备数据丢失** - 影响用户体验

### 10.2 优化重点
1. **用户体系重构** - 兑换码即账号（最高优先级）
2. **性能优化** - 缓存、批量查询、流式响应
3. **数据库完善** - 索引、初始化脚本

### 10.3 预期收益
- 用户数据安全性提升100%
- API响应速度提升30-50%
- 用户体验显著改善
- 转化率预计提升20-30%

---

**下一步行动**:
1. 与用户确认优化方案
2. 开始实施Phase 1（兑换码即账号）
3. 逐步推进性能优化

**制定人**: Claude  
**审核人**: Garo
