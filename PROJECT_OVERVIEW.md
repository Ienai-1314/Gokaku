# Gokaku 合格道 — 项目全景说明

## 一句话定位

**面向 JLPT N1/N2 考生的 AI 备考工具 + 资料包，¥39 早鸟价，7月考试截止前变现。**

---

## 产品是什么

网站 `gokaku.app`，两条收入线：

| 收入线 | 形式 | 现状 |
|--------|------|------|
| AI 工具订阅 | 免费试用 3 次，付费解锁无限 | 已上线，待接支付 |
| 资料包一次性购买 | ¥39 早鸟，含 176 份备考资料 | 已上线，小红书店铺 |

**核心 AI 功能（已上线）：**
- 语法查询：输入语法点 → DeepSeek 结合 231 条语法库解释 + 真题例句
- 错题分析：粘贴做错的题 → AI 分析陷阱、语法点、记忆技巧
- 拍照识题：上传题目图片 → OCR 提取文字 → 自动分析

**增长机制（已上线）：**
- 每日祈福签到（IP 限一次/天），今日/累计计数，社区感
- 邀请裂变：分享者 +5 次，被邀请者 +3 次，6 位邀请码

---

## 技术栈

```
前端：Next.js 14 + TypeScript + Tailwind CSS + Framer Motion
后端：Next.js API Routes（Vercel 部署）
数据库：腾讯云 CloudBase（NoSQL）
AI：DeepSeek API（语法查询 + 错题分析 + OCR）
支付：LemonSqueezy（已集成 SDK，待配置）
```

**CloudBase 数据集合：**
- `ratelimit` — IP 每日用量计数
- `invite_codes` — 邀请码 + 奖励池
- `blessings` — 每日祈福记录
- `error_records` — 用户错题档案
- `grammar_weakness` — 用户薄弱语法统计

**环境变量（Vercel 需配置）：**
```
TCB_ENV_ID / TCB_SECRET_ID / TCB_SECRET_KEY
DEEPSEEK_API_KEY
```

---

## 数据资产（在 `d:/量化n1/`）

| 资产 | 规模 | 用途 |
|------|------|------|
| grammar_231.json | 231 条 | 语法查询知识库（已打包进项目） |
| 完整真题文本 | 18 套 | RAG 检索真实例句 |
| idioms_v2.json | 699 条 | 惯用语查询（待接入） |
| JLPT-N1.xlsx | ~6000 词 | 词汇查询（待接入） |
| 备考资料 | 176 份 | 资料包销售内容 |

---

## 当前状态 vs 待完成

**已完成：**
- 完整首页（Hero + 祈福 + 工具展示 + 资料包 + 定价）
- /tool 工具页（语法查询 + 错题分析 + OCR + 用量显示 + 用户菜单）
- /invite 邀请页（邀请码 + 复制链接 + 原生分享）
- 全部 API 路由（analyze / query / ocr / blessing / invite / usage / profile）
- IP 限流 + 奖励池系统
- PWA manifest（可添加到手机桌面）
- /privacy + /terms 页面

**待完成（按优先级）：**
1. **接通支付**：LemonSqueezy SDK 已装，需配置 Webhook + 付费后解锁逻辑
2. **替换小红书店铺链接**：Hero.tsx 里 `XIAOHONGSHU_SHOP_URL` 是占位符
3. **CloudBase 建 `blessings` 集合**：祈福功能需要手动在控制台建表
4. **idioms + 词汇接入**：query API 目前只用 grammar_231，可扩展
5. **考前推送**：用户错题档案 → 考前 7 天生成"专属高风险语法清单"

---

## 商业逻辑

```
小红书内容引流
    ↓
首页 → 免费试用 AI 工具（3次）
    ↓
用量耗尽 → 付费墙（¥39 解锁无限）
    ↓
邀请好友 → 双方获得额外次数 → 裂变
    ↓
错题档案越用越有价值 → 留存
    ↓
7月考试后 → N2 用户复购
```

**时间窗口：** 2026 年 7 月 JLPT 考试，现在距考试约 3 个月，是变现黄金期。

---

## 给接手 Agent 的快速上手指南

1. 克隆仓库，`npm install`
2. 复制 `.env.local.example` → `.env.local`，填入四个密钥
3. `npm run dev` 本地跑起来
4. 关键文件：
   - 首页组件：`components/` 下各文件
   - AI 逻辑：`app/api/query/route.ts`、`app/api/analyze/route.ts`
   - 限流逻辑：`lib/ratelimit.ts`
   - 数据库：`lib/cloudbase.ts`
5. 当前最高优先级任务：接通 LemonSqueezy 支付，让付费流程跑通

---

## 目录结构

```
gokaku/
├── app/
│   ├── api/
│   │   ├── analyze/route.ts     # 错题分析
│   │   ├── query/route.ts       # 语法查询
│   │   ├── ocr/route.ts         # 拍照识题
│   │   ├── blessing/route.ts    # 每日祈福
│   │   ├── invite/route.ts      # 邀请裂变
│   │   ├── usage/route.ts       # 用量查询
│   │   └── profile/route.ts     # 错题档案
│   ├── tool/page.tsx            # AI 工具主页
│   ├── invite/page.tsx          # 邀请页
│   ├── download/page.tsx        # 资料下载页
│   ├── privacy/page.tsx         # 隐私政策
│   ├── terms/page.tsx           # 服务条款
│   └── page.tsx                 # 首页
├── components/
│   ├── Hero.tsx                 # 首屏
│   ├── BlessingWidget.tsx       # 祈福签到
│   ├── ToolShowcase.tsx         # 工具展示
│   ├── ResourcePack.tsx         # 资料包展示
│   ├── ContentPreview.tsx       # 内容预览
│   ├── Pricing.tsx              # 定价
│   ├── Navbar.tsx
│   └── Footer.tsx
├── lib/
│   ├── cloudbase.ts             # 数据库连接
│   ├── ratelimit.ts             # 限流 + 奖励池
│   └── data/grammar_231.json   # 语法知识库
└── public/
    ├── manifest.json            # PWA 配置
    └── sakurai.png              # 守护神插图
```
