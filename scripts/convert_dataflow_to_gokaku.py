"""
将 DataFlow 提取的题目转换为 Gokaku 格式并导入数据库
"""

import json
import os
from datetime import datetime
import sys

# 添加项目路径
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from lib.cloudbase import get_db

def convert_dataflow_to_gokaku(dataflow_json_path: str, exam_info: dict):
    """
    转换 DataFlow 输出为 Gokaku 格式

    Args:
        dataflow_json_path: DataFlow 输出的 JSON 文件路径
        exam_info: 考试信息 {"year": 2025, "month": 12, "paper_id": "xxx"}
    """
    print(f"📖 读取 DataFlow 输出: {dataflow_json_path}")

    with open(dataflow_json_path, 'r', encoding='utf-8') as f:
        dataflow_data = json.load(f)

    questions = dataflow_data.get('questions', [])
    print(f"找到 {len(questions)} 道题目")

    # 转换为 Gokaku 格式
    gokaku_questions = []

    for q in questions:
        gokaku_q = {
            "paper_id": exam_info['paper_id'],
            "question_number": q.get('number', 0),
            "section": q.get('section', ''),
            "question_type": q.get('type', 'vocabulary'),
            "question_text": q.get('text', ''),
            "options": q.get('options', []),
            "correct_answer": q.get('answer', ''),
            "explanation": q.get('explanation', ''),
            "difficulty": q.get('difficulty', 'medium'),
            "tags": q.get('tags', []),
            "created_at": datetime.now().isoformat(),
        }
        gokaku_questions.append(gokaku_q)

    return gokaku_questions


def import_to_database(questions: list):
    """导入题目到数据库"""
    print(f"\n📥 导入 {len(questions)} 道题目到数据库...")

    db = get_db()
    collection = db.collection('exam_questions')

    # 批量插入
    batch_size = 50
    for i in range(0, len(questions), batch_size):
        batch = questions[i:i+batch_size]
        try:
            collection.add(batch)
            print(f"✅ 已导入 {i+len(batch)}/{len(questions)} 道题目")
        except Exception as e:
            print(f"❌ 导入失败: {e}")
            # 尝试逐条插入
            for q in batch:
                try:
                    collection.add(q)
                except Exception as e2:
                    print(f"❌ 题目 {q['question_number']} 导入失败: {e2}")

    print(f"\n🎉 导入完成！")


def process_all_dataflow_outputs(output_dir: str):
    """
    处理所有 DataFlow 输出文件

    Args:
        output_dir: DataFlow 输出目录
    """
    cache_dir = os.path.join(output_dir, 'cache')

    if not os.path.exists(cache_dir):
        print(f"❌ 未找到输出目录: {cache_dir}")
        return

    # 查找所有 JSON 文件
    json_files = []
    for root, dirs, files in os.walk(cache_dir):
        for file in files:
            if file.endswith('.json'):
                json_files.append(os.path.join(root, file))

    print(f"找到 {len(json_files)} 个输出文件")

    all_questions = []

    for json_file in json_files:
        print(f"\n处理: {json_file}")

        # 从文件名推断考试信息
        filename = os.path.basename(json_file)
        # 例如: jlpt_step1.json

        # TODO: 需要从原始 PDF 文件名提取年份和月份
        exam_info = {
            "year": 2025,
            "month": 12,
            "paper_id": "2025-12-n1"  # 需要根据实际情况调整
        }

        try:
            questions = convert_dataflow_to_gokaku(json_file, exam_info)
            all_questions.extend(questions)
        except Exception as e:
            print(f"❌ 转换失败: {e}")
            import traceback
            traceback.print_exc()

    if all_questions:
        print(f"\n总共转换了 {len(all_questions)} 道题目")

        # 导入数据库
        import_to_database(all_questions)

        # 保存备份
        backup_file = os.path.join(output_dir, 'gokaku_questions_backup.json')
        with open(backup_file, 'w', encoding='utf-8') as f:
            json.dump(all_questions, f, ensure_ascii=False, indent=2)
        print(f"\n💾 备份保存到: {backup_file}")


if __name__ == "__main__":
    OUTPUT_DIR = r"C:\Users\Garo\gokaku\jlpt_output"

    print("🔄 开始转换 DataFlow 输出...")
    process_all_dataflow_outputs(OUTPUT_DIR)
