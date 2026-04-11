#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
提取1级语法机能辞PDF中的所有语法点
"""
import os
import sys
import json
import requests
from pathlib import Path

# 设置输出编码为UTF-8
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# 添加项目根目录到路径
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

# MinerU API配置
MINERU_API_URL = "https://mineru.openxlab.org.cn/api/v1/pdf/extract"
API_KEY = os.getenv("MINERU_API_KEY", "sk-852d4b17220e4c9c850b1e4c8465e737")

def extract_pdf_to_markdown(pdf_path: str, output_dir: str) -> str:
    """使用MinerU API提取PDF为Markdown"""
    print(f"📄 开始提取PDF: {pdf_path}")

    # 创建输出目录
    os.makedirs(output_dir, exist_ok=True)

    # 读取PDF文件
    with open(pdf_path, 'rb') as f:
        files = {'file': (os.path.basename(pdf_path), f, 'application/pdf')}
        headers = {'Authorization': f'Bearer {API_KEY}'}

        try:
            response = requests.post(
                MINERU_API_URL,
                files=files,
                headers=headers,
                timeout=300
            )
            response.raise_for_status()

            result = response.json()
            markdown_content = result.get('markdown', '')

            # 保存Markdown
            output_file = os.path.join(output_dir, 'n1_grammar_dict.md')
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(markdown_content)

            print(f"✅ 提取完成，保存到: {output_file}")
            print(f"📊 内容长度: {len(markdown_content)} 字符")

            return markdown_content

        except requests.exceptions.RequestException as e:
            print(f"❌ API请求失败: {e}")
            if hasattr(e, 'response') and e.response is not None:
                print(f"响应内容: {e.response.text}")
            return None

def parse_grammar_points(markdown_content: str) -> list:
    """从Markdown中解析语法点"""
    print("\n🔍 开始解析语法点...")

    lines = markdown_content.split('\n')
    grammar_points = []
    current_grammar = None

    for line in lines:
        line = line.strip()

        # 跳过空行
        if not line:
            continue

        # 检测语法点标题（通常是粗体或特殊格式）
        # 例如: **～ところを** 或 ～ところを
        if '～' in line or line.startswith('・'):
            # 提取语法点
            grammar = line.replace('**', '').replace('・', '').strip()

            # 过滤掉太长的行（可能不是语法点）
            if len(grammar) < 30 and ('～' in grammar or grammar.startswith('（')):
                if current_grammar:
                    grammar_points.append(current_grammar)
                current_grammar = grammar

    # 添加最后一个
    if current_grammar:
        grammar_points.append(current_grammar)

    # 去重
    grammar_points = list(set(grammar_points))
    grammar_points.sort()

    print(f"✅ 解析完成，找到 {len(grammar_points)} 个语法点")

    return grammar_points

def main():
    pdf_path = r"D:\量化n1\资料\1级语法机能辞.pdf"
    output_dir = r"C:\Users\Garo\gokaku\output\n1_grammar_dict"

    # 检查PDF是否存在
    if not os.path.exists(pdf_path):
        print(f"❌ PDF文件不存在: {pdf_path}")
        return

    # 提取PDF
    markdown_content = extract_pdf_to_markdown(pdf_path, output_dir)

    if not markdown_content:
        print("❌ PDF提取失败")
        return

    # 解析语法点
    grammar_points = parse_grammar_points(markdown_content)

    # 保存语法点列表
    output_file = os.path.join(output_dir, 'grammar_points.json')
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(grammar_points, f, ensure_ascii=False, indent=2)

    print(f"\n💾 语法点列表已保存到: {output_file}")
    print(f"\n前10个语法点:")
    for i, point in enumerate(grammar_points[:10], 1):
        print(f"  {i}. {point}")

if __name__ == '__main__':
    main()
