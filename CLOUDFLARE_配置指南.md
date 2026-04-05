# Cloudflare + Vercel 国内访问加速方案

## 问题
- Vercel 在国内访问很慢或无法打开
- 需要通过 Cloudflare CDN 加速

## 解决方案：Cloudflare + 自定义域名

### 步骤1：注册 Cloudflare 账号

1. 访问：https://dash.cloudflare.com/sign-up
2. 注册免费账号
3. 验证邮箱

### 步骤2：添加域名到 Cloudflare

1. 登录 Cloudflare Dashboard
2. 点击 "添加站点"
3. 输入：`gokaku.cn`
4. 选择 "Free" 免费计划
5. 点击 "继续"

### 步骤3：更改域名 DNS 服务器

Cloudflare 会提供两个 Nameserver（名称服务器），类似：
```
ns1.cloudflare.com
ns2.cloudflare.com
```

**在腾讯云修改 DNS 服务器：**

1. 登录腾讯云控制台：https://console.cloud.tencent.com/domain
2. 找到域名 `gokaku.cn`
3. 点击 "管理" → "修改DNS服务器"
4. 将 DNS 服务器改为 Cloudflare 提供的两个地址
5. 保存

**等待生效：** 通常需要 2-24 小时

### 步骤4：在 Cloudflare 添加 DNS 记录

DNS 服务器生效后，在 Cloudflare 添加记录：

1. 进入 Cloudflare Dashboard → DNS → Records
2. 添加以下记录：

| 类型 | 名称 | 目标 | 代理状态 |
|------|------|------|---------|
| CNAME | www | cname.vercel-dns.com | 已代理（橙色云朵） |
| CNAME | @ | cname.vercel-dns.com | 已代理（橙色云朵） |

**重要：** 确保"代理状态"是橙色云朵（已代理），这样流量才会走 Cloudflare CDN。

### 步骤5：在 Vercel 添加域名

1. 登录 Vercel Dashboard：https://vercel.com/dashboard
2. 进入项目 `gokaku-1314`
3. Settings → Domains
4. 添加域名：
   - `www.gokaku.cn`
   - `gokaku.cn`
5. Vercel 会自动验证（因为 DNS 已指向 Vercel）

### 步骤6：Cloudflare 优化设置（可选但推荐）

#### 6.1 开启 HTTP/3
- SSL/TLS → Edge Certificates
- 开启 "HTTP/3 (with QUIC)"

#### 6.2 设置缓存规则
- 规则 → 页面规则
- 创建规则：
  - URL: `www.gokaku.cn/*`
  - 设置: 缓存级别 = 标准

#### 6.3 开启 Brotli 压缩
- 速度 → 优化
- 开启 "Brotli"

#### 6.4 开启 Auto Minify
- 速度 → 优化
- 开启 "Auto Minify" (HTML, CSS, JS)

#### 6.5 设置 SSL/TLS 模式
- SSL/TLS → 概述
- 选择 "完全（严格）"

### 步骤7：测试访问

等待 DNS 生效后（通常 10 分钟 - 2 小时），测试：

```bash
# 检查 DNS 是否指向 Cloudflare
nslookup www.gokaku.cn

# 测试访问
curl -I https://www.gokaku.cn
```

在浏览器访问：https://www.gokaku.cn

### 步骤8：验证 Cloudflare 是否生效

1. 打开浏览器开发者工具（F12）
2. 访问 https://www.gokaku.cn
3. 查看 Network → Headers
4. 如果看到 `cf-ray` 或 `cf-cache-status` 响应头，说明 Cloudflare 已生效

## 为什么这样能解决国内访问问题？

1. **Cloudflare 在国内有节点**：虽然不是官方的，但通过 Cloudflare 的全球 CDN 网络，国内访问速度会大幅提升
2. **CDN 缓存**：静态资源会被缓存到离用户最近的节点
3. **智能路由**：Cloudflare 会自动选择最优路径

## 常见问题

### Q: Cloudflare 免费吗？
A: 是的，免费计划足够使用。

### Q: 需要备案吗？
A: 使用 Cloudflare + Vercel 不需要备案（因为服务器在海外）。

### Q: 国内访问速度如何？
A: 比直接访问 Vercel 快很多，通常可以正常打开。但不如备案后使用国内服务器快。

### Q: 如果还是慢怎么办？
A: 可以考虑：
1. 使用腾讯云 CDN（需要备案）
2. 使用腾讯云轻量服务器 + 备案
3. 使用 Cloudflare 付费计划（中国网络优化）

### Q: DNS 修改后多久生效？
A: 通常 2-24 小时，国内一般 2-6 小时。

### Q: 如何检查 DNS 是否生效？
A: 
```bash
nslookup www.gokaku.cn
# 如果返回的是 Cloudflare 的 IP，说明已生效
```

## 快速操作清单

- [ ] 注册 Cloudflare 账号
- [ ] 添加域名 gokaku.cn 到 Cloudflare
- [ ] 在腾讯云修改 DNS 服务器为 Cloudflare 提供的地址
- [ ] 等待 DNS 生效（2-24小时）
- [ ] 在 Cloudflare 添加 CNAME 记录（橙色云朵）
- [ ] 在 Vercel 添加域名
- [ ] 优化 Cloudflare 设置（可选）
- [ ] 测试访问 https://www.gokaku.cn

## 预期效果

- ✅ 国内可以正常访问（不需要 VPN）
- ✅ 访问速度提升 3-5 倍
- ✅ 自动 HTTPS 加密
- ✅ 全球 CDN 加速
- ✅ 免费

## 下一步

按照上面的步骤操作，大约 30 分钟可以完成配置，等待 DNS 生效后就可以在国内正常访问了！
