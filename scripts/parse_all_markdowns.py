"""
解析已提取的 Markdown 文件，提取题目数据
"""

import os
import sys
import json
import time
import re
from pathlib import Path
from dotenv import load_dotenv
from openai import OpenAI

print("脚本开始运行...")

# 加载环境变量
load_dotenv("C:/Users/Garo/gokaku/.env.local")

DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")
BATCH_DIR = "C:/Users/Garo/gokaku/output/batch_processed"
FINAL_OUTPUT = "C:/Users/Garo/gokaku/output/all_questions.json"

# DeepSeek 客户端
deepseek_client = OpenAI(
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

def find_all_markdowns():
    """查找所有已提取的 Markdown 文件"""
    md_files = []
    for batch_dir in Path(BATCH_DIR).glob("batch_*"):
        for md_file in batch_dir.rglob("full.md"):
            md_files.append(md_file)
    return md_files

def extract_questions_from_markdown(md_path):
    """从 Markdown 提取题目"""

    try:
        with open(md_path, "r", encoding="utf-8") as f:
            content = f.read()
    except Exception as e:
        print(f"[错误] 读取失败: {e}")
        return []

    # 分块处理
    chunk_size = 4000
    chunks = [content[i:i+chunk_size] for i in range(0, len(content), chunk_size)]

    all_questions = []

    for i, chunk in enumerate(chunks):
        try:
            response = deepseek_client.chat.completions.create(
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

            # API 限流
            time.sleep(1)

        except Exception as e:
            print(f"[警告] 块 {i+1} 解析失败: {e}")
            continue

    return all_questions

def main():
    print("="*60)
    print("JLPT N1 题目解析脚本")
    print("="*60)

    # 检查 API Key
    if not DEEPSEEK_API_KEY:
        print("[错误] DEEPSEEK_API_KEY 未找到")
        return

    print(f"API Key: {DEEPSEEK_API_KEY[:20]}...")

    # 1. 查找所有 Markdown
    print(f"\n[步骤 1] 扫描 Markdown 文件...")
    md_files = find_all_markdowns()
    print(f"找到 {len(md_files)} 个 Markdown 文件")

    if not md_files:
        print("[错误] 没有找到 Markdown 文件")
        return

    # 2. 解析题目
    print(f"\n[步骤 2] 开始解析题目...")
    all_questions = []

    for i, md_file in enumerate(md_files, 1):
        print(f"\n[{i}/{len(md_files)}] 解析: {md_file.parent.name}/{md_file.name}")

        questions = extract_questions_from_markdown(md_file)

        # 添加来源信息
        source_name = f"{md_file.parent.parent.name}/{md_file.parent.name}"
        for q in questions:
            q['source'] = source_name

        all_questions.extend(questions)
        print(f"提取 {len(questions)} 题")

    # 3. 保存结果
    print(f"\n[步骤 3] 保存结果...")

    final_data = {
        "source": "JLPT N1 真题 (2020-2025)",
        "total_files": len(md_files),
        "total_questions": len(all_questions),
        "questions": all_questions
    }

    with open(FINAL_OUTPUT, "w", encoding="utf-8") as f:
        json.dump(final_data, f, ensure_ascii=False, indent=2)

    print(f"\n{'='*60}")
    print(f"解析完成！")
    print(f"{'='*60}")
    print(f"输出文件: {FINAL_OUTPUT}")
    print(f"总题目数: {len(all_questions)}")

    # 统计
    sources = {}
    for q in all_questions:
        src = q.get('source', 'unknown')
        sources[src] = sources.get(src, 0) + 1

    print(f"\n题目来源统计 (前 10):")
    for src, count in sorted(sources.items(), key=lambda x: x[1], reverse=True)[:10]:
        print(f"  {src}: {count} 题")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"脚本错误: {e}")
        import traceback
        traceback.print_exc()
