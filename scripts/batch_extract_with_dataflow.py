#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
使用 DataFlow 本地方法批量提取 PDF
基于之前成功的 extract_jlpt_with_dataflow.py
"""

import os
import sys
import json
from pathlib import Path

# 添加 DataFlow 到路径
DATAFLOW_PATH = r"C:\Users\Garo\DataFlow"
sys.path.insert(0, DATAFLOW_PATH)

from llm_data_extraction.pipeline import Pipeline
from llm_data_extraction.operator.mineru_operator import MinerUBatchExtractorViaAPI

# 配置
MINERU_API_KEY = "sk_0Aq8Ry1Ks5Ub7Ct4Dg9Hj2Lp6Mn3Vf8Wx"
CLASSIFICATION_FILE = r"C:\Users\Garo\gokaku\output\pdf_classification.json"
OUTPUT_BASE = r"C:\Users\Garo\gokaku\output\batch_classified_v3"

def extract_category(category: str, files: list):
    """
    提取某个类别的所有 PDF
    """
    print(f"\n{'='*60}")
    print(f"提取类别: {category} ({len(files)} 个文件)")
    print(f"{'='*60}")

    # 创建输出目录
    output_dir = os.path.join(OUTPUT_BASE, category)
    os.makedirs(output_dir, exist_ok=True)

    # 准备文件路径
    pdf_paths = [f["path"] for f in files]

    # 创建 Pipeline
    pipeline = Pipeline()

    # 添加 MinerU 提取步骤
    pipeline.add_operator(
        MinerUBatchExtractorViaAPI(
            api_key=MINERU_API_KEY,
            model_version="v2",
            poll_interval=10,
            timeout=1800
        )
    )

    # 执行提取
    try:
        print(f"开始提取 {len(pdf_paths)} 个文件...")
        results = pipeline.run({
            "pdf_paths": pdf_paths,
            "output_dir": output_dir
        })

        # 统计结果
        success_count = 0
        for pdf_path in pdf_paths:
            filename = os.path.basename(pdf_path)
            md_file = os.path.join(output_dir, f"{Path(filename).stem}.md")
            if os.path.exists(md_file):
                success_count += 1
                print(f"  ✓ {filename}")
            else:
                print(f"  ✗ {filename}")

        print(f"\n提取完成: {success_count}/{len(pdf_paths)} 成功")

        return {
            "category": category,
            "total": len(pdf_paths),
            "success": success_count,
            "failed": len(pdf_paths) - success_count
        }

    except Exception as e:
        print(f"提取失败: {e}")
        import traceback
        traceback.print_exc()
        return {
            "category": category,
            "total": len(pdf_paths),
            "success": 0,
            "failed": len(pdf_paths),
            "error": str(e)
        }

def main():
    sys.stdout = __import__('io').TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

    print("使用 DataFlow 批量提取分类后的 PDF...")

    # 读取分类结果
    with open(CLASSIFICATION_FILE, 'r', encoding='utf-8') as f:
        classification = json.load(f)

    # 优先提取的类别
    priority_categories = ["exam_paper", "vocabulary", "grammar"]

    all_results = []

    for category in priority_categories:
        files = classification.get(category, [])
        if not files:
            print(f"\n跳过 {category}：无文件")
            continue

        result = extract_category(category, files)
        all_results.append(result)

    # 保存总结果
    summary_file = os.path.join(OUTPUT_BASE, "extraction_summary.json")
    os.makedirs(OUTPUT_BASE, exist_ok=True)
    with open(summary_file, 'w', encoding='utf-8') as f:
        json.dump(all_results, f, ensure_ascii=False, indent=2)

    print("\n所有提取任务完成！")
    print(f"总结果保存到: {summary_file}")

    # 打印总结
    print("\n总结:")
    for result in all_results:
        print(f"  {result['category']}: {result['success']}/{result['total']} 成功")

if __name__ == "__main__":
    main()
