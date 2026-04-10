"""
使用 DeepSeek API 读取 PDF 并修复题目数据
由于 PDF 直接读取有编码问题，我们采用分步策略：
1. 先将 PDF 转换为图片
2. 使用 OCR 或 AI 从图片提取文本
"""
import os
import json
import fitz  # PyMuPDF
from pathlib import Path
from openai import OpenAI

# 配置
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "sk-852d4b17220e4c9c850b1e4c8465e737")
PDF_DIR = r"D:\量化n1\资料\A 日语N1\2025年12月N1 完整原卷"
OUTPUT_DIR = r"C:\Users\Garo\gokaku\output"

def pdf_to_text(pdf_path):
    """使用 PyMuPDF 提取 PDF 文本"""
    print(f"正在提取 PDF 文本: {pdf_path}")

    doc = fitz.open(pdf_path)
    full_text = ""

    for page_num in range(len(doc)):
        page = doc[page_num]
        text = page.get_text()
        full_text += f"\n\n=== 第 {page_num + 1} 页 ===\n\n{text}"

    doc.close()
    return full_text

def extract_questions_with_ai(text, pdf_type="questions"):
    """使用 DeepSeek API 从文本提取题目"""
    print(f"正在使用 AI 提取题目...")

    # 创建 OpenAI 客户端（DeepSeek 兼容 OpenAI API）
    client = OpenAI(
        api_key=DEEPSEEK_API_KEY,
        base_url="https://api.deepseek.com"
    )

    # 构建提示词
    if pdf_type == "questions":
        prompt = f"""请从以下 JLPT N1 试卷文本中提取所有题目。

文本内容：
{text[:50000]}  # 限制长度避免超出 token 限制

要求：
1. 提取题号、题目类型、题目内容、选项
2. 保持日语原文，不要翻译
3. 按照以下 JSON 格式输出：

{{
  "questions": [
    {{
      "number": 31,
      "type": "vocabulary",
      "question": "引越しの予定は半年後だが、早く準備を始めるに越したことはないと思い、少しずつ片付けを進めている。",
      "options": ["勢いだ", "に上がりはない", "見込みだ", "に越したことはない"]
    }}
  ]
}}

题目类型：
- vocabulary: 词汇题（问題1-6）
- grammar: 语法题（问題7-13）
- reading: 阅读题（问題14以后）
- listening: 听力题

只输出 JSON，不要其他说明文字。"""
    else:  # answers
        prompt = f"""请从以下 JLPT N1 答案文本中提取所有题目的答案。

文本内容：
{text[:10000]}

要求：
1. 提取题号和对应的答案（1/2/3/4）
2. 按照以下 JSON 格式输出：

{{
  "answers": [
    {{"number": 31, "answer": "4"}},
    {{"number": 32, "answer": "2"}}
  ]
}}

只输出 JSON，不要其他说明文字。"""

    # 调用 DeepSeek API
    response = client.chat.completions.create(
        model="deepseek-chat",
        messages=[
            {"role": "system", "content": "你是一个专业的 JLPT 题目提取助手，擅长从文本中提取结构化的题目数据。"},
            {"role": "user", "content": prompt}
        ],
        temperature=0.1,
        max_tokens=16000
    )

    # 提取响应
    response_text = response.choices[0].message.content

    # 解析 JSON
    # 移除可能的 markdown 代码块标记
    if "```json" in response_text:
        response_text = response_text.split("```json")[1].split("```")[0]
    elif "```" in response_text:
        response_text = response_text.split("```")[1].split("```")[0]

    return json.loads(response_text.strip())

def merge_questions_and_answers(questions_data, answers_data):
    """合并题目和答案"""
    # 创建答案字典
    answer_dict = {item["number"]: item["answer"] for item in answers_data["answers"]}

    # 合并
    for question in questions_data["questions"]:
        question_num = question["number"]
        question["answer"] = answer_dict.get(question_num, None)

    return questions_data

def main():
    """主函数"""
    print("=== 使用 DeepSeek API 修复题目数据 ===")
    print()

    # PDF 文件路径
    questions_pdf = os.path.join(PDF_DIR, "A 2025年12月N1完整原卷.pdf")
    answers_pdf = os.path.join(PDF_DIR, "C 2025年12月N1答案.pdf")

    # 检查文件是否存在
    if not os.path.exists(questions_pdf):
        print(f"错误: 找不到题目 PDF: {questions_pdf}")
        return

    if not os.path.exists(answers_pdf):
        print(f"错误: 找不到答案 PDF: {answers_pdf}")
        return

    print("步骤 1: 从原卷 PDF 提取文本...")
    questions_text = pdf_to_text(questions_pdf)
    print(f"✓ 提取了 {len(questions_text)} 个字符")

    # 保存提取的文本用于调试
    text_file = os.path.join(OUTPUT_DIR, "extracted_text.txt")
    with open(text_file, 'w', encoding='utf-8') as f:
        f.write(questions_text)
    print(f"✓ 文本已保存到: {text_file}")
    print()

    print("步骤 2: 使用 AI 从文本提取题目...")
    questions_data = extract_questions_with_ai(questions_text, "questions")
    print(f"✓ 提取了 {len(questions_data['questions'])} 道题目")
    print()

    print("步骤 3: 从答案 PDF 提取文本...")
    answers_text = pdf_to_text(answers_pdf)
    print(f"✓ 提取了 {len(answers_text)} 个字符")
    print()

    print("步骤 4: 使用 AI 从文本提取答案...")
    answers_data = extract_questions_with_ai(answers_text, "answers")
    print(f"✓ 提取了 {len(answers_data['answers'])} 个答案")
    print()

    print("步骤 3: 合并题目和答案...")
    merged_data = merge_questions_and_answers(questions_data, answers_data)
    print("✓ 合并完成")
    print()

    # 保存修复后的数据
    output_file = os.path.join(OUTPUT_DIR, "questions_fixed.json")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump({
            "source": "2025年12月N1完整原卷",
            "total_questions": len(merged_data["questions"]),
            "questions": merged_data["questions"]
        }, f, ensure_ascii=False, indent=2)

    print(f"✓ 修复后的数据已保存到: {output_file}")
    print()

    # 验证数据
    print("=== 数据验证 ===")
    missing_answers = sum(1 for q in merged_data["questions"] if q.get("answer") is None)
    print(f"总题目数: {len(merged_data['questions'])}")
    print(f"缺失答案: {missing_answers}")
    print()

    # 显示前 3 道题
    print("=== 前 3 道题样例 ===")
    for q in merged_data["questions"][:3]:
        print(f"题目 {q['number']} ({q['type']}):")
        print(f"  问题: {q['question'][:50]}...")
        print(f"  选项: {q['options']}")
        print(f"  答案: {q['answer']}")
        print()

if __name__ == "__main__":
    main()
