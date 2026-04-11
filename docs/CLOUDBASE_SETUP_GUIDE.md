# CloudBase 数据库集合创建指南

## 问题
CloudBase SDK 不支持自动创建集合，需要在控制台手动创建。

## 解决方案

### 方法 1：腾讯云控制台创建（推荐）

1. 访问腾讯云 CloudBase 控制台
2. 选择环境：`gokaku-8gxxx6xxx`
3. 进入「数据库」→「集合管理」
4. 点击「新建集合」，创建以下两个集合：

#### grammar_cache 集合
- 集合名称：`grammar_cache`
- 索引配置：
  ```json
  {
    "query": 1
  }
  ```

#### vocab_cache 集合
- 集合名称：`vocab_cache`
- 索引配置：
  ```json
  {
    "query": 1
  }
  ```

### 方法 2：使用 CloudBase CLI

```bash
# 安装 CLI
npm install -g @cloudbase/cli

# 登录
tcb login

# 创建集合
tcb db createCollection grammar_cache -e gokaku-8gxxx6xxx
tcb db createCollection vocab_cache -e gokaku-8gxxx6xxx

# 创建索引
tcb db createIndex grammar_cache query -e gokaku-8gxxx6xxx
tcb db createIndex vocab_cache query -e gokaku-8gxxx6xxx
```

### 方法 3：通过 Web 端触发创建

访问以下 URL，通过 API 写入触发集合创建：

```
http://localhost:3001/api/query/stream
```

POST 请求体：
```json
{
  "query": "ところを",
  "skipCache": false
}
```

Header：
```
x-admin-key: your-secret-key-here
```

## 验证

创建完成后，运行以下命令验证：

```bash
npm run check-cache
```

预期输出：
```
✅ grammar_cache 集合存在
✅ vocab_cache 集合存在
```

## 预填充语法缓存

集合创建成功后，运行：

```bash
npm run seed-grammar
```

这将预填充 5 个高频语法到缓存。

## 常见问题

### Q: 为什么不能自动创建集合？
A: CloudBase 出于安全考虑，不允许通过 SDK 直接创建集合，必须通过控制台或 CLI 创建。

### Q: 如何扩大预填充语法数量？
A: 编辑 `scripts/seed-grammar-cache.ts`，在 `HIGH_FREQUENCY_GRAMMAR` 数组中添加更多语法点。

### Q: 预填充时遇到速率限制怎么办？
A: 确保在 `.env.local` 中配置了 `ADMIN_SECRET_KEY`，脚本会自动使用管理员权限绕过限制。
