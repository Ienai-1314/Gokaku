# DataFlow + Gokaku 集成方案

## 📋 DataFlow 简介

根据你提供的信息，DataFlow 是一个**高质量数据准备系统**，支持：

### 六种流水线
1. **RAG 搜索**
2. **大规模知识抽取** - 从 PDF 和网页中提取结构化知识 ⭐
3. 数据清洗
4. 数据转换
5. 数据验证
6. 数据增强

### 关键特性
- ✅ 支持 PDF 结构化知识提取
- ✅ 支持网页数据抓取
- ✅ 可以提取表格、文本、图片
- ✅ 输出结构化数据（JSON/CSV）

---

## 🎯 实施计划

### Phase 1: 安装 DataFlow

```bash
# 1. 克隆 DataFlow 仓库
git clone https://github.com/opendcai/DataFlow.git
cd DataFlow

# 2. 安装依赖
pip install -r requirements.txt

# 3. 配置环境
cp .env.example .env
# 编辑 .env 文件，配置必要的 API Key
```

### Phase 2: 配置 PDF 提取流水线

创建配置文件 `config/jlpt_extraction.yaml`:

```yaml
pipeline:
  name: "JLPT N1 真题提取"
  type: "knowledge_extraction"
  
input:
  type: "pdf"
  path: "D:/量化n1/资料/A 日语N1"
  pattern: "**/*.pdf"
  
extraction:
  # 提取题目
  questions:
    - type: "text_block"
      pattern: "問題\\d+"
      fields:
        - question_number
        - question_text
        - options
        - answer
  
  # 提取选项
  options:
    - type: "list"
      pattern: "[1-4]\\s+.*"
  
output:
  type: "json"
  path: "./output/questions.json"
  format: "structured"
```

### Phase 3: 运行提取

```bash
# 提取单个 PDF
python dataflow.py extract \
  --config config/jlpt_extraction.yaml \
  --input "D:/量化n1/资料/A 日语N1/2025年12月N1 完整原卷/A 2025年12月N1完整原卷.pdf" \
  --output output/2025-12.json

# 批量提取所有 PDF
python dataflow.py batch_extract \
  --config config/jlpt_extraction.yaml \
  --input-dir "D:/量化n1/资料/A 日语N1" \
  --output-dir output/
```

### Phase 4: 数据转换

将 DataFlow 输出转换为 Gokaku 数据格式：

```typescript
// scripts/convert-dataflow-output.ts
import * as fs from 'fs';

interface DataFlowQuestion {
  question_number: number;
  question_text: string;
  options: string[];
  answer: string;
}

interface GokakuQuestion {
  questionNumber: number;
  section: 'vocabulary' | 'grammar' | 'reading' | 'listening';
  questionType: string;
  content: {
    question: string;
    options: string[];
    correctAnswer: string;
  };
  analysis: {
    explanation: string;
    knowledgePoints: string[];
    difficulty: 1 | 2 | 3 | 4 | 5;
  };
}

function convertToGokakuFormat(dataflowData: DataFlowQuestion[]): GokakuQuestion[] {
  return dataflowData.map(q => ({
    questionNumber: q.question_number,
    section: 'vocabulary', // 需要根据题目类型判断
    questionType: '单选',
    content: {
      question: q.question_text,
      options: q.options,
      correctAnswer: q.answer,
    },
    analysis: {
      explanation: '解析待补充',
      knowledgePoints: [],
      difficulty: 3,
    },
  }));
}

// 读取 DataFlow 输出
const dataflowOutput = JSON.parse(fs.readFileSync('output/2025-12.json', 'utf-8'));

// 转换格式
const gokakuQuestions = convertToGokakuFormat(dataflowOutput);

// 保存
fs.writeFileSync('parsed-questions-2025-12.json', JSON.stringify(gokakuQuestions, null, 2));
```

### Phase 5: 导入数据库

```bash
# 使用现有的导入脚本
npm run import-exam -- --file parsed-questions-2025-12.json
```

---

## 🔧 备选方案：x-crawl

如果 DataFlow 不适合，可以使用 **x-crawl** 爬取在线真题资源：

```typescript
// scripts/crawl-online-questions.ts
import xCrawl from 'x-crawl';

const crawler = xCrawl({
  timeout: 10000,
  intervalTime: { max: 3000, min: 1000 }
});

// 爬取在线真题网站
async function crawlOnlineQuestions() {
  const result = await crawler.crawlPage({
    targets: [
      'https://jlpt-example.com/n1/2025-12',
      'https://jlpt-example.com/n1/2025-07',
      // ... 更多链接
    ],
    viewport: { width: 1920, height: 1080 }
  });

  // 提取题目数据
  const questions = result.map(page => {
    return page.evaluate(() => {
      // 在页面中提取题目
      const questionElements = document.querySelectorAll('.question');
      return Array.from(questionElements).map(el => ({
        question: el.querySelector('.question-text')?.textContent,
        options: Array.from(el.querySelectorAll('.option')).map(o => o.textContent),
        answer: el.querySelector('.answer')?.textContent,
      }));
    });
  });

  return questions;
}
```

---

## 📊 预期效果

### 使用 DataFlow
- **优点**：专业的 PDF 提取工具，准确度高
- **缺点**：需要学习配置，可能需要 1-2 天
- **适合**：PDF 是主要数据源

### 使用 x-crawl
- **优点**：简单易用，适合爬取网页
- **缺点**：需要找到在线真题资源
- **适合**：有在线真题网站可用

---

## 🚀 下一步

1. **先尝试 DataFlow**
   - 克隆仓库
   - 测试提取 1 份 PDF
   - 如果成功，批量处理

2. **如果 DataFlow 不行**
   - 尝试 x-crawl 爬取在线资源
   - 或者使用百度 OCR API

3. **最后兜底方案**
   - 手动录入 50-100 题
   - 先上线，后续慢慢补充

---

**你想先尝试哪个方案？**
1. DataFlow（我帮你安装和配置）
2. x-crawl（我帮你写爬虫脚本）
3. 其他想法？
