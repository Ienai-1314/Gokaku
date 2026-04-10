"""
批量处理所有 JLPT N1 真题 PDF 文件
1. 扫描所有 PDF
2. 使用 MinerU API 提取为 Markdown
3. 使用 DeepSeek API 解析题目
4. 合并为一个 JSON 文件
"""

import os
import sys
import json
import time
import re
from pathlib import Path
from dotenv import load_dotenv
from openai import OpenAI

# 设置 UTF-8 编码
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# 加载环境变量
load_dotenv("C:/Users/Garo/gokaku/.env.local")

# 添加 DataFlow 到路径
sys.path.insert(0, "C:/Users/Garo/DataFlow")

from dataflow.utils.kbc.mineru_api_caller import MinerUBatchExtractorViaAPI

# 配置
MINERU_API_KEY = os.getenv("MINERU_API_KEY", "")
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")
PDF_ROOT_DIR = "D:/量化n1/资料/A 日语N1"
OUTPUT_DIR = "C:/Users/Garo/gokaku/output/batch_processed"
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


def find_all_pdfs(root_dir):
    """递归查找所有 PDF 文件"""
    pdf_files = []
    for root, dirs, files in os.walk(root_dir):
        for file in files:
            if file.lower().endswith('.pdf'):
                pdf_files.append(os.path.join(root, file))
    return pdf_files


def extract_pdfs_batch(pdf_files, batch_size=10):
    """分批提取 PDF（MinerU API 限制）"""

    print(f"\n{'='*60}")
    print(f"步骤 1: 使用 MinerU API 提取 PDF")
    print(f"{'='*60}")

    if not MINERU_API_KEY:
        print("[ERROR] MINERU_API_KEY not found")
        return []

    extractor = MinerUBatchExtractorViaAPI(
        api_key=MINERU_API_KEY,
        model_version="vlm",
        poll_interval=15,
        timeout=900  # 15 分钟超时
    )

    all_results = []
    total_batches = (len(pdf_files) + batch_size - 1) // batch_size

    for i in range(0, len(pdf_files), batch_size):
        batch = pdf_files[i:i+batch_size]
        batch_num = i // batch_size + 1

        print(f"\n[INFO] 处理批次 {batch_num}/{total_batches} ({len(batch)} 个文件)")

        try:
            result = extractor.extract_batch(
                file_paths=batch,
                out_dir=os.path.join(OUTPUT_DIR, f"batch_{batch_num}")
            )

            all_results.extend(result['items'])
            print(f"[OK] 批次 {batch_num} 完成")

            # API 限流保护
            if i + batch_size < len(pdf_files):
                print("[INFO] 等待 30 秒避免 API 限流...")
                time.sleep(30)

        except Exception as e:
            print(f"[ERROR] 批次 {batch_num} 失败: {e}")
            # 保存失败的文件列表
            failed_file = os.path.join(OUTPUT_DIR, f"failed_batch_{batch_num}.txt")
            with open(failed_file, "w", encoding="utf-8") as f:
                f.write("\n".join(batch))
            continue

    return all_results


def extract_questions_from_markdown(md_path, source_name):
    """从 Markdown 提取题目"""

    print(f"\n[INFO] 解析: {source_name}")

    try:
        with open(md_path, "r", encoding="utf-8") as f:
            content = f.read()
    except Exception as e:
        print(f"[ERROR] 读取失败: {e}")
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

            # API 限流保护
            time.sleep(2)

        except Exception as e:
            print(f"[WARN] 块 {i+1} 解析失败: {e}")
            continue

    return all_questions


def parse_all_markdowns(extraction_results):
    """解析所有 Markdown 文件"""

    print(f"\n{'='*60}")
    print(f"步骤 2: 使用 DeepSeek API 解析题目")
    print(f"{'='*60}")

    if not DEEPSEEK_API_KEY:
        print("[ERROR] DEEPSEEK_API_KEY not found")
        return []

    all_questions = []

    for item in extraction_results:
        if item['state'] != 'success':
            continue

        md_path = item.get('md_path')
        if not md_path or not os.path.exists(md_path):
            continue

        source_name = item['file_name']
        questions = extract_questions_from_markdown(md_path, source_name)

        # 添加来源信息
        for q in questions:
            q['source'] = source_name

        all_questions.extend(questions)
        print(f"[OK] 提取 {len(questions)} 题")

    return all_questions


def main():
    print("="*60)
    print("JLPT N1 批量处理脚本")
    print("="*60)

    # 创建输出目录
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # 1. 查找所有 PDF
    print(f"\n[INFO] 扫描 PDF 文件: {PDF_ROOT_DIR}")
    pdf_files = find_all_pdfs(PDF_ROOT_DIR)
    print(f"[OK] 找到 {len(pdf_files)} 个 PDF 文件")

    # 保存文件列表
    file_list_path = os.path.join(OUTPUT_DIR, "pdf_file_list.txt")
    with open(file_list_path, "w", encoding="utf-8") as f:
        f.write("\n".join(pdf_files))
    print(f"[INFO] 文件列表已保存: {file_list_path}")

    # 2. 提取 PDF
    extraction_results = extract_pdfs_batch(pdf_files, batch_size=10)
    print(f"\n[INFO] 提取完成: {len(extraction_results)} 个文件")

    # 保存提取结果
    extraction_summary = os.path.join(OUTPUT_DIR, "extraction_summary.json")
    with open(extraction_summary, "w", encoding="utf-8") as f:
        json.dump(extraction_results, f, ensure_ascii=False, indent=2)

    # 3. 解析题目
    all_questions = parse_all_markdowns(extraction_results)
    print(f"\n[INFO] 总共提取 {len(all_questions)} 道题目")

    # 4. 合并保存
    final_data = {
        "source": "JLPT N1 真题 (2020-2025)",
        "total_pdfs": len(pdf_files),
        "total_questions": len(all_questions),
        "questions": all_questions
    }

    with open(FINAL_OUTPUT, "w", encoding="utf-8") as f:
        json.dump(final_data, f, ensure_ascii=False, indent=2)

    print(f"\n{'='*60}")
    print(f"[SUCCESS] 处理完成！")
    print(f"{'='*60}")
    print(f"输出文件: {FINAL_OUTPUT}")
    print(f"总题目数: {len(all_questions)}")

    # 统计
    sources = {}
    for q in all_questions:
        src = q.get('source', 'unknown')
        sources[src] = sources.get(src, 0) + 1

    print(f"\n[INFO] 题目来源统计:")
    for src, count in sorted(sources.items(), key=lambda x: x[1], reverse=True)[:10]:
        print(f"  {src}: {count} 题")


if __name__ == "__main__":
    main()
