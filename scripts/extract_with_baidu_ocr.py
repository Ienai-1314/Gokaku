#!/usr/bin/env python3
"""
使用百度OCR API提取PDF真题
需要先安装: pip install baidu-aip PyPDF2 Pillow pdf2image
"""

import os
import json
import base64
from pathlib import Path
from aip import AipOcr
from pdf2image import convert_from_path
import tempfile

# 百度OCR配置
APP_ID = 'YOUR_APP_ID'
API_KEY = 'YOUR_API_KEY'
SECRET_KEY = 'YOUR_SECRET_KEY'

# 初始化百度OCR客户端
client = AipOcr(APP_ID, API_KEY, SECRET_KEY)

def pdf_to_images(pdf_path):
    """将PDF转换为图片列表"""
    print(f"正在转换PDF: {pdf_path}")
    images = convert_from_path(pdf_path, dpi=300)
    return images

def ocr_image(image):
    """对单张图片进行OCR识别"""
    # 将PIL Image转换为字节
    with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmp:
        image.save(tmp.name, 'PNG')
        with open(tmp.name, 'rb') as f:
            img_bytes = f.read()
        os.unlink(tmp.name)

    # 调用百度OCR API
    options = {
        'language_type': 'JAP',  # 日语识别
        'detect_direction': 'true',
        'detect_language': 'true',
        'probability': 'true'
    }

    result = client.basicAccurate(img_bytes, options)

    # 提取文本
    if 'words_result' in result:
        text_lines = [item['words'] for item in result['words_result']]
        return '\n'.join(text_lines)
    else:
        print(f"OCR错误: {result}")
        return ""

def extract_pdf_to_text(pdf_path, output_path):
    """提取整个PDF为文本"""
    images = pdf_to_images(pdf_path)

    all_text = []
    for i, image in enumerate(images, 1):
        print(f"正在识别第 {i}/{len(images)} 页...")
        text = ocr_image(image)
        all_text.append(f"=== 第 {i} 页 ===\n{text}\n")

    # 保存结果
    full_text = '\n'.join(all_text)
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(full_text)

    print(f"✅ 提取完成，保存到: {output_path}")
    return full_text

def batch_extract_pdfs(pdf_dir, output_dir):
    """批量提取PDF目录下的所有文件"""
    pdf_dir = Path(pdf_dir)
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    pdf_files = list(pdf_dir.glob('**/*.pdf'))
    print(f"找到 {len(pdf_files)} 个PDF文件")

    for i, pdf_path in enumerate(pdf_files, 1):
        print(f"\n[{i}/{len(pdf_files)}] 处理: {pdf_path.name}")

        # 生成输出文件名
        output_name = pdf_path.stem + '_ocr.txt'
        output_path = output_dir / output_name

        # 跳过已处理的文件
        if output_path.exists():
            print(f"⏭️  已存在，跳过")
            continue

        try:
            extract_pdf_to_text(str(pdf_path), str(output_path))
        except Exception as e:
            print(f"❌ 处理失败: {e}")
            continue

if __name__ == '__main__':
    # 测试单个文件
    test_pdf = r'D:\量化n1\资料\A 日语N1\2025年12月N1 完整原卷\A 2025年12月N1完整原卷.pdf'
    test_output = r'C:\Users\Garo\gokaku\output\2025_12_n1_ocr.txt'

    print("=" * 60)
    print("百度OCR PDF提取工具")
    print("=" * 60)
    print("\n⚠️  请先配置百度OCR API密钥:")
    print("1. 访问 https://cloud.baidu.com/product/ocr")
    print("2. 创建应用获取 APP_ID, API_KEY, SECRET_KEY")
    print("3. 修改本脚本顶部的配置")
    print("\n安装依赖:")
    print("pip install baidu-aip PyPDF2 Pillow pdf2image")
    print("\n" + "=" * 60)

    # 检查配置
    if APP_ID == 'YOUR_APP_ID':
        print("\n❌ 请先配置百度OCR API密钥！")
        exit(1)

    # 提取单个文件
    print(f"\n开始提取: {test_pdf}")
    extract_pdf_to_text(test_pdf, test_output)

    # 批量提取（可选）
    # batch_extract_pdfs(
    #     r'D:\量化n1\资料\A 日语N1',
    #     r'C:\Users\Garo\gokaku\output\ocr_texts'
    # )
