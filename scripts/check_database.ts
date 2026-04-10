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

async function checkDatabase() {
  console.log('检查数据库...\n');

  try {
    const { data } = await db.collection('exam_questions').get();
    console.log(`总题目数: ${data.length}`);

    const types: Record<string, number> = {};
    data.forEach(q => {
      const type = q.question_type || 'unknown';
      types[type] = (types[type] || 0) + 1;
    });

    console.log('\n题型分布:');
    Object.entries(types).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });

    console.log('\n前 10 道题示例:');
    data.slice(0, 10).forEach(q => {
      console.log(`  题号 ${q.question_number}: ${q.question_type} - ${q.question_text?.substring(0, 30)}...`);
    });
  } catch (error) {
    console.error('查询失败:', error);
  }
}

checkDatabase();
