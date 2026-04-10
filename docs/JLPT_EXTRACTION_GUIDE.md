# JLPT 真题提取系统 - 使用 DataFlow

## 📋 系统架构

```
PDF 扫描版真题
    ↓
MinerU API (OCR + 布局识别)
    ↓
Markdown 文本
    ↓
DeepSeek API (结构化提取)
    ↓
JSON 格式题目
    ↓
导入 Gokaku 数据库
```

## 🔑 需要的 API Key

### 1. MinerU API Key
- **用途**: PDF OCR 识别（支持日语）
- **官网**: https://mineru.net/
- **申请步骤**:
  1. 访问 https://mineru.net/apiManage/docs
  2. 注册账号
  3. 获取 API Key
  4. 设置环境变量: `export MINERU_API_KEY=your_key`

### 2. DeepSeek API Key
- **用途**: 从 Markdown 提取结构化题目
- **已有**: `sk-852d4b17220e4c9c850b1e4c8465e737`
- **已配置**: 在 `.env.local` 中

## 📦 安装步骤

### 1. 安装 DataFlow
```bash
cd C:/Users/Garo/DataFlow
pip install -e .
```

### 2. 配置环境变量
在 `C:\Users\Garo\gokaku\.env.local` 添加：
```bash
# MinerU API Key (需要申请)
MINERU_API_KEY=your_mineru_api_key_here

# DeepSeek API Key (已有)
DEEPSEEK_API_KEY=sk-852d4b17220e4c9c850b1e4c8465e737
```

## 🚀 使用方法

### 测试单个 PDF
```bash
cd C:/Users/Garo/gokaku
python scripts/jlpt_extract_simple.py
```

这会：
1. 查找 `D:\量化n1\资料\A 日语N1` 下的所有 PDF
2. 只处理第一个 PDF（测试模式）
3. 输出到 `C:\Users\Garo\gokaku\jlpt_output`

### 批量处理所有 PDF
修改 `jlpt_extract_simple.py` 第 95 行：
```python
# 从这个：
test_pdf = [pdf_files[0]]

# 改为这个：
test_pdf = pdf_files
```

## 📊 输出格式

### 中间文件
```
jlpt_output/
├── cache/                    # DataFlow 缓存
├── intermediate/             # MinerU 中间文件
│   └── *.md                 # Markdown 文件
└── jlpt_step1.json          # 最终输出
```

### 最终 JSON 格式
```json
{
  "questions": [
    {
      "number": 1,
      "section": "言語知識（文字・語彙）",
      "type": "vocabulary",
      "text": "彼の___は素晴らしい。",
      "options": [
        {"label": "1", "text": "えんぎ"},
        {"label": "2", "text": "えんげい"},
        {"label": "3", "text": "えんそう"},
        {"label": "4", "text": "えんざん"}
      ],
      "answer": "3",
      "explanation": "演奏（えんそう）表示演奏音乐",
      "difficulty": "medium",
      "tags": ["词汇", "汉字读音"]
    }
  ]
}
```

## 🔄 导入到 Gokaku 数据库

提取完成后，运行转换脚本：
```bash
python scripts/convert_dataflow_to_gokaku.py
```

这会：
1. 读取 `jlpt_output/jlpt_step1.json`
2. 转换为 Gokaku 格式
3. 导入到 `exam_questions` 集合

## 💰 成本估算

### MinerU API
- **定价**: 约 ¥0.01-0.05 / 页
- **总页数**: 约 2000 页（2020-2025 年真题）
- **预估成本**: ¥20-100

### DeepSeek API
- **定价**: ¥0.001 / 1K tokens
- **每题约**: 500 tokens
- **总题数**: 约 1980 题
- **预估成本**: ¥1-2

**总成本**: 约 ¥21-102

## 🐛 故障排查

### 问题 1: DataFlow 安装失败
```bash
# 使用 uv 加速安装
pip install uv
uv pip install open-dataflow
```

### 问题 2: MinerU API 调用失败
- 检查 API Key 是否正确
- 检查网络连接
- 查看 MinerU 配额是否用完

### 问题 3: DeepSeek 提取不准确
- 调整 Prompt（在 `_build_prompt()` 方法中）
- 增加示例（few-shot learning）
- 使用更强的模型（deepseek-reasoner）

## 📚 参考资料

- DataFlow 官方文档: https://OpenDCAI.github.io/DataFlow-Doc/
- MinerU API 文档: https://mineru.net/apiManage/docs
- DeepSeek API 文档: https://platform.deepseek.com/docs

## 🎯 下一步

1. ✅ 申请 MinerU API Key
2. ⏳ 测试提取单个 PDF
3. ⏳ 验证提取质量
4. ⏳ 批量处理所有 PDF
5. ⏳ 导入 Gokaku 数据库
6. ⏳ 部署上线
