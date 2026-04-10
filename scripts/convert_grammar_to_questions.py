#!/usr/bin/env python3
"""
将语法点转换为练习题格式
每个语法点生成一道填空题或选择题
"""

import json
import random
from pathlib import Path

def create_grammar_question(grammar_point, index):
    """根据语法点创建一道题目"""

    pattern = grammar_point.get('grammar_pattern', '')
    meaning = grammar_point.get('meaning', '')
    example = grammar_point.get('example', '')
    translation = grammar_point.get('translation', '')
    exam_year = grammar_point.get('exam_year', '2024')

    if not pattern or not example:
        return None

    # 在例句中找到语法点的位置
    # 简化处理：创建选择题，让学生选择正确的语法

    # 生成干扰项（其他相似的语法点）
    similar_patterns = [
        "において", "に対して", "について", "にとって",
        "によって", "に関して", "に際して", "に先立って",
        "に限らず", "に加えて", "にかけて", "にわたって"
    ]

    # 移除正确答案
    distractors = [p for p in similar_patterns if p != pattern and p not in pattern]
    random.shuffle(distractors)

    # 选择3个干扰项
    options = [pattern] + distractors[:3]
    random.shuffle(options)

    # 找到正确答案的位置
    correct_index = options.index(pattern)
    correct_answer = chr(65 + correct_index)  # A, B, C, D

    # 构建题目
    question = {
        "examDate": exam_year if exam_year else "2024",
        "section": "grammar",
        "questionNumber": index + 1,
        "questionType": "grammar_choice",
        "content": {
            "question": f"请选择正确的语法填入空格：\n\n{example}\n\n意思：{meaning}",
            "options": {
                "A": options[0],
                "B": options[1],
                "C": options[2],
                "D": options[3]
            },
            "correctAnswer": correct_answer
        },
        "analysis": {
            "explanation": f"正确答案是「{pattern}」，意思是「{meaning}」。",
            "knowledgePoints": [pattern, "N1语法"],
            "difficulty": "medium",
            "relatedGrammar": [pattern]
        },
        "stats": {
            "totalAttempts": 0,
            "correctRate": 0
        }
    }

    return question

def main():
    # 读取语法点
    input_file = Path("C:/Users/Garo/gokaku/output/grammar_points.json")
    output_file = Path("C:/Users/Garo/gokaku/output/grammar_questions.json")

    with open(input_file, 'r', encoding='utf-8') as f:
        grammar_points = json.load(f)

    print(f"读取了 {len(grammar_points)} 个语法点")

    # 转换为题目
    questions = []
    for i, gp in enumerate(grammar_points):
        question = create_grammar_question(gp, i)
        if question:
            questions.append(question)

    print(f"生成了 {len(questions)} 道题目")

    # 保存
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(questions, f, ensure_ascii=False, indent=2)

    print(f"保存到: {output_file}")

    # 统计
    sections = {}
    for q in questions:
        section = q.get('section', 'unknown')
        sections[section] = sections.get(section, 0) + 1

    print("\n题型统计:")
    for section, count in sections.items():
        print(f"  {section}: {count} 道")

if __name__ == "__main__":
    main()
