# 百度OCR使用指南

## 为什么选择百度OCR？

1. **日语识别准确率高** - 专门优化过日语OCR
2. **价格便宜** - 每月免费1000次调用，付费也很便宜（¥0.002/次）
3. **API稳定** - 国内访问速度快，无需翻墙
4. **简单易用** - Python SDK支持良好

## 申请步骤

### 1. 注册百度智能云账号

访问：https://cloud.baidu.com/

### 2. 开通文字识别服务

1. 进入控制台：https://console.bce.baidu.com/ai/#/ai/ocr/overview/index
2. 点击"立即使用"
3. 创建应用

### 3. 获取API密钥

在应用管理页面可以看到：
- APP_ID
- API_KEY  
- SECRET_KEY

### 4. 配置到脚本

编辑 `scripts/extract_with_baidu_ocr.py`，填入密钥：

```python
APP_ID = '你的APP_ID'
API_KEY = '你的API_KEY'
SECRET_KEY = '你的SECRET_KEY'
```

## 安装依赖

```bash
pip install baidu-aip PyPDF2 Pillow pdf2image
```

**Windows额外步骤：** 需要安装 poppler

1. 下载：https://github.com/oschwartz10612/poppler-windows/releases/
2. 解压到 `C:\Program Files\poppler`
3. 添加到环境变量 PATH：`C:\Program Files\poppler\Library\bin`

## 使用方法

### 提取单个PDF

```bash
cd C:\Users\Garo\gokaku
python scripts/extract_with_baidu_ocr.py
```

默认会提取：
- 输入：`D:\量化n1\资料\A 日语N1\2025年12月N1 完整原卷\A 2025年12月N1完整原卷.pdf`
- 输出：`C:\Users\Garo\gokaku\output\2025_12_n1_ocr.txt`

### 批量提取所有PDF

修改脚本底部，取消注释：

```python
batch_extract_pdfs(
    r'D:\量化n1\资料\A 日语N1',
    r'C:\Users\Garo\gokaku\output\ocr_texts'
)
```

## 成本估算

### 免费额度
- 每月1000次免费调用
- 每个PDF约10-20页 = 10-20次调用
- 免费额度可处理 50-100个PDF

### 付费价格
- 通用文字识别（高精度）：¥0.002/次
- 185个PDF × 15页/PDF × ¥0.002 = **约¥5.5**

## 完整流程

```
1. 百度OCR提取PDF → TXT文件（日语正确）
2. DeepSeek API解析TXT → 结构化JSON
3. 手动补充答案（从答案PDF）
4. 导入数据库
```

## 备选方案

如果百度OCR效果不理想，可以尝试：

1. **腾讯云OCR** - https://cloud.tencent.com/product/ocr
2. **阿里云OCR** - https://www.aliyun.com/product/ocr
3. **Google Cloud Vision API** - 需要翻墙，但识别效果最好

## 下一步

配置好百度OCR后，运行：

```bash
python scripts/extract_with_baidu_ocr.py
```

提取完成后，使用DeepSeek解析：

```bash
python scripts/parse_questions_with_deepseek.py
```
