# Gokaku 域名配置指南

## 域名信息
- 域名：www.gokaku.cn
- 注册商：腾讯云

## 配置步骤

### 1. 在 Vercel 添加域名

1. 登录 Vercel Dashboard：https://vercel.com/dashboard
2. 进入项目 `gokaku-1314`
3. 点击 Settings → Domains
4. 添加域名：`www.gokaku.cn` 和 `gokaku.cn`
5. Vercel 会提供 DNS 记录配置信息

### 2. 在腾讯云配置 DNS

登录腾讯云 DNS 解析控制台：https://console.cloud.tencent.com/cns

#### 方案 A：使用 Vercel DNS（推荐）

添加以下记录：

```
记录类型    主机记录    记录值（Vercel 提供）
CNAME      www        cname.vercel-dns.com
CNAME      @          cname.vercel-dns.com
```

#### 方案 B：使用 A 记录

```
记录类型    主机记录    记录值
A          www        76.76.21.21
A          @          76.76.21.21
```

### 3. 等待 DNS 生效

- 通常需要 10 分钟到 24 小时
- 可以用 `nslookup www.gokaku.cn` 检查是否生效

### 4. 在 Vercel 验证域名

- DNS 生效后，Vercel 会自动验证
- 验证成功后会自动配置 SSL 证书（Let's Encrypt）
- 等待 SSL 证书签发（通常几分钟）

### 5. 测试访问

```bash
# 测试 HTTP（会自动跳转到 HTTPS）
curl -I http://www.gokaku.cn

# 测试 HTTPS
curl -I https://www.gokaku.cn

# 测试裸域名
curl -I https://gokaku.cn
```

## 环境变量配置

已更新以下文件：

1. `.env.local`：
   ```
   NEXT_PUBLIC_SITE_URL=https://www.gokaku.cn
   ```

2. `vercel.json`：
   ```json
   {
     "env": {
       "NEXT_PUBLIC_SITE_URL": "https://www.gokaku.cn"
     }
   }
   ```

## Vercel 环境变量设置

在 Vercel Dashboard 设置环境变量：

1. 进入项目 Settings → Environment Variables
2. 添加以下变量（Production + Preview + Development）：

```
TCB_ENV_ID=你的腾讯云环境ID
TCB_SECRET_ID=你的腾讯云SecretID
TCB_SECRET_KEY=你的腾讯云SecretKey
DEEPSEEK_API_KEY=你的DeepSeek_API密钥
NEXT_PUBLIC_SITE_URL=https://www.gokaku.cn
```

## 重新部署

配置完成后，推送代码触发重新部署：

```bash
cd C:/Users/Garo/gokaku
git add .
git commit -m "配置域名 www.gokaku.cn"
git push origin main
```

或在 Vercel Dashboard 手动触发 Redeploy。

## 域名跳转规则

Vercel 会自动处理以下跳转：

- `http://gokaku.cn` → `https://www.gokaku.cn`
- `http://www.gokaku.cn` → `https://www.gokaku.cn`
- `https://gokaku.cn` → `https://www.gokaku.cn`

## 常见问题

### Q: DNS 配置后多久生效？
A: 通常 10 分钟到 24 小时，国内一般 1-2 小时。

### Q: SSL 证书多久签发？
A: DNS 验证通过后，通常 5-10 分钟自动签发。

### Q: 如何检查 DNS 是否生效？
A: 
```bash
nslookup www.gokaku.cn
# 或
ping www.gokaku.cn
```

### Q: 域名配置后旧域名还能用吗？
A: 可以，`gokaku-1314.vercel.app` 依然可以访问。

### Q: 如何强制使用新域名？
A: 在 Vercel Settings → Domains 中，将 `www.gokaku.cn` 设为 Primary Domain。

## 下一步

1. 在腾讯云 DNS 控制台配置 CNAME 记录
2. 在 Vercel 添加域名并等待验证
3. 在 Vercel 设置环境变量
4. 推送代码重新部署
5. 测试访问 https://www.gokaku.cn
