"""
使用 DeepSeek API 从 Markdown 中提取结构化题目
"""

import os
import json
import re
from pathlib import Path
from openai import OpenAI
from dotenv import load_dotenv

# 加载环境变量
load_dotenv("C:/Users/Garo/gokaku/.env.local")

DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
MARKDOWN_DIR = "C:/Users/Garo/gokaku/output/mineru_extracted/2"  # 主试卷
OUTPUT_FILE = "C:/Users/Garo/gokaku/output/extracted_questions.json"

# DeepSeek 客户端
client = OpenAI(
    api_key=DEEPSEEK_API_KEY,
    base_url="https://api.deepseek.com"
)

EXTRACTION_PROMPT = """你是一个日语能力考试（JLPT N1）题目提取专家。

请从以下 Markdown 文本中提取所有题目，并转换为 JSON 格式。

**提取规则：**
1. 识别题目编号（如：1、2、3...）
2. 提取题干文本
3. 提取所有选项（1、2、3、4）
4. 判断题目类型（词汇、语法、阅读、听力）
5. 如果有答案，提取答案

**输出格式：**
```json
{
  "questions": [
    {
      "number": 1,
      "type": "vocabulary",
      "question": "題干文本",
      "options": ["选项1", "选项2", "选项3", "选项4"],
      "answer": "1"
    }
  ]
}
```

**Markdown 文本：**
"""

def extract_questions_from_markdown(md_path: str):
    """从 Markdown 文件提取题目"""

    print(f"\n[INFO] Reading: {md_path}")

    with open(md_path, "r", encoding="utf-8") as f:
        content = f.read()

    # 分块处理（每次处理 3000 字符）
    chunk_size = 3000
    chunks = [content[i:i+chunk_size] for i in range(0, len(content), chunk_size)]

    all_questions = []

    for i, chunk in enumerate(chunks):
        print(f"\n[INFO] Processing chunk {i+1}/{len(chunks)}...")

        try:
            response = client.chat.completions.create(
                model="deepseek-chat",
                messages=[
                    {"role": "system", "content": "You are a JLPT question extraction expert."},
                    {"role": "user", "content": EXTRACTION_PROMPT + "\n\n" + chunk}
                ],
                temperature=0.1,
                max_tokens=4000
            )

            result_text = response.choices[0].message.content

            # 提取 JSON
            json_match = re.search(r'```json\s*(\{.*?\})\s*```', result_text, re.DOTALL)
            if json_match:
                result_json = json.loads(json_match.group(1))
                questions = result_json.get("questions", [])
                all_questions.extend(questions)
                print(f"[OK] Extracted {len(questions)} questions from chunk {i+1}")
            else:
                print(f"[WARN] No JSON found in chunk {i+1}")

        except Exception as e:
            print(f"[ERROR] Failed to process chunk {i+1}: {e}")
            continue

    return all_questions

def main():
    print("=" * 60)
    print("JLPT Question Extraction - DeepSeek API")
    print("=" * 60)

    # 查找 Markdown 文件
    md_file = Path(MARKDOWN_DIR) / "full.md"

    if not md_file.exists():
        print(f"[ERROR] Markdown file not found: {md_file}")
        return

    print(f"[OK] Found markdown: {md_file}")
    print(f"[INFO] File size: {md_file.stat().st_size / 1024:.1f} KB")

    # 提取题目
    questions = extract_questions_from_markdown(str(md_file))

    print(f"\n[SUCCESS] Total questions extracted: {len(questions)}")

    # 保存结果
    output_data = {
        "source": "2025年12月N1完整原卷",
        "total_questions": len(questions),
        "questions": questions
    }

    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)

    print(f"[INFO] Results saved to: {OUTPUT_FILE}")

    # 显示前 3 题
    print("\n[INFO] Sample questions:")
    for q in questions[:3]:
        print(f"\n  Q{q['number']}: {q['question'][:50]}...")
        print(f"  Type: {q['type']}")
        print(f"  Options: {len(q.get('options', []))}")

if __name__ == "__main__":
    main()
