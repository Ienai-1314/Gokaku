#!/usr/bin/env python3
"""
解析分类后的真题 Markdown 文件为结构化题目
使用 DeepSeek API 提取题号、题干、选项、答案
"""

import os
import sys
import json
import time
from pathlib import Path
from openai import OpenAI

# 强制立即输出
sys.stdout.reconfigure(line_buffering=True)
sys.stderr.reconfigure(line_buffering=True)

# 配置
DEEPSEEK_API_KEY = "sk-852d4b17220e4c9c850b1e4c8465e737"
INPUT_DIR = Path("C:/Users/Garo/gokaku/output/batch_classified_final/exam_paper")
OUTPUT_DIR = Path("C:/Users/Garo/gokaku/output/parsed_classified")

# 初始化 DeepSeek 客户端
client = OpenAI(
    api_key=DEEPSEEK_API_KEY,
    base_url="https://api.deepseek.com"
)

SYSTEM_PROMPT = """你是一个专业的日语 N1 考试题目提取专家。

请从提供的 Markdown 文本中提取所有题目，返回 JSON 数组格式。

每道题目包含：
- question_number: 题号（整数）
- question_type: 题型（vocabulary/grammar/reading/listening）
- question_text: 题干（日语原文）
- options: 选项数组，每个选项包含 {label: "1"/"2"/"3"/"4", text: "选项内容"}
- correct_answer: 正确答案（"1"/"2"/"3"/"4"）
- explanation: 解析（如果有）

识别规则：
1. 问题1-8：词汇题（vocabulary）
2. 问题9-13：语法题（grammar）
3. 问题14及以后：阅读题（reading）
4. 听力题会明确标注（listening）

注意：
- 保留所有日语字符
- 选项通常是 1/2/3/4
- 如果没有答案，correct_answer 设为 null
- 如果 OCR 有错误，尽量修正明显的错误

只返回 JSON 数组，不要其他文字。"""

def parse_markdown_with_deepseek(md_content: str, file_name: str, retry=0) -> list:
    """使用 DeepSeek API 解析 Markdown"""

    print(f"\n解析文件: {file_name}", flush=True)
    print(f"内容长度: {len(md_content)} 字符", flush=True)

    try:
        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"请提取以下 Markdown 中的所有题目：\n\n{md_content}"}
            ],
            temperature=0.1,
            max_tokens=8000
        )

        result_text = response.choices[0].message.content.strip()

        # 移除可能的 markdown 代码块标记
        if result_text.startswith("```json"):
            result_text = result_text[7:]
        if result_text.startswith("```"):
            result_text = result_text[3:]
        if result_text.endswith("```"):
            result_text = result_text[:-3]

        result_text = result_text.strip()

        # 解析 JSON
        questions = json.loads(result_text)

        print(f"成功提取 {len(questions)} 道题目", flush=True)
        return questions

    except json.JSONDecodeError as e:
        print(f"JSON 解析失败: {e}", flush=True)

        # 保存错误的 JSON 用于调试
        error_file = OUTPUT_DIR / f"error_{file_name}_{retry}.json"
        with open(error_file, 'w', encoding='utf-8') as f:
            f.write(result_text)
        print(f"错误 JSON 已保存到: {error_file}", flush=True)

        # 重试一次，使用更明确的提示
        if retry < 1:
            print("尝试重新解析...", flush=True)
            time.sleep(3)
            return parse_markdown_with_deepseek(md_content, file_name, retry + 1)

        return []
    except Exception as e:
        print(f"API 调用失败: {e}", flush=True)
        return []

def main():
    """主函数"""

    print("=" * 60, flush=True)
    print("开始解析分类后的真题 Markdown 文件", flush=True)
    print("=" * 60, flush=True)

    # 创建输出目录
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"输出目录: {OUTPUT_DIR}", flush=True)

    # 查找所有 full.md 文件
    print(f"搜索目录: {INPUT_DIR}", flush=True)
    md_files = list(INPUT_DIR.glob("*/full.md"))

    if not md_files:
        print("错误: 未找到 Markdown 文件", flush=True)
        return

    print(f"找到 {len(md_files)} 个 Markdown 文件", flush=True)

    all_questions = []

    for md_file in md_files:
        # 读取文件
        with open(md_file, 'r', encoding='utf-8') as f:
            content = f.read()

        # 解析题目
        questions = parse_markdown_with_deepseek(content, md_file.name)

        # 添加文件来源信息
        for q in questions:
            q['source_file'] = str(md_file.relative_to(INPUT_DIR.parent))
            q['source_category'] = 'exam_paper'

        all_questions.extend(questions)

        # API 限流：每次请求后等待 2 秒
        time.sleep(2)

    # 保存所有题目
    output_file = OUTPUT_DIR / "all_classified_questions.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_questions, f, ensure_ascii=False, indent=2)

    print(f"\n总计提取 {len(all_questions)} 道题目")
    print(f"保存到: {output_file}")

    # 统计题型分布
    type_counts = {}
    for q in all_questions:
        qtype = q.get('question_type', 'unknown')
        type_counts[qtype] = type_counts.get(qtype, 0) + 1

    print("\n题型分布:")
    for qtype, count in sorted(type_counts.items()):
        print(f"  {qtype}: {count} 道")

if __name__ == "__main__":
    main()
