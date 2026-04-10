"""
数据验证脚本 - 检查题目数据的完整性和质量
"""
import json
import os
import re

# 配置
GOKAKU_FILE = r"C:\Users\Garo\gokaku\output\questions_gokaku_format.json"

def check_encoding_issues(text):
    """检查文本是否有编码问题"""
    if not text:
        return True

    # 检查是否包含乱码字符
    # 正常的日语字符范围：平假名、片假名、汉字、标点
    normal_chars = set()
    abnormal_chars = set()

    for char in text:
        if '\u3040' <= char <= '\u309F':  # 平假名
            normal_chars.add('hiragana')
        elif '\u30A0' <= char <= '\u30FF':  # 片假名
            normal_chars.add('katakana')
        elif '\u4E00' <= char <= '\u9FFF':  # 汉字
            normal_chars.add('kanji')
        elif char in '、。？！（）「」【】・':  # 日语标点
            normal_chars.add('punctuation')
        elif char.isascii():  # ASCII字符
            normal_chars.add('ascii')
        elif char.isspace():  # 空白字符
            pass
        else:
            abnormal_chars.add(char)

    # 如果没有任何日语字符，或者有很多异常字符，则认为有编码问题
    has_japanese = len(normal_chars & {'hiragana', 'katakana', 'kanji'}) > 0
    has_many_abnormal = len(abnormal_chars) > len(text) * 0.1

    return not has_japanese or has_many_abnormal

def validate_question(question, index):
    """验证单个题目"""
    issues = []
    warnings = []

    # 检查必填字段
    required_fields = ['paperId', 'examDate', 'section', 'questionNumber', 'questionType', 'content', 'analysis', 'stats']
    for field in required_fields:
        if field not in question:
            issues.append(f"缺少必填字段: {field}")

    # 检查 content 字段
    if 'content' in question:
        content = question['content']

        # 检查问题文本
        if not content.get('question'):
            issues.append("问题文本为空")
        elif check_encoding_issues(content['question']):
            issues.append("问题文本有编码问题")

        # 检查选项
        options = content.get('options', [])
        if len(options) != 4:
            issues.append(f"选项数量不正确: {len(options)} (应为4)")
        else:
            for i, opt in enumerate(options):
                if not opt:
                    issues.append(f"选项{i+1}为空")
                elif check_encoding_issues(opt):
                    issues.append(f"选项{i+1}有编码问题")

        # 检查答案
        correct_answer = content.get('correctAnswer', '')
        if not correct_answer:
            issues.append("答案为空")
        elif correct_answer == "":
            warnings.append("答案未设置")

    # 检查 analysis 字段
    if 'analysis' in question:
        analysis = question['analysis']
        if analysis.get('explanation') == "【需要补充解析】":
            warnings.append("解析内容需要补充")
        if not analysis.get('knowledgePoints'):
            warnings.append("知识点为空")

    return {
        'questionNumber': question.get('questionNumber', index),
        'section': question.get('section', 'unknown'),
        'issues': issues,
        'warnings': warnings,
        'status': 'error' if issues else ('warning' if warnings else 'ok')
    }

def generate_report(validation_results):
    """生成验证报告"""
    total = len(validation_results)
    error_count = sum(1 for r in validation_results if r['status'] == 'error')
    warning_count = sum(1 for r in validation_results if r['status'] == 'warning')
    ok_count = sum(1 for r in validation_results if r['status'] == 'ok')

    report = {
        "summary": {
            "总题目数": total,
            "错误题目数": error_count,
            "警告题目数": warning_count,
            "正常题目数": ok_count,
            "完成度": f"{ok_count}/{total} ({ok_count*100//total if total > 0 else 0}%)"
        },
        "details": {
            "errors": [r for r in validation_results if r['status'] == 'error'],
            "warnings": [r for r in validation_results if r['status'] == 'warning'],
            "ok": [r for r in validation_results if r['status'] == 'ok']
        },
        "recommendations": []
    }

    # 生成建议
    if error_count > 0:
        report["recommendations"].append(f"有 {error_count} 道题目存在错误，需要优先修复")
    if warning_count > 0:
        report["recommendations"].append(f"有 {warning_count} 道题目有警告，建议补充完善")
    if ok_count == total:
        report["recommendations"].append("所有题目验证通过！可以导入数据库")

    # 按题目类型统计
    section_stats = {}
    for r in validation_results:
        section = r['section']
        if section not in section_stats:
            section_stats[section] = {'total': 0, 'error': 0, 'warning': 0, 'ok': 0}
        section_stats[section]['total'] += 1
        section_stats[section][r['status']] += 1

    report["section_stats"] = section_stats

    return report

def main():
    """主函数"""
    print("=== 数据验证 ===")
    print()

    # 检查文件是否存在
    if not os.path.exists(GOKAKU_FILE):
        print(f"错误: 找不到文件 {GOKAKU_FILE}")
        return

    # 读取数据
    print("步骤 1: 读取数据...")
    with open(GOKAKU_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)

    questions = data.get('questions', [])
    print(f"[OK] 读取了 {len(questions)} 道题目")
    print()

    # 验证每道题
    print("步骤 2: 验证题目...")
    validation_results = []
    for i, question in enumerate(questions):
        result = validate_question(question, i + 1)
        validation_results.append(result)
    print(f"[OK] 验证完成")
    print()

    # 生成报告
    print("步骤 3: 生成报告...")
    report = generate_report(validation_results)
    print()

    # 显示摘要
    print("=== 验证摘要 ===")
    print(json.dumps(report['summary'], ensure_ascii=False, indent=2))
    print()

    # 显示题目类型统计
    print("=== 题目类型统计 ===")
    print(json.dumps(report['section_stats'], ensure_ascii=False, indent=2))
    print()

    # 显示建议
    print("=== 建议 ===")
    for rec in report['recommendations']:
        print(f"- {rec}")
    print()

    # 显示前5个错误
    if report['details']['errors']:
        print("=== 前5个错误题目 ===")
        for r in report['details']['errors'][:5]:
            print(f"题目 {r['questionNumber']} ({r['section']}):")
            for issue in r['issues']:
                print(f"  - {issue}")
        print()

    # 保存完整报告
    report_file = r"C:\Users\Garo\gokaku\output\validation_report.json"
    with open(report_file, 'w', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    print(f"[OK] 完整报告已保存到: {report_file}")

if __name__ == "__main__":
    main()
