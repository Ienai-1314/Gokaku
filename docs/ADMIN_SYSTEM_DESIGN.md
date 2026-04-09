# 兑换码后台管理系统设计

## 1. 系统概述

基于现有兑换码数据（JSON 文件），构建 Web 后台管理系统，支持兑换码的生成、查询、分配、使用追踪。

## 2. 数据源

### 现有数据结构
```json
{
  "codes": [
    {
      "code": "GOKAKU-XXXX-XXXX",
      "status": "available" | "delivered" | "used",
      "createdAt": "2026-04-03T17:40:12.996Z",
      "deliveredAt": null,
      "deliveredTo": null,
      "orderId": null,
      "usedAt": null,
      "usedBy": null
    }
  ],
  "metadata": {
    "totalCodes": 1000,
    "availableCodes": 998,
    "deliveredCodes": 1,
    "usedCodes": 1,
    "lastUpdated": "2026-04-03T17:40:12.996Z"
  }
}
```

### 数据迁移策略
**方案 A**：继续使用 JSON 文件（简单快速）
- 优点：无需迁移，直接读写
- 缺点：并发性能差，不支持复杂查询

**方案 B**：迁移到腾讯云数据库（推荐）
- 优点：高性能，支持复杂查询，易于扩展
- 缺点：需要一次性迁移

**采用方案 B**：创建 `redeem_codes` 集合

## 3. 数据库设计

### redeem_codes 集合
```typescript
{
  _id: string;
  code: string;                    // 兑换码（唯一索引）
  status: "available" | "delivered" | "used";
  
  // 创建信息
  createdAt: Date;
  createdBy?: string;              // 管理员ID
  batchId?: string;                // 批次ID
  
  // 发放信息
  deliveredAt?: Date;
  deliveredTo?: string;            // 买家信息
  orderId?: string;                // 订单ID
  platform?: string;               // 平台（xiaohongshu/taobao等）
  
  // 使用信息
  usedAt?: Date;
  usedBy?: string;                 // 用户账号ID
  
  // 会员信息
  membershipType?: "monthly" | "yearly";
  membershipDays?: number;         // 会员天数
  
  // 备注
  notes?: string;
}
```

### admin_users 集合（管理员）
```typescript
{
  _id: string;
  username: string;                // 管理员用户名
  passwordHash: string;            // 密码哈希
  role: "admin" | "operator";      // 角色
  permissions: string[];           // 权限列表
  createdAt: Date;
  lastLoginAt?: Date;
}
```

### code_batches 集合（批次管理）
```typescript
{
  _id: string;
  batchName: string;               // 批次名称
  prefix: string;                  // 兑换码前缀
  count: number;                   // 生成数量
  membershipType: "monthly" | "yearly";
  membershipDays: number;
  createdAt: Date;
  createdBy: string;
}
```

## 4. 功能模块

### 4.1 管理员登录
- 路由：`/admin/login`
- 功能：用户名密码登录
- 权限：公开访问

### 4.2 仪表盘
- 路由：`/admin/dashboard`
- 功能：
  - 兑换码总览（总数/可用/已发放/已使用）
  - 最近发放记录
  - 最近使用记录
  - 统计图表

### 4.3 兑换码管理
- 路由：`/admin/codes`
- 功能：
  - 列表展示（分页、筛选、搜索）
  - 状态筛选（全部/可用/已发放/已使用）
  - 搜索（按兑换码、订单ID、用户ID）
  - 批量操作（导出、标记）
  - 详情查看

### 4.4 生成兑换码
- 路由：`/admin/codes/generate`
- 功能：
  - 设置前缀
  - 设置数量
  - 设置会员类型和天数
  - 批次命名
  - 一键生成

### 4.5 发放兑换码
- 路由：`/admin/codes/deliver`
- 功能：
  - 选择可用兑换码
  - 填写订单信息
  - 填写买家信息
  - 标记为已发放

### 4.6 订单管理
- 路由：`/admin/orders`
- 功能：
  - 订单列表
  - 订单详情
  - 关联兑换码
  - 发货状态追踪

## 5. API 设计

### 5.1 管理员认证
```
POST /api/admin/login
Body: { username, password }
Response: { success, token, user }

POST /api/admin/logout
Response: { success }

GET /api/admin/me
Response: { success, user }
```

### 5.2 兑换码管理
```
GET /api/admin/codes
Query: { page, limit, status, search }
Response: { success, data: { codes, total, page, limit } }

GET /api/admin/codes/:code
Response: { success, data: code }

POST /api/admin/codes/generate
Body: { prefix, count, membershipType, membershipDays, batchName }
Response: { success, data: { batchId, codes } }

PUT /api/admin/codes/:code/deliver
Body: { orderId, deliveredTo, platform, notes }
Response: { success, data: code }

GET /api/admin/codes/stats
Response: { success, data: { total, available, delivered, used } }
```

### 5.3 订单管理
```
GET /api/admin/orders
Query: { page, limit, status }
Response: { success, data: { orders, total } }

GET /api/admin/orders/:orderId
Response: { success, data: order }

POST /api/admin/orders/:orderId/deliver
Body: { codeId }
Response: { success, data: order }
```

## 6. 权限设计

### 角色权限
- **admin**（管理员）：所有权限
- **operator**（操作员）：查看、发放兑换码

### 权限列表
- `codes.view` - 查看兑换码
- `codes.generate` - 生成兑换码
- `codes.deliver` - 发放兑换码
- `codes.export` - 导出兑换码
- `orders.view` - 查看订单
- `orders.manage` - 管理订单
- `users.manage` - 管理管理员

## 7. 安全措施

1. **身份认证**：JWT Token
2. **密码加密**：bcrypt
3. **HTTPS**：生产环境强制 HTTPS
4. **CSRF 防护**：使用 CSRF Token
5. **操作日志**：记录所有敏感操作
6. **IP 白名单**：限制管理后台访问 IP

## 8. 数据迁移

### 迁移脚本
```typescript
// scripts/migrate-codes-to-db.ts
// 将 JSON 文件中的兑换码迁移到数据库
```

### 迁移步骤
1. 读取 `D:\量化n1\lib\data\redeem_codes.json`
2. 解析 JSON 数据
3. 批量插入到 `redeem_codes` 集合
4. 验证数据完整性

## 9. 开发计划

### Phase 1: 基础功能（1-2天）
- [x] 数据库设计
- [ ] 数据迁移脚本
- [ ] 管理员登录
- [ ] 兑换码列表
- [ ] 兑换码详情

### Phase 2: 核心功能（1-2天）
- [ ] 生成兑换码
- [ ] 发放兑换码
- [ ] 统计仪表盘
- [ ] 搜索和筛选

### Phase 3: 高级功能（1天）
- [ ] 订单管理
- [ ] 批量操作
- [ ] 导出功能
- [ ] 操作日志

## 10. 技术栈

- **前端**：Next.js 14 + React
- **后端**：Next.js API Routes
- **数据库**：腾讯云 CloudBase
- **认证**：JWT + bcrypt
- **UI**：Gokaku 设计系统
- **图标**：Lucide React

## 11. MVP 范围

**最小可用版本**：
1. ✅ 管理员登录（硬编码账号）
2. ✅ 兑换码列表（分页、搜索）
3. ✅ 兑换码详情
4. ✅ 发放兑换码
5. ✅ 统计概览

**暂不实现**：
- ❌ 多管理员管理
- ❌ 复杂权限系统
- ❌ 操作日志
- ❌ IP 白名单
