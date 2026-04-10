"""
过滤批量结果中的无效目录，并导入有效的词汇/语法题到数据库
"""
import json
import os
import subprocess
from pathlib import Path

SUMMARY = Path(r"C:/Users/Garo/gokaku/output/batch_processed/batch_summary.json")
MERGED = Path(r"C:/Users/Garo/gokaku/output/all_vocab_grammar_gokaku_filtered.json")

VALID_FOLDERS_EXCLUDE = {"答案解析"}


def main():
    summary = json.loads(SUMMARY.read_text(encoding="utf-8"))
    all_items = []

    for item in summary:
        folder = item.get("folder", "")
        if folder in VALID_FOLDERS_EXCLUDE:
            print(f"skip invalid folder: {folder}")
            continue
        file_path = Path(item["file"])
        if not file_path.exists():
            print(f"missing file: {file_path}")
            continue
        data = json.loads(file_path.read_text(encoding="utf-8"))
        all_items.extend(data)
        print(f"include {folder}: {len(data)} records")

    MERGED.write_text(json.dumps(all_items, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"saved filtered merged file: {MERGED}")
    print(f"total valid records: {len(all_items)}")

if __name__ == '__main__':
    main()
