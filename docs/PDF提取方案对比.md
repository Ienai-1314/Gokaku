# PDF真题提取方案对比

## 当前状态

- 已有49道题目数据（来自DataFlow + MinerU API）
- 存在问题：日语编码错误、答案缺失
- 需要处理：185个PDF文件，约1980道题目

## 方案对比

### 方案A：百度OCR API（推荐）⭐

**优点：**
- 日语识别准确率高（专门优化）
- 价格便宜（¥0.002/次，每月免费1000次）
- API稳定，国内访问快
- Python SDK支持好

**缺点：**
- 需要申请API Key
- 需要实名认证

**成本估算：**
- 185个PDF × 15页/PDF × ¥0.002 = **约¥5.5**
- 免费额度可处理50-100个PDF

**申请步骤：**
1. 访问：https://cloud.baidu.com/product/ocr
2. 注册并实名认证
3. 创建应用获取 APP_ID, API_KEY, SECRET_KEY
4. 配置到脚本：`scripts/extract_with_baidu_ocr.py`

**使用方法：**
```bash
python scripts/extract_with_baidu_ocr.py
```

---

### 方案B：Tesseract OCR（免费开源）

**优点：**
- 完全免费
- 开源，无需API Key
- 支持日语识别

**缺点：**
- 识别准确率较低（特别是扫描版PDF）
- 需要本地安装软件
- 处理速度较慢

**安装步骤：**
1. 下载安装程序：https://github.com/UB-Mannheim/tesseract/wiki
2. 安装时选择日语语言包（jpn.traineddata）
3. 安装依赖：`pip install pytesseract`

**使用方法：**
```bash
python scripts/extract_pdf_simple.py
```

---

### 方案C：MinerU API（已测试）

**优点：**
- 识别准确率高
- 已经跑通流程

**缺点：**
- 需要OpenXLab账号
- API调用有配额限制
- 之前提取的数据有编码问题

**状态：**
- 已成功提取5个PDF
- 已有49道题目数据（需修复编码）

---

### 方案D：手动修复（适合小批量）

**优点：**
- 准确率100%
- 无需额外成本

**缺点：**
- 耗时长（49题预计2-3小时）
- 不适合大批量处理

**适用场景：**
- 修复现有49题数据
- 补充答案（从答案PDF）

---

## 推荐方案

### 短期方案（立即可用）

1. **修复现有49题数据**（手动）
   - 打开原始PDF和答案PDF
   - 参考 `output/questions_template.json`
   - 修复 `output/questions_gokaku_format.json`
   - 优先修复词汇和语法题（10题）

2. **使用Tesseract OCR提取新PDF**（免费）
   - 安装Tesseract
   - 提取2-3套真题测试效果
   - 如果效果不好，再考虑百度OCR

### 长期方案（最佳效果）

1. **申请百度OCR API**
   - 成本低（约¥5.5）
   - 识别准确率高
   - 适合批量处理185个PDF

2. **使用DeepSeek API解析**
   - 已配置好API Key
   - 将OCR文本转为结构化JSON
   - 成本约¥10-20

3. **补充答案**
   - 从答案PDF提取答案
   - 使用OCR或手动补充

---

## 下一步行动

### 立即开始（无需等待）

```bash
# 1. 安装Tesseract OCR
# 下载：https://github.com/UB-Mannheim/tesseract/wiki

# 2. 安装Python依赖
pip install pytesseract

# 3. 测试提取
python scripts/extract_pdf_simple.py

# 4. 如果效果好，批量提取
# 修改脚本取消注释 batch_extract()
```

### 并行进行（提高效率）

1. **修复现有49题**
   - 手动修复日语编码
   - 补充答案
   - 导入数据库

2. **申请百度OCR**
   - 注册百度智能云
   - 创建应用
   - 获取API Key

3. **测试Tesseract**
   - 提取2-3套真题
   - 对比识别效果
   - 决定最终方案

---

## 时间和成本估算

| 方案 | 时间 | 成本 | 准确率 |
|------|------|------|--------|
| 手动修复49题 | 2-3小时 | ¥0 | 100% |
| Tesseract OCR | 3-5小时 | ¥0 | 70-80% |
| 百度OCR API | 2-3小时 | ¥5.5 | 95%+ |
| MinerU API | 2-3小时 | ¥20-50 | 90%+ |

**推荐组合：**
- 手动修复49题（立即可用）
- Tesseract提取新题（免费测试）
- 如效果不好，切换百度OCR（成本低）

---

## 相关文件

- 百度OCR脚本：`scripts/extract_with_baidu_ocr.py`
- Tesseract脚本：`scripts/extract_pdf_simple.py`
- 百度OCR指南：`docs/百度OCR使用指南.md`
- 数据转换脚本：`scripts/convert_to_gokaku_format.py`
- 数据验证脚本：`scripts/validate_questions.py`
- 现有数据：`output/questions_gokaku_format.json`
- 修复模板：`output/questions_template.json`
