# Gokaku - JLPT N1/N2 AI 备考平台

> V0 静态资料站 - AI 分析近15年真题，精准定位高频考点

## 技术栈

- **框架**: Next.js 14 (App Router)
- **样式**: Tailwind CSS
- **动画**: Framer Motion
- **字体**: Noto Sans JP / Noto Serif JP (Google Fonts)

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 项目结构

```
gokaku/
├── app/
│   ├── globals.css      # 全局样式
│   ├── layout.tsx       # 根布局
│   └── page.tsx         # 首页
├── components/
│   ├── Navbar.tsx       # 导航栏
│   ├── Hero.tsx         # Hero 区域
│   ├── ContentPreview.tsx  # 内容预览
│   ├── Pricing.tsx      # 价格方案
│   └── Footer.tsx       # 页脚
└── lib/
    └── utils.ts         # 工具函数
```

## V0 功能

- [x] N1/N2 等级切换
- [x] Hero 区域展示
- [x] 资料预览（考点分析/押题预测/高频词汇）
- [x] 价格方案展示
- [x] 响应式布局

## 待接入

- [ ] Lemon Squeezy 支付集成
- [ ] Supabase 认证系统
- [ ] 用户解锁状态管理

## 许可证

Private - All rights reserved
