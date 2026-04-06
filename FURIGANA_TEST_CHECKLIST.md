# 振假名功能测试验证清单

## 本地测试 ✅

### 1. 构建测试
```bash
cd C:/Users/Garo/gokaku
npm run build
```
**结果**: ✅ 构建成功，无错误

### 2. API 测试
```bash
# 启动开发服务器
npm run dev

# 测试 API 端点
curl -X POST http://localhost:3000/api/furigana \
  -H "Content-Type: application/json" \
  -d '{"text":"日本語を勉強します"}'
```

**预期响应**:
```json
{
  "tokens": [
    {"surface_form": "日本語", "reading": "ニホンゴ", "pos": "名詞", "basic_form": "日本語"},
    {"surface_form": "を", "reading": "ヲ", "pos": "助詞", "basic_form": "を"},
    {"surface_form": "勉強", "reading": "ベンキョウ", "pos": "名詞", "basic_form": "勉強"},
    {"surface_form": "し", "reading": "シ", "pos": "動詞", "basic_form": "する"},
    {"surface_form": "ます", "reading": "マス", "pos": "助動詞", "basic_form": "ます"}
  ],
  "count": 5
}
```

**结果**: ✅ API 正常返回

### 3. 代码提交
```bash
git add app/api/furigana/route.ts components/FuriganaText.tsx
git commit -m "修复振假名功能：改用后端API方案"
git push origin main
```

**结果**: ✅ 已推送到 GitHub (commit: 64ff8ff)

---

## 生产环境验证（待 Vercel 部署完成后）

### 1. 部署状态检查
- [ ] 访问 Vercel Dashboard
- [ ] 确认最新提交已触发部署
- [ ] 检查部署日志无错误
- [ ] 确认部署状态为 "Ready"

### 2. API 端点测试
```bash
# 测试生产环境 API
curl -X POST https://gokaku.app/api/furigana \
  -H "Content-Type: application/json" \
  -d '{"text":"日本語を勉強します"}'
```

**预期**: 返回正确的 tokens 数据

### 3. 前端功能测试

#### 测试场景 1: 语法查询真题例句
1. 访问 https://gokaku.app/tool
2. 切换到"语法查询"标签
3. 输入"なり"并查询
4. 查看"真题例句"部分
5. **验证**: 日语句子中的汉字上方显示读音

#### 测试场景 2: 点击词汇查询
1. 在真题例句中点击某个词汇
2. **验证**: 自动切换到"词汇查询"标签
3. **验证**: 自动填充并查询该词汇

#### 测试场景 3: 错误降级
1. 打开浏览器开发者工具
2. Network 标签中模拟 API 失败（Offline 模式）
3. 刷新页面并查询
4. **验证**: 显示原文，不报错，不影响其他功能

### 4. 性能测试

#### 首次加载
- [ ] 打开 Network 标签
- [ ] 清除缓存
- [ ] 访问工具页面并查询
- [ ] 记录 `/api/furigana` 响应时间
- **预期**: < 3000ms（包含 tokenizer 初始化）

#### 后续请求
- [ ] 再次查询相同内容
- [ ] 记录响应时间
- **预期**: < 100ms（缓存命中）或 < 200ms（API 调用）

### 5. 浏览器兼容性测试
- [ ] Chrome/Edge (最新版)
- [ ] Firefox (最新版)
- [ ] Safari (最新版)
- [ ] 移动端 Safari
- [ ] 移动端 Chrome

**验证点**: ruby 标签显示正常，读音在汉字上方

---

## 回归测试

### 1. 其他功能不受影响
- [ ] 语法查询功能正常
- [ ] 词汇查询功能正常
- [ ] 错题分析功能正常
- [ ] 用户额度显示正常
- [ ] 收藏功能正常

### 2. 页面加载速度
- [ ] 首页加载正常
- [ ] 工具页面加载正常
- [ ] 无明显性能下降

---

## 监控指标

### Vercel 函数日志
查找以下日志确认正常运行：
```
[Furigana] Initializing tokenizer with dicPath: ...
[Furigana] Tokenizer initialized successfully
```

### 错误监控
如果出现错误，检查：
```
[Furigana] Tokenizer initialization failed: ...
[Furigana] API error: ...
```

### 性能指标
- 函数执行时间: < 3000ms (首次), < 200ms (后续)
- 内存使用: < 100MB
- 错误率: < 1%

---

## 已知问题和限制

### 1. 首次调用延迟
- **现象**: 首次调用需要 1-2 秒初始化 tokenizer
- **影响**: 用户首次查询时可能感觉稍慢
- **缓解**: 显示加载状态，后续请求很快

### 2. 文本长度限制
- **限制**: 单次请求最大 1000 字符
- **原因**: 避免超时和内存溢出
- **影响**: 正常使用场景不受影响（例句通常 < 100 字符）

### 3. 片假名显示
- **现象**: 读音以片假名显示（ニホンゴ）而非平假名（にほんご）
- **原因**: kuromoji 默认返回片假名
- **影响**: 不影响阅读，符合日语学习习惯

---

## 故障排查指南

### 问题 1: API 返回 500 错误
**可能原因**:
- kuromoji 词典文件未正确部署
- tokenizer 初始化失败

**排查步骤**:
1. 检查 Vercel 函数日志
2. 确认 `node_modules/kuromoji/dict` 存在
3. 检查 package.json 中 kuromoji 在 dependencies

### 问题 2: 前端不显示振假名
**可能原因**:
- API 调用失败
- 缓存问题
- 网络问题

**排查步骤**:
1. 打开浏览器控制台查看错误
2. 检查 Network 标签中 `/api/furigana` 请求
3. 清除浏览器缓存重试

### 问题 3: 读音显示不正确
**可能原因**:
- kuromoji 分词错误（罕见）
- 特殊词汇未收录

**解决方案**:
- 这是 kuromoji 的限制，无法完全避免
- 对于重要内容可手动标注

---

## 成功标准

✅ 所有测试项通过
✅ 生产环境稳定运行 24 小时无错误
✅ 用户反馈正面
✅ 性能指标达标

---

## 下一步计划

### 短期（1-2 周）
- [ ] 监控生产环境运行状态
- [ ] 收集用户反馈
- [ ] 优化性能（如有需要）

### 中期（1-2 月）
- [ ] 实现数据库缓存（常用例句预处理）
- [ ] 添加批量处理接口
- [ ] 优化首次加载速度

### 长期（3-6 月）
- [ ] 研究更轻量的分词方案
- [ ] 实现边缘缓存
- [ ] 支持自定义词典

---

## 文档更新日期
2026-04-05

## 负责人
Claude Code Agent

## 相关文档
- [实现说明](./FURIGANA_IMPLEMENTATION.md)
- [方案研究](./FURIGANA_RESEARCH.md)
