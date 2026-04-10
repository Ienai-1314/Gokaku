/**
 * PDF 真题解析脚本 - 简化版
 * 直接使用 DeepSeek API 解析 PDF 文本
 */

import { config } from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// 加载环境变量
config({ path: path.join(process.cwd(), '.env.local') });

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
 * 使用 DeepSeek Vision API 直接解析 PDF
 */
async function parsePDFWithVision(pdfPath: string): Promise<ParsedQuestion[]> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY 未配置');
  }

  console.log(`\n正在使用 DeepSeek API 解析 PDF...`);
  console.log(`文件: ${path.basename(pdfPath)}`);

  // 将 PDF 转换为图片（使用系统命令）
  // 或者直接读取 PDF 文本
  const pdfBuffer = fs.readFileSync(pdfPath);
  const base64Pdf = pdfBuffer.toString('base64');

  const prompt = `你是 JLPT N1 真题解析专家。请仔细分析这份 PDF 真题，提取所有题目信息。

要求：
1. 识别题目编号（1-180）
2. 提取题干（日语原文）
3. 提取选项（通常是 1/2/3/4 或 A/B/C/D）
4. 识别题目类型（词汇、语法、阅读、听力）

返回 JSON 数组格式：
[
  {
    "questionNumber": 1,
    "section": "vocabulary",
    "question": "题干文本",
    "options": ["选项1", "选项2", "选项3", "选项4"],
    "correctAnswer": "选项1"
  }
]

注意：
- 只提取完整的题目
- 保持日语原文
- 如果无法识别，返回空数组 []
- 不要编造内容`;

  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API 错误 ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '[]';

    console.log('\nAPI 返回内容预览:');
    console.log(content.slice(0, 500));

    // 提取 JSON
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    const jsonStr = jsonMatch ? jsonMatch[0] : '[]';
    const rawQuestions = JSON.parse(jsonStr);

    console.log(`\n✓ 解析到 ${rawQuestions.length} 道题目`);

    // 转换为标准格式
    const questions: ParsedQuestion[] = rawQuestions.map((q: any) => ({
      questionNumber: q.questionNumber,
      section: q.section || 'vocabulary',
      questionType: '单选',
      content: {
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer || q.options[0],
      },
      analysis: {
        explanation: '解析待补充',
        knowledgePoints: [],
        difficulty: 3,
      },
    }));

    return questions;
  } catch (error) {
    console.error('API 调用失败：', error);
    return [];
  }
}

/**
 * 简化版：先手动提取 PDF 文本，再用 AI 解析
 */
async function parseWithManualText(examDate: string, examMonth: string): Promise<void> {
  console.log(`\n=== 开始解析 ${examDate} 年 ${examMonth} 月真题 ===\n`);

  // 示例：手动输入一些题目文本让 AI 解析
  const sampleText = `
問題1 ＿＿＿の言葉の読み方として最もよいものを、1・2・3・4から一つ選びなさい。

1 この薬は副作用が少ないので安心して使える。
  1 ふくさよう  2 ふくさよ  3 ふうさよう  4 ふうさよ

2 彼女は几帳面な性格だ。
  1 きちょうめん  2 きちょめん  3 きじょうめん  4 きじょめん
`;

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY 未配置');
  }

  const prompt = `你是 JLPT N1 真题解析专家。请从以下文本中提取题目信息：

${sampleText}

返回 JSON 数组格式：
[
  {
    "questionNumber": 1,
    "section": "vocabulary",
    "question": "この薬は副作用が少ないので安心して使える。",
    "options": ["ふくさよう", "ふくさよ", "ふうさよう", "ふうさよ"],
    "correctAnswer": "ふくさよう"
  }
]`;

  try {
    console.log('正在调用 DeepSeek API...');

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
      const errorText = await response.text();
      throw new Error(`API 错误 ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '[]';

    console.log('\n✓ API 调用成功！');
    console.log('\n返回内容：');
    console.log(content);

    // 提取 JSON
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const questions = JSON.parse(jsonMatch[0]);
      console.log(`\n✓ 成功解析 ${questions.length} 道题目`);

      // 保存结果
      const outputPath = path.join(
        process.cwd(),
        `parsed-questions-${examDate}-${examMonth}.json`
      );
      fs.writeFileSync(outputPath, JSON.stringify(questions, null, 2), 'utf-8');
      console.log(`\n✅ 结果已保存到: ${outputPath}`);
    }
  } catch (error) {
    console.error('❌ 解析失败：', error);
    throw error;
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('=== PDF 真题解析工具 ===\n');

  // 测试 API 连接
  console.log('1. 测试 DeepSeek API 连接...');
  await parseWithManualText('2025', '12');

  console.log('\n\n下一步：');
  console.log('1. 手动从 PDF 复制题目文本');
  console.log('2. 修改 sampleText 变量');
  console.log('3. 重新运行脚本');
  console.log('4. 逐步完善解析逻辑');
}

// 执行
main()
  .then(() => {
    console.log('\n✅ 完成！');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 错误：', error);
    process.exit(1);
  });
