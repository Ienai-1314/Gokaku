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

async function inspectDatabase() {
  console.log('检查数据库详细结构...\n');

  try {
    const { data } = await db.collection('exam_questions').limit(3).get();
    console.log(`获取到 ${data.length} 条数据\n`);

    data.forEach((item, index) => {
      console.log(`\n=== 题目 ${index + 1} ===`);
      console.log('所有字段:', Object.keys(item));
      console.log('完整数据:', JSON.stringify(item, null, 2));
    });
  } catch (error) {
    console.error('查询失败:', error);
  }
}

inspectDatabase();
