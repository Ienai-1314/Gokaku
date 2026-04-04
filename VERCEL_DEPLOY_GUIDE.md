# Vercel 部署步骤（命令行方式）

## 1. 安装 Vercel CLI

打开命令行（PowerShell 或 CMD），运行：

```bash
npm install -g vercel
```

等待安装完成（可能需要1-2分钟）。

---

## 2. 登录 Vercel

```bash
vercel login
```

会弹出浏览器，选择登录方式：
- GitHub（推荐）
- GitLab
- Bitbucket
- Email

选一个登录即可。

---

## 3. 进入项目目录

```bash
cd C:/Users/Garo/gokaku
```

---

## 4. 第一次部署（测试环境）

```bash
vercel
```

会问你几个问题，按照下面回答：

```
? Set up and deploy "C:\Users\Garo\gokaku"? [Y/n] 
→ 输入 Y 回车

? Which scope do you want to deploy to? 
→ 选择你的账号（用方向键选择，回车确认）

? Link to existing project? [y/N] 
→ 输入 N 回车（第一次部署）

? What's your project's name? 
→ 输入 gokaku 回车（或者你想要的名字）

? In which directory is your code located? 
→ 直接回车（默认 ./）

? Want to override the settings? [y/N] 
→ 输入 N 回车
```

然后等待部署完成，会给你一个测试链接，比如：
```
https://gokaku-xxx.vercel.app
```

---

## 5. 设置环境变量

部署完成后，需要添加环境变量：

### 方式A：通过命令行（快速）

```bash
vercel env add TCB_ENV_ID
```
输入：`你的腾讯云环境ID`

```bash
vercel env add TCB_SECRET_ID
```
输入：`你的腾讯云SecretID`

```bash
vercel env add TCB_SECRET_KEY
```
输入：`你的腾讯云SecretKey`

```bash
vercel env add DEEPSEEK_API_KEY
```
输入：`你的DeepSeek API密钥`

```bash
vercel env add NEXT_PUBLIC_SITE_URL
```
输入：`https://gokaku-xxx.vercel.app`（用你刚才得到的链接）

每个命令会问你：
```
? Add to which Environments? (Press <space> to select, <a> to toggle all)
```
按空格选中所有（Production, Preview, Development），然后回车。

### 方式B：通过网页（更直观）

1. 访问 https://vercel.com/dashboard
2. 找到你的项目 `gokaku`
3. 点击 Settings → Environment Variables
4. 添加上面5个环境变量

---

## 6. 重新部署（应用环境变量）

```bash
vercel --prod
```

等待部署完成，会给你正式的生产环境链接：
```
https://gokaku.vercel.app
```

---

## 7. 测试网站

打开浏览器，访问你的网站：
- 首页：`https://gokaku.vercel.app`
- 工具页：`https://gokaku.vercel.app/tool`
- 管理后台：`https://gokaku.vercel.app/admin`

试试功能是否正常。

---

## 8. 绑定自定义域名（可选）

如果你有自己的域名（比如 gokaku.com）：

1. 在 Vercel 项目设置中点击 Domains
2. 输入你的域名
3. 按照提示在域名服务商添加 DNS 记录
4. 等待生效（5-30分钟）

---

## ⚠️ 常见问题

### Q: 命令行提示 "vercel: command not found"
A: 重新打开命令行窗口，或者运行：
```bash
npm install -g vercel
```

### Q: 部署后网站打不开
A: 检查环境变量是否都添加了，特别是 TCB 和 DEEPSEEK 的。

### Q: 功能报错
A: 打开浏览器开发者工具（F12），看 Console 有什么错误信息。

---

## ✅ 部署成功的标志

- 能打开首页
- 能看到倒计时和祈福功能
- 点击"免费体验AI工具"能进入工具页
- 访问 /admin 能看到管理后台

---

**准备好了吗？开始部署吧！**
