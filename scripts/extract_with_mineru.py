"""
使用本地 MinerU 提取 JLPT 真题 PDF
"""
import os
import json
import subprocess
from pathlib import Path

# 配置
PDF_DIR = r"D:\量化n1\资料\A 日语N1"
OUTPUT_DIR = r"C:\Users\Garo\gokaku\data\mineru_output"
MARKDOWN_DIR = os.path.join(OUTPUT_DIR, "markdown")

def extract_pdf_with_mineru(pdf_path, output_dir):
    """使用 MinerU 提取单个 PDF"""
    print(f"Processing: {pdf_path}")

    # 创建输出目录
    os.makedirs(output_dir, exist_ok=True)

    # 运行 magic-pdf 命令
    cmd = [
        "magic-pdf",
        "-p", pdf_path,
        "-o", output_dir,
        "-m", "auto"  # 自动模式
    ]

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            encoding='utf-8',
            errors='ignore'
        )

        if result.returncode == 0:
            print(f"Success: {pdf_path}")
            return True
        else:
            print(f"Error: {result.stderr}")
            return False

    except Exception as e:
        print(f"Exception: {e}")
        return False

def find_all_pdfs():
    """查找所有真题 PDF"""
    pdf_files = []

    for root, dirs, files in os.walk(PDF_DIR):
        for file in files:
            if file.endswith('.pdf'):
                pdf_files.append(os.path.join(root, file))

    return pdf_files

def main():
    """主函数"""
    print("=== MinerU PDF Extraction ===")
    print(f"PDF Directory: {PDF_DIR}")
    print(f"Output Directory: {OUTPUT_DIR}")
    print()

    # 查找所有 PDF
    pdf_files = find_all_pdfs()
    print(f"Found {len(pdf_files)} PDF files")
    print()

    # 先测试第一个 PDF
    if pdf_files:
        test_pdf = pdf_files[0]
        print(f"Testing with: {test_pdf}")

        # 提取
        success = extract_pdf_with_mineru(test_pdf, OUTPUT_DIR)

        if success:
            print("\nExtraction completed!")
            print(f"Check output at: {OUTPUT_DIR}")

            # 列出生成的文件
            if os.path.exists(OUTPUT_DIR):
                print("\nGenerated files:")
                for root, dirs, files in os.walk(OUTPUT_DIR):
                    for file in files:
                        filepath = os.path.join(root, file)
                        print(f"  - {filepath}")
        else:
            print("\nExtraction failed. Check the error messages above.")
    else:
        print("No PDF files found!")

if __name__ == "__main__":
    main()
