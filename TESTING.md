# 测试新功能指南

## 功能概览

本次更新实现了三个核心功能：

1. **振假名注音** - 自动为日语文本添加读音标注
2. **词内链接** - 点击词汇即可查看定义和解析
3. **个性化练习** - 基于错题画像生成针对性练习

## 快速测试

### 1. 准备测试数据

首先需要生成测试数据（错题和用户画像）：

```bash
# 安装依赖（如果还没安装）
npm install

# 运行测试数据生成脚本
npx tsx scripts/seed-test-data.ts
```

**重要提示**：
- 脚本会使用测试账号 `test_user_001`
- 如果你想用自己的账号测试，请修改 `scripts/seed-test-data.ts` 中的 `TEST_ACCOUNT_ID`
- 脚本会自动清理该账号的旧测试数据

### 2. 启动开发服务器

```bash
npm run dev
```

服务器会在 `http://localhost:3000` 启动（如果端口被占用会自动尝试其他端口）

### 3. 测试功能

#### 功能 1：振假名注音

振假名功能已集成在多个页面中，任何使用 `FuriganaText` 或 `SmartText` 组件的地方都会自动显示读音。

**测试位置**：
- Dashboard 页面的题目文本
- 个性化练习页面的题目
- 任何显示日语文本的地方

**预期效果**：
- 汉字上方显示假名读音
- 使用 `<ruby>` 标签实现，符合 HTML 标准
- 自动缓存，重复文本瞬间显示

#### 功能 2：词内链接

**测试步骤**：
1. 访问个性化练习页面：`http://localhost:3008/practice/personalized`
2. 找到题目中的日语词汇（如「仕事」「時間」等）
3. 点击词汇

**预期效果**：
- 弹出 tooltip 显示词汇定义
- 显示读音、释义和例句
- 可点击"查看完整解析"跳转到详细页面
- 点击外部区域关闭 tooltip

**设计特点**：
- 使用 Lucide React 图标（X 关闭按钮）
- 遵循 Gokaku 设计系统（crimson #C75B3B 配色）
- 平滑动画效果

#### 功能 3：个性化练习

**测试步骤**：
1. 确保已运行测试数据生成脚本
2. 访问：`http://localhost:3008/practice/personalized`

**预期效果**：
- 顶部显示学习画像卡片：
  - 薄弱知识点列表（按错误次数排序）
  - 学习建议（基于错误模式生成）
- 下方显示练习题集：
  - 按薄弱知识点分组
  - 每组 2-3 道相关题目
  - 显示你的答案 vs 正确答案
  - 可展开查看详细解析
- 题目中的词汇可点击查询（集成功能 2）

**API 端点测试**：
```bash
# 获取学习画像
curl http://localhost:3008/api/profile/learning

# 获取个性化练习
curl http://localhost:3008/api/practice/personalized
```

## 数据库集合

本次功能使用以下数据库集合：

1. **wrong_questions** - 错题本
   - 字段：question, userAnswer, correctAnswer, analysis, classification, account_id
   
2. **user_profiles** - 用户学习画像
   - 字段：accountId, weakAreas, errorPatterns, recommendations, totalErrors

3. **collections** - 收藏（已有）

## 测试数据说明

测试脚本会生成 6 道错题，涵盖以下知识点：
- 形容词变化（なくなる）
- 递进表达（な上に、ばかりか、であるばかりでなく）
- 样态助动词（そうだ）
- 并列表达（であると同時に）

错误类型分布：
- 混淆：5 次（主要错误类型）
- 不熟悉：1 次

## 常见问题

### Q: 运行脚本时报错 "API key not configured"
A: 这是正常的，脚本只生成数据库数据，不调用 AI API。

### Q: 个性化练习页面显示"暂无练习数据"
A: 请确认：
1. 已运行测试数据生成脚本
2. 当前登录的账号 ID 与脚本中的 TEST_ACCOUNT_ID 一致
3. 数据库连接正常（检查 .env.local 中的 TCB 配置）

### Q: 点击词汇没有反应
A: 请检查：
1. 浏览器控制台是否有错误
2. `/api/query` 端点是否正常工作
3. 词汇长度是否大于 1（单字符不可点击）

### Q: 振假名不显示
A: 请检查：
1. `/api/furigana` 端点是否正常工作
2. 浏览器控制台是否有错误
3. 文本中是否包含汉字

## 下一步

测试完成后，你可以：

1. **清理测试数据**：
   ```bash
   # 手动删除测试账号的数据，或修改脚本重新运行
   ```

2. **部署到生产环境**：
   ```bash
   npm run build
   # 部署到你的服务器
   ```

3. **添加更多功能**：
   - 练习题目的答题功能
   - 学习进度追踪
   - 知识点详细页面

## 技术栈

- **前端框架**：Next.js 14 + React
- **样式**：Tailwind CSS
- **图标**：Lucide React（符合专业 UI 标准，无 emoji）
- **字体**：Bebas Neue, DM Sans, Noto Sans JP
- **数据库**：腾讯云开发 CloudBase
- **AI**：DeepSeek API

## 设计系统

遵循 Gokaku 品牌设计：
- 主色：Crimson #C75B3B
- 背景：Warm Beige #FAF6F0
- 文字：Dark Brown #2D2420
- 强调色：Gold #F0A500

---

如有问题，请查看控制台日志或联系开发者。
