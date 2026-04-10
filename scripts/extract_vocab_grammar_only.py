"""
只提取 2025-12 N1 主卷中的词汇和语法题（31-40）
输出结构化 JSON
"""

import json
import os
from pathlib import Path
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv("C:/Users/Garo/gokaku/.env.local")
client = OpenAI(api_key=os.getenv("DEEPSEEK_API_KEY"), base_url="https://api.deepseek.com")

MD_FILE = Path(r"C:/Users/Garo/gokaku/output/mineru_extracted/2/full.md")
OUT_FILE = Path(r"C:/Users/Garo/gokaku/output/questions_2025_12_vocab_grammar.json")

PROMPT = """你是 JLPT N1 真题结构化提取助手。
只提取题号 31-40 的题目，31-35 为 vocabulary，36-40 为 grammar。

要求：
1. 只输出 31-40。
2. 每题输出字段：number, type, question, options。
3. options 必须是长度为 4 的数组。
4. 不输出答案。
5. 严格输出 JSON，不要 markdown 代码块，不要解释。

输出格式：
{
  "questions": [
    {
      "number": 31,
      "type": "vocabulary",
      "question": "...",
      "options": ["...", "...", "...", "..."]
    }
  ]
}
"""


def main():
    text = MD_FILE.read_text(encoding="utf-8")
    # 只截取前部，减少噪声。31-40 在文档前半部分
    text = text[:12000]

    resp = client.chat.completions.create(
        model="deepseek-chat",
        messages=[
            {"role": "system", "content": PROMPT},
            {"role": "user", "content": text}
        ],
        temperature=0.0,
        max_tokens=5000,
    )

    content = resp.choices[0].message.content.strip()
    data = json.loads(content)
    questions = [q for q in data.get("questions", []) if isinstance(q.get("number"), int) and 31 <= q["number"] <= 40]
    questions.sort(key=lambda x: x["number"])

    OUT_FILE.write_text(json.dumps({"source": "2025-12", "questions": questions}, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"saved: {OUT_FILE}")
    print(f"total questions: {len(questions)}")
    for q in questions:
        print(q["number"], q["type"], len(q.get("options", [])))

if __name__ == "__main__":
    main()
