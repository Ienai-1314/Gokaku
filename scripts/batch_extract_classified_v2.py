#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
使用 DataFlow 批量提取分类后的 PDF（修复版）
直接使用已验证的提取方法
"""

import os
import sys
import json
import time
import requests
from pathlib import Path

# MinerU API 配置
MINERU_API_KEY = "sk_0Aq8Ry1Ks5Ub7Ct4Dg9Hj2Lp6Mn3Vf8Wx"
MINERU_API_URL = "https://mineru.openxlab.org.cn/api/v1/pdf/extract"
CLASSIFICATION_FILE = r"C:\Users\Garo\gokaku\output\pdf_classification.json"
OUTPUT_BASE = r"C:\Users\Garo\gokaku\output\batch_classified"

def upload_and_extract(pdf_path: str, output_dir: str) -> dict:
    """
    上传 PDF 并提取为 Markdown
    """
    try:
        filename = os.path.basename(pdf_path)
        print(f"  正在处理: {filename}")

        # 上传文件
        with open(pdf_path, 'rb') as f:
            files = {'file': (filename, f, 'application/pdf')}
            headers = {'Authorization': f'Bearer {MINERU_API_KEY}'}

            response = requests.post(
                MINERU_API_URL,
                files=files,
                headers=headers,
                timeout=600
            )

        if response.status_code != 200:
            return {
                "file": filename,
                "status": "failed",
                "error": f"HTTP {response.status_code}: {response.text}"
            }

        result = response.json()

        # 检查是否需要轮询
        if result.get("status") == "processing":
            task_id = result.get("task_id")
            print(f"    任务ID: {task_id}，等待处理...")

            # 轮询结果
            for i in range(60):  # 最多等待10分钟
                time.sleep(10)
                status_response = requests.get(
                    f"{MINERU_API_URL}/{task_id}",
                    headers=headers,
                    timeout=30
                )

                if status_response.status_code == 200:
                    status_result = status_response.json()
                    if status_result.get("status") == "completed":
                        result = status_result
                        break
                    elif status_result.get("status") == "failed":
                        return {
                            "file": filename,
                            "status": "failed",
                            "error": status_result.get("error", "Unknown error")
                        }
                print(f"    等待中... ({i+1}/60)")

        # 保存 Markdown
        if result.get("status") == "completed" or result.get("markdown"):
            markdown_content = result.get("markdown", "")
            output_file = os.path.join(output_dir, f"{Path(filename).stem}.md")

            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(markdown_content)

            print(f"    ✓ 成功: {output_file}")
            return {
                "file": filename,
                "status": "success",
                "output": output_file,
                "size": len(markdown_content)
            }
        else:
            return {
                "file": filename,
                "status": "failed",
                "error": "No markdown content returned"
            }

    except Exception as e:
        return {
            "file": filename,
            "status": "failed",
            "error": str(e)
        }

def main():
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

    print("开始批量提取分类后的 PDF...")

    # 读取分类结果
    with open(CLASSIFICATION_FILE, 'r', encoding='utf-8') as f:
        classification = json.load(f)

    # 优先提取的类别
    priority_categories = ["exam_paper", "vocabulary", "grammar"]

    all_results = {}

    for category in priority_categories:
        files = classification.get(category, [])
        if not files:
            print(f"\n跳过 {category}：无文件")
            continue

        print(f"\n{'='*60}")
        print(f"提取类别: {category} ({len(files)} 个文件)")
        print(f"{'='*60}")

        # 创建输出目录
        output_dir = os.path.join(OUTPUT_BASE, category)
        os.makedirs(output_dir, exist_ok=True)

        # 逐个提取
        results = []
        for file_info in files:
            pdf_path = file_info["path"]
            result = upload_and_extract(pdf_path, output_dir)
            results.append(result)

            # 避免 API 限流
            time.sleep(2)

        # 统计结果
        success_count = sum(1 for r in results if r.get("status") == "success")
        print(f"\n提取完成: {success_count}/{len(files)} 成功")

        # 保存提取结果
        result_file = os.path.join(output_dir, "extraction_results.json")
        with open(result_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2)

        all_results[category] = results

    # 保存总结果
    summary_file = os.path.join(OUTPUT_BASE, "extraction_summary.json")
    with open(summary_file, 'w', encoding='utf-8') as f:
        json.dump(all_results, f, ensure_ascii=False, indent=2)

    print("\n所有提取任务完成！")
    print(f"总结果保存到: {summary_file}")

if __name__ == "__main__":
    main()
