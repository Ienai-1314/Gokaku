#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
使用 DataFlow 批量提取分类后的 PDF
优先提取：真题试卷、词汇、语法资料
"""

import os
import sys
import json
from pathlib import Path

# 添加 DataFlow 路径
sys.path.insert(0, r'C:\Users\Garo\DataFlow')

from llm_data_extraction.extractor.mineru_extractor import MinerUBatchExtractorViaAPI

# 配置
MINERU_API_KEY = "sk_0Aq8Ry1Ks5Ub7Ct4Dg9Hj2Lp6Mn3Vf8Wx"
CLASSIFICATION_FILE = r"C:\Users\Garo\gokaku\output\pdf_classification.json"
OUTPUT_BASE = r"C:\Users\Garo\gokaku\output\batch_classified"

def main():
    print("开始批量提取分类后的 PDF...")

    # 读取分类结果
    with open(CLASSIFICATION_FILE, 'r', encoding='utf-8') as f:
        classification = json.load(f)

    # 优先提取的类别
    priority_categories = ["exam_paper", "vocabulary", "grammar"]

    for category in priority_categories:
        files = classification.get(category, [])
        if not files:
            print(f"\n跳过 {category}：无文件")
            continue

        print(f"\n{'='*60}")
        print(f"提取类别: {category} ({len(files)} 个文件)")
        print(f"{'='*60}")

        # 准备文件路径列表
        file_paths = [f["path"] for f in files]

        # 创建输出目录
        output_dir = os.path.join(OUTPUT_BASE, category)
        os.makedirs(output_dir, exist_ok=True)

        # 使用 MinerU API 批量提取
        try:
            extractor = MinerUBatchExtractorViaAPI(
                api_key=MINERU_API_KEY,
                model_version="v2",
                poll_interval=10,
                timeout=1800
            )

            print(f"开始提取 {len(file_paths)} 个文件...")
            results = extractor.extract_batch(file_paths, output_dir)

            # 统计结果
            success_count = sum(1 for r in results if r.get("status") == "success")
            print(f"\n提取完成: {success_count}/{len(file_paths)} 成功")

            # 保存提取结果
            result_file = os.path.join(output_dir, "extraction_results.json")
            with open(result_file, 'w', encoding='utf-8') as f:
                json.dump(results, f, ensure_ascii=False, indent=2)

        except Exception as e:
            print(f"提取失败: {e}")
            import traceback
            traceback.print_exc()

    print("\n所有提取任务完成！")

if __name__ == "__main__":
    main()
