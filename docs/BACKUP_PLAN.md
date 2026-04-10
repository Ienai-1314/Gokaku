# 备用方案：不使用 DataFlow 的 PDF 提取方案

如果 DataFlow 安装遇到问题，可以使用以下备用方案：

## 方案 A：使用百度 OCR API（推荐）

### 优势
- ✅ 支持日语识别
- ✅ 准确率高
- ✅ API 简单易用
- ✅ 成本低（约 ¥50-100）

### 实施步骤

1. **申请百度 OCR API**
   - 访问：https://cloud.baidu.com/product/ocr
   - 注册并创建应用
   - 获取 APP_ID, API_KEY, SECRET_KEY

2. **安装 SDK**
   ```bash
   pip install baidu-aip
   ```

3. **使用脚本**
   ```python
   from aip import AipOcr
   from pdf2image import convert_from_path
   
   # 初始化
   client = AipOcr(APP_ID, API_KEY, SECRET_KEY)
   
   # PDF 转图片
   images = convert_from_path('真题.pdf')
   
   # OCR 识别
   for img in images:
       result = client.basicGeneral(img)
       text = '\n'.join([w['words'] for w in result['words_result']])
       
       # 使用 DeepSeek 提取题目
       questions = extract_questions(text)
   ```

---

## 方案 B：使用 Tesseract OCR（免费）

### 优势
- ✅ 完全免费
- ✅ 开源
- ✅ 支持日语

### 实施步骤

1. **安装 Tesseract**
   - Windows: 下载 https://github.com/UB-Mannheim/tesseract/wiki
   - 安装日语语言包

2. **安装 Python 库**
   ```bash
   pip install pytesseract pdf2image pillow
   ```

3. **使用脚本**
   ```python
   import pytesseract
   from pdf2image import convert_from_path
   
   # 配置 Tesseract 路径
   pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
   
   # PDF 转图片
   images = convert_from_path('真题.pdf')
   
   # OCR 识别（日语）
   for img in images:
       text = pytesseract.image_to_string(img, lang='jpn')
       
       # 使用 DeepSeek 提取题目
       questions = extract_questions(text)
   ```

---

## 方案 C：手动标注（最后手段）

如果 OCR 效果不好，可以：

1. 雇佣兼职人员手动录入题目
2. 使用众包平台（如猪八戒、威客）
3. 预算：约 ¥0.5-1 / 题 × 1980 题 = ¥990-1980

---

## 推荐顺序

1. **优先尝试 DataFlow**（如果安装成功）
2. **备用方案 A**：百度 OCR（最实用）
3. **备用方案 B**：Tesseract（免费但准确率较低）
4. **最后手段**：手动标注

---

## 当前状态

- DataFlow 正在安装中（遇到网络超时）
- 如果安装失败，建议使用百度 OCR API

---

**更新时间**: 2026-04-10 14:15
