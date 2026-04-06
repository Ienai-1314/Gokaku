# 振假名功能实现说明

## 问题背景
之前使用 kuromoji.js 从 CDN 加载词典文件，在 Vercel 生产环境中不稳定，导致"服务暂不可用"错误。

## 解决方案
采用**后端 API + 前端调用**的架构，确保在 Vercel 环境稳定运行。

### 技术架构

#### 后端 API (`/api/furigana`)
- **位置**: `app/api/furigana/route.ts`
- **运行环境**: Node.js serverless function
- **词典来源**: 使用 `node_modules/kuromoji/dict` 中的词典文件
- **优化措施**:
  - 单例模式：tokenizer 只初始化一次，后续请求复用
  - 错误处理：初始化失败时可重试
  - 文本长度限制：最大 1000 字符
  - 详细日志：便于调试

#### 前端组件 (`components/FuriganaText.tsx`)
- **调用方式**: 通过 fetch 调用后端 API
- **缓存机制**: 使用 Map 缓存已处理的文本，避免重复请求
- **降级处理**: API 失败时显示原文，不影响用户体验
- **显示效果**: 使用 HTML `<ruby>` 标签，读音显示在汉字上方

### 数据流程

```
用户输入日语文本
    ↓
FuriganaText 组件
    ↓
检查本地缓存
    ↓ (未命中)
调用 /api/furigana
    ↓
后端 kuromoji 分词
    ↓
返回 tokens (原文 + 读音)
    ↓
缓存结果
    ↓
渲染 <ruby> 标签
```

### API 接口

**请求**:
```json
POST /api/furigana
Content-Type: application/json

{
  "text": "日本語を勉強します"
}
```

**响应**:
```json
{
  "tokens": [
    {
      "surface_form": "日本語",
      "reading": "ニホンゴ",
      "pos": "名詞",
      "basic_form": "日本語"
    },
    {
      "surface_form": "を",
      "reading": "ヲ",
      "pos": "助詞",
      "basic_form": "を"
    },
    ...
  ],
  "count": 5
}
```

### 性能优化

1. **后端缓存**: tokenizer 实例全局缓存，避免重复初始化（初始化耗时约 1-2 秒）
2. **前端缓存**: 已处理文本缓存在内存中，相同文本无需重复请求
3. **按需加载**: 只有包含日语文本的组件才会调用 API
4. **快速降级**: API 失败时立即显示原文，不阻塞页面渲染

### 使用示例

```tsx
import FuriganaText from '@/components/FuriganaText';

// 基本使用
<FuriganaText text="日本語を勉強します" />

// 带点击事件（用于词汇查询）
<FuriganaText 
  text="日本語を勉強します"
  onWordClick={(word) => console.log('点击了:', word)}
  className="text-lg"
/>
```

### 显示效果

原文: 日本語を勉強します

渲染后:
```html
<ruby>日本語<rt>ニホンゴ</rt></ruby>
を
<ruby>勉強<rt>ベンキョウ</rt></ruby>
します
```

浏览器显示: 日本語(ニホンゴ)を勉強(ベンキョウ)します（读音显示在汉字上方）

### Vercel 部署注意事项

1. **依赖安装**: 确保 `kuromoji` 在 `package.json` 的 `dependencies` 中（不是 devDependencies）
2. **词典文件**: kuromoji 的词典文件会随 npm 包一起部署到 Vercel
3. **函数超时**: 首次调用可能需要 2-3 秒初始化，后续请求 < 100ms
4. **内存限制**: tokenizer 占用约 30-50MB 内存，在 Vercel 免费版限制内

### 测试验证

本地测试:
```bash
# 启动开发服务器
npm run dev

# 测试 API
curl -X POST http://localhost:3000/api/furigana \
  -H "Content-Type: application/json" \
  -d '{"text":"日本語を勉強します"}'
```

生产环境测试:
1. 访问 https://gokaku.app/tool
2. 在语法查询结果中查看真题例句
3. 确认汉字上方显示读音
4. 点击词汇可跳转到词汇查询

### 故障排查

如果振假名不显示:
1. 检查浏览器控制台是否有 API 错误
2. 检查 Vercel 函数日志: `[Furigana] Initializing tokenizer...`
3. 确认 kuromoji 包已正确部署
4. 验证 API 路由可访问: `/api/furigana`

### 未来优化方向

1. **数据库缓存**: 将常用句子的分词结果存入数据库，减少 API 调用
2. **批量处理**: 支持一次请求处理多个句子
3. **边缘缓存**: 使用 Vercel Edge Config 缓存热门查询
4. **轻量级方案**: 研究 tiny-segmenter 等更轻量的分词库

## 总结

当前方案在 Vercel 生产环境稳定可靠，性能良好，用户体验流畅。通过后端 API 方式避免了 CDN 加载的不确定性，同时利用缓存机制保证了响应速度。
