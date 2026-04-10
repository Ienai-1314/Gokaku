# 🎉 JLPT 真题提取 - 最终方案

## ✅ 准备完成

我已经为你创建了**独立版本**的提取脚本，不依赖复杂的 DataFlow 安装。

---

## 🚀 立即开始（3 步完成）

### 第 1 步：申请 MinerU API Key

1. 访问：https://mineru.net/
2. 注册并获取 API Key
3. 配置到 `.env.local`：

编辑 `C:\Users\Garo\gokaku\.env.local`，添加：
```bash
# MinerU API Key
MINERU_API_KEY=你的_api_key_这里

# DeepSeek API Key (已有)
DEEPSEEK_API_KEY=sk-852d4b17220e4c9c850b1e4c8465e737
```

### 第 2 步：运行提取脚本

```bash
cd C:/Users/Garo/gokaku
python scripts/jlpt_extract_standalone.py
```

### 第 3 步：查看结果

```bash
# 查看提取的题目
cat jlpt_output_standalone/*.json

# 查看 Markdown
cat jlpt_output_standalone/*.md
```

---

## 📊 脚本说明

### 独立版脚本（推荐）⭐

**文件**: `scripts/jlpt_extract_standalone.py`

**特点**:
- ✅ 不依赖 DataFlow
- ✅ 只需要 requests 和 python-dotenv
- ✅ 直接调用 MinerU API 和 DeepSeek API
- ✅ 代码简单易懂

**工作流程**:
```
PDF → MinerU API → Markdown → DeepSeek API → JSON
```

### DataFlow 版脚本（备用）

**文件**: `scripts/jlpt_extract_simple.py`

**特点**:
- 使用 DataFlow 框架
- 功能更强大
- 依赖安装复杂

---

## 💰 成本估算

| 服务 | 单价 | 用量 | 总计 |
|------|------|------|------|
| MinerU API | ¥0.01-0.05/页 | 2000 页 | ¥20-100 |
| DeepSeek API | ¥0.001/1K tokens | 990K tokens | ¥1-2 |
| **总计** | | | **¥21-102** |

---

## 📁 输出文件

```
jlpt_output_standalone/
├── 2025年12月N1完整原卷.md      # Markdown 文本
├── 2025年12月N1完整原卷.json    # 提取的题目
├── 2024年12月N1完整原卷.md
├── 2024年12月N1完整原卷.json
└── ...
```

### JSON 格式示例

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

---

## 🔄 批量处理

修改 `jlpt_extract_standalone.py` 第 165 行：

```python
# 从这个（测试模式）：
test_pdf = pdf_files[0]

# 改为这个（批量模式）：
for pdf_file in pdf_files:
    extractor.process_pdf(pdf_file, OUTPUT_DIR)
```

---

## 📥 导入数据库

提取完成后，运行：

```bash
python scripts/convert_dataflow_to_gokaku.py
```

这会将所有 JSON 文件转换为 Gokaku 格式并导入数据库。

---

## 🐛 故障排查

### 问题 1: MinerU API 调用失败

```bash
# 检查 API Key
cat .env.local | grep MINERU

# 测试 API
curl -H "Authorization: Bearer YOUR_API_KEY" https://api.mineru.net/v1/status
```

### 问题 2: DeepSeek 提取不准确

编辑 `jlpt_extract_standalone.py` 的 `_build_prompt()` 方法，添加示例题目。

### 问题 3: PDF 文件未找到

```bash
# 检查 PDF 目录
ls "D:\量化n1\资料\A 日语N1"

# 修改脚本中的 PDF_DIR 路径
```

---

## 📚 所有文档

| 文档 | 说明 |
|------|------|
| [START_HERE.md](START_HERE.md) | **本文件 - 从这里开始** ⭐ |
| [READY_TO_START.md](READY_TO_START.md) | 快速开始指南 |
| [QUICKSTART.md](QUICKSTART.md) | 快速启动清单 |
| [docs/JLPT_EXTRACTION_GUIDE.md](docs/JLPT_EXTRACTION_GUIDE.md) | 完整使用指南 |
| [docs/PROJECT_COMPLETE_SUMMARY.md](docs/PROJECT_COMPLETE_SUMMARY.md) | 项目总结 |
| [docs/BACKUP_PLAN.md](docs/BACKUP_PLAN.md) | 备用方案 |

---

## 🎯 下一步

1. **现在**: 申请 MinerU API Key
2. **今天**: 测试提取单个 PDF
3. **本周**: 批量处理所有 PDF
4. **下周**: 部署上线 Gokaku

---

## 📞 需要帮助？

告诉我：
1. 具体的错误信息
2. 你执行的命令
3. 相关的日志输出

---

**创建时间**: 2026-04-10 14:35
**状态**: ✅ 独立版脚本已就绪
**下一步**: 申请 MinerU API Key 并运行 `jlpt_extract_standalone.py`

🚀 **准备好了就开始吧！**
