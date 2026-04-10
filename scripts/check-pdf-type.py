# -*- coding: utf-8 -*-
"""
检查 PDF 类型并尝试 OCR
"""
import pdfplumber
from PIL import Image
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

pdf_path = r"D:\量化n1\资料\A 日语N1\2025年12月N1 完整原卷\A 2025年12月N1完整原卷.pdf"

print(f"检查 PDF: {pdf_path}\n")

try:
    with pdfplumber.open(pdf_path) as pdf:
        print(f"总页数: {len(pdf.pages)}\n")

        # 检查前 3 页
        for i in range(min(3, len(pdf.pages))):
            page = pdf.pages[i]
            print(f"=== 第 {i+1} 页 ===")

            # 尝试提取文本
            text = page.extract_text()
            print(f"文本长度: {len(text) if text else 0}")

            # 检查是否有图片
            images = page.images
            print(f"图片数量: {len(images)}")

            # 检查页面尺寸
            print(f"页面尺寸: {page.width} x {page.height}")

            if text and len(text) > 0:
                print(f"文本预览: {text[:200]}")
            else:
                print("⚠️ 这是扫描版 PDF，需要 OCR")

            print()

except Exception as e:
    print(f"错误: {e}")
    import traceback
    traceback.print_exc()
