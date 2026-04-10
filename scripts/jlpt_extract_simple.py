"""
JLPT N1 真题提取流水线 - 简化版
使用 MinerU API + DeepSeek API，无需本地模型
"""

from dataflow.operators.knowledge_cleaning import FileOrURLToMarkdownConverterAPI
from dataflow.serving import APILLMServing_request
from dataflow.utils.storage import FileStorage
from dataflow.operators.core_text import PromptedGenerator
import json
import os
import glob

class JLPTExtractSimplePipeline:
    """JLPT 真题提取流水线 - 使用 API 服务"""

    def __init__(self, input_jsonl_path: str, output_dir: str = "./jlpt_output"):
        # 创建输出目录
        os.makedirs(output_dir, exist_ok=True)
        os.makedirs(f"{output_dir}/intermediate", exist_ok=True)

        # 文件存储
        self.storage = FileStorage(
            first_entry_file_name=input_jsonl_path,
            cache_path=f"{output_dir}/cache",
            file_name_prefix="jlpt",
            cache_type="json",
        )

        # DeepSeek LLM 服务
        self.llm_serving = APILLMServing_request(
            api_url="https://api.deepseek.com/v1/chat/completions",
            key_name_of_api_key="DEEPSEEK_API_KEY",
            model_name="deepseek-chat",
            max_workers=3,
        )

        # Step 1: PDF 转 Markdown (使用 MinerU API)
        self.pdf_converter = FileOrURLToMarkdownConverterAPI(
            intermediate_dir=f"{output_dir}/intermediate",
            mineru_backend="vlm",  # 使用视觉语言模型
            api_key=None  # 从环境变量 MINERU_API_KEY 读取
        )

        # Step 2: 提取题目 (使用 DeepSeek)
        self.question_extractor = PromptedGenerator(
            llm_serving=self.llm_serving,
            system_prompt=self._build_prompt()
        )

        self.output_dir = output_dir

    def _build_prompt(self) -> str:
        """构建题目提取 Prompt"""
        return """你是 JLPT N1 真题提取专家。从 Markdown 文本中提取题目。

**输出 JSON 格式：**
```json
{
  "questions": [
    {
      "number": 1,
      "section": "言語知識（文字・語彙）",
      "type": "vocabulary",
      "text": "題目正文",
      "options": [
        {"label": "1", "text": "選項1"},
        {"label": "2", "text": "選項2"},
        {"label": "3", "text": "選項3"},
        {"label": "4", "text": "選項4"}
      ],
      "answer": "1",
      "explanation": "解析",
      "difficulty": "medium",
      "tags": ["词汇"]
    }
  ]
}
```

**题型：** vocabulary, grammar, reading, listening
**难度：** easy, medium, hard

严格按 JSON 格式输出，不要添加其他文字。
"""

    def forward(self):
        """执行流水线"""
        print("🚀 开始 JLPT 真题提取...")

        # Step 1: PDF → Markdown
        print("\n📄 Step 1: 转换 PDF 为 Markdown (使用 MinerU API)...")
        self.pdf_converter.run(
            storage=self.storage.step(),
            input_key="pdf_path",
            output_key="markdown_path"
        )

        # Step 2: Markdown → 结构化题目
        print("\n🤖 Step 2: 提取题目 (使用 DeepSeek API)...")
        self.question_extractor.run(
            storage=self.storage.step(),
            input_key="markdown_path",
            output_key="questions_json"
        )

        print(f"\n✅ 提取完成！结果保存在: {self.output_dir}")


def create_input_jsonl(pdf_files: list, output_jsonl: str):
    """创建输入 JSONL"""
    with open(output_jsonl, 'w', encoding='utf-8') as f:
        for pdf_path in pdf_files:
            filename = os.path.basename(pdf_path)
            exam_name = filename.replace('.pdf', '')

            entry = {
                "pdf_path": pdf_path,
                "exam_name": exam_name,
                "level": "N1"
            }
            f.write(json.dumps(entry, ensure_ascii=False) + '\n')

    print(f"✅ 创建输入文件: {output_jsonl}")
    print(f"📝 包含 {len(pdf_files)} 个 PDF")


if __name__ == "__main__":
    # 配置
    PDF_DIR = r"D:\量化n1\资料\A 日语N1"
    INPUT_JSONL = r"C:\Users\Garo\gokaku\jlpt_input.jsonl"
    OUTPUT_DIR = r"C:\Users\Garo\gokaku\jlpt_output"

    # 查找所有 PDF
    print("🔍 查找 PDF 文件...")
    pdf_files = glob.glob(f"{PDF_DIR}/**/*.pdf", recursive=True)
    print(f"找到 {len(pdf_files)} 个 PDF 文件")

    if not pdf_files:
        print("❌ 未找到 PDF 文件！")
        exit(1)

    # 先测试一个 PDF
    print("\n📋 测试模式：只处理第一个 PDF")
    test_pdf = [pdf_files[0]]
    print(f"测试文件: {test_pdf[0]}")

    # 创建输入
    create_input_jsonl(test_pdf, INPUT_JSONL)

    # 运行流水线
    print("\n" + "="*60)
    pipeline = JLPTExtractSimplePipeline(
        input_jsonl_path=INPUT_JSONL,
        output_dir=OUTPUT_DIR
    )

    try:
        pipeline.forward()
        print("\n🎉 测试成功！")
        print(f"\n💡 如需处理所有 PDF，修改代码中的 test_pdf = pdf_files")
    except Exception as e:
        print(f"\n❌ 提取失败: {e}")
        import traceback
        traceback.print_exc()
