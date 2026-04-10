"""
JLPT 真题提取 - 独立版本（不依赖 DataFlow）
直接使用 MinerU API + DeepSeek API
"""

import requests
import json
import os
import glob
from pathlib import Path

class JLPTExtractor:
    """JLPT 真题提取器 - 独立版本"""

    def __init__(self, mineru_api_key: str, deepseek_api_key: str):
        self.mineru_api_key = mineru_api_key
        self.deepseek_api_key = deepseek_api_key
        self.mineru_api_url = "https://api.mineru.net/v1/pdf/parse"  # 需要确认实际 URL
        self.deepseek_api_url = "https://api.deepseek.com/v1/chat/completions"

    def pdf_to_markdown(self, pdf_path: str) -> str:
        """
        使用 MinerU API 将 PDF 转换为 Markdown

        Args:
            pdf_path: PDF 文件路径

        Returns:
            Markdown 文本
        """
        print(f"Converting PDF: {pdf_path}")

        # 读取 PDF 文件
        with open(pdf_path, 'rb') as f:
            pdf_data = f.read()

        # 调用 MinerU API
        headers = {
            "Authorization": f"Bearer {self.mineru_api_key}",
            "Content-Type": "application/pdf"
        }

        response = requests.post(
            self.mineru_api_url,
            headers=headers,
            data=pdf_data,
            timeout=300
        )

        if response.status_code == 200:
            result = response.json()
            markdown_text = result.get('markdown', '')
            print(f"Conversion successful, length: {len(markdown_text)} chars")
            return markdown_text
        else:
            raise Exception(f"MinerU API failed: {response.status_code} - {response.text}")

    def extract_questions(self, markdown_text: str) -> dict:
        """
        使用 DeepSeek API 从 Markdown 提取题目

        Args:
            markdown_text: Markdown 文本

        Returns:
            题目 JSON
        """
        print(f"Extracting questions...")

        prompt = self._build_prompt()

        headers = {
            "Authorization": f"Bearer {self.deepseek_api_key}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": "deepseek-chat",
            "messages": [
                {"role": "system", "content": prompt},
                {"role": "user", "content": markdown_text}
            ],
            "temperature": 0.1,
            "max_tokens": 8000
        }

        response = requests.post(
            self.deepseek_api_url,
            headers=headers,
            json=payload,
            timeout=120
        )

        if response.status_code == 200:
            result = response.json()
            content = result['choices'][0]['message']['content']

            # 解析 JSON
            try:
                # 提取 JSON 部分（可能包含在 ```json ``` 中）
                if '```json' in content:
                    json_str = content.split('```json')[1].split('```')[0].strip()
                elif '```' in content:
                    json_str = content.split('```')[1].split('```')[0].strip()
                else:
                    json_str = content.strip()

                questions = json.loads(json_str)
                print(f"Extraction successful, found {len(questions.get('questions', []))} questions")
                return questions
            except json.JSONDecodeError as e:
                print(f"JSON parse failed: {e}")
                print(f"Raw content: {content[:500]}")
                return {"questions": []}
        else:
            raise Exception(f"DeepSeek API failed: {response.status_code} - {response.text}")

    def _build_prompt(self) -> str:
        """构建提取 Prompt"""
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

严格按 JSON 格式输出，不要添加其他文字。"""

    def process_pdf(self, pdf_path: str, output_dir: str) -> str:
        """
        处理单个 PDF

        Args:
            pdf_path: PDF 文件路径
            output_dir: 输出目录

        Returns:
            输出 JSON 文件路径
        """
        # 创建输出目录
        os.makedirs(output_dir, exist_ok=True)

        # PDF 转 Markdown
        markdown_text = self.pdf_to_markdown(pdf_path)

        # 保存 Markdown
        md_path = os.path.join(output_dir, f"{Path(pdf_path).stem}.md")
        with open(md_path, 'w', encoding='utf-8') as f:
            f.write(markdown_text)
        print(f"Markdown saved to: {md_path}")

        # 提取题目
        questions = self.extract_questions(markdown_text)

        # 保存 JSON
        json_path = os.path.join(output_dir, f"{Path(pdf_path).stem}.json")
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(questions, f, ensure_ascii=False, indent=2)
        print(f"Questions saved to: {json_path}")

        return json_path


def main():
    """主函数"""
    # 配置
    PDF_DIR = r"D:\量化n1\资料\A 日语N1"
    OUTPUT_DIR = r"C:\Users\Garo\gokaku\jlpt_output_standalone"

    # 从环境变量读取 API Key
    MINERU_API_KEY = os.getenv('MINERU_API_KEY')
    DEEPSEEK_API_KEY = os.getenv('DEEPSEEK_API_KEY')

    if not MINERU_API_KEY:
        print("ERROR: Please set MINERU_API_KEY in .env.local")
        return

    if not DEEPSEEK_API_KEY:
        print("ERROR: Please set DEEPSEEK_API_KEY in .env.local")
        return

    # 查找 PDF 文件
    pdf_files = glob.glob(f"{PDF_DIR}/**/*.pdf", recursive=True)
    print(f"Found {len(pdf_files)} PDF files")

    if not pdf_files:
        print("ERROR: No PDF files found!")
        return

    # 测试模式：只处理第一个 PDF
    print("\nTest mode: Processing first PDF only")
    test_pdf = pdf_files[0]
    print(f"Test file: {test_pdf}")

    # 创建提取器
    extractor = JLPTExtractor(MINERU_API_KEY, DEEPSEEK_API_KEY)

    # 处理 PDF
    try:
        output_path = extractor.process_pdf(test_pdf, OUTPUT_DIR)
        print(f"\nExtraction completed!")
        print(f"Output directory: {OUTPUT_DIR}")
        print(f"Questions file: {output_path}")

        # 显示统计
        with open(output_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            print(f"\nStatistics:")
            print(f"  Total questions: {len(data.get('questions', []))}")

    except Exception as e:
        print(f"\nExtraction failed: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    # 加载环境变量
    from dotenv import load_dotenv
    load_dotenv('.env.local')

    main()
