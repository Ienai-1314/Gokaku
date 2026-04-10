"""
简化测试版本 - 只处理前 2 个 PDF
"""

import os
import sys
import json
from pathlib import Path
from dotenv import load_dotenv

# 设置 UTF-8 编码
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# 加载环境变量
load_dotenv("C:/Users/Garo/gokaku/.env.local")

# 添加 DataFlow 到路径
sys.path.insert(0, "C:/Users/Garo/DataFlow")

from dataflow.utils.kbc.mineru_api_caller import MinerUBatchExtractorViaAPI

# 配置
MINERU_API_KEY = os.getenv("MINERU_API_KEY", "")
PDF_ROOT_DIR = "D:/量化n1/资料/A 日语N1"
OUTPUT_DIR = "C:/Users/Garo/gokaku/output/test_batch"

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
    print("JLPT N1 批量处理测试")
    print("="*60)

    # 创建输出目录
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # 1. 查找所有 PDF
    print(f"\n[INFO] 扫描 PDF 文件: {PDF_ROOT_DIR}")
    pdf_files = find_all_pdfs(PDF_ROOT_DIR)
    print(f"[OK] 找到 {len(pdf_files)} 个 PDF 文件")

    # 只处理前 2 个
    test_files = pdf_files[:2]
    print(f"\n[INFO] 测试处理前 2 个文件:")
    for f in test_files:
        print(f"  - {os.path.basename(f)}")

    # 2. 检查 API Key
    if not MINERU_API_KEY:
        print("[ERROR] MINERU_API_KEY not found")
        return

    print(f"\n[OK] API Key: {MINERU_API_KEY[:20]}...")

    # 3. 提取 PDF
    print("\n[INFO] 初始化 MinerU API 客户端...")
    extractor = MinerUBatchExtractorViaAPI(
        api_key=MINERU_API_KEY,
        model_version="vlm",
        poll_interval=10,
        timeout=600
    )

    print("[INFO] 开始提取 PDF...")
    try:
        result = extractor.extract_batch(
            file_paths=test_files,
            out_dir=OUTPUT_DIR
        )

        print("\n[SUCCESS] 提取完成！")
        print(f"[INFO] Batch ID: {result['batch_id']}")
        print(f"[INFO] 处理文件数: {result['num_files']}")

        # 保存结果
        summary_path = os.path.join(OUTPUT_DIR, "test_summary.json")
        with open(summary_path, "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=2)

        print(f"\n[INFO] 结果已保存: {summary_path}")

        # 显示结果
        for item in result['items']:
            print(f"\n  文件: {item['file_name']}")
            print(f"  状态: {item['state']}")
            if item.get('md_path'):
                print(f"  Markdown: {item['md_path']}")

    except Exception as e:
        print(f"\n[ERROR] 提取失败: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
