# x-crawl 工具集成文档

## 📦 安装状态

✅ **已安装**: x-crawl@10.1.0

```bash
npm install x-crawl --save
```

## 🎯 x-crawl 能做什么

x-crawl 是一个 **灵活的 Node.js AI 辅助爬虫库**，主要功能：

### 1. **网页爬取**
- 爬取静态网页内容
- 爬取动态网页（使用 Puppeteer）
- 支持 JavaScript 渲染的页面

### 2. **AI 辅助提取**
- 集成 OpenAI API
- 集成 Ollama（本地 AI 模型）
- 智能提取网页结构化数据

### 3. **高级功能**
- 自动轮换 User-Agent
- 指纹识别防护
- 代理支持（https-proxy-agent）
- 页面控制和交互

### 4. **数据提取**
- HTML 解析
- JSON 数据提取
- 图片下载
- 文件下载

## 🚀 核心依赖

- **puppeteer**: 无头浏览器控制
- **openai**: OpenAI API 集成
- **ollama**: 本地 AI 模型
- **chalk**: 终端彩色输出
- **ora**: 加载动画

## 💡 在 Gokaku 项目中的应用场景

### 场景 1：爬取在线 JLPT 真题
如果有在线真题网站，可以用 x-crawl 自动爬取：

```typescript
import xCrawl from 'x-crawl'

const crawler = xCrawl({
  maxRetry: 3,
  intervalTime: { max: 2000, min: 1000 }
})

// 爬取真题页面
const result = await crawler.crawlPage({
  url: 'https://example.com/jlpt-n1-questions',
  viewport: { width: 1920, height: 1080 }
})

// 使用 AI 提取题目
const questions = await result.page.evaluate(() => {
  // 提取页面数据
})
```

### 场景 2：爬取词汇解释
为 SmartText 组件提供在线词典数据：

```typescript
// 爬取日语词典
const dictResult = await crawler.crawlPage({
  url: `https://jisho.org/search/${word}`,
  targets: ['.concept_light-representation', '.meaning-wrapper']
})
```

### 场景 3：爬取学习资源
自动收集 N1 学习资料：

```typescript
// 爬取学习网站
const resources = await crawler.crawlData({
  url: 'https://example.com/n1-resources',
  targets: {
    title: '.resource-title',
    link: '.resource-link',
    description: '.resource-desc'
  }
})
```

## 📝 基础使用示例

### 示例 1：简单网页爬取

```typescript
import xCrawl from 'x-crawl'

const crawler = xCrawl()

// 爬取网页
const result = await crawler.crawlPage('https://example.com')
console.log(result.page.url())
```

### 示例 2：AI 辅助提取

```typescript
import xCrawl from 'x-crawl'

const crawler = xCrawl({
  ai: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      model: 'gpt-4'
    }
  }
})

// 使用 AI 提取数据
const result = await crawler.crawlPage({
  url: 'https://example.com',
  aiExtract: {
    prompt: 'Extract all JLPT N1 questions from this page',
    schema: {
      questions: 'array',
      options: 'array',
      answer: 'string'
    }
  }
})
```

### 示例 3：批量爬取

```typescript
const urls = [
  'https://example.com/page1',
  'https://example.com/page2',
  'https://example.com/page3'
]

const results = await crawler.crawlPage(urls)
results.forEach(result => {
  console.log(result.page.url())
})
```

## 🔧 集成到 Gokaku

### 创建爬虫工具类

```typescript
// lib/crawler.ts
import xCrawl from 'x-crawl'

export class GokakuCrawler {
  private crawler: any

  constructor() {
    this.crawler = xCrawl({
      maxRetry: 3,
      intervalTime: { max: 2000, min: 1000 },
      ai: {
        openai: {
          apiKey: process.env.OPENAI_API_KEY
        }
      }
    })
  }

  async crawlJLPTQuestions(url: string) {
    const result = await this.crawler.crawlPage({
      url,
      aiExtract: {
        prompt: 'Extract JLPT N1 questions with options and answers',
        schema: {
          type: 'string',
          question_text: 'string',
          options: 'array',
          correct_answer: 'number'
        }
      }
    })
    return result.data
  }

  async crawlDictionary(word: string) {
    const result = await this.crawler.crawlPage({
      url: `https://jisho.org/search/${word}`,
      targets: ['.meaning-wrapper']
    })
    return result.data
  }
}
```

## ⚠️ 注意事项

1. **遵守网站规则**
   - 检查 robots.txt
   - 设置合理的请求间隔
   - 不要过度爬取

2. **API Key 配置**
   - OpenAI API Key（如果使用 AI 功能）
   - 配置到 .env.local

3. **性能考虑**
   - Puppeteer 占用内存较大
   - 批量爬取时注意并发控制

4. **法律合规**
   - 只爬取公开数据
   - 遵守版权法

## 📚 相关文档

- GitHub: https://github.com/coder-hxl/x-crawl
- npm: https://www.npmjs.com/package/x-crawl

## 🎯 下一步

1. 创建示例脚本测试 x-crawl
2. 集成到 Gokaku 工具库
3. 用于爬取在线真题（如果有）
4. 用于词典数据补充

---

**安装时间**: 2026-04-10 15:15
**版本**: 10.1.0
**状态**: ✅ 已集成
