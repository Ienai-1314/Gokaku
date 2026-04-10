"""
更稳健地从主卷 Markdown 中提取题目结构（针对 2025-12 N1）
- 只抽取 问題5-問題13 对应的 31-66 题
- 输出结构化 JSON，后续和答案映射合并
"""

import json
import os
import re
from pathlib import Path
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv("C:/Users/Garo/gokaku/.env.local")

client = OpenAI(api_key=os.getenv("DEEPSEEK_API_KEY"), base_url="https://api.deepseek.com")
MD_FILE = Path(r"C:/Users/Garo/gokaku/output/mineru_extracted/2/full.md")
OUT_FILE = Path(r"C:/Users/Garo/gokaku/output/questions_2025_12_structured.json")

PROMPT = """你是 JLPT N1 真题结构化提取助手。
任务：从给定 markdown 里，只提取真实题目，输出 JSON。
要求：
1. 只提取題號 31-66。
2. 每道题输出：number, type, question, options。
3. type 只能是 vocabulary / grammar / reading。
4. options 必须是长度为4的数组；如果 OCR 错乱，也要尽量保留原文本。
5. 不要编造答案，不输出 answer。
6. 严格输出 JSON，不要 markdown 代码块，不要解释。
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


def chunk_text(text, size=2200):
    return [text[i:i+size] for i in range(0, len(text), size)]


def main():
    text = MD_FILE.read_text(encoding="utf-8")
    chunks = chunk_text(text)
    all_questions = []
    seen = set()

    for idx, chunk in enumerate(chunks, 1):
        print(f"processing chunk {idx}/{len(chunks)}")
        try:
            resp = client.chat.completions.create(
                model="deepseek-chat",
                messages=[
                    {"role": "system", "content": PROMPT},
                    {"role": "user", "content": chunk},
                ],
                temperature=0.0,
                max_tokens=3500,
            )
            content = resp.choices[0].message.content.strip()
            data = json.loads(content)
            for q in data.get("questions", []):
                num = q.get("number")
                if isinstance(num, int) and 31 <= num <= 66 and num not in seen:
                    seen.add(num)
                    all_questions.append(q)
        except Exception as e:
            print(f"chunk {idx} failed: {e}")

    all_questions.sort(key=lambda x: x["number"])
    OUT_FILE.write_text(
        json.dumps({"source": "2025-12", "questions": all_questions}, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )
    print(f"saved: {OUT_FILE}")
    print(f"total questions: {len(all_questions)}")

if __name__ == "__main__":
    main()
