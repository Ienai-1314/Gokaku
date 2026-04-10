#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PDF 资料分类脚本
根据文件名和路径将 203 个 PDF 分类为：词汇、语法、阅读、听力、真题试卷、答案解析
"""

import os
import json
from pathlib import Path

# 资料根目录
RESOURCE_DIR = r"D:\量化n1\资料"
OUTPUT_DIR = r"C:\Users\Garo\gokaku\output"

# 分类规则
CLASSIFICATION_RULES = {
    "vocabulary": {
        "keywords": ["词汇", "单词", "vocabulary", "N1词汇合集", "副词"],
        "description": "词汇相关资料"
    },
    "grammar": {
        "keywords": ["语法", "grammar", "文法", "句型"],
        "description": "语法相关资料"
    },
    "reading": {
        "keywords": ["阅读", "reading", "読解", "文章"],
        "description": "阅读理解资料"
    },
    "listening": {
        "keywords": ["听力", "listening", "聴解", "音频", "原文", "即时应答"],
        "description": "听力相关资料"
    },
    "exam_paper": {
        "keywords": ["真题试卷", "完整原卷", "高清打印版", "原卷"],
        "exclude": ["答案", "解析", "听力原文"],
        "description": "真题试卷"
    },
    "answer": {
        "keywords": ["答案", "answer", "解析", "详细答案", "标准答案"],
        "description": "答案和解析"
    },
    "comprehensive": {
        "keywords": ["惯用语", "总结", "合集"],
        "description": "综合资料"
    }
}

def classify_pdf(file_path: str) -> str:
    """
    根据文件路径和名称分类 PDF
    """
    file_name = os.path.basename(file_path)
    file_path_lower = file_path.lower()
    file_name_lower = file_name.lower()

    # 优先匹配答案（避免被误分类为试卷）
    if any(kw in file_name_lower or kw in file_path_lower for kw in CLASSIFICATION_RULES["answer"]["keywords"]):
        return "answer"

    # 匹配真题试卷（排除答案和解析）
    if any(kw in file_name_lower or kw in file_path_lower for kw in CLASSIFICATION_RULES["exam_paper"]["keywords"]):
        if not any(kw in file_name_lower for kw in CLASSIFICATION_RULES["exam_paper"].get("exclude", [])):
            return "exam_paper"

    # 匹配听力
    if any(kw in file_name_lower or kw in file_path_lower for kw in CLASSIFICATION_RULES["listening"]["keywords"]):
        return "listening"

    # 匹配词汇
    if any(kw in file_name_lower or kw in file_path_lower for kw in CLASSIFICATION_RULES["vocabulary"]["keywords"]):
        return "vocabulary"

    # 匹配语法
    if any(kw in file_name_lower or kw in file_path_lower for kw in CLASSIFICATION_RULES["grammar"]["keywords"]):
        return "grammar"

    # 匹配阅读
    if any(kw in file_name_lower or kw in file_path_lower for kw in CLASSIFICATION_RULES["reading"]["keywords"]):
        return "reading"

    # 匹配综合资料
    if any(kw in file_name_lower or kw in file_path_lower for kw in CLASSIFICATION_RULES["comprehensive"]["keywords"]):
        return "comprehensive"

    # 默认分类为其他
    return "other"

def extract_year_month(file_path: str) -> dict:
    """
    从文件名提取年份和月份
    """
    import re
    file_name = os.path.basename(file_path)

    # 匹配 YYYY年MM月 或 YYYYMM 格式
    year_month_pattern = r'(\d{4})年?(\d{1,2})月?'
    match = re.search(year_month_pattern, file_name)

    if match:
        year = match.group(1)
        month = match.group(2).zfill(2)
        return {"year": year, "month": month}

    return {"year": None, "month": None}

def main():
    import sys
    import io
    # 修复 Windows 控制台编码问题
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

    print("开始扫描和分类 PDF 资料...")

    # 读取 PDF 列表
    pdf_list_file = r"C:\Users\Garo\gokaku\scripts\all_pdfs_list.txt"
    with open(pdf_list_file, 'r', encoding='utf-8') as f:
        pdf_files = [line.strip() for line in f if line.strip()]

    print(f"共找到 {len(pdf_files)} 个 PDF 文件")

    # 分类统计
    classification_result = {
        "vocabulary": [],
        "grammar": [],
        "reading": [],
        "listening": [],
        "exam_paper": [],
        "answer": [],
        "comprehensive": [],
        "other": []
    }

    # 逐个分类
    for pdf_file in pdf_files:
        full_path = os.path.join(RESOURCE_DIR, pdf_file.lstrip('./'))
        category = classify_pdf(pdf_file)
        year_month = extract_year_month(pdf_file)

        classification_result[category].append({
            "path": full_path,
            "relative_path": pdf_file,
            "filename": os.path.basename(pdf_file),
            "year": year_month["year"],
            "month": year_month["month"]
        })

    # 输出统计
    print("\n分类统计：")
    for category, files in classification_result.items():
        count = len(files)
        desc = CLASSIFICATION_RULES.get(category, {}).get("description", "其他")
        print(f"  {category:15s} ({desc:15s}): {count:3d} 个文件")

    # 保存分类结果
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    output_file = os.path.join(OUTPUT_DIR, "pdf_classification.json")

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(classification_result, f, ensure_ascii=False, indent=2)

    print(f"\n分类结果已保存到: {output_file}")

    # 生成分类报告
    report_file = os.path.join(OUTPUT_DIR, "classification_report.md")
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write("# PDF 资料分类报告\n\n")
        f.write(f"**总计：** {len(pdf_files)} 个 PDF 文件\n\n")

        for category, files in classification_result.items():
            if not files:
                continue

            desc = CLASSIFICATION_RULES.get(category, {}).get("description", "其他")
            f.write(f"## {category} - {desc} ({len(files)} 个)\n\n")

            for file_info in files:
                f.write(f"- `{file_info['filename']}`")
                if file_info['year'] and file_info['month']:
                    f.write(f" ({file_info['year']}-{file_info['month']})")
                f.write("\n")

            f.write("\n")

    print(f"分类报告已保存到: {report_file}")

if __name__ == "__main__":
    main()
