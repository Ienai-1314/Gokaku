"""
批量处理所有真题中的词汇和语法题：
1. 调用 MinerU API 提取每套卷子的主卷+答案卷
2. 用 DeepSeek 解析主卷中的 词汇/语法题
3. 用答案卷提取答案表
4. 合并成 Gokaku 可导入 JSON

说明：
- 优先处理每个目录中的 A 主卷 和 C 答案 PDF
- 当前先处理 N1 目录
"""

import os
import json
import re
from pathlib import Path
from dotenv import load_dotenv
from openai import OpenAI
import sys

sys.path.insert(0, "C:/Users/Garo/DataFlow")
from dataflow.utils.kbc.mineru_api_caller import MinerUBatchExtractorViaAPI

load_dotenv("C:/Users/Garo/gokaku/.env.local")

DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
MINERU_API_KEY = os.getenv("MINERU_API_KEY")

client = OpenAI(api_key=DEEPSEEK_API_KEY, base_url="https://api.deepseek.com")

PDF_ROOT = Path(r"D:/量化n1/资料/A 日语N1")
OUT_ROOT = Path(r"C:/Users/Garo/gokaku/output/batch_processed")
OUT_ROOT.mkdir(parents=True, exist_ok=True)

QUESTION_PROMPT = """你是 JLPT N1 真题结构化提取助手。
请从输入的 markdown 中只提取词汇题和语法题。
规则：
1. 只输出题目，不输出解释。
2. 题型 type 只能是 vocabulary 或 grammar。
3. 词汇题一般是 31-35，语法题一般是 36-40；如果文档中能识别更多同类题，也一并保留。
4. 每题字段：number, type, question, options。
5. options 必须是长度 4 的数组。
6. 严格输出 JSON，不要 markdown 代码块。
格式：
{
  "questions": [
    {"number": 31, "type": "vocabulary", "question": "...", "options": ["...","...","...","..."]}
  ]
}
"""


def parse_answers_md(md_text: str):
    answer_map = {}
    current_problem = None
    for line in md_text.splitlines():
        line = line.strip()
        if not line:
            continue
        if line.startswith("問題"):
            current_problem = line
            continue
        if line.startswith("<table>") and current_problem:
            nums = re.findall(r"\((\d+)\)", line)
            flat_vals = re.findall(r">(\d+)<", line)
            if nums:
                if len(flat_vals) >= len(nums) * 2:
                    answers = flat_vals[len(nums):len(nums) * 2]
                else:
                    answers = flat_vals[-len(nums):]
                for n, a in zip(nums, answers):
                    answer_map[int(n)] = int(a)
    return answer_map


def parse_questions_md(md_text: str):
    chunks = [md_text[i:i+2200] for i in range(0, len(md_text), 2200)]
    all_questions = []
    seen = set()
    for idx, chunk in enumerate(chunks, 1):
        try:
            resp = client.chat.completions.create(
                model="deepseek-chat",
                messages=[
                    {"role": "system", "content": QUESTION_PROMPT},
                    {"role": "user", "content": chunk},
                ],
                temperature=0.0,
                max_tokens=3500,
            )
            content = resp.choices[0].message.content.strip()
            data = json.loads(content)
            for q in data.get("questions", []):
                num = q.get("number")
                if isinstance(num, int) and num not in seen and q.get("type") in {"vocabulary", "grammar"}:
                    seen.add(num)
                    all_questions.append(q)
        except Exception as e:
            print(f"  chunk {idx} parse failed: {e}")
    all_questions.sort(key=lambda x: x["number"])
    return all_questions


def find_exam_pairs(root: Path):
    pairs = []
    for folder in root.rglob("*"):
        if not folder.is_dir():
            continue
        pdfs = list(folder.glob("*.pdf"))
        if not pdfs:
            continue
        main_pdf = None
        answer_pdf = None
        for pdf in pdfs:
            name = pdf.name
            if name.startswith("A ") or "完整原卷" in name or "试卷" in name:
                if main_pdf is None:
                    main_pdf = pdf
            if name.startswith("C ") or "答案" in name:
                if answer_pdf is None:
                    answer_pdf = pdf
        if main_pdf and answer_pdf:
            pairs.append((folder, main_pdf, answer_pdf))
    return pairs


def extract_pair(main_pdf: Path, answer_pdf: Path, out_dir: Path):
    out_dir.mkdir(parents=True, exist_ok=True)
    extractor = MinerUBatchExtractorViaAPI(
        api_key=MINERU_API_KEY,
        model_version="vlm",
        poll_interval=10,
        timeout=600,
    )
    result = extractor.extract_batch([str(main_pdf), str(answer_pdf)], str(out_dir))

    md_main = None
    md_answer = None
    for item in result["items"]:
        name = str(item.get("file_name", ""))
        if Path(name).name == main_pdf.name:
            md_main = item.get("md_path")
        elif Path(name).name == answer_pdf.name:
            md_answer = item.get("md_path")
    return md_main, md_answer, result


def to_gokaku(records, exam_date: str, paper_id: str):
    out = []
    for q in records:
        out.append({
            "paperId": paper_id,
            "examDate": exam_date,
            "section": q["type"],
            "questionNumber": q["number"],
            "questionType": "single_choice",
            "content": {
                "question": q["question"],
                "options": q["options"],
                "correctAnswer": q.get("answer"),
            },
            "analysis": {
                "explanation": "待补充",
                "knowledgePoints": [],
                "difficulty": 3,
            },
            "stats": {
                "totalAttempts": 0,
                "correctRate": 0,
            }
        })
    return out


def infer_exam_date(folder_name: str):
    m = re.search(r"(20\d{2}).*?(7|07|12)", folder_name)
    if m:
        year = m.group(1)
        month = m.group(2).zfill(2)
        return f"{year}-{month}"
    return "unknown"


def main():
    print("=" * 70)
    print("批量提取所有卷子的词汇和语法题")
    print("=" * 70)

    if not MINERU_API_KEY or not DEEPSEEK_API_KEY:
        print("缺少 API Key")
        return

    pairs = find_exam_pairs(PDF_ROOT)
    print(f"找到 {len(pairs)} 组 主卷+答案 PDF")

    summary = []

    for idx, (folder, main_pdf, answer_pdf) in enumerate(pairs, 1):
        print(f"\n[{idx}/{len(pairs)}] {folder.name}")
        out_dir = OUT_ROOT / f"batch_{idx}"
        try:
            md_main, md_answer, raw_result = extract_pair(main_pdf, answer_pdf, out_dir)
            if not md_main or not md_answer:
                print("  缺少 markdown 输出，跳过")
                continue

            main_text = Path(md_main).read_text(encoding="utf-8")
            answer_text = Path(md_answer).read_text(encoding="utf-8")

            questions = parse_questions_md(main_text)
            answer_map = parse_answers_md(answer_text)

            for q in questions:
                q["answer"] = answer_map.get(q["number"])

            exam_date = infer_exam_date(folder.name)
            paper_id = exam_date + "-n1"
            gokaku = to_gokaku(questions, exam_date, paper_id)

            out_json = out_dir / "vocab_grammar_gokaku.json"
            out_json.write_text(json.dumps(gokaku, ensure_ascii=False, indent=2), encoding="utf-8")

            summary.append({
                "folder": folder.name,
                "examDate": exam_date,
                "count": len(gokaku),
                "file": str(out_json)
            })
            print(f"  done: {len(gokaku)} 题")
        except Exception as e:
            print(f"  failed: {e}")

    summary_file = OUT_ROOT / "batch_summary.json"
    summary_file.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nsummary saved: {summary_file}")

if __name__ == "__main__":
    main()
