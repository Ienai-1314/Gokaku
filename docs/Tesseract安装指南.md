# Tesseract OCR 安装指南

## 快速安装（推荐）

### 方法1：自动安装脚本

```bash
cd C:\Users\Garo\gokaku
python scripts/install_tesseract.py
```

脚本会自动：
1. 下载Tesseract安装程序
2. 启动安装向导
3. 验证安装

### 方法2：手动下载安装

1. **下载安装程序**
   - 访问：https://github.com/UB-Mannheim/tesseract/wiki
   - 下载最新版本（推荐 5.3.x）
   - 直接下载链接：https://digi.bib.uni-mannheim.de/tesseract/

2. **安装步骤**
   - 运行下载的 `.exe` 文件
   - 安装路径：`C:\Program Files\Tesseract-OCR`
   - **重要**：勾选 "Additional language data (download)"
   - **重要**：勾选 "Japanese (jpn.traineddata)"

3. **验证安装**
   ```bash
   "C:\Program Files\Tesseract-OCR\tesseract.exe" --version
   ```

### 方法3：使用Chocolatey（需要管理员权限）

```bash
choco install tesseract
```

## 配置Python脚本

安装完成后，确认路径：
```python
TESSERACT_PATH = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
```

## 测试OCR

```bash
cd C:\Users\Garo\gokaku
python scripts/extract_pdf_simple.py
```

## 常见问题

### 1. 找不到tesseract命令

**解决方法：**
- 检查安装路径是否正确
- 修改脚本中的 `TESSERACT_PATH`

### 2. 日语识别效果差

**解决方法：**
- 确认已安装日语语言包（jpn.traineddata）
- 检查语言包位置：`C:\Program Files\Tesseract-OCR\tessdata\jpn.traineddata`
- 如果缺失，手动下载：https://github.com/tesseract-ocr/tessdata

### 3. PDF转图片失败

**解决方法：**
- 安装 poppler：https://github.com/oschwartz10612/poppler-windows/releases/
- 解压到 `C:\Program Files\poppler`
- 添加到PATH：`C:\Program Files\poppler\Library\bin`

## 下一步

安装完成后，运行PDF提取：

```bash
# 测试单个PDF
python scripts/extract_pdf_simple.py

# 批量提取（修改脚本取消注释）
# batch_extract(
#     r'D:\量化n1\资料\A 日语N1',
#     r'C:\Users\Garo\gokaku\output\ocr_texts'
# )
```

## 备选方案

如果Tesseract效果不理想，可以切换到：
- **百度OCR API**（推荐，成本约¥5.5）
- **腾讯云OCR**
- **阿里云OCR**

参考：`docs/PDF提取方案对比.md`
