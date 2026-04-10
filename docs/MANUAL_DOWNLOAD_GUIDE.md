# MinerU 模型手动下载指南

## 问题
所有自动下载方案都遇到网络问题：
- Hugging Face 官方：连接超时
- HF 镜像站：返回错误
- ModelScope：连接失败

## 解决方案：手动下载

### 方法 1：使用浏览器下载

1. 打开以下任一链接（选择能访问的）：
   - **Hugging Face**: https://huggingface.co/wanderkid/PDF-Extract-Kit/tree/main/models/Layout/YOLO
   - **HF 镜像**: https://hf-mirror.com/wanderkid/PDF-Extract-Kit/tree/main/models/Layout/YOLO
   - **ModelScope**: https://www.modelscope.cn/models/wanderkid/PDF-Extract-Kit/files

2. 找到并下载 `yolo_v8_ft.pt` 文件（约 6MB）

3. 将文件放到这个目录：
   ```
   C:\Users\Garo\.magic-pdf\models\MFD\YOLO\yolo_v8_ft.pt
   ```

### 方法 2：使用下载工具

如果浏览器也无法访问，可以尝试：
- 使用 VPN 或代理
- 使用迅雷等下载工具
- 使用 IDM (Internet Download Manager)

### 方法 3：备用方案 - 百度 OCR

如果实在无法下载模型，我已经准备了百度 OCR 方案：
```bash
python scripts/extract_with_baidu_ocr.py
```

需要申请百度 OCR API Key（免费额度：每天 500 次）

## 下载完成后

运行以下命令测试：
```bash
python scripts/extract_with_mineru.py
```

## 当前状态

- ❌ Hugging Face 官方：连接超时
- ❌ HF 镜像站：返回错误
- ❌ ModelScope：连接失败
- ✅ 手动下载：推荐方案
- ✅ 百度 OCR：备用方案
