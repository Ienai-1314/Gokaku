# MinerU 本地部署使用指南

## 安装状态

✅ 正在安装 magic-pdf[full]
- 包含完整的 OCR 和 PDF 处理功能
- 依赖较多，预计需要 5-10 分钟

## 使用流程

### 步骤 1：提取 PDF 为 Markdown

```bash
cd C:\Users\Garo\gokaku
python scripts\extract_with_mineru.py
```

这会：
- 扫描 `D:\量化n1\资料\A 日语N1` 目录
- 使用 MinerU 提取第一个 PDF（测试）
- 输出 Markdown 到 `C:\Users\Garo\gokaku\data\mineru_output`

### 步骤 2：转换为 Gokaku 格式

```bash
python scripts\mineru_to_gokaku.py
```

这会：
- 读取 MinerU 生成的 Markdown
- 使用 DeepSeek API 提取题目结构
- 保存 JSON 到 `C:\Users\Garo\gokaku\data\extracted_questions.json`

### 步骤 3：导入数据库

```bash
tsx scripts/import-exam-questions.ts
```

## MinerU 命令行用法

### 基础用法
```bash
magic-pdf -p "PDF文件路径" -o "输出目录"
```

### 自动模式（推荐）
```bash
magic-pdf -p "真题.pdf" -o output -m auto
```

### OCR 模式（扫描版 PDF）
```bash
magic-pdf -p "真题.pdf" -o output -m ocr
```

### 批量处理
```bash
magic-pdf -p "PDF目录" -o output -m auto
```

## 输出格式

MinerU 会生成：
- `*.md` - Markdown 格式文本
- `images/` - 提取的图片
- `*.json` - 结构化数据（可选）

## 预估成本

- MinerU：免费（本地运行）
- DeepSeek API：约 ¥0.01-0.05/题
- 总计（1980题）：约 ¥20-100

## 故障排除

### 问题 1：安装失败
```bash
# 使用国内镜像
pip install magic-pdf[full] -i https://pypi.tuna.tsinghua.edu.cn/simple
```

### 问题 2：OCR 识别不准确
- 尝试调整 DPI：`-dpi 300`
- 使用 OCR 模式：`-m ocr`

### 问题 3：内存不足
- 单个处理：一次处理一个 PDF
- 减少并发：不要批量处理

## 下一步

等待安装完成后：
1. 运行 `extract_with_mineru.py` 测试
2. 检查输出质量
3. 批量处理所有 PDF
4. 导入数据库

---

**更新时间**: 2026-04-10 15:00
**状态**: 安装中
