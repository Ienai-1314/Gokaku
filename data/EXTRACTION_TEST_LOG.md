# MinerU PDF 提取测试

## 测试信息

**测试时间**: 2026-04-10 15:35
**测试文件**: A 2025年12月N1完整原卷.pdf
**文件路径**: D:\量化n1\资料\A 日语N1\2025年12月N1 完整原卷\
**输出目录**: C:\Users\Garo\gokaku\data\test_output

## 命令

```bash
magic-pdf -p "D:\量化n1\资料\A 日语N1\2025年12月N1 完整原卷\A 2025年12月N1完整原卷.pdf" \
  -o test_output \
  -m auto \
  -l japan
```

## 参数说明

- `-p`: PDF 文件路径
- `-o`: 输出目录
- `-m auto`: 自动选择最佳解析方法（OCR 或文本提取）
- `-l japan`: 指定日语语言以提高 OCR 准确率

## 预期输出

- Markdown 文件（.md）
- 提取的图片（images/）
- 结构化数据（可选）

## 状态

🔄 **处理中** - OCR 识别需要几分钟时间

预计完成时间：2-5 分钟（取决于 PDF 页数）

---

**下一步**:
1. 检查生成的 Markdown 文件
2. 验证日语识别准确率
3. 使用 DeepSeek API 提取题目结构
4. 批量处理所有 PDF
