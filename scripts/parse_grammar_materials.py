#!/usr/bin/env python3
"""
解析语法资料 Markdown 为结构化题目
使用 DeepSeek API 提取语法点和例句
"""

import os
import sys
import json
from pathlib import Path
from openai import OpenAI

# 确保输出使用 UTF-8
sys.stdout.reconfigure(encoding='utf-8')

# 加载环境变量
from dotenv import load_dotenv
env_path = Path(__file__).parent.parent / '.env.local'
load_dotenv(dotenv_path=env_path)

DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
if not DEEPSEEK_API_KEY:
    print("错误: 未找到 DEEPSEEK_API_KEY")
    sys.exit(1)

def parse_grammar_with_deepseek(content: str, filename: str):
    """使用 DeepSeek 解析语法资料"""

    client = OpenAI(
        api_key=DEEPSEEK_API_KEY,
        base_url="https://api.deepseek.com"
    )

    prompt = f"""你是一个日语 N1 语法资料解析专家。请从以下 Markdown 内容中提取语法点信息。

文件名: {filename}

内容:
{content[:3000]}

请提取所有语法点，每个语法点包含：
1. grammar_pattern: 语法句型（如：に際して、に先立って）
2. meaning: 中文意思
3. example: 日语例句
4. translation: 例句中文翻译（如果有）
5. usage_notes: 使用说明（如果有）
6. exam_year: 出现的考试年份（如果有，如：2024.7）

返回 JSON 数组格式，每个元素是一个语法点对象。
只返回 JSON，不要其他说明文字。

示例格式：
[
  {{
    "grammar_pattern": "に際して",
    "meaning": "在...之际",
    "example": "クレジットカードの申し込みに際して、本書の書類にご記入ください",
    "translation": "在申请信用卡之际，请填写本书的文件",
    "usage_notes": "表示在某个重要时刻或场合",
    "exam_year": "2024.7"
  }}
]
"""

    try:
        print(f"正在解析: {filename}")
        sys.stdout.flush()

        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": "你是一个专业的日语语法资料解析助手。"},
                {"role": "user", "content": prompt}
            ],
            max_tokens=8192,
            temperature=0.1
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
        grammar_points = json.loads(result_text)
        print(f"成功解析 {len(grammar_points)} 个语法点")
        sys.stdout.flush()

        return grammar_points

    except json.JSONDecodeError as e:
        print(f"JSON 解析错误: {e}")
        print(f"原始响应: {result_text[:500]}")
        sys.stdout.flush()
        return []
    except Exception as e:
        print(f"解析错误: {e}")
        sys.stdout.flush()
        return []

def main():
    # 语法资料目录
    grammar_dir = Path("C:/Users/Garo/gokaku/output/batch_classified_final/grammar")
    output_file = Path("C:/Users/Garo/gokaku/output/grammar_points.json")

    all_grammar_points = []

    # 遍历所有语法文件
    for i in range(4):
        md_file = grammar_dir / str(i) / "full.md"
        if not md_file.exists():
            print(f"文件不存在: {md_file}")
            continue

        print(f"\n处理文件 {i+1}/4: {md_file.name}")
        sys.stdout.flush()

        # 读取文件
        with open(md_file, 'r', encoding='utf-8') as f:
            content = f.read()

        # 由于文件较大，分段处理
        # 每 2000 行处理一次
        lines = content.split('\n')
        chunk_size = 2000

        for chunk_idx in range(0, len(lines), chunk_size):
            chunk_lines = lines[chunk_idx:chunk_idx + chunk_size]
            chunk_content = '\n'.join(chunk_lines)

            if len(chunk_content.strip()) < 100:
                continue

            print(f"  处理片段 {chunk_idx//chunk_size + 1} (行 {chunk_idx}-{chunk_idx+len(chunk_lines)})")
            sys.stdout.flush()

            grammar_points = parse_grammar_with_deepseek(chunk_content, f"{md_file.name}_chunk_{chunk_idx//chunk_size}")
            all_grammar_points.extend(grammar_points)

            print(f"  当前总计: {len(all_grammar_points)} 个语法点")
            sys.stdout.flush()

    # 保存结果
    print(f"\n保存结果到: {output_file}")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_grammar_points, f, ensure_ascii=False, indent=2)

    print(f"\n完成！共提取 {len(all_grammar_points)} 个语法点")

    # 统计
    patterns = set(gp.get('grammar_pattern', '') for gp in all_grammar_points)
    print(f"唯一语法句型: {len(patterns)} 个")

if __name__ == "__main__":
    main()
