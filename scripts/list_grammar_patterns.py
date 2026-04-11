#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
统计并提取语法点列表
"""
import os
import sys
import json

# 设置输出编码为UTF-8
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

def main():
    input_file = r"C:\Users\Garo\gokaku\output\grammar_points.json"

    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    print(f"总计: {len(data)} 个语法点\n")

    # 提取所有语法点
    patterns = [item['grammar_pattern'] for item in data]

    print("前30个语法点:")
    for i, pattern in enumerate(patterns[:30], 1):
        print(f"{i}. {pattern}")

    # 保存纯语法点列表
    output_file = r"C:\Users\Garo\gokaku\output\grammar_patterns_list.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(patterns, f, ensure_ascii=False, indent=2)

    print(f"\n语法点列表已保存到: {output_file}")

if __name__ == '__main__':
    main()
