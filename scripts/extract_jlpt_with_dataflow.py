"""
使用 DataFlow + MinerU API 提取 JLPT 真题
无需本地模型，直接调用 MinerU API
"""

import os
import sys
import json
from pathlib import Path
from dotenv import load_dotenv

# 加载环境变量
load_dotenv("C:/Users/Garo/gokaku/.env.local")

# 添加 DataFlow 到路径
sys.path.insert(0, "C:/Users/Garo/DataFlow")

from dataflow.utils.kbc.mineru_api_caller import MinerUBatchExtractorViaAPI

# 配置
MINERU_API_KEY = os.getenv("MINERU_API_KEY", "")
PDF_DIR = "D:/量化n1/资料/A 日语N1/2025年12月N1 完整原卷"
OUTPUT_DIR = "C:/Users/Garo/gokaku/output/mineru_extracted"

def main():
    print("=" * 60)
    print("JLPT N1 PDF Extraction - DataFlow + MinerU API")
    print("=" * 60)

    # 检查 API Key
    if not MINERU_API_KEY:
        print("[ERROR] MINERU_API_KEY not found")
        print("Please configure MINERU_API_KEY in .env.local")
        return

    print(f"[OK] API Key: {MINERU_API_KEY[:20]}...")

    # 查找 PDF 文件
    pdf_files = list(Path(PDF_DIR).glob("*.pdf"))

    if not pdf_files:
        print(f"[ERROR] No PDF files found: {PDF_DIR}")
        return

    print(f"\n[INFO] Found {len(pdf_files)} PDF files:")
    for pdf in pdf_files:
        print(f"  - {pdf.name} ({pdf.stat().st_size / 1024 / 1024:.1f} MB)")

    # 创建 MinerU API 客户端
    print("\n[INFO] Initializing MinerU API client...")
    extractor = MinerUBatchExtractorViaAPI(
        api_key=MINERU_API_KEY,
        model_version="vlm",  # 使用 VLM 模型
        poll_interval=10,     # 每 10 秒轮询一次
        timeout=600           # 10 分钟超时
    )

    # 提取 PDF
    print("\n[INFO] Uploading PDFs to MinerU API...")
    print("[INFO] This may take a few minutes, please wait...")

    try:
        result = extractor.extract_batch(
            file_paths=[str(p) for p in pdf_files],
            out_dir=OUTPUT_DIR
        )

        print("\n[SUCCESS] Extraction completed!")
        print(f"[INFO] Batch ID: {result['batch_id']}")
        print(f"[INFO] Output directory: {result['output_dir']}")
        print(f"[INFO] Files processed: {result['num_files']}")

        print("\n[INFO] Extraction results:")
        for item in result['items']:
            print(f"\n  File: {item['file_name']}")
            print(f"  State: {item['state']}")
            print(f"  Markdown: {item['md_path']}")

        # 保存结果摘要
        summary_path = os.path.join(OUTPUT_DIR, "extraction_summary.json")
        with open(summary_path, "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=2)

        print(f"\n[INFO] Summary saved: {summary_path}")

        return result

    except Exception as e:
        print(f"\n[ERROR] Extraction failed: {e}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    main()
