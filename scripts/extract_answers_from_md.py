"""
从答案 PDF 的 Markdown 中提取答案映射
输入: mineru_extracted/4/full.md
输出: output/answer_map_2025_12.json
"""

import json
import re
from pathlib import Path

MD_PATH = Path(r"C:/Users/Garo/gokaku/output/mineru_extracted/4/full.md")
OUT_PATH = Path(r"C:/Users/Garo/gokaku/output/answer_map_2025_12.json")

SECTION_MAP = {
    "問題5": "vocabulary",
    "問題6": "grammar",
    "問題7": "reading",
    "問題8": "reading",
    "問題9": "reading",
    "問題10": "reading",
    "問題11": "reading",
    "問題12": "reading",
    "問題13": "reading",
}

def parse_tables(md: str):
    answer_map = {}

    current_problem = None
    for line in md.splitlines():
        line = line.strip()
        if not line:
            continue

        if line.startswith("問題"):
            current_problem = line
            continue

        if line.startswith("<table>") and current_problem:
            nums = re.findall(r"\((\d+)\)", line)
            vals = re.findall(r"<tr><td>(\d+)</td>|<td>(\d+)</td>", line)
            if nums:
                # 第二行的答案需要从整个 table 里抓所有 td 数字，再截取后半段
                flat_vals = re.findall(r">(\d+)<", line)
                # flat_vals 前半是题号，后半是答案，不严格但对当前格式够用
                if len(flat_vals) >= len(nums) * 2:
                    answers = flat_vals[len(nums):len(nums)*2]
                else:
                    answers = flat_vals[-len(nums):]
                for n, a in zip(nums, answers):
                    answer_map[int(n)] = int(a)

    return answer_map


def main():
    text = MD_PATH.read_text(encoding="utf-8")
    answer_map = parse_tables(text)
    OUT_PATH.write_text(json.dumps(answer_map, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"saved: {OUT_PATH}")
    print(f"total answers: {len(answer_map)}")
    preview = list(answer_map.items())[:15]
    print(preview)

if __name__ == "__main__":
    main()
