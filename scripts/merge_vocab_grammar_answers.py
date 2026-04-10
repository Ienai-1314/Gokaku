"""
将 31-40 题与答案 31-40 对齐，并转换为 Gokaku 导入格式
"""

import json
from pathlib import Path

QUESTIONS_FILE = Path(r"C:/Users/Garo/gokaku/output/questions_2025_12_vocab_grammar.json")
ANSWERS_FILE = Path(r"C:/Users/Garo/gokaku/output/answer_map_2025_12.json")
OUT_FILE = Path(r"C:/Users/Garo/gokaku/output/questions_2025_12_vocab_grammar_gokaku.json")

EXAM_DATE = "2025-12"
PAPER_ID = "2025-12-n1"


def map_section(qtype: str):
    if qtype == "vocabulary":
        return "vocabulary"
    return "grammar"


def main():
    questions = json.loads(QUESTIONS_FILE.read_text(encoding="utf-8"))["questions"]
    answer_map = json.loads(ANSWERS_FILE.read_text(encoding="utf-8"))

    out = []
    for q in questions:
        num = q["number"]
        ans = answer_map.get(str(num)) or answer_map.get(num)
        out.append({
            "paperId": PAPER_ID,
            "examDate": EXAM_DATE,
            "section": map_section(q["type"]),
            "questionNumber": num,
            "questionType": "single_choice",
            "content": {
                "question": q["question"],
                "options": q["options"],
                "correctAnswer": ans,
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

    OUT_FILE.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"saved: {OUT_FILE}")
    print(f"total records: {len(out)}")
    for item in out:
        print(item["questionNumber"], item["section"], item["content"]["correctAnswer"])

if __name__ == "__main__":
    main()
