"""
将 MinerU 提取的 Markdown 转换为 Gokaku 题目格式
使用 DeepSeek API 进行结构化提取
"""
import os
import json
import requests
from pathlib import Path
from dotenv import load_dotenv

# 加载环境变量
load_dotenv(dotenv_path=r"C:\Users\Garo\gokaku\.env.local")

# 配置
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions"
MARKDOWN_DIR = r"C:\Users\Garo\gokaku\data\mineru_output"
OUTPUT_JSON = r"C:\Users\Garo\gokaku\data\extracted_questions.json"

def read_markdown_files():
    """读取所有 Markdown 文件"""
    markdown_files = []

    if not os.path.exists(MARKDOWN_DIR):
        print(f"Directory not found: {MARKDOWN_DIR}")
        return []

    for root, dirs, files in os.walk(MARKDOWN_DIR):
        for file in files:
            if file.endswith('.md'):
                filepath = os.path.join(root, file)
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                    markdown_files.append({
                        'file': filepath,
                        'content': content
                    })

    return markdown_files

def extract_questions_with_deepseek(markdown_content):
    """使用 DeepSeek 提取题目"""

    prompt = f"""你是一个 JLPT N1 真题解析专家。请从以下 Markdown 文本中提取所有题目。

要求：
1. 识别题目类型（vocabulary, grammar, reading, listening）
2. 提取题目文本、选项、正确答案
3. 提取解析说明（如果有）
4. 按照 JSON 格式输出

输出格式：
{{
  "questions": [
    {{
      "type": "vocabulary",
      "question_text": "题目文本",
      "options": ["选项1", "选项2", "选项3", "选项4"],
      "correct_answer": 0,
      "explanation": "解析说明"
    }}
  ]
}}

Markdown 内容：
{markdown_content[:8000]}

请直接输出 JSON，不要其他说明。"""

    headers = {
        "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
        "Content-Type": "application/json"
    }

    data = {
        "model": "deepseek-chat",
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.1
    }

    try:
        response = requests.post(DEEPSEEK_API_URL, headers=headers, json=data, timeout=60)
        response.raise_for_status()

        result = response.json()
        content = result['choices'][0]['message']['content']

        # 解析 JSON
        questions_data = json.loads(content)
        return questions_data.get('questions', [])

    except Exception as e:
        print(f"DeepSeek API Error: {e}")
        return []

def main():
    """主函数"""
    print("=== MinerU to Gokaku Converter ===")
    print(f"Markdown Directory: {MARKDOWN_DIR}")
    print(f"Output JSON: {OUTPUT_JSON}")
    print()

    # 读取 Markdown 文件
    markdown_files = read_markdown_files()
    print(f"Found {len(markdown_files)} markdown files")

    if not markdown_files:
        print("No markdown files found. Run extract_with_mineru.py first.")
        return

    # 提取题目
    all_questions = []

    for idx, md_file in enumerate(markdown_files, 1):
        print(f"\nProcessing {idx}/{len(markdown_files)}: {md_file['file']}")

        questions = extract_questions_with_deepseek(md_file['content'])
        print(f"  Extracted {len(questions)} questions")

        all_questions.extend(questions)

    # 保存结果
    os.makedirs(os.path.dirname(OUTPUT_JSON), exist_ok=True)

    with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(all_questions, f, ensure_ascii=False, indent=2)

    print(f"\n=== Extraction Complete ===")
    print(f"Total questions: {len(all_questions)}")
    print(f"Saved to: {OUTPUT_JSON}")

if __name__ == "__main__":
    main()
