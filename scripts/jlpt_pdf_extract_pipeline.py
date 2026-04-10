"""
JLPT N1 真题 PDF 提取流水线
基于 DataFlow 的 PDF2VQA Pipeline 改造
"""

from dataflow.operators.knowledge_cleaning import FileOrURLToMarkdownConverterFlash
from dataflow.serving import APILLMServing_request
from dataflow.utils.storage import FileStorage
from dataflow.operators.pdf2vqa import MinerU2LLMInputOperator, LLMOutputParser
from dataflow.operators.core_text import ChunkedPromptedGenerator
from dataflow.pipeline import PipelineABC
import json
import os

class JLPTQuestionExtractPipeline(PipelineABC):
    """JLPT N1 真题提取流水线"""

    def __init__(self, input_jsonl_path: str, output_dir: str = "./jlpt_output"):
        super().__init__()

        # 创建输出目录
        os.makedirs(output_dir, exist_ok=True)
        os.makedirs(f"{output_dir}/cache", exist_ok=True)
        os.makedirs(f"{output_dir}/intermediate", exist_ok=True)

        # 文件存储配置
        self.storage = FileStorage(
            first_entry_file_name=input_jsonl_path,
            cache_path=f"{output_dir}/cache",
            file_name_prefix="jlpt",
            cache_type="jsonl",
        )

        # LLM 服务配置 - 使用 DeepSeek API
        self.llm_serving = APILLMServing_request(
            api_url="https://api.deepseek.com/v1/chat/completions",
            key_name_of_api_key="DEEPSEEK_API_KEY",
            model_name="deepseek-chat",
            max_workers=5,  # 控制并发数
        )

        # JLPT 题目提取 Prompt
        self.jlpt_extract_prompt = self._build_jlpt_prompt()

        # MinerU PDF 转 Markdown（需要本地模型）
        # 注意：这需要下载 MinerU 模型，如果没有可以使用 API 版本
        self.mineru_executor = FileOrURLToMarkdownConverterFlash(
            intermediate_dir=f"{output_dir}/intermediate",
            mineru_model_path="opendatalab/MinerU2.5-2509-1.2B",  # 需要下载
            batch_size=2,
            replicas=1,
            num_gpus_per_replica=0,  # CPU 模式
        )

        # 格式化 MinerU 输出
        self.input_formatter = MinerU2LLMInputOperator()

        # LLM 提取器
        self.question_extractor = ChunkedPromptedGenerator(
            llm_serving=self.llm_serving,
            system_prompt=self.jlpt_extract_prompt,
            max_chunk_len=100000,  # DeepSeek 支持长上下文
        )

        # 输出解析器
        self.output_parser = LLMOutputParser(
            output_dir=f"{output_dir}/parsed",
            intermediate_dir=f"{output_dir}/intermediate"
        )

        self.output_dir = output_dir

    def _build_jlpt_prompt(self) -> str:
        """构建 JLPT 题目提取 Prompt"""
        return """你是一个专业的日语能力考试（JLPT N1）题目提取专家。

你的任务是从 PDF 扫描版真题中提取结构化的题目数据。

**输入格式：**
- PDF 转换后的 Markdown 文本（包含 OCR 识别的日语文本）
- 可能包含图片、表格、选项等

**输出格式（JSON）：**
```json
{
  "questions": [
    {
      "question_number": 1,
      "section": "言語知識（文字・語彙）",
      "question_type": "vocabulary",
      "question_text": "題目正文（日语）",
      "options": [
        {"label": "1", "text": "選項1"},
        {"label": "2", "text": "選項2"},
        {"label": "3", "text": "選項3"},
        {"label": "4", "text": "選項4"}
      ],
      "correct_answer": "1",
      "explanation": "解析说明（如果有）",
      "difficulty": "medium",
      "tags": ["词汇", "汉字读音"]
    }
  ]
}
```

**题型分类：**
1. vocabulary - 词汇题
2. grammar - 语法题
3. reading - 阅读理解
4. listening - 听力题（如果有音频标记）

**难度等级：**
- easy - 简单
- medium - 中等
- hard - 困难

**注意事项：**
1. 准确识别题号和选项
2. 保留原始日语文本，不要翻译
3. 如果有下划线或空格，用 _____ 表示
4. 如果无法确定某个字段，使用 null
5. 每道题必须包含 question_number, section, question_type, question_text, options
6. 严格按照 JSON 格式输出，不要添加额外的文字说明

开始提取题目：
"""

    def forward(self):
        """执行流水线"""
        print("🚀 开始 JLPT 真题提取流水线...")

        # Step 1: PDF 转 Markdown
        print("📄 Step 1: 转换 PDF 为 Markdown...")
        self.mineru_executor.run(
            storage=self.storage.step(),
            input_key="pdf_path",
            output_key="markdown_path",
        )

        # Step 2: 格式化 Markdown
        print("🔧 Step 2: 格式化 Markdown...")
        self.input_formatter.run(
            storage=self.storage.step(),
            input_markdown_path_key="markdown_path",
            output_converted_layout_key="formatted_layout_path",
        )

        # Step 3: LLM 提取题目
        print("🤖 Step 3: 使用 LLM 提取题目...")
        self.question_extractor.run(
            storage=self.storage.step(),
            input_path_key="formatted_layout_path",
            output_path_key="extracted_questions_path",
        )

        # Step 4: 解析输出
        print("📊 Step 4: 解析 LLM 输出...")
        self.output_parser.run(
            storage=self.storage.step(),
            input_response_path_key="extracted_questions_path",
            input_converted_layout_path_key="formatted_layout_path",
            input_name_key="exam_name",
            output_qalist_path_key="final_questions_path",
        )

        print(f"✅ 提取完成！结果保存在: {self.output_dir}")


def create_input_jsonl(pdf_dir: str, output_jsonl: str):
    """
    创建输入 JSONL 文件

    Args:
        pdf_dir: PDF 文件目录
        output_jsonl: 输出 JSONL 文件路径
    """
    import glob

    pdf_files = glob.glob(f"{pdf_dir}/**/*.pdf", recursive=True)

    with open(output_jsonl, 'w', encoding='utf-8') as f:
        for pdf_path in pdf_files:
            # 从文件名提取考试信息
            filename = os.path.basename(pdf_path)
            # 例如: "2025年12月N1完整原卷.pdf"
            exam_name = filename.replace('.pdf', '')

            entry = {
                "pdf_path": pdf_path,
                "exam_name": exam_name,
                "level": "N1"
            }
            f.write(json.dumps(entry, ensure_ascii=False) + '\n')

    print(f"✅ 创建输入文件: {output_jsonl}")
    print(f"📝 找到 {len(pdf_files)} 个 PDF 文件")


if __name__ == "__main__":
    import sys

    # 配置路径
    PDF_DIR = r"D:\量化n1\资料\A 日语N1"
    INPUT_JSONL = r"C:\Users\Garo\gokaku\jlpt_input.jsonl"
    OUTPUT_DIR = r"C:\Users\Garo\gokaku\jlpt_output"

    # 创建输入文件
    print("📋 创建输入配置文件...")
    create_input_jsonl(PDF_DIR, INPUT_JSONL)

    # 运行流水线
    print("\n🚀 启动提取流水线...")
    pipeline = JLPTQuestionExtractPipeline(
        input_jsonl_path=INPUT_JSONL,
        output_dir=OUTPUT_DIR
    )

    try:
        pipeline.compile()
        pipeline.forward()
        print("\n🎉 所有题目提取完成！")
    except Exception as e:
        print(f"\n❌ 提取失败: {e}")
        import traceback
        traceback.print_exc()
