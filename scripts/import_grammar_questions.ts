import * as tcb from '@cloudbase/node-sdk';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const app = tcb.init({
  env: process.env.NEXT_PUBLIC_TCB_ENV_ID!,
  secretId: process.env.TCB_SECRET_ID!,
  secretKey: process.env.TCB_SECRET_KEY!,
});

const db = app.database();

interface Question {
  examDate: string;
  section: string;
  questionNumber: number;
  questionType: string;
  content: {
    question: string;
    options: {
      A: string;
      B: string;
      C: string;
      D: string;
    };
    correctAnswer: string;
  };
  analysis: {
    explanation: string;
    knowledgePoints: string[];
    difficulty: string;
    relatedGrammar: string[];
  };
  stats: {
    totalAttempts: number;
    correctRate: number;
  };
}

async function importGrammarQuestions() {
  try {
    // 读取题目文件
    const questionsPath = path.join(__dirname, '..', 'output', 'grammar_questions.json');
    const questionsData = fs.readFileSync(questionsPath, 'utf-8');
    const questions: Question[] = JSON.parse(questionsData);

    console.log(`读取了 ${questions.length} 道语法题目`);

    const collection = db.collection('exam_questions');

    let inserted = 0;
    let skipped = 0;
    let failed = 0;

    // 批量导入
    for (const question of questions) {
      try {
        // 检查是否已存在（根据 section 和 questionNumber）
        const { data: existing } = await collection
          .where({
            section: question.section,
            examDate: question.examDate,
            questionNumber: question.questionNumber,
          })
          .get();

        if (existing && existing.length > 0) {
          console.log(`跳过已存在的题目: ${question.examDate} - ${question.section} - Q${question.questionNumber}`);
          skipped++;
          continue;
        }

        // 添加时间戳
        const questionWithTimestamp = {
          ...question,
          paperId: `grammar-${question.examDate}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // 插入
        await collection.add(questionWithTimestamp);
        console.log(`✓ 导入: ${question.examDate} - ${question.section} - Q${question.questionNumber}`);
        inserted++;
      } catch (error) {
        console.error(`✗ 导入失败: ${question.examDate} - Q${question.questionNumber}`, error);
        failed++;
      }
    }

    console.log('\n导入完成！');
    console.log(`成功导入: ${inserted} 道`);
    console.log(`跳过重复: ${skipped} 道`);
    console.log(`导入失败: ${failed} 道`);
    console.log(`总计: ${questions.length} 道`);

  } catch (error) {
    console.error('导入过程出错:', error);
    process.exit(1);
  }
}

importGrammarQuestions();
