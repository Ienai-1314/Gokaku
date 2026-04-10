# PDF真题提取完整工作流程

## 当前进度

✅ **已完成：**
- UI改造（导航栏 + 首页入口）
- 依赖安装（baidu-aip, pytesseract, pdf2image）
- 提取脚本准备（百度OCR + Tesseract）
- 数据转换和验证脚本

⏳ **进行中：**
- Tesseract OCR安装

📋 **待完成：**
- PDF提取测试
- 数据解析和清洗
- 答案补充
- 数据库导入

---

## 工作流程

### 阶段1：环境准备（30分钟）

#### 选项A：Tesseract OCR（免费）

```bash
# 1. 安装Tesseract
python scripts/install_tesseract.py

# 2. 验证安装
"C:\Program Files\Tesseract-OCR\tesseract.exe" --version

# 3. 测试提取
python scripts/extract_pdf_simple.py
```

#### 选项B：百度OCR API（推荐）

```bash
# 1. 申请API Key
# 访问：https://cloud.baidu.com/product/ocr
# 获取：APP_ID, API_KEY, SECRET_KEY

# 2. 配置脚本
# 编辑 scripts/extract_with_baidu_ocr.py
# 填入API密钥

# 3. 测试提取
python scripts/extract_with_baidu_ocr.py
```

---

### 阶段2：PDF提取（2-3小时）

#### 单个PDF测试

```bash
# 测试文件
test_pdf = r'D:\量化n1\资料\A 日语N1\2025年12月N1 完整原卷\A 2025年12月N1完整原卷.pdf'

# 使用Tesseract
python scripts/extract_pdf_simple.py

# 或使用百度OCR
python scripts/extract_with_baidu_ocr.py
```

**输出：**
- `output/2025_12_n1_ocr.txt` - 提取的文本

#### 批量提取（185个PDF）

```bash
# 修改脚本，取消注释 batch_extract()
# 然后运行：
python scripts/extract_with_baidu_ocr.py
```

**预计时间：**
- Tesseract: 3-5小时
- 百度OCR: 2-3小时

**预计成本：**
- Tesseract: ¥0
- 百度OCR: ¥5.5

---

### 阶段3：数据解析（1-2小时）

#### 使用DeepSeek API解析

```bash
# 1. 确认API Key已配置
# .env.local 中的 DEEPSEEK_API_KEY

# 2. 解析OCR文本为JSON
python scripts/parse_questions_with_deepseek.py

# 输入：output/2025_12_n1_ocr.txt
# 输出：output/extracted_questions.json
```

**DeepSeek API成本：**
- 约¥10-20（185个PDF）

---

### 阶段4：数据清洗（1小时）

#### 转换为Gokaku格式

```bash
# 1. 转换数据格式
python scripts/convert_to_gokaku_format.py

# 输入：output/extracted_questions.json
# 输出：output/questions_gokaku_format.json
```

#### 验证数据质量

```bash
# 2. 运行验证
python scripts/validate_questions.py

# 输出：output/validation_report.json
```

#### 修复问题数据

```bash
# 3. 根据验证报告修复
# 参考：output/questions_template.json
# 修改：output/questions_gokaku_format.json
```

---

### 阶段5：答案补充（2-3小时）

#### 方法1：OCR提取答案PDF

```bash
# 提取答案PDF
python scripts/extract_answers.py

# 输入：D:\量化n1\资料\A 日语N1\*\C *答案.pdf
# 输出：output/answers.json
```

#### 方法2：手动补充（推荐）

1. 打开答案PDF
2. 参考 `output/questions_template.json`
3. 逐题补充答案到 `output/questions_gokaku_format.json`

**优先级：**
- 词汇题（5题）
- 语法题（5题）
- 听力题（13题）
- 阅读题（26题）

---

### 阶段6：数据库导入（30分钟）

```bash
# 1. 导入题目数据
npx tsx scripts/import-exam-questions.ts

# 2. 验证导入
# 访问：http://localhost:3011/exam
```

---

## 快速开始（推荐路径）

### 路径A：免费方案（Tesseract）

```bash
# 1. 安装Tesseract
python scripts/install_tesseract.py

# 2. 提取2-3套真题测试
python scripts/extract_pdf_simple.py

# 3. 如果效果好，批量提取
# 修改脚本取消注释 batch_extract()

# 4. 解析数据
python scripts/parse_questions_with_deepseek.py

# 5. 转换和验证
python scripts/convert_to_gokaku_format.py
python scripts/validate_questions.py

# 6. 补充答案（手动）

# 7. 导入数据库
npx tsx scripts/import-exam-questions.ts
```

### 路径B：付费方案（百度OCR，推荐）

```bash
# 1. 申请百度OCR API
# https://cloud.baidu.com/product/ocr

# 2. 配置API Key
# 编辑 scripts/extract_with_baidu_ocr.py

# 3. 批量提取所有PDF
python scripts/extract_with_baidu_ocr.py

# 4-7. 同路径A
```

---

## 并行任务（提高效率）

可以同时进行：

1. **修复现有49题数据**
   - 手动修复日语编码
   - 补充答案
   - 先导入这49题

2. **提取新PDF**
   - 使用Tesseract或百度OCR
   - 批量处理185个PDF

3. **申请API Key**
   - 百度OCR（备用）
   - 腾讯云OCR（备用）

---

## 时间和成本总结

| 阶段 | 时间 | 成本 |
|------|------|------|
| 环境准备 | 30分钟 | ¥0 |
| PDF提取 | 2-3小时 | ¥0-5.5 |
| 数据解析 | 1-2小时 | ¥10-20 |
| 数据清洗 | 1小时 | ¥0 |
| 答案补充 | 2-3小时 | ¥0 |
| 数据库导入 | 30分钟 | ¥0 |
| **总计** | **7-10小时** | **¥10-25.5** |

---

## 检查清单

### 环境准备
- [ ] Tesseract OCR已安装（或百度OCR API已配置）
- [ ] Python依赖已安装
- [ ] DeepSeek API Key已配置

### PDF提取
- [ ] 测试单个PDF提取成功
- [ ] 日语识别准确率可接受
- [ ] 批量提取脚本准备就绪

### 数据处理
- [ ] OCR文本已保存
- [ ] DeepSeek解析成功
- [ ] 数据格式转换完成
- [ ] 验证报告已生成

### 答案补充
- [ ] 答案PDF已提取（或准备手动补充）
- [ ] 答案已补充到题目数据
- [ ] 数据验证通过

### 数据库导入
- [ ] 题目数据已导入
- [ ] 网站可以访问真题
- [ ] 刷题功能正常

---

## 相关文件

### 脚本
- `scripts/install_tesseract.py` - Tesseract安装
- `scripts/extract_pdf_simple.py` - Tesseract提取
- `scripts/extract_with_baidu_ocr.py` - 百度OCR提取
- `scripts/parse_questions_with_deepseek.py` - DeepSeek解析
- `scripts/convert_to_gokaku_format.py` - 格式转换
- `scripts/validate_questions.py` - 数据验证
- `scripts/import-exam-questions.ts` - 数据库导入

### 文档
- `docs/PDF提取方案对比.md` - 方案对比
- `docs/Tesseract安装指南.md` - 安装指南
- `docs/百度OCR使用指南.md` - 百度OCR指南

### 数据
- `output/extracted_questions.json` - 原始提取数据
- `output/questions_gokaku_format.json` - Gokaku格式数据
- `output/questions_template.json` - 修复模板
- `output/validation_report.json` - 验证报告

---

## 下一步行动

**立即开始：**
1. 等待Tesseract安装完成
2. 测试提取单个PDF
3. 评估识别效果

**如果效果好：**
- 批量提取所有PDF
- 使用DeepSeek解析

**如果效果不好：**
- 申请百度OCR API
- 切换到百度OCR方案

**并行进行：**
- 修复现有49题数据
- 手动补充答案
