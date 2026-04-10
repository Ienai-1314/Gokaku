"""
使用 Node 侧 CloudBase 兼容方式导入合并后的词汇/语法题
"""
import json
from pathlib import Path

OUT = Path(r"C:/Users/Garo/gokaku/output/import_todo_summary.json")
DATA = Path(r"C:/Users/Garo/gokaku/output/all_vocab_grammar_gokaku_filtered.json")


def main():
    items = json.loads(DATA.read_text(encoding="utf-8"))
    # 这里只先做摘要，真正导入交给 TS 脚本执行
    by_exam = {}
    for x in items:
        key = x.get("examDate", "unknown")
        by_exam[key] = by_exam.get(key, 0) + 1
    summary = {
        "total": len(items),
        "by_exam": by_exam,
        "data_file": str(DATA)
    }
    OUT.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"saved: {OUT}")
    print(summary)

if __name__ == '__main__':
    main()
