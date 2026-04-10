"""
批量处理所有 JLPT N1 真题 PDF 文件 - 简化版
"""

import os
import sys
import json
import time
from pathlib import Path
from dotenv import load_dotenv

print("脚本开始运行...")

# 加载环境变量
load_dotenv("C:/Users/Garo/gokaku/.env.local")

# 添加 DataFlow 到路径
sys.path.insert(0, "C:/Users/Garo/DataFlow")

from dataflow.utils.kbc.mineru_api_caller import MinerUBatchExtractorViaAPI

# 配置
MINERU_API_KEY = os.getenv("MINERU_API_KEY", "")
PDF_ROOT_DIR = "D:/量化n1/资料/A 日语N1"
OUTPUT_DIR = "C:/Users/Garo/gokaku/output/batch_processed"
PROGRESS_FILE = "C:/Users/Garo/gokaku/output/batch_progress.json"

def load_progress():
    """加载进度"""
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"extracted": [], "failed": []}

def save_progress(progress):
    """保存进度"""
    with open(PROGRESS_FILE, "w", encoding="utf-8") as f:
        json.dump(progress, f, ensure_ascii=False, indent=2)

def find_all_pdfs(root_dir):
    """递归查找所有 PDF 文件"""
    pdf_files = []
    for root, dirs, files in os.walk(root_dir):
        for file in files:
            if file.lower().endswith('.pdf'):
                pdf_files.append(os.path.join(root, file))
    return pdf_files

def main():
    print("="*60)
    print("JLPT N1 批量处理脚本")
    print("="*60)

    # 创建输出目录
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # 1. 查找所有 PDF
    print(f"\n[步骤 1] 扫描 PDF 文件...")
    pdf_files = find_all_pdfs(PDF_ROOT_DIR)
    print(f"找到 {len(pdf_files)} 个 PDF 文件")

    # 加载进度
    progress = load_progress()
    extracted_files = set(progress.get("extracted", []))
    remaining_files = [f for f in pdf_files if f not in extracted_files]

    print(f"已处理: {len(extracted_files)}, 待处理: {len(remaining_files)}")

    if not remaining_files:
        print("所有文件已提取完成！")
        return

    # 检查 API Key
    if not MINERU_API_KEY:
        print("[错误] MINERU_API_KEY 未找到")
        return

    print(f"API Key: {MINERU_API_KEY[:20]}...")

    # 2. 分批提取
    print(f"\n[步骤 2] 开始提取 PDF...")

    extractor = MinerUBatchExtractorViaAPI(
        api_key=MINERU_API_KEY,
        model_version="vlm",
        poll_interval=15,
        timeout=900
    )

    batch_size = 5
    total_batches = (len(remaining_files) + batch_size - 1) // batch_size

    for i in range(0, len(remaining_files), batch_size):
        batch = remaining_files[i:i+batch_size]
        batch_num = i // batch_size + 1

        print(f"\n批次 {batch_num}/{total_batches} ({len(batch)} 个文件)")

        try:
            result = extractor.extract_batch(
                file_paths=batch,
                out_dir=os.path.join(OUTPUT_DIR, f"batch_{batch_num}")
            )

            # 保存批次结果
            batch_summary = os.path.join(OUTPUT_DIR, f"batch_{batch_num}", "extraction_summary.json")
            os.makedirs(os.path.dirname(batch_summary), exist_ok=True)
            with open(batch_summary, "w", encoding="utf-8") as f:
                json.dump(result, f, ensure_ascii=False, indent=2)

            # 更新进度
            for item in result['items']:
                if item['state'] == 'done':
                    extracted_files.add(item['file_path'])

            progress['extracted'] = list(extracted_files)
            save_progress(progress)

            print(f"批次 {batch_num} 完成！")

            # API 限流
            if i + batch_size < len(remaining_files):
                print("等待 20 秒...")
                time.sleep(20)

        except Exception as e:
            print(f"批次 {batch_num} 失败: {e}")
            progress['failed'].extend(batch)
            save_progress(progress)
            continue

    print(f"\n{'='*60}")
    print(f"提取完成！")
    print(f"成功: {len(extracted_files)}")
    print(f"失败: {len(progress.get('failed', []))}")
    print(f"{'='*60}")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"脚本错误: {e}")
        import traceback
        traceback.print_exc()
