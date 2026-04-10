# Gokaku 项目当前状态报告

## 📊 已完成的工作

### 1. DataFlow 系统
- ✅ **已克隆**: `C:\Users\Garo\DataFlow`
- ✅ **已安装**: open-dataflow Python 包
- ✅ **已创建脚本**: `jlpt_pdf_extract_pipeline.py` (基于 DataFlow 的 PDF2VQA Pipeline)

### 2. MinerU 系统
- ✅ **magic-pdf 已安装**: v1.3.12 (本地 PDF 处理工具)
- ✅ **mineru-kie-sdk 已安装**: v0.1.0 (API 服务客户端)
- ✅ **配置文件**: `C:\Users\Garo\magic-pdf.json`
- ✅ **测试脚本**: `extract_with_mineru_kie.py`

### 3. x-crawl 爬虫工具
- ✅ **已安装**: x-crawl v10.1.0
- ✅ **测试脚本**: `download_with_xcrawl.js`, `crawl_dataflow_docs.js`
- ✅ **用途明确**: 用于自主学习工具使用方法（爬取文档）

### 4. Gokaku 网站功能
- ✅ 真题刷题系统（数据库 + API + 前端）
- ✅ 个性化练习系统
- ✅ 兑换码管理系统
- ✅ 网站运行正常: http://localhost:3011

---

## 🚧 当前卡点

### 核心问题：PDF 真题提取未完成

**问题 1: DataFlow 使用方式不明确**
- 已创建 `jlpt_pdf_extract_pipeline.py` 脚本
- 但脚本依赖 MinerU 本地模型（需要下载 `opendatalab/MinerU2.5-2509-1.2B`）
- **DataFlow 的操作规范**：
  - 基于 `Pipeline → Operator → Prompt` 三层架构
  - 需要定义 Pipeline 类继承 `PipelineABC`
  - 使用 Operator 组合完成数据处理流程
  - 支持 WebUI 可视化构建（`dataflow webui` 命令）

**问题 2: MinerU 模型下载失败**
- 尝试下载 YOLO 模型 (yolo_v8_ft.pt) 失败
- 网络问题导致无法从 Hugging Face、ModelScope 下载
- **备选方案**: 使用 MinerU KIE SDK (API 服务)
  - Pipeline ID: 432397c4-08bb-489e-881b-71e1ace8e821
  - 但 Pipeline 未配置处理步骤（报错: "no steps configured"）

**问题 3: 两套方案未整合**
- **方案 A**: DataFlow + 本地 MinerU (需要模型文件)
- **方案 B**: MinerU KIE SDK (API 服务，需要配置 Pipeline)
- 两套方案都未跑通

---

## 🎯 DataFlow 操作规范

根据 README 和代码分析：

### 1. 核心概念
```
Pipeline (流水线)
  ├── Operator (操作符)
  │     ├── Generation (生成)
  │     ├── Evaluation (评估)
  │     ├── Filtering (过滤)
  │     └── Refinement (精炼)
  └── Prompt (提示词)
```

### 2. 使用流程
```python
# Step 1: 定义 Pipeline
class MyPipeline(PipelineABC):
    def __init__(self, input_path, output_dir):
        super().__init__()
        # 配置存储
        self.storage = FileStorage(...)
        # 配置 LLM
        self.llm_serving = APILLMServing_request(...)
        # 配置 Operators
        self.operator1 = SomeOperator(...)
        self.operator2 = AnotherOperator(...)

# Step 2: 运行 Pipeline
pipeline = MyPipeline(input_path, output_dir)
pipeline.run()
```

### 3. 关键 Operators
- `FileOrURLToMarkdownConverterFlash`: PDF → Markdown (需要 MinerU 模型)
- `ChunkedPromptedGenerator`: 使用 LLM 提取结构化数据
- `MinerU2LLMInputOperator`: 准备 LLM 输入
- `LLMOutputParser`: 解析 LLM 输出

### 4. WebUI 模式
```bash
dataflow webui  # 启动可视化界面
```
可以通过拖拽方式构建 Pipeline，无需写代码。

---

## 🔍 具体卡在哪一步

### 当前状态
1. **DataFlow 已安装** ✅
2. **Pipeline 脚本已创建** ✅ (`jlpt_pdf_extract_pipeline.py`)
3. **MinerU 模型未下载** ❌ (网络问题)
4. **MinerU KIE SDK 已安装** ✅
5. **MinerU KIE Pipeline 未配置** ❌ (需要在 mineru.net 配置)

### 阻塞点
- **无法运行 DataFlow Pipeline**: 因为依赖 MinerU 本地模型
- **无法使用 MinerU KIE SDK**: 因为 Pipeline 未配置处理步骤

---

## 💡 解决方案

### 方案 A: 使用 DataFlow WebUI (推荐)
```bash
cd C:\Users\Garo\DataFlow
dataflow webui
```
通过可视化界面构建 Pipeline，可能不需要本地模型。

### 方案 B: 配置 MinerU KIE Pipeline
1. 访问 https://mineru.net/apiManage/kie-sdk
2. 配置 Pipeline ID: 432397c4-08bb-489e-881b-71e1ace8e821
3. 添加处理步骤: Parse → Split → Extract
4. 运行 `extract_with_mineru_kie.py`

### 方案 C: 手动下载 MinerU 模型
1. 从 Hugging Face 手动下载 yolo_v8_ft.pt
2. 放到 `C:\Users\Garo\.magic-pdf\models\MFD\YOLO\`
3. 运行 DataFlow Pipeline

### 方案 D: 使用百度 OCR (备选)
已准备脚本 `extract_with_baidu_ocr.py`，可以直接使用。

---

## 📝 下一步建议

1. **优先尝试 DataFlow WebUI** (最简单)
2. 如果不行，配置 MinerU KIE Pipeline
3. 如果还不行，使用百度 OCR 备选方案
4. 最后兜底：手动录入 50-100 题先上线

---

## 📂 关键文件位置

- DataFlow 仓库: `C:\Users\Garo\DataFlow`
- Pipeline 脚本: `C:\Users\Garo\gokaku\scripts\jlpt_pdf_extract_pipeline.py`
- MinerU KIE 脚本: `C:\Users\Garo\gokaku\scripts\extract_with_mineru_kie.py`
- 真题 PDF: `D:\量化n1\资料\A 日语N1\`
- Gokaku 项目: `C:\Users\Garo\gokaku` (但主项目在 `d:\量化n1`)
