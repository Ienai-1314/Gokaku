# Gokaku 部署指南

## 📋 部署前准备

### 1. 环境变量配置
在 Vercel 部署时需要设置以下环境变量：

```
TCB_ENV_ID=你的腾讯云环境ID
TCB_SECRET_ID=你的腾讯云SecretID
TCB_SECRET_KEY=你的腾讯云SecretKey
DEEPSEEK_API_KEY=你的DeepSeek API密钥
NEXT_PUBLIC_SITE_URL=https://你的域名.com
```

⚠️ **注意**：不要设置 `DATA_DIR`，这个只在本地开发用。

---

## 🚀 部署到 Vercel

### 方式一：通过 Vercel CLI（推荐）

```bash
# 1. 安装 Vercel CLI（如果还没装）
npm i -g vercel

# 2. 登录 Vercel
vercel login

# 3. 部署到生产环境
cd C:/Users/Garo/gokaku
vercel --prod
```

### 方式二：通过 Vercel 网站

1. 访问 https://vercel.com
2. 点击 "Import Project"
3. 连接你的 GitHub 仓库（需要先把代码推到 GitHub）
4. 在 "Environment Variables" 中添加上面的环境变量
5. 点击 "Deploy"

---

## 🇨🇳 中国大陆访问优化

### 关于 Vercel + 腾讯云的组合

**好消息**：
- ✅ 你已经用了腾讯云 CloudBase（数据库在国内）
- ✅ DeepSeek API 也在国内，访问速度快

**坏消息**：
- ❌ Vercel 的服务器在国外，中国访问可能较慢
- ❌ Vercel 在中国没有被墙，但速度不如国内服务器

### 解决方案

#### 方案 A：Vercel + 腾讯云 CDN（推荐）
1. 先部署到 Vercel（简单快速）
2. 在腾讯云购买 CDN 服务
3. 将你的域名通过 CDN 加速 Vercel
4. 用户访问时走腾讯云 CDN，速度快

**优点**：简单、便宜（CDN 很便宜）、不用备案
**缺点**：需要额外配置 CDN

#### 方案 B：直接部署到腾讯云（最快但复杂）
1. 使用腾讯云 Serverless（云函数 + API 网关）
2. 或者购买腾讯云服务器（轻量应用服务器）
3. 需要域名备案（15-20 天）

**优点**：国内访问最快、完全可控
**缺点**：配置复杂、需要备案

#### 方案 C：先 Vercel，后期迁移
1. 现在先部署到 Vercel，让朋友测试
2. 如果用户反馈速度慢，再考虑迁移到腾讯云
3. 或者加 CDN 加速

**推荐**：先用方案 C，测试后再决定

---

## 📦 兑换码自动发货系统

Agent 已经帮你设计好了完整方案，文件在：
- `d:/量化n1/docs/auto_delivery_guide.md` - 完整指南
- `d:/量化n1/docs/quick_reference.md` - 快速参考
- `d:/量化n1/scripts/` - 发货脚本

### 核心流程（半自动化）

```bash
# 收到小红书订单后：

# 1. 分配兑换码
python d:/量化n1/scripts/allocate_code.py \
  --order-id XHS20260403001 \
  --quantity 1 \
  --buyer-id buyer_123

# 输出：GOKAKU-0001-ABCD

# 2. 记录订单
python d:/量化n1/scripts/record_order.py \
  --order-id XHS20260403001 \
  --buyer-id buyer_123 \
  --codes '["GOKAKU-0001-ABCD"]'

# 3. 复制兑换码，通过小红书私信发给买家
```

### 追踪兑换码状态

```bash
# 查看统计信息
python d:/量化n1/scripts/check_status.py --stats

# 输出：
# 可用: 997
# 已发货: 2
# 已使用: 1

# 查询特定兑换码
python d:/量化n1/scripts/check_status.py --code GOKAKU-0001-ABCD

# 查询订单
python d:/量化n1/scripts/check_status.py --order XHS20260403001
```

### 导入你的 1000 个兑换码

你需要把 `C:/Users/Garo/gokaku/lib/data/redeem_codes.json` 转换成新格式：

```python
# 运行这个脚本转换格式
python d:/量化n1/scripts/convert_codes.py
```

我现在帮你创建这个转换脚本：
