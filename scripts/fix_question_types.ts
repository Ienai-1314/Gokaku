#!/usr/bin/env tsx
/**
 * 修复数据库中题目的题型分类
 * 根据题号自动分类：1-8词汇，9-13语法，14+阅读
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import cloudbase from '@cloudbase/node-sdk';

// 加载环境变量
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const app = cloudbase.init({
  env: process.env.NEXT_PUBLIC_TCB_ENV_ID!,
  secretId: process.env.TCB_SECRET_ID!,
  secretKey: process.env.TCB_SECRET_KEY!,
});

const db = app.database();
const _ = db.command;

/**
 * 根据题号判断题型
 */
function getQuestionType(questionNumber: number): string {
  if (questionNumber >= 1 && questionNumber <= 8) {
    return 'vocabulary';
  } else if (questionNumber >= 9 && questionNumber <= 13) {
    return 'grammar';
  } else if (questionNumber >= 14) {
    return 'reading';
  }
  return 'unknown';
}

async function fixQuestionTypes() {
  console.log('开始修复题型分类...\n');

  try {
    // 获取所有题目
    const { data: questions } = await db
      .collection('exam_questions')
      .get();

    console.log(`找到 ${questions.length} 道题目\n`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    // 统计修复前的题型分布
    const beforeTypes: Record<string, number> = {};
    questions.forEach(q => {
      const type = q.question_type || 'unknown';
      beforeTypes[type] = (beforeTypes[type] || 0) + 1;
    });

    console.log('修复前题型分布:');
    Object.entries(beforeTypes).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });
    console.log();

    // 批量更新
    for (const question of questions) {
      const questionNumber = question.question_number;
      const currentType = question.question_type || 'unknown';
      const correctType = getQuestionType(questionNumber);

      if (currentType === correctType) {
        skipped++;
        continue;
      }

      try {
        await db
          .collection('exam_questions')
          .doc(question._id)
          .update({
            question_type: correctType,
          });

        console.log(`✓ 题目 ${questionNumber}: ${currentType} → ${correctType}`);
        updated++;
      } catch (error) {
        console.error(`✗ 题目 ${questionNumber} 更新失败:`, error);
        errors++;
      }
    }

    console.log('\n修复完成！');
    console.log(`  更新: ${updated}`);
    console.log(`  跳过: ${skipped}`);
    console.log(`  失败: ${errors}`);

    // 统计修复后的题型分布
    const { data: updatedQuestions } = await db
      .collection('exam_questions')
      .get();

    const afterTypes: Record<string, number> = {};
    updatedQuestions.forEach(q => {
      const type = q.question_type || 'unknown';
      afterTypes[type] = (afterTypes[type] || 0) + 1;
    });

    console.log('\n修复后题型分布:');
    Object.entries(afterTypes).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });

  } catch (error) {
    console.error('修复失败:', error);
    process.exit(1);
  }
}

fixQuestionTypes();
