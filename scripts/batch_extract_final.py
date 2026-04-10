"""
使用 DataFlow + MinerU API 批量提取分类后的 PDF
基于成功的 extract_jlpt_with_dataflow.py
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
MINERU_API_KEY = os.getenv("MINERU_API_KEY", "sk_0Aq8Ry1Ks5Ub7Ct4Dg9Hj2Lp6Mn3Vf8Wx")
CLASSIFICATION_FILE = r"C:\Users\Garo\gokaku\output\pdf_classification.json"
OUTPUT_BASE = r"C:\Users\Garo\gokaku\output\batch_classified_final"

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

    print(f"\n文件列表:")
    for i, pdf_path in enumerate(pdf_paths, 1):
        filename = os.path.basename(pdf_path)
        size_mb = Path(pdf_path).stat().st_size / 1024 / 1024
        print(f"  {i}. {filename} ({size_mb:.1f} MB)")

    # 创建 MinerU API 客户端
    print(f"\n初始化 MinerU API 客户端...")
    extractor = MinerUBatchExtractorViaAPI(
        api_key=MINERU_API_KEY,
        model_version="vlm",
        poll_interval=10,
        timeout=1800
    )

    # 批量提取
    try:
        print(f"\n开始批量提取...")
        result_dict = extractor.extract_batch(pdf_paths, output_dir)

        items = result_dict.get("items", [])

        # 统计结果
        success_count = 0
        failed_files = []

        for item in items:
            filename = item.get("file_name", "Unknown")
            state = item.get("state", "unknown")
            md_path = item.get("md_path")

            if md_path and os.path.exists(md_path):
                success_count += 1
                print(f"  ✓ {filename}")
            else:
                failed_files.append({
                    "file": filename,
                    "state": state,
                    "error": f"State: {state}, no md_path"
                })
                print(f"  ✗ {filename}: {state}")

        print(f"\n提取完成: {success_count}/{len(pdf_paths)} 成功")

        # 保存结果
        result_file = os.path.join(output_dir, "extraction_results.json")
        with open(result_file, 'w', encoding='utf-8') as f:
            json.dump({
                "category": category,
                "total": len(pdf_paths),
                "success": success_count,
                "failed": len(failed_files),
                "failed_files": failed_files,
                "result": result_dict
            }, f, ensure_ascii=False, indent=2)

        return {
            "category": category,
            "total": len(pdf_paths),
            "success": success_count,
            "failed": len(failed_files)
        }

    except Exception as e:
        print(f"\n提取失败: {e}")
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

    print("="*60)
    print("批量提取分类后的 PDF - DataFlow + MinerU API")
    print("="*60)

    # 检查 API Key
    if not MINERU_API_KEY:
        print("\n[ERROR] MINERU_API_KEY not found")
        return

    print(f"\n[OK] API Key: {MINERU_API_KEY[:20]}...")

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

    print("\n"+"="*60)
    print("所有提取任务完成！")
    print("="*60)
    print(f"\n总结果保存到: {summary_file}")

    # 打印总结
    print("\n总结:")
    total_success = 0
    total_files = 0
    for result in all_results:
        total_success += result['success']
        total_files += result['total']
        print(f"  {result['category']:15s}: {result['success']}/{result['total']} 成功")

    print(f"\n总计: {total_success}/{total_files} 成功")

if __name__ == "__main__":
    main()
