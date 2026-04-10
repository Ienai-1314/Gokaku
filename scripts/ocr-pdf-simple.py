# -*- coding: utf-8 -*-
"""
使用 pdfplumber 提取图片 + DeepSeek API 识别
"""
import sys
import io
import os
import json
import base64
import requests
import pdfplumber
from PIL import Image

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# 配置
PDF_PATH = r"D:\量化n1\资料\A 日语N1\2025年12月N1 完整原卷\A 2025年12月N1完整原卷.pdf"
OUTPUT_DIR = r"C:\Users\Garo\gokaku\pdf-images"
API_KEY = "sk-852d4b17220e4c9c850b1e4c8465e737"

os.makedirs(OUTPUT_DIR, exist_ok=True)

print("=== JLPT N1 真题识别工具 ===\n")

# 步骤 1: 提取 PDF 图片
print("步骤 1: 提取 PDF 图片...")
try:
    with pdfplumber.open(PDF_PATH) as pdf:
        # 只处理第 3 页（通常第 1-2 页是封面和说明）
        page = pdf.pages[2]

        # 将页面转换为图片
        im = page.to_image(resolution=200)
        image_path = os.path.join(OUTPUT_DIR, "page_3.png")
        im.save(image_path)

        print(f"✓ 已保存: {image_path}\n")

except Exception as e:
    print(f"❌ 提取失败: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# 步骤 2: 使用 DeepSeek API 识别
print("步骤 2: 使用 DeepSeek API 识别题目...\n")

try:
    # 读取图片
    with open(image_path, 'rb') as f:
        image_data = base64.b64encode(f.read()).decode('utf-8')

    prompt = """你是 JLPT N1 真题识别专家。请仔细识别这张图片中的所有题目。

要求：
1. 识别题目编号
2. 提取题干（日语原文，包含下划线）
3. 提取选项（通常是 1/2/3/4）
4. 保持原文格式

返回 JSON 数组格式：
[
  {
    "questionNumber": 1,
    "question": "题干文本（包含___）",
    "options": ["选项1", "选项2", "选项3", "选项4"]
  }
]

注意：
- 只提取完整的题目
- 保持日语原文
- 如果看到"問題1"等标题，说明这是词汇题
- 每道题通常有 4 个选项"""

    print("正在调用 DeepSeek API...")

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
        timeout=120
    )

    if response.status_code == 200:
        data = response.json()
        content = data['choices'][0]['message']['content']

        print("\n✓ API 调用成功！\n")
        print("返回内容:")
        print(content)

        # 提取 JSON
        import re
        json_match = re.search(r'\[[\s\S]*\]', content)
        if json_match:
            questions = json.loads(json_match.group(0))
            print(f"\n✓ 识别到 {len(questions)} 道题目\n")

            # 显示识别结果
            for q in questions:
                print(f"题目 {q['questionNumber']}: {q['question'][:50]}...")

            # 保存结果
            output_file = os.path.join(OUTPUT_DIR, 'questions_page3.json')
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(questions, f, ensure_ascii=False, indent=2)

            print(f"\n✓ 结果已保存: {output_file}")
        else:
            print("\n⚠️ 未找到 JSON 格式的题目")
            print("原始返回:")
            print(content)

    else:
        print(f"\n❌ API 错误: {response.status_code}")
        print(response.text)

except Exception as e:
    print(f"\n❌ 识别失败: {e}")
    import traceback
    traceback.print_exc()

print("\n=== 完成 ===")
