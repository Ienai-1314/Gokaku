# Gokaku 项目完整总结 - 2026-04-10

## 🎯 项目目标

完善 Gokaku 日语 N1 学习网站，实现从 PDF 真题提取到在线刷题的完整流程。

---

## ✅ 已完成功能

### 1. 核心功能模块
- ✅ **真题刷题系统**
  - 真题列表页 (`/exam`)
  - 刷题界面 (`/exam/practice`)
  - 成绩报告 (`/exam/result`)
  - 单题模式、题目导航、进度追踪

- ✅ **个性化练习系统**
  - 错题分析与用户画像
  - 基于薄弱点的智能推荐
  - 个性化练习页面 (`/practice/personalized`)

- ✅ **兑换码管理系统**
  - 管理员登录 (`/admin/login`)
  - 兑换码列表 (`/admin/codes`)
  - 统计仪表盘 (`/admin/dashboard`)
  - 1000 条兑换码已导入数据库

- ✅ **AI 功能**
  - 振假名注音（FuriganaText 组件）
  - 词内链接（SmartText 组件）
  - DeepSeek API 集成

### 2. 数据库设计
- ✅ `exam_papers` - 试卷集合
- ✅ `exam_questions` - 题目集合（10 题示例数据）
- ✅ `user_exam_records` - 答题记录
- ✅ `wrong_questions` - 错题记录
- ✅ `user_profiles` - 用户画像
- ✅ `redemption_codes` - 兑换码（1000 条）

### 3. 开发工具
- ✅ 测试数据生成脚本 (`seed-test-data.ts`)
- ✅ 真题导入脚本 (`import-exam-questions.ts`)
- ✅ 兑换码迁移脚本 (`migrate-codes-to-db.ts`)

---

## 🚧 进行中任务

### DataFlow PDF 提取系统

**目标**: 从 2020-2025 年 PDF 真题中提取约 1980 道题目

**技术方案**:
```
PDF 扫描版 → MinerU API (OCR) → Markdown → DeepSeek API → JSON → Gokaku DB
```

**已完成**:
1. ✅ 克隆 DataFlow 仓库到本地
2. ✅ 研究 PDF2VQA 和知识库清洗流水线
3. ✅ 创建简化版提取脚本 (`jlpt_extract_simple.py`)
4. ✅ 创建数据转换脚本 (`convert_dataflow_to_gokaku.py`)
5. ✅ 编写完整使用指南 (`JLPT_EXTRACTION_GUIDE.md`)
6. 🔄 安装 DataFlow 依赖（网络超时，重试中）

**待完成**:
1. ⏳ 申请 MinerU API Key (https://mineru.net/)
2. ⏳ 配置环境变量 (`MINERU_API_KEY`)
3. ⏳ 测试提取单个 PDF
4. ⏳ 验证提取质量
5. ⏳ 批量处理所有 PDF
6. ⏳ 导入 Gokaku 数据库

**成本估算**:
- MinerU API: ¥20-100 (约 2000 页)
- DeepSeek API: ¥1-2 (约 1980 题)
- **总计**: ¥21-102

---

## 📁 项目文件结构

```
C:\Users\Garo\gokaku\
├── app/
│   ├── exam/                    # 真题刷题模块
│   ├── practice/                # 个性化练习模块
│   └── admin/                   # 后台管理模块
├── components/
│   ├── FuriganaText.tsx        # 振假名组件
│   └── SmartText.tsx           # 词内链接组件
├── lib/
│   ├── cloudbase.ts            # 云数据库连接
│   └── error-classification.ts # 错题分类系统
├── scripts/
│   ├── jlpt_extract_simple.py  # DataFlow 提取脚本
│   ├── convert_dataflow_to_gokaku.py  # 数据转换脚本
│   ├── seed-test-data.ts       # 测试数据生成
│   └── import-exam-questions.ts # 真题导入
├── docs/
│   ├── JLPT_EXTRACTION_GUIDE.md  # 提取系统指南
│   ├── EXAM_SYSTEM_DESIGN.md     # 真题系统设计
│   └── ADMIN_SYSTEM_DESIGN.md    # 后台系统设计
└── .env.local                   # 环境变量配置

C:\Users\Garo\DataFlow\          # DataFlow 工具
D:\量化n1\资料\A 日语N1\          # PDF 真题资源
```

---

## 🔑 API Keys 配置

### 已配置
- ✅ **DeepSeek API**: `sk-852d4b17220e4c9c850b1e4c8465e737`
- ✅ **腾讯云开发**: TCB_ENV_ID, TCB_SECRET_ID, TCB_SECRET_KEY

### 待申请
- ⏳ **MinerU API**: 需要访问 https://mineru.net/ 注册

---

## 🚀 下一步行动计划

### 立即执行（优先级 P0）
1. **申请 MinerU API Key**
   - 访问 https://mineru.net/
   - 注册并获取 API Key
   - 配置到 `.env.local`

2. **完成 DataFlow 安装**
   - 等待当前安装完成
   - 验证安装成功: `python -c "import dataflow; print(dataflow.__version__)"`

3. **测试提取单个 PDF**
   ```bash
   cd C:/Users/Garo/gokaku
   python scripts/jlpt_extract_simple.py
   ```

### 短期目标（1-2 天）
4. **验证提取质量**
   - 检查 OCR 准确率
   - 检查题目结构完整性
   - 调整 Prompt 优化提取

5. **批量处理所有 PDF**
   - 修改脚本处理所有文件
   - 监控 API 调用成本
   - 处理异常情况

6. **导入数据库**
   - 运行转换脚本
   - 验证数据完整性
   - 更新试卷元数据

### 中期目标（3-5 天）
7. **功能测试**
   - 测试所有页面功能
   - 修复发现的 bug
   - 优化用户体验

8. **部署上线**
   - 配置生产环境
   - 部署到服务器
   - 配置域名和 SSL

---

## 📊 数据统计

- **代码文件**: 50+ 个
- **代码行数**: 5000+ 行
- **已导入题目**: 10 题（示例）
- **待导入题目**: 约 1980 题
- **兑换码**: 1000 条
- **PDF 资源**: 2020-2025 年完整真题

---

## 🛠️ 技术栈

- **前端**: Next.js 14, React, TypeScript, Tailwind CSS
- **后端**: Next.js API Routes
- **数据库**: 腾讯云开发 CloudBase
- **AI**: DeepSeek API, MinerU API
- **工具**: DataFlow, pdf-parse, tsx

---

## 📝 重要文档

1. [JLPT_EXTRACTION_GUIDE.md](./JLPT_EXTRACTION_GUIDE.md) - PDF 提取完整指南
2. [EXAM_SYSTEM_DESIGN.md](./EXAM_SYSTEM_DESIGN.md) - 真题系统设计
3. [ADMIN_SYSTEM_DESIGN.md](./ADMIN_SYSTEM_DESIGN.md) - 后台管理设计
4. [TESTING.md](./TESTING.md) - 测试指南

---

## 💡 关键决策记录

1. **选择 DataFlow 而非手动 OCR**
   - 原因: 专业的 PDF 知识提取工具，支持日语
   - 优势: 布局识别、结构化输出、批量处理

2. **使用 MinerU API 而非本地模型**
   - 原因: 无需下载大模型，节省磁盘空间
   - 优势: 云端处理，速度快，准确率高

3. **先完善网站功能，后开发 iOS App**
   - 原因: 网站是基础，数据完整后再做 App
   - 优势: 避免重复开发，专注核心功能

---

## 🎉 项目亮点

1. **完整的学习闭环**: 刷题 → 错题分析 → 个性化练习
2. **AI 增强体验**: 振假名、词内链接、智能推荐
3. **数据驱动**: 用户画像、学习轨迹、薄弱点分析
4. **自动化工具**: PDF 提取、数据导入、测试生成

---

**最后更新**: 2026-04-10 14:00
**当前状态**: DataFlow 安装中，等待 MinerU API Key
