# -*- coding: utf-8 -*-
"""
提取 PDF 文本
"""
import pdfplumber
import sys
import io

# 设置输出编码为 UTF-8
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

pdf_path = r"D:\量化n1\资料\A 日语N1\2025年12月N1 完整原卷\A 2025年12月N1完整原卷.pdf"
output_path = r"C:\Users\Garo\gokaku\pdf-extracted-text.txt"

print(f"正在提取 PDF 文本: {pdf_path}")

try:
    with pdfplumber.open(pdf_path) as pdf:
        print(f"总页数: {len(pdf.pages)}")

        all_text = ""
        for i, page in enumerate(pdf.pages):
            print(f"正在处理第 {i+1} 页...")
            text = page.extract_text()
            if text:
                all_text += f"\n\n=== 第 {i+1} 页 ===\n\n"
                all_text += text

        # 保存文本
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(all_text)

        print(f"\n提取完成！")
        print(f"文本已保存到: {output_path}")
        print(f"总字符数: {len(all_text)}")

        # 显示前 1000 字符预览
        print(f"\n前 1000 字符预览:")
        print(all_text[:1000])

except Exception as e:
    print(f"错误: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
