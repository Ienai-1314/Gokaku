# 返现系统设计文档

## 功能概述

实现"做满100道错题自动延长会员1个月"的返现机制。

## 数据库设计

### 1. accounts 集合（已有，新增字段）

```typescript
{
  _id: string;
  account_id: string;
  account_type: 'redeem_code' | 'free' | 'registered';
  membership_expiry: string;  // 会员到期时间
  total_rewards: number;      // 已获得的返现次数
  last_reward_at: string;     // 最后一次返现时间
  // ... 其他字段
}
```

### 2. cashback_history 集合（新增）

用于记录每次返现的详细历史。

```typescript
{
  _id: string;
  account_id: string;         // 账号ID
  milestone: number;          // 达到的里程碑（100, 200, 300...）
  reward_type: string;        // 返现类型：'membership_extension'
  reward_value: number;       // 返现价值（月数）
  old_expiry: string | null;  // 延长前的到期时间
  new_expiry: string;         // 延长后的到期时间
  created_at: string;         // 返现发放时间
}
```

**索引建议**：
- `account_id` - 用于查询用户的返现历史
- `created_at` - 用于按时间排序

## 业务逻辑

### 1. 返现触发时机

在 `/api/analyze` 接口中，每次保存错题后自动检查：

```typescript
async function saveToWrongBook(accountId, data) {
  // 1. 保存错题到 wrong_questions 集合
  await db.collection("wrong_questions").add({...});
  
  // 2. 检查是否达到返现条件
  await checkAndRewardMembership(accountId);
}
```

### 2. 返现判断逻辑

```typescript
async function checkAndRewardMembership(accountId) {
  // 1. 查询错题总数
  const totalErrors = wrongQuestions.length;
  
  // 2. 判断是否达到100的倍数
  if (totalErrors % 100 !== 0) return;
  
  // 3. 计算应发放的返现次数
  const rewardTimes = Math.floor(totalErrors / 100);
  
  // 4. 检查是否已发放过
  const existingRewards = account.total_rewards || 0;
  if (rewardTimes <= existingRewards) return;
  
  // 5. 发放返现
  await grantReward(accountId, rewardTimes);
}
```

### 3. 会员延长规则

- **未过期会员**：从当前到期时间延长
- **已过期会员**：从当前时间开始计算
- **无会员记录**：从当前时间开始计算

```typescript
const currentExpiry = account.membership_expiry 
  ? new Date(account.membership_expiry) 
  : new Date();

const baseDate = currentExpiry > new Date() 
  ? currentExpiry 
  : new Date();

const newExpiry = new Date(baseDate);
newExpiry.setMonth(newExpiry.getMonth() + 1);
```

### 4. 防重复发放

通过比较 `total_rewards` 和计算出的 `rewardTimes` 来防止重复发放：

```typescript
const rewardTimes = Math.floor(totalErrors / 100);
const existingRewards = account.total_rewards || 0;

if (rewardTimes > existingRewards) {
  // 发放返现
}
```

## API 接口

### 1. POST /api/analyze

**功能**：分析错题，自动触发返现检查

**返现逻辑**：
- 每次保存错题后，异步检查返现条件
- 达到100的倍数时自动发放
- 不阻塞响应，确保用户体验

### 2. GET /api/progress

**功能**：获取学习进度和返现信息

**返回数据**：
```typescript
{
  cashback: {
    totalRewards: number;        // 已获得返现次数
    currentProgress: number;     // 当前进度 (0-99)
    nextMilestone: number;       // 下个里程碑
    remainingForNext: number;    // 还需多少道题
    progressPercentage: number;  // 进度百分比
    history: Array<{             // 返现历史（最近5条）
      milestone: number;
      rewardValue: number;
      newExpiry: string;
      createdAt: string;
    }>;
  }
}
```

## 前端展示

### 个人中心返现卡片

**显示内容**：
1. **进度条**：当前进度 X/100
2. **统计卡片**：
   - 已获得返现次数
   - 累计错题数
3. **提示信息**：还需多少道题，下次返现里程碑
4. **返现历史**：最近5条返现记录

**显示条件**：
- 仅对付费用户（`accountType === 'redeem'`）显示
- 免费用户不显示返现卡片

## 日志记录

关键操作日志：

```typescript
console.log(`[返现] 账号 ${accountId} 完成 ${totalErrors} 道错题，会员延长至 ${newExpiry.toISOString()}`);
```

错误日志：

```typescript
console.error("[返现] 检查失败:", err);
console.error("[返现] 更新失败:", updateErr);
```

## 测试用例

参见 `scripts/test-cashback.js`

**测试覆盖**：
1. 未达到100道错题 - 不发放
2. 刚好100道错题 - 发放第1次
3. 200道错题 - 发放第2次
4. 已发放过的里程碑 - 不重复发放
5. 进度计算准确性
6. 会员延长计算准确性

## 安全性考虑

1. **防重复发放**：通过 `total_rewards` 字段记录已发放次数
2. **异步处理**：返现检查不阻塞用户请求
3. **错误容错**：返现失败不影响错题保存
4. **日志追踪**：记录所有返现操作，便于审计

## 未来优化方向

1. **事务支持**：使用数据库事务确保原子性
2. **通知功能**：返现成功后推送通知给用户
3. **返现类型扩展**：支持更多返现类型（积分、优惠券等）
4. **里程碑自定义**：支持配置不同的返现里程碑
5. **返现统计**：管理后台查看返现发放统计

## 部署检查清单

- [ ] 确认 `cashback_history` 集合已创建
- [ ] 确认 `accounts` 集合索引正常
- [ ] 测试返现逻辑（100道、200道）
- [ ] 验证前端显示正常
- [ ] 检查日志输出
- [ ] 监控返现发放情况
