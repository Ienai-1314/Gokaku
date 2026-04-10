#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
监控批量提取进度
"""

import os
import json
import time
import sys

OUTPUT_BASE = r"C:\Users\Garo\gokaku\output\batch_classified"

def check_progress():
    sys.stdout = __import__('io').TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

    categories = ["exam_paper", "vocabulary", "grammar"]

    print("\n批量提取进度监控")
    print("=" * 60)

    for category in categories:
        result_file = os.path.join(OUTPUT_BASE, category, "extraction_results.json")

        if os.path.exists(result_file):
            with open(result_file, 'r', encoding='utf-8') as f:
                results = json.load(f)

            success = sum(1 for r in results if r.get("status") == "success")
            failed = sum(1 for r in results if r.get("status") == "failed")
            total = len(results)

            print(f"\n{category}:")
            print(f"  总计: {total} 个文件")
            print(f"  成功: {success} 个")
            print(f"  失败: {failed} 个")

            # 显示失败的文件
            if failed > 0:
                print("  失败文件:")
                for r in results:
                    if r.get("status") == "failed":
                        print(f"    - {r['file']}: {r.get('error', 'Unknown')}")
        else:
            # 检查是否有输出文件
            output_dir = os.path.join(OUTPUT_BASE, category)
            if os.path.exists(output_dir):
                md_files = [f for f in os.listdir(output_dir) if f.endswith('.md')]
                print(f"\n{category}: 正在处理... (已生成 {len(md_files)} 个 Markdown 文件)")
            else:
                print(f"\n{category}: 等待开始...")

    print("\n" + "=" * 60)

if __name__ == "__main__":
    check_progress()
