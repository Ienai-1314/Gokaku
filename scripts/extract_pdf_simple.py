#!/usr/bin/env python3
"""
简化版PDF提取脚本 - 使用Tesseract OCR（免费开源）
适合日语PDF识别，无需API Key
"""

import os
import sys
from pathlib import Path
from pdf2image import convert_from_path
import pytesseract
from PIL import Image

# 配置Tesseract路径（Windows）
# 下载地址：https://github.com/UB-Mannheim/tesseract/wiki
TESSERACT_PATH = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

def setup_tesseract():
    """配置Tesseract"""
    if os.path.exists(TESSERACT_PATH):
        pytesseract.pytesseract.tesseract_cmd = TESSERACT_PATH
        print(f"✅ Tesseract已配置: {TESSERACT_PATH}")
        return True
    else:
        print(f"❌ Tesseract未安装，请下载安装：")
        print("   https://github.com/UB-Mannheim/tesseract/wiki")
        print(f"   安装到: {TESSERACT_PATH}")
        return False

def extract_pdf_to_text(pdf_path, output_path):
    """提取PDF为文本（日语OCR）"""
    print(f"\n开始提取: {pdf_path}")

    # 转换PDF为图片
    print("正在转换PDF为图片...")
    images = convert_from_path(pdf_path, dpi=300)
    print(f"共 {len(images)} 页")

    all_text = []
    for i, image in enumerate(images, 1):
        print(f"正在识别第 {i}/{len(images)} 页...", end=' ')

        # 使用Tesseract OCR识别日语
        # lang='jpn' 表示日语，需要下载日语语言包
        text = pytesseract.image_to_string(image, lang='jpn')

        all_text.append(f"=== 第 {i} 页 ===\n{text}\n")
        print("✓")

    # 保存结果
    full_text = '\n'.join(all_text)
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(full_text)

    print(f"✅ 提取完成: {output_path}")
    return full_text

def batch_extract(pdf_dir, output_dir):
    """批量提取PDF目录"""
    pdf_dir = Path(pdf_dir)
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    pdf_files = list(pdf_dir.glob('**/*.pdf'))
    print(f"\n找到 {len(pdf_files)} 个PDF文件")

    for i, pdf_path in enumerate(pdf_files, 1):
        print(f"\n[{i}/{len(pdf_files)}] {pdf_path.name}")

        output_name = pdf_path.stem + '_ocr.txt'
        output_path = output_dir / output_name

        if output_path.exists():
            print("⏭️  已存在，跳过")
            continue

        try:
            extract_pdf_to_text(str(pdf_path), str(output_path))
        except Exception as e:
            print(f"❌ 失败: {e}")
            continue

if __name__ == '__main__':
    print("=" * 60)
    print("Tesseract OCR PDF提取工具（免费开源）")
    print("=" * 60)

    # 检查Tesseract
    if not setup_tesseract():
        print("\n安装步骤：")
        print("1. 下载安装程序：https://github.com/UB-Mannheim/tesseract/wiki")
        print("2. 安装时选择日语语言包（jpn.traineddata）")
        print("3. 重新运行此脚本")
        sys.exit(1)

    # 测试单个文件
    test_pdf = r'D:\量化n1\资料\A 日语N1\2025年12月N1 完整原卷\A 2025年12月N1完整原卷.pdf'
    test_output = r'C:\Users\Garo\gokaku\output\2025_12_n1_tesseract.txt'

    if os.path.exists(test_pdf):
        extract_pdf_to_text(test_pdf, test_output)
    else:
        print(f"测试文件不存在: {test_pdf}")

    # 批量提取（可选）
    # batch_extract(
    #     r'D:\量化n1\资料\A 日语N1',
    #     r'C:\Users\Garo\gokaku\output\ocr_texts'
    # )
