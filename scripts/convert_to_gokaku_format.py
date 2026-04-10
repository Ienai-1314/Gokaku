"""
将提取的题目数据转换为 Gokaku 数据库格式
"""
import json
import os
from datetime import datetime

# 配置
INPUT_FILE = r"C:\Users\Garo\gokaku\output\extracted_questions.json"
OUTPUT_FILE = r"C:\Users\Garo\gokaku\output\questions_gokaku_format.json"
TEMPLATE_FILE = r"C:\Users\Garo\gokaku\output\questions_template.json"

# 题目类型映射
SECTION_MAP = {
    'vocabulary': 'vocabulary',
    'grammar': 'grammar',
    'reading': 'reading',
    'listening': 'listening'
}

def convert_to_gokaku_format(questions_data):
    """转换为 Gokaku 格式"""
    gokaku_questions = []

    for q in questions_data['questions']:
        # 基础数据
        question_number = q['number']
        section = SECTION_MAP.get(q['type'], 'vocabulary')

        # 转换为 Gokaku 格式
        gokaku_q = {
            "paperId": "2025-12-n1",
            "examDate": "2025-12",
            "section": section,
            "questionNumber": question_number,
            "questionType": "单选",
            "content": {
                "question": q['question'],
                "options": q['options'],
                "correctAnswer": q['options'][int(q['answer']) - 1] if q['answer'] else "",
                "images": []
            },
            "analysis": {
                "explanation": "【需要补充解析】",
                "knowledgePoints": [],
                "difficulty": 3,
                "relatedGrammar": []
            },
            "stats": {
                "totalAttempts": 0,
                "correctRate": 0
            },
            "_meta": {
                "needsReview": True,
                "hasEncodingIssue": True,
                "originalData": {
                    "question": q['question'][:100],
                    "options": q['options']
                }
            }
        }

        gokaku_questions.append(gokaku_q)

    return gokaku_questions

def create_template(questions_data):
    """创建修复模板，标注需要手动修复的部分"""
    template = {
        "source": "2025年12月N1完整原卷",
        "status": "需要修复编码问题",
        "totalQuestions": len(questions_data['questions']),
        "instructions": {
            "1": "所有题目的日语文本都有编码问题，需要手动修复",
            "2": "答案字段全部缺失，需要从答案PDF中补充",
            "3": "修复步骤：",
            "steps": [
                "1. 打开原始PDF：D:\\量化n1\\资料\\A 日语N1\\2025年12月N1 完整原卷\\A 2025年12月N1完整原卷.pdf",
                "2. 打开答案PDF：D:\\量化n1\\资料\\A 日语N1\\2025年12月N1 完整原卷\\C 2025年12月N1答案.pdf",
                "3. 逐题对照PDF，修复question和options字段的日语文本",
                "4. 从答案PDF中补充correctAnswer字段",
                "5. 可选：补充analysis.explanation解析内容"
            ]
        },
        "questions": []
    }

    # 为每道题创建模板
    for i, q in enumerate(questions_data['questions'][:5]):  # 先显示前5题作为样例
        template_q = {
            "questionNumber": q['number'],
            "section": q['type'],
            "status": "❌ 需要修复",
            "issues": [
                "日语文本编码错误",
                "答案缺失"
            ],
            "current": {
                "question": q['question'][:50] + "...",
                "options": [opt[:20] + "..." for opt in q['options']],
                "answer": q['answer']
            },
            "fixed": {
                "question": "【请从PDF中复制正确的日语文本】",
                "options": [
                    "【选项1】",
                    "【选项2】",
                    "【选项3】",
                    "【选项4】"
                ],
                "correctAnswer": "【1/2/3/4】"
            }
        }
        template['questions'].append(template_q)

    return template

def generate_summary(questions_data):
    """生成数据摘要"""
    summary = {
        "总题目数": len(questions_data['questions']),
        "题目类型分布": {},
        "题号范围": {
            "最小": min(q['number'] for q in questions_data['questions']),
            "最大": max(q['number'] for q in questions_data['questions'])
        },
        "数据质量": {
            "编码问题题目数": sum(1 for q in questions_data['questions'] if any(ord(c) > 127 and c not in '、。？！（）「」' for c in q['question'])),
            "缺失答案题目数": sum(1 for q in questions_data['questions'] if q['answer'] is None),
            "完整题目数": 0
        }
    }

    # 统计题目类型
    for q in questions_data['questions']:
        qtype = q['type']
        summary['题目类型分布'][qtype] = summary['题目类型分布'].get(qtype, 0) + 1

    return summary

def main():
    """主函数"""
    print("=== 转换为 Gokaku 格式 ===")
    print()

    # 读取原始数据
    print("步骤 1: 读取原始数据...")
    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        questions_data = json.load(f)
    print(f"[OK] 读取了 {len(questions_data['questions'])} 道题目")
    print()

    # 生成摘要
    print("步骤 2: 生成数据摘要...")
    summary = generate_summary(questions_data)
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    print()

    # 转换为 Gokaku 格式
    print("步骤 3: 转换为 Gokaku 格式...")
    gokaku_questions = convert_to_gokaku_format(questions_data)
    print(f"[OK] 转换了 {len(gokaku_questions)} 道题目")
    print()

    # 保存 Gokaku 格式
    print("步骤 4: 保存 Gokaku 格式数据...")
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump({
            "paperId": "2025-12-n1",
            "examDate": "2025-12",
            "title": "2025年12月 JLPT N1 真题",
            "totalQuestions": len(gokaku_questions),
            "questions": gokaku_questions
        }, f, ensure_ascii=False, indent=2)
    print(f"[OK] 已保存到: {OUTPUT_FILE}")
    print()

    # 创建修复模板
    print("步骤 5: 创建修复模板...")
    template = create_template(questions_data)
    with open(TEMPLATE_FILE, 'w', encoding='utf-8') as f:
        json.dump(template, f, ensure_ascii=False, indent=2)
    print(f"[OK] 已保存到: {TEMPLATE_FILE}")
    print()

    # 显示下一步操作
    print("=== 下一步操作 ===")
    print("1. 查看修复模板：", TEMPLATE_FILE)
    print("2. 打开原始PDF和答案PDF")
    print("3. 手动修复题目文本和答案")
    print("4. 或者使用 OCR 工具重新提取（推荐使用付费的 OCR API）")
    print()
    print("=== 推荐方案 ===")
    print("由于题目数量较多（49题），建议：")
    print("1. 使用百度OCR、腾讯OCR等付费API重新提取（准确率高）")
    print("2. 或者分批手动修复（每次5-10题）")
    print("3. 优先修复词汇和语法题（共10题），这些题目较短")

if __name__ == "__main__":
    main()
