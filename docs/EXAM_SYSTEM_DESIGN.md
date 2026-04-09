# 真题刷题系统设计文档

## 1. 系统概述

基于 2020-2025 年 JLPT N1 真题，构建智能刷题系统，集成错题分析和个性化推荐。

## 2. 数据资源

### 真题文件结构
```
D:\量化n1\资料\A 日语N1\
├── 2025年12月N1 完整原卷/
│   ├── A 2025年12月N1完整原卷.pdf
│   ├── B 2025年12月N1解析消除水印版.pdf
│   ├── C 2025年12月N1答案.pdf
│   └── 2025年12月N1听力原文，译文，答案.pdf
├── N1 2025年7月原卷+听力音频/
├── N1(202012-202507高清打印卷 含解析答案）/
└── N1历年真题 有音频/
```

### 覆盖年份
- 2020.12 - 2025.12（共11场考试）
- 每场包含：试卷、答案、解析、听力原文

## 3. 数据库设计

### 3.1 exam_papers（真题试卷）
```typescript
{
  _id: string;
  examDate: string;           // "2025-12"
  examType: "N1" | "N2";
  sections: {
    vocabulary: { questionCount: number };
    grammar: { questionCount: number };
    reading: { questionCount: number };
    listening: { questionCount: number };
  };
  pdfFiles: {
    paper: string;            // PDF 文件路径
    answer: string;
    analysis: string;
    listeningScript?: string;
  };
  status: "active" | "archived";
  createdAt: Date;
}
```

### 3.2 exam_questions（真题题目）
```typescript
{
  _id: string;
  paperId: string;            // 关联 exam_papers
  examDate: string;           // "2025-12"
  section: "vocabulary" | "grammar" | "reading" | "listening";
  questionNumber: number;     // 题号（1-180）
  questionType: string;       // "单选"、"完形填空"、"阅读理解"等
  
  // 题目内容
  content: {
    question: string;         // 题干（支持富文本/图片）
    options: string[];        // 选项 A/B/C/D
    correctAnswer: string;    // 正确答案
    images?: string[];        // 图片URL（如有）
  };
  
  // 解析内容
  analysis: {
    explanation: string;      // 详细解析
    knowledgePoints: string[]; // 知识点标签
    difficulty: 1 | 2 | 3 | 4 | 5; // 难度等级
    relatedGrammar?: string[]; // 关联语法点
  };
  
  // 统计数据
  stats: {
    totalAttempts: number;    // 总答题次数
    correctRate: number;      // 正确率
  };
  
  createdAt: Date;
  updatedAt: Date;
}
```

### 3.3 user_exam_records（用户答题记录）
```typescript
{
  _id: string;
  accountId: string;
  paperId: string;
  examDate: string;
  
  // 答题进度
  progress: {
    totalQuestions: number;
    answeredQuestions: number;
    startedAt: Date;
    completedAt?: Date;
    timeSpent: number;        // 秒
  };
  
  // 答题详情
  answers: Array<{
    questionId: string;
    userAnswer: string;
    isCorrect: boolean;
    timeSpent: number;
  }>;
  
  // 成绩统计
  score: {
    vocabulary: { correct: number; total: number };
    grammar: { correct: number; total: number };
    reading: { correct: number; total: number };
    listening: { correct: number; total: number };
    overall: { correct: number; total: number; percentage: number };
  };
  
  createdAt: Date;
  updatedAt: Date;
}
```

## 4. 功能模块

### 4.1 真题导入工具（Phase 1）
**目标**：将 PDF 真题转换为结构化数据

**实现方案**：
1. **手动录入**（MVP）
   - 创建管理后台表单
   - 按题目逐条录入
   - 支持富文本编辑器
   - 优点：准确度高，可控
   - 缺点：工作量大

2. **半自动化**（推荐）
   - 使用 Claude API 解析 PDF
   - 人工审核校对
   - 批量导入数据库

3. **全自动化**（未来）
   - OCR + NLP 自动识别
   - AI 自动生成解析

**Phase 1 实现**：手动录入 2-3 套真题作为种子数据

### 4.2 刷题界面（Phase 2）
**路由**：`/exam/practice`

**功能**：
- 选择真题年份/场次
- 选择练习模式：
  - 完整模拟（180题，180分钟）
  - 分项练习（词汇/语法/阅读/听力）
  - 错题重做
  - 薄弱点专项
- 答题界面：
  - 题目导航（快速跳转）
  - 标记功能（稍后回顾）
  - 倒计时器
  - 实时保存进度
- 提交后查看：
  - 成绩报告
  - 错题解析
  - 知识点分布

### 4.3 成绩分析（Phase 3）
**路由**：`/exam/analysis`

**功能**：
- 历史成绩曲线
- 各科目得分雷达图
- 薄弱知识点排行
- 与全站平均对比
- 错题本集成

### 4.4 智能推荐（Phase 4）
**集成现有功能**：
- 基于错题画像推荐真题
- 优先推荐薄弱知识点相关题目
- 自适应难度调整

## 5. 技术实现

### 5.1 PDF 解析
```bash
# 安装依赖
npm install pdf-parse
```

```typescript
// lib/pdf-parser.ts
import pdf from 'pdf-parse';

export async function parsePDF(filePath: string) {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdf(dataBuffer);
  return data.text;
}
```

### 5.2 Claude API 辅助解析
```typescript
// scripts/import-exam.ts
import Anthropic from '@anthropic-ai/sdk';

const prompt = `
解析以下 JLPT N1 真题内容，提取：
1. 题号
2. 题干
3. 选项 A/B/C/D
4. 正确答案
5. 知识点

返回 JSON 格式。
`;
```

### 5.3 前端组件
```typescript
// components/ExamQuestion.tsx
- 题目展示
- 选项选择
- 标记/跳转
- 提交确认

// components/ExamTimer.tsx
- 倒计时
- 自动提交

// components/ExamNavigation.tsx
- 题目列表
- 答题状态（已答/未答/标记）
```

## 6. 开发计划

### Phase 1: 数据准备（1-2天）
- [x] 设计数据库结构
- [ ] 创建导入脚本
- [ ] 手动录入 2 套真题（2025.12 + 2025.07）
- [ ] 验证数据完整性

### Phase 2: 刷题功能（2-3天）
- [ ] 实现答题界面
- [ ] 实现题目导航
- [ ] 实现进度保存
- [ ] 实现成绩计算

### Phase 3: 分析功能（1-2天）
- [ ] 成绩报告页面
- [ ] 错题解析展示
- [ ] 集成现有错题本

### Phase 4: 智能推荐（1天）
- [ ] 基于画像推荐真题
- [ ] 薄弱点专项练习

## 7. MVP 范围

**最小可用版本**：
1. ✅ 2 套完整真题（2025.12 + 2025.07）
2. ✅ 基础答题界面（单题模式）
3. ✅ 答案校对
4. ✅ 简单成绩统计
5. ✅ 错题记录

**暂不实现**：
- ❌ 听力音频播放
- ❌ 完整模拟考试（180题）
- ❌ 复杂图表分析
- ❌ 全自动 PDF 解析

## 8. 数据安全

- PDF 文件存储在本地，不上传云端
- 题目数据存储在腾讯云数据库
- 用户答题记录加密存储
- 遵守版权法规（仅供学习使用）
