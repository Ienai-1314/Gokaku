"""
批量处理所有 JLPT N1 真题 PDF 文件 - 优化版
支持断点续传和错误重试
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
    try:
        import io
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')
    except:
        pass  # 如果已经是 TextIOWrapper 就跳过

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
PROGRESS_FILE = "C:/Users/Garo/gokaku/output/batch_progress.json"

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


def load_progress():
    """加载进度"""
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"extracted": [], "parsed": [], "failed": []}


def save_progress(progress):
    """保存进度"""
    with open(PROGRESS_FILE, "w", encoding="utf-8") as f:
        json.dump(progress, f, ensure_ascii=False, indent=2)


def find_all_pdfs(root_dir):
    """递归查找所有 PDF 文件"""
    pdf_files = []
    for root, dirs, files in os.walk(root_dir):
        for file in files:
            if file.lower().endswith('.pdf'):
                pdf_files.append(os.path.join(root, file))
    return pdf_files


def extract_pdfs_batch(pdf_files, batch_size=5):
    """分批提取 PDF"""

    print(f"\n{'='*60}")
    print(f"步骤 1: 使用 MinerU API 提取 PDF")
    print(f"{'='*60}")

    if not MINERU_API_KEY:
        print("[ERROR] MINERU_API_KEY not found")
        return []

    # 加载进度
    progress = load_progress()
    extracted_files = set(progress.get("extracted", []))

    # 过滤已处理的文件
    remaining_files = [f for f in pdf_files if f not in extracted_files]
    print(f"[INFO] 总文件: {len(pdf_files)}, 已处理: {len(extracted_files)}, 待处理: {len(remaining_files)}")

    if not remaining_files:
        print("[INFO] 所有文件已提取完成")
        return []

    extractor = MinerUBatchExtractorViaAPI(
        api_key=MINERU_API_KEY,
        model_version="vlm",
        poll_interval=15,
        timeout=900
    )

    all_results = []
    total_batches = (len(remaining_files) + batch_size - 1) // batch_size

    for i in range(0, len(remaining_files), batch_size):
        batch = remaining_files[i:i+batch_size]
        batch_num = i // batch_size + 1

        print(f"\n[INFO] 处理批次 {batch_num}/{total_batches} ({len(batch)} 个文件)")
        for f in batch:
            print(f"  - {os.path.basename(f)}")

        try:
            result = extractor.extract_batch(
                file_paths=batch,
                out_dir=os.path.join(OUTPUT_DIR, f"batch_{batch_num}")
            )

            all_results.extend(result['items'])

            # 更新进度
            for item in result['items']:
                if item['state'] == 'done':
                    extracted_files.add(item['file_path'])

            progress['extracted'] = list(extracted_files)
            save_progress(progress)

            print(f"[OK] 批次 {batch_num} 完成")

            # API 限流保护
            if i + batch_size < len(remaining_files):
                wait_time = 20
                print(f"[INFO] 等待 {wait_time} 秒避免 API 限流...")
                time.sleep(wait_time)

        except Exception as e:
            print(f"[ERROR] 批次 {batch_num} 失败: {e}")
            progress['failed'].extend(batch)
            save_progress(progress)
            continue

    return all_results


def extract_questions_from_markdown(md_path, source_name):
    """从 Markdown 提取题目"""

    print(f"\n[INFO] 解析: {os.path.basename(source_name)}")

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
            time.sleep(1)

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

    # 加载进度
    progress = load_progress()
    parsed_files = set(progress.get("parsed", []))

    all_questions = []

    for item in extraction_results:
        if item['state'] != 'done':
            continue

        file_path = item['file_path']
        if file_path in parsed_files:
            print(f"[SKIP] 已解析: {os.path.basename(file_path)}")
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

        # 更新进度
        parsed_files.add(file_path)
        progress['parsed'] = list(parsed_files)
        save_progress(progress)

    return all_questions


def main():
    print("="*60)
    print("JLPT N1 批量处理脚本 - 优化版")
    print("="*60)

    # 创建输出目录
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # 1. 查找所有 PDF
    print(f"\n[INFO] 扫描 PDF 文件: {PDF_ROOT_DIR}")
    pdf_files = find_all_pdfs(PDF_ROOT_DIR)
    print(f"[OK] 找到 {len(pdf_files)} 个 PDF 文件")

    # 2. 提取 PDF
    extraction_results = extract_pdfs_batch(pdf_files, batch_size=5)

    # 加载所有已提取的结果
    all_extraction_results = []
    for batch_dir in Path(OUTPUT_DIR).glob("batch_*"):
        summary_file = batch_dir / "extraction_summary.json"
        if summary_file.exists():
            with open(summary_file, "r", encoding="utf-8") as f:
                batch_result = json.load(f)
                all_extraction_results.extend(batch_result.get('items', []))

    print(f"\n[INFO] 提取完成: {len(all_extraction_results)} 个文件")

    # 3. 解析题目
    all_questions = parse_all_markdowns(all_extraction_results)
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

    print(f"\n[INFO] 题目来源统计 (前 10):")
    for src, count in sorted(sources.items(), key=lambda x: x[1], reverse=True)[:10]:
        print(f"  {os.path.basename(src)}: {count} 题")


if __name__ == "__main__":
    main()
