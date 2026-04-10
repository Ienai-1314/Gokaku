# -*- coding: utf-8 -*-
"""
使用 DeepSeek API 识别扫描版 PDF 真题
将 PDF 转换为图片，然后用 AI 识别题目
"""
import sys
import io
import os
import json
from pdf2image import convert_from_path
import base64
from pathlib import Path
import requests

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# 配置
PDF_PATH = r"D:\量化n1\资料\A 日语N1\2025年12月N1 完整原卷\A 2025年12月N1完整原卷.pdf"
OUTPUT_DIR = r"C:\Users\Garo\gokaku\pdf-images"
API_KEY = "sk-852d4b17220e4c9c850b1e4c8465e737"

# 创建输出目录
os.makedirs(OUTPUT_DIR, exist_ok=True)

print("=== JLPT N1 真题识别工具 ===\n")
print(f"PDF 文件: {PDF_PATH}")
print(f"输出目录: {OUTPUT_DIR}\n")

# 步骤 1: 将 PDF 转换为图片
print("步骤 1: 将 PDF 转换为图片...")
try:
    # 只转换前 5 页作为测试
    images = convert_from_path(PDF_PATH, first_page=1, last_page=5, dpi=200)
    print(f"✓ 成功转换 {len(images)} 页\n")

    # 保存图片
    image_paths = []
    for i, image in enumerate(images):
        image_path = os.path.join(OUTPUT_DIR, f"page_{i+1}.png")
        image.save(image_path, 'PNG')
        image_paths.append(image_path)
        print(f"  保存: page_{i+1}.png")

except Exception as e:
    print(f"❌ 转换失败: {e}")
    print("\n需要安装 poppler:")
    print("  Windows: 下载 https://github.com/oschwartz10612/poppler-windows/releases/")
    print("  解压后将 bin 目录添加到系统 PATH")
    sys.exit(1)

# 步骤 2: 使用 DeepSeek API 识别第一页
print(f"\n步骤 2: 使用 DeepSeek API 识别题目...")
print("(仅识别第 1 页作为测试)\n")

try:
    # 读取第一页图片
    with open(image_paths[0], 'rb') as f:
        image_data = base64.b64encode(f.read()).decode('utf-8')

    # 调用 DeepSeek API
    prompt = """你是 JLPT N1 真题识别专家。请仔细识别这张图片中的所有题目。

要求：
1. 识别题目编号
2. 提取题干（日语原文）
3. 提取选项（通常是 1/2/3/4）
4. 保持原文格式

返回 JSON 数组格式：
[
  {
    "questionNumber": 1,
    "question": "题干文本",
    "options": ["选项1", "选项2", "选项3", "选项4"]
  }
]

注意：只提取完整的题目，保持日语原文。"""

    response = requests.post(
        'https://api.deepseek.com/v1/chat/completions',
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {API_KEY}',
        },
        json={
            'model': 'deepseek-chat',
            'messages': [
                {
                    'role': 'user',
                    'content': [
                        {'type': 'text', 'text': prompt},
                        {
                            'type': 'image_url',
                            'image_url': {'url': f'data:image/png;base64,{image_data}'}
                        }
                    ]
                }
            ],
            'temperature': 0.1,
        },
        timeout=60
    )

    if response.status_code == 200:
        data = response.json()
        content = data['choices'][0]['message']['content']

        print("API 返回内容:")
        print(content[:500])
        print("\n...")

        # 提取 JSON
        import re
        json_match = re.search(r'\[[\s\S]*\]', content)
        if json_match:
            questions = json.loads(json_match.group(0))
            print(f"\n✓ 识别到 {len(questions)} 道题目")

            # 保存结果
            output_file = os.path.join(OUTPUT_DIR, 'questions_page1.json')
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(questions, f, ensure_ascii=False, indent=2)

            print(f"✓ 结果已保存: {output_file}")
        else:
            print("⚠️ 未找到 JSON 格式的题目")

    else:
        print(f"❌ API 错误: {response.status_code}")
        print(response.text)

except Exception as e:
    print(f"❌ 识别失败: {e}")
    import traceback
    traceback.print_exc()

print("\n=== 完成 ===")
print("\n下一步:")
print("1. 检查识别结果是否准确")
print("2. 如果准确，批量处理所有页面")
print("3. 导入数据库")
