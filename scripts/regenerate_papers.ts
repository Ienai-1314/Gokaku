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

async function regeneratePapers() {
  console.log('重新生成 exam_papers...\n');

  try {
    // 1. 获取所有题目
    const { data: questions } = await db.collection('exam_questions').get();
    console.log(`找到 ${questions.length} 道题目`);

    // 2. 按 examDate 分组
    const byDate: Record<string, any> = {};
    questions.forEach(q => {
      const date = q.examDate;
      if (!byDate[date]) {
        byDate[date] = {
          examDate: date,
          examType: 'N1',
          sections: {
            vocabulary: { questionCount: 0 },
            grammar: { questionCount: 0 },
            reading: { questionCount: 0 },
            listening: { questionCount: 0 },
          },
          status: 'active',
          createdAt: new Date().toISOString(),
        };
      }
      byDate[date].sections[q.section].questionCount++;
    });

    console.log(`\n生成 ${Object.keys(byDate).length} 份试卷:`);
    Object.entries(byDate).forEach(([date, paper]) => {
      console.log(`\n${date}:`);
      console.log(`  词汇: ${paper.sections.vocabulary.questionCount}`);
      console.log(`  语法: ${paper.sections.grammar.questionCount}`);
      console.log(`  阅读: ${paper.sections.reading.questionCount}`);
      console.log(`  听力: ${paper.sections.listening.questionCount}`);
    });

    // 3. 清空旧数据
    console.log('\n清空旧的 exam_papers 数据...');
    const { data: oldPapers } = await db.collection('exam_papers').get();
    for (const paper of oldPapers) {
      await db.collection('exam_papers').doc(paper._id).remove();
    }
    console.log(`删除了 ${oldPapers.length} 条旧数据`);

    // 4. 插入新数据
    console.log('\n插入新的 exam_papers 数据...');
    const papers = Object.values(byDate);
    for (const paper of papers) {
      await db.collection('exam_papers').add(paper);
    }
    console.log(`插入了 ${papers.length} 条新数据`);

    console.log('\n✅ 完成！');
  } catch (error) {
    console.error('操作失败:', error);
  }
}

regeneratePapers();
