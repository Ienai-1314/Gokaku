#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
解析所有年份的 Markdown 为结构化题目
"""

import os
import sys
import json
from pathlib import Path
from dotenv import load_dotenv

# 加载环境变量
load_dotenv(r'C:\Users\Garo\gokaku\.env.local')

# DeepSeek API
DEEPSEEK_API_KEY = os.getenv('DEEPSEEK_API_KEY', '')
DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'

# 路径配置
INPUT_DIR = Path(r'C:\Users\Garo\gokaku\output\batch_all_years')
OUTPUT_DIR = Path(r'C:\Users\Garo\gokaku\output\parsed_all_years')
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# 试卷映射
PAPER_MAPPING = {
    '0': {'exam_date': '2020-12', 'paper_id': '2020-12-n1'},
    '1': {'exam_date': '2021-07', 'paper_id': '2021-07-n1'},
    '2': {'exam_date': '2022-07', 'paper_id': '2022-07-n1'},
    '3': {'exam_date': '2022-12', 'paper_id': '2022-12-n1'},
    '4': {'exam_date': '2023-07', 'paper_id': '2023-07-n1'},
    '5': {'exam_date': '2023-12', 'paper_id': '2023-12-n1'},
    '6': {'exam_date': '2024-12', 'paper_id': '2024-12-n1'},
    '7': {'exam_date': '2025-07', 'paper_id': '2025-07-n1'},
}

def call_deepseek(prompt, text):
    """调用 DeepSeek API"""
    import requests

    headers = {
        'Authorization': f'Bearer {DEEPSEEK_API_KEY}',
        'Content-Type': 'application/json'
    }

    data = {
        'model': 'deepseek-chat',
        'messages': [
            {'role': 'system', 'content': prompt},
            {'role': 'user', 'content': text}
        ],
        'temperature': 0.1
    }

    response = requests.post(DEEPSEEK_API_URL, headers=headers, json=data, timeout=60)
    response.raise_for_status()

    result = response.json()
    return result['choices'][0]['message']['content']

def extract_vocab_grammar(markdown_text, exam_date, paper_id):
    """提取词汇和语法题"""

    prompt = """你是 JLPT N1 真题解析专家。请从 Markdown 文本中提取词汇和语法题（通常是第 1-10 题）。

要求：
1. 只提取词汇和语法选择题
2. 每道题包含：题号、题干、4个选项
3. 输出 JSON 数组格式
4. 如果题目中有下划线或空格，保留原样

输出格式：
[
  {
    "questionNumber": 1,
    "questionText": "题干文本",
    "options": ["选项1", "选项2", "选项3", "选项4"]
  }
]

只输出 JSON，不要其他内容。"""

    try:
        response = call_deepseek(prompt, markdown_text)

        # 清理响应
        response = response.strip()
        if response.startswith('```json'):
            response = response[7:]
        if response.startswith('```'):
            response = response[3:]
        if response.endswith('```'):
            response = response[:-3]
        response = response.strip()

        questions = json.loads(response)

        # 添加元数据
        for q in questions:
            q['examDate'] = exam_date
            q['paperId'] = paper_id
            q['section'] = 'vocabulary' if q['questionNumber'] <= 5 else 'grammar'

        return questions

    except Exception as e:
        print(f"  ERROR parsing: {e}")
        return []

def main():
    print("Starting to parse all years questions...")

    all_questions = []

    for batch_num, paper_info in PAPER_MAPPING.items():
        exam_date = paper_info['exam_date']
        paper_id = paper_info['paper_id']

        md_path = INPUT_DIR / batch_num / 'full.md'

        if not md_path.exists():
            print(f"[{batch_num}] WARNING: Markdown not found: {md_path}")
            continue

        print(f"\n[{batch_num}] Processing: {exam_date}")

        # 读取 Markdown
        with open(md_path, 'r', encoding='utf-8') as f:
            markdown_text = f.read()

        # 提取题目
        questions = extract_vocab_grammar(markdown_text, exam_date, paper_id)

        if questions:
            print(f"  Extracted {len(questions)} questions")
            all_questions.extend(questions)

            # 保存单个试卷结果
            output_path = OUTPUT_DIR / f'{paper_id}_questions.json'
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(questions, f, ensure_ascii=False, indent=2)
        else:
            print(f"  No questions extracted")

    # 保存所有题目
    all_output_path = OUTPUT_DIR / 'all_questions.json'
    with open(all_output_path, 'w', encoding='utf-8') as f:
        json.dump(all_questions, f, ensure_ascii=False, indent=2)

    print(f"\n✅ Parsing completed!")
    print(f"Total questions: {len(all_questions)}")
    print(f"Output: {all_output_path}")

if __name__ == '__main__':
    main()
