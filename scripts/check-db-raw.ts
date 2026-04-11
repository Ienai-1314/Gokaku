#!/usr/bin/env tsx
/**
 * 直接查询数据库原始数据
 */
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import tcb from '@cloudbase/node-sdk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 加载环境变量
dotenv.config({ path: join(__dirname, '../.env.local') });

const app = tcb.init({
  env: process.env.TCB_ENV_ID!,
  secretId: process.env.TCB_SECRET_ID!,
  secretKey: process.env.TCB_SECRET_KEY!,
});

const db = app.database();

async function checkRawData() {
  console.log('🔍 查询数据库原始数据...\n');

  try {
    // 查询所有记录
    const { data } = await db.collection('grammar_cache')
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    console.log(`找到 ${data.length} 条记录\n`);

    data.forEach((item, i) => {
      console.log(`记录 ${i + 1}:`);
      console.log(JSON.stringify(item, null, 2));
      console.log('\n' + '='.repeat(70) + '\n');
    });

  } catch (error) {
    console.error('❌ 查询失败:', error);
  }
}

checkRawData().then(() => {
  console.log('✅ 完成');
  process.exit(0);
});
