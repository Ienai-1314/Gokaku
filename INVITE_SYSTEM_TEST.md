# 邀请系统测试指南

## 功能概述

完整的邀请奖励系统已实现，包括：
- 用户生成专属邀请码（格式：INV-XXXXXX）
- 生成专属邀请链接
- 新用户通过邀请链接注册/兑换
- 邀请人获得奖励：延长会员1个月

## 测试流程

### 1. 邀请人生成邀请码

**访问邀请页面：**
```
https://gokaku.cn/invite
```

**预期结果：**
- 自动生成唯一邀请码（格式：INV-XXXXXX）
- 显示专属邀请链接：`https://gokaku.cn/?invite=INV-XXXXXX`
- 显示邀请统计：成功邀请人数、获得奖励月数

### 2. 被邀请人访问邀请链接

**访问带邀请码的链接：**
```
https://gokaku.cn/?invite=INV-XXXXXX
```

**预期结果：**
- 页面顶部显示绿色提示条："您正在使用邀请码 INV-XXXXXX，兑换码后您和邀请人都将获得奖励！"
- 邀请码保存到 localStorage（key: `pending_invite_code`）
- 后台调用 `/api/invite/track` 记录邀请关系

### 3. 被邀请人兑换码

**访问兑换页面：**
```
https://gokaku.cn/redeem
```

**输入兑换码并提交**

**预期结果：**
- 兑换成功
- 自动发放邀请奖励：邀请人的会员到期时间延长1个月
- 数据库记录：
  - `invite_records` 集合中 `reward_granted` 设为 `true`
  - 邀请人账号的 `invite_count` +1
  - 邀请人账号的 `invite_rewards` +1
  - 邀请人账号的 `membership_expiry` 延长1个月

### 4. 邀请人查看奖励

**访问个人中心：**
```
https://gokaku.cn/dashboard
```

**预期结果：**
- 显示"邀请奖励"卡片
- 成功邀请人数：1
- 获得奖励月数：1
- 会员到期时间已延长

**访问邀请页面：**
```
https://gokaku.cn/invite
```

**预期结果：**
- 成功邀请人数：1
- 获得奖励月数：1

## API 端点

### GET /api/invite
获取当前账号的邀请码和统计信息

**响应：**
```json
{
  "invite_code": "INV-XXXXXX",
  "invite_count": 0,
  "invite_rewards": 0,
  "invite_link": "https://gokaku.cn/?invite=INV-XXXXXX"
}
```

### POST /api/invite/track
追踪邀请关系（新用户访问带邀请码的链接时调用）

**请求：**
```json
{
  "invite_code": "INV-XXXXXX"
}
```

**响应：**
```json
{
  "success": true,
  "message": "邀请关系已记录，兑换码后双方获得奖励"
}
```

### POST /api/redeem
兑换码（已集成邀请奖励发放）

**请求：**
```json
{
  "code": "GOKAKU-XXXX-XXXX"
}
```

**响应：**
```json
{
  "success": true,
  "quota": 100,
  "daily_limit": 100,
  "message": "兑换成功！已为您开通会员",
  "account_id": "GOKAKU-XXXX-XXXX",
  "membership_expiry": "2026-12-31T23:59:59Z"
}
```

## 数据库结构

### accounts 集合（新增字段）
```typescript
{
  invite_code: string,           // 邀请码 INV-XXXXXX
  invited_by: string | null,     // 被谁邀请（邀请人的 account_id）
  invite_count: number,          // 邀请人数
  invite_rewards: number         // 获得的奖励月数
}
```

### invite_records 集合（新建）
```typescript
{
  _id: string,
  inviter_id: string,           // 邀请人 account_id
  invitee_id: string,           // 被邀请人 account_id
  invite_code: string,          // 使用的邀请码
  reward_granted: boolean,      // 是否已发放奖励
  created_at: Date,             // 邀请时间
  redeemed_at: Date | null      // 兑换时间
}
```

## 防作弊机制

1. **邀请码唯一性**：每个账号只有一个邀请码，碰撞重试最多10次
2. **防止自己邀请自己**：检查邀请人和被邀请人是否为同一账号
3. **防止重复领取奖励**：
   - 每个被邀请人只能使用一次邀请码
   - 检查 `invited_by` 字段，已有邀请关系则拒绝
   - 检查 `invite_records` 中的 `reward_granted` 字段
4. **奖励发放时机**：只在被邀请人首次兑换码时发放，不是访问时发放

## 测试场景

### 场景1：正常邀请流程
1. 用户A访问 `/invite`，获得邀请码 `INV-ABC123`
2. 用户B访问 `/?invite=INV-ABC123`
3. 用户B兑换码成功
4. 用户A的会员时长延长1个月
5. 用户A的邀请统计更新

### 场景2：自己邀请自己
1. 用户A访问 `/invite`，获得邀请码 `INV-ABC123`
2. 用户A访问 `/?invite=INV-ABC123`
3. 系统提示："不能使用自己的邀请码"

### 场景3：重复使用邀请码
1. 用户B已经使用过用户A的邀请码
2. 用户B再次访问 `/?invite=INV-ABC123`
3. 系统提示："您已经使用过邀请码了"

### 场景4：无效邀请码
1. 用户B访问 `/?invite=INV-INVALID`
2. 系统提示："邀请码不存在"

## 注意事项

1. **邀请码格式**：INV-XXXXXX（6位大写字母和数字，去掉易混淆字符 O/0/I/1）
2. **奖励发放**：延长会员到期时间1个月，如果没有到期时间则从当前时间开始加1个月
3. **邀请追踪**：使用 localStorage 保存待处理的邀请码，兑换时自动关联
4. **错误处理**：所有邀请相关错误不影响主流程（兑换、注册等）

## 下一步优化建议

1. **邀请历史列表**：在 `/invite` 页面显示被邀请人列表和兑换时间
2. **邀请排行榜**：显示邀请人数最多的用户
3. **邀请奖励多样化**：除了延长会员，还可以奖励额度、优惠券等
4. **邀请码自定义**：允许用户自定义邀请码（需要唯一性检查）
5. **社交分享优化**：添加微信、QQ、微博等平台的直接分享功能
6. **邀请通知**：邀请成功后通知邀请人
