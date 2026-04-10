# MinerU 模型手动下载指南

## 需要下载的模型文件

MinerU 需要以下模型文件才能运行：

### 方案 1：从 Hugging Face 下载（推荐）

访问：https://huggingface.co/opendatalab/PDF-Extract-Kit

下载以下文件到 `C:\Users\Garo\.magic-pdf\models\` 目录：

```
C:\Users\Garo\.magic-pdf\models\
├── MFD/
│   └── YOLO/
│       └── yolo_v8_ft.pt (约 6MB)
├── Layout/
│   └── layoutlmv3/
│       └── model files
├── OCR/
│   └── paddleocr/
│       └── model files
└── Formula/
    └── model files
```

### 方案 2：从 ModelScope 下载（国内镜像）

访问：https://modelscope.cn/models/opendatalab/PDF-Extract-Kit

### 方案 3：百度网盘分享（如果上述都失败）

我可以帮你生成一个简化版的配置，只下载必需的核心模型。

## 下载步骤

1. 创建目录结构：
```bash
mkdir -p "C:\Users\Garo\.magic-pdf\models\MFD\YOLO"
```

2. 下载核心模型文件：
   - yolo_v8_ft.pt (必需，用于版面检测)
   - PaddleOCR 模型 (必需，用于日语 OCR)

3. 下载链接：

**YOLO 模型：**
https://huggingface.co/opendatalab/PDF-Extract-Kit/resolve/main/models/MFD/YOLO/yolo_v8_ft.pt

**PaddleOCR 日语模型：**
https://paddleocr.bj.bcebos.com/PP-OCRv3/multilingual/japan_PP-OCRv3_det_infer.tar
https://paddleocr.bj.bcebos.com/PP-OCRv3/multilingual/japan_PP-OCRv3_rec_infer.tar

## 快速下载命令

在浏览器中打开以下链接，手动下载：

1. YOLO 模型 (6MB)：
   https://huggingface.co/opendatalab/PDF-Extract-Kit/resolve/main/models/MFD/YOLO/yolo_v8_ft.pt
   
   保存到：`C:\Users\Garo\.magic-pdf\models\MFD\YOLO\yolo_v8_ft.pt`

2. 如果 Hugging Face 无法访问，使用镜像站：
   https://hf-mirror.com/opendatalab/PDF-Extract-Kit/resolve/main/models/MFD/YOLO/yolo_v8_ft.pt

## 验证安装

下载完成后，运行以下命令验证：

```bash
ls -lh "C:\Users\Garo\.magic-pdf\models\MFD\YOLO\yolo_v8_ft.pt"
```

应该看到文件大小约 6MB。

## 下载完成后

告诉我"模型已下载"，我会重新运行 PDF 提取命令。
