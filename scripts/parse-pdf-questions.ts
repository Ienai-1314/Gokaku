/**
 * PDF 真题解析脚本
 * 使用 DeepSeek API 辅助解析 PDF 真题
 */

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import PDFParser from 'pdf2json';

const PDF_DIR = 'D:\\量化n1\\资料\\A 日语N1';

interface ParsedQuestion {
  questionNumber: number;
  section: 'vocabulary' | 'grammar' | 'reading' | 'listening';
  questionType: string;
  content: {
    question: string;
    options: string[];
    correctAnswer: string;
  };
  analysis: {
    explanation: string;
    knowledgePoints: string[];
    difficulty: 1 | 2 | 3 | 4 | 5;
  };
}

/**
 * 解析 PDF 文件
 */
async function parsePDF(filePath: string): Promise<string> {
  console.log(`正在读取 PDF: ${path.basename(filePath)}`);

  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();

    pdfParser.on('pdfParser_dataError', (errData: any) => {
      reject(new Error(errData.parserError));
    });

    pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
      const text = pdfParser.getRawTextContent();
      console.log(`  - 文本长度: ${text.length} 字符`);
      resolve(text);
    });

    pdfParser.loadPDF(filePath);
  });
}

/**
 * 使用 DeepSeek API 解析题目
 */
async function parseQuestionsWithAI(
  pdfText: string,
  examDate: string,
  section: string
): Promise<ParsedQuestion[]> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY 未配置');
  }

  console.log('\n使用 AI 解析题目...');

  const prompt = `你是 JLPT N1 真题解析专家。请从以下 PDF 文本中提取题目信息。

PDF 文本：
${pdfText.slice(0, 10000)}

请提取所有题目，每道题包含：
1. 题号
2. 题干（日语原文）
3. 选项 A/B/C/D（日语原文）
4. 正确答案

返回 JSON 数组格式：
[
  {
    "questionNumber": 1,
    "question": "题干文本",
    "options": ["选项1", "选项2", "选项3", "选项4"],
    "correctAnswer": "正确答案文本"
  }
]

注意：
- 只提取完整的题目
- 保持日语原文
- 如果无法识别，返回空数组 []`;

  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      throw new Error(`API 错误: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '[]';

    // 提取 JSON
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    const jsonStr = jsonMatch ? jsonMatch[0] : '[]';
    const rawQuestions = JSON.parse(jsonStr);

    console.log(`  ✓ 解析到 ${rawQuestions.length} 道题目`);

    // 转换为标准格式
    const questions: ParsedQuestion[] = rawQuestions.map((q: any) => ({
      questionNumber: q.questionNumber,
      section: section as any,
      questionType: '单选',
      content: {
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
      },
      analysis: {
        explanation: '解析待补充',
        knowledgePoints: [],
        difficulty: 3,
      },
    }));

    return questions;
  } catch (error) {
    console.error('AI 解析失败：', error);
    return [];
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('开始解析真题 PDF...\n');

  // 示例：解析 2025年12月 N1 试卷
  const pdfPath = path.join(
    PDF_DIR,
    '2025年12月N1 完整原卷',
    'A 2025年12月N1完整原卷.pdf'
  );

  if (!fs.existsSync(pdfPath)) {
    console.error(`❌ 文件不存在: ${pdfPath}`);
    process.exit(1);
  }

  try {
    // 1. 解析 PDF
    const pdfText = await parsePDF(pdfPath);

    // 保存原始文本用于调试
    const rawTextPath = path.join(process.cwd(), 'pdf-raw-text.txt');
    fs.writeFileSync(rawTextPath, pdfText, 'utf-8');
    console.log(`\n✓ 原始文本已保存: ${rawTextPath}`);

    // 2. 使用 AI 提取题目
    const questions = await parseQuestionsWithAI(pdfText, '2025-12', 'vocabulary');

    // 3. 保存结果
    const outputPath = path.join(process.cwd(), 'parsed-questions-2025-12.json');
    fs.writeFileSync(outputPath, JSON.stringify(questions, null, 2), 'utf-8');

    console.log(`\n✅ 解析完成！`);
    console.log(`📄 结果已保存到: ${outputPath}`);
    console.log(`📊 共解析 ${questions.length} 道题目`);
    console.log('\n下一步：');
    console.log('1. 检查 parsed-questions-2025-12.json');
    console.log('2. 人工校对题目和答案');
    console.log('3. 补充解析内容');
    console.log('4. 导入到数据库');
  } catch (error) {
    console.error('❌ 解析失败：', error);
    process.exit(1);
  }
}

// 执行
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
