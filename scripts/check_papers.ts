#!/usr/bin/env tsx
import * as dotenv from 'dotenv';
import * as path from 'path';
import cloudbase from '@cloudbase/node-sdk';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const app = cloudbase.init({
  env: process.env.NEXT_PUBLIC_TCB_ENV_ID!,
  secretId: process.env.TCB_SECRET_ID!,
  secretKey: process.env.TCB_SECRET_KEY!,
});

const db = app.database();

async function checkPapers() {
  console.log('检查 exam_papers 集合...\n');

  try {
    const { data: papers } = await db.collection('exam_papers').get();
    console.log(`exam_papers 集合有 ${papers.length} 条数据\n`);

    if (papers.length > 0) {
      console.log('前 3 条数据:');
      papers.slice(0, 3).forEach((p, i) => {
        console.log(`\n${i + 1}. ${JSON.stringify(p, null, 2)}`);
      });
    }

    console.log('\n\n检查 exam_questions 集合...\n');
    const { data: questions } = await db.collection('exam_questions').get();
    console.log(`exam_questions 集合有 ${questions.length} 条数据`);

    // 按 examDate 分组统计
    const byDate: Record<string, any> = {};
    questions.forEach(q => {
      const date = q.examDate || 'unknown';
      if (!byDate[date]) {
        byDate[date] = { vocabulary: 0, grammar: 0, reading: 0, listening: 0 };
      }
      byDate[date][q.section] = (byDate[date][q.section] || 0) + 1;
    });

    console.log('\n按考试日期分组:');
    Object.entries(byDate).forEach(([date, sections]) => {
      console.log(`\n${date}:`);
      console.log(`  词汇: ${sections.vocabulary}`);
      console.log(`  语法: ${sections.grammar}`);
      console.log(`  阅读: ${sections.reading}`);
      console.log(`  听力: ${sections.listening}`);
    });
  } catch (error) {
    console.error('查询失败:', error);
  }
}

checkPapers();
