#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
使用magic-pdf本地提取1级语法机能辞
"""
import os
import sys
import json
import subprocess
from pathlib import Path

# 设置输出编码为UTF-8
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

def extract_with_magic_pdf(pdf_path: str, output_dir: str) -> str:
    """使用magic-pdf提取PDF"""
    print(f"开始提取PDF: {pdf_path}")

    # 创建输出目录
    os.makedirs(output_dir, exist_ok=True)

    # 运行magic-pdf
    cmd = [
        'magic-pdf',
        '-p', pdf_path,
        '-o', output_dir,
        '-m', 'auto'
    ]

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            encoding='utf-8',
            timeout=300
        )

        if result.returncode != 0:
            print(f"错误: {result.stderr}")
            return None

        print(f"提取完成")

        # 查找生成的markdown文件
        md_files = list(Path(output_dir).rglob('*.md'))
        if md_files:
            md_file = md_files[0]
            print(f"找到Markdown文件: {md_file}")

            with open(md_file, 'r', encoding='utf-8') as f:
                content = f.read()

            print(f"内容长度: {len(content)} 字符")
            return content
        else:
            print("未找到Markdown文件")
            return None

    except Exception as e:
        print(f"提取失败: {e}")
        return None

def parse_grammar_points(markdown_content: str) -> list:
    """从Markdown中解析语法点"""
    print("\n开始解析语法点...")

    lines = markdown_content.split('\n')
    grammar_points = []

    for line in lines:
        line = line.strip()

        # 跳过空行和太短的行
        if not line or len(line) < 2:
            continue

        # 查找包含～的行（日语语法标记）
        if '～' in line:
            # 清理格式标记
            grammar = line.replace('**', '').replace('*', '').replace('#', '').strip()

            # 提取～开头的部分
            if '～' in grammar:
                # 分割并取第一个语法点
                parts = grammar.split()
                for part in parts:
                    if '～' in part:
                        # 清理标点
                        clean = part.strip('、。，；：！？()（）[]【】')
                        if len(clean) >= 2 and len(clean) <= 20:
                            grammar_points.append(clean)

    # 去重并排序
    grammar_points = sorted(list(set(grammar_points)))

    print(f"找到 {len(grammar_points)} 个语法点")

    return grammar_points

def main():
    pdf_path = r"D:\量化n1\资料\1级语法机能辞.pdf"
    output_dir = r"C:\Users\Garo\gokaku\output\n1_grammar_dict"

    # 检查PDF是否存在
    if not os.path.exists(pdf_path):
        print(f"PDF文件不存在: {pdf_path}")
        return

    # 提取PDF
    markdown_content = extract_with_magic_pdf(pdf_path, output_dir)

    if not markdown_content:
        print("PDF提取失败")
        return

    # 解析语法点
    grammar_points = parse_grammar_points(markdown_content)

    if not grammar_points:
        print("未找到语法点")
        return

    # 保存语法点列表
    output_file = os.path.join(output_dir, 'grammar_points.json')
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(grammar_points, f, ensure_ascii=False, indent=2)

    print(f"\n语法点列表已保存到: {output_file}")
    print(f"\n前20个语法点:")
    for i, point in enumerate(grammar_points[:20], 1):
        print(f"  {i}. {point}")

    print(f"\n总计: {len(grammar_points)} 个语法点")

if __name__ == '__main__':
    main()
