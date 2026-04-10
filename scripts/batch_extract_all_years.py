#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
批量提取 2020-2025 年所有 N1 真题的词汇和语法题
"""

import os
import sys
import json
from pathlib import Path
from dotenv import load_dotenv

# 加载环境变量
load_dotenv(r'C:\Users\Garo\gokaku\.env.local')

# 添加 DataFlow 路径
sys.path.insert(0, r'C:\Users\Garo\DataFlow')

from dataflow.utils.kbc.mineru_api_caller import MinerUBatchExtractorViaAPI

# 配置
BASE_DIR = Path(r'D:\量化n1\资料\A 日语N1')
OUTPUT_DIR = Path(r'C:\Users\Garo\gokaku\output\batch_all_years')
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# 待处理的试卷列表
PAPERS = [
    {
        'path': BASE_DIR / 'N1(202012-202507高清打印卷 含解析答案）/N1高清打印版仅试卷（202012-202507）/2020年12月日语N1真题试卷（高清打印版）.pdf',
        'exam_date': '2020-12',
        'paper_id': '2020-12-n1'
    },
    {
        'path': BASE_DIR / 'N1(202012-202507高清打印卷 含解析答案）/N1高清打印版仅试卷（202012-202507）/2021年07月日语N1真题试卷（高清打印版）.pdf',
        'exam_date': '2021-07',
        'paper_id': '2021-07-n1'
    },
    {
        'path': BASE_DIR / 'N1(202012-202507高清打印卷 含解析答案）/N1高清打印版仅试卷（202012-202507）/2022年07月日语N1真题试卷（高清打印版）.pdf',
        'exam_date': '2022-07',
        'paper_id': '2022-07-n1'
    },
    {
        'path': BASE_DIR / 'N1(202012-202507高清打印卷 含解析答案）/N1高清打印版仅试卷（202012-202507）/2022年12月日语N1真题试卷（高清打印版）.pdf',
        'exam_date': '2022-12',
        'paper_id': '2022-12-n1'
    },
    {
        'path': BASE_DIR / 'N1(202012-202507高清打印卷 含解析答案）/N1高清打印版仅试卷（202012-202507）/2023年07月日语N1真题试卷（高清打印版）.pdf',
        'exam_date': '2023-07',
        'paper_id': '2023-07-n1'
    },
    {
        'path': BASE_DIR / 'N1(202012-202507高清打印卷 含解析答案）/N1高清打印版仅试卷（202012-202507）/2023年12月日语N1真题试卷（高清打印版）.pdf',
        'exam_date': '2023-12',
        'paper_id': '2023-12-n1'
    },
    {
        'path': BASE_DIR / 'N1(202012-202507高清打印卷 含解析答案）/N1高清打印版仅试卷（202012-202507）/2024年12月日语N1真题试卷（高清打印版）.pdf',
        'exam_date': '2024-12',
        'paper_id': '2024-12-n1'
    },
    {
        'path': BASE_DIR / 'N1 2025年7月原卷+听力音频/N1 2025年7月完整版原卷.pdf',
        'exam_date': '2025-07',
        'paper_id': '2025-07-n1'
    },
]

def main():
    print(f"Starting batch extraction for {len(PAPERS)} papers...")

    # 检查 API Key
    api_key = os.getenv('MINERU_API_KEY', '')
    if not api_key:
        print("ERROR: MINERU_API_KEY not found in environment")
        return

    # 过滤存在的文件
    valid_papers = []
    for paper in PAPERS:
        if paper['path'].exists():
            valid_papers.append(paper)
        else:
            print(f"WARNING: File not found: {paper['path']}")

    if not valid_papers:
        print("ERROR: No valid PDF files found")
        return

    print(f"Found {len(valid_papers)} valid papers")

    # 创建 MinerU API 客户端
    extractor = MinerUBatchExtractorViaAPI(
        api_key=api_key,
        model_version="vlm",
        poll_interval=10,
        timeout=600
    )

    # 批量提取
    try:
        print("\nUploading PDFs to MinerU API...")
        result = extractor.extract_batch(
            file_paths=[str(p['path']) for p in valid_papers],
            out_dir=str(OUTPUT_DIR)
        )

        print("\nExtraction completed!")
        print(f"Batch ID: {result.get('batch_id', 'N/A')}")
        print(f"Output directory: {OUTPUT_DIR}")

        # 保存元数据
        for i, paper in enumerate(valid_papers):
            metadata = {
                'exam_date': paper['exam_date'],
                'paper_id': paper['paper_id'],
                'pdf_path': str(paper['path']),
                'status': 'success'
            }
            metadata_path = OUTPUT_DIR / f"{paper['paper_id']}_metadata.json"
            with open(metadata_path, 'w', encoding='utf-8') as f:
                json.dump(metadata, f, ensure_ascii=False, indent=2)

        # 保存批次结果
        summary_path = OUTPUT_DIR / 'batch_summary.json'
        with open(summary_path, 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2)

        print(f"\nSummary saved: {summary_path}")

    except Exception as e:
        print(f"\nERROR: Extraction failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
