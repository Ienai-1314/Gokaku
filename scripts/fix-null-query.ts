#!/usr/bin/env tsx
/**
 * 查找并删除 query 为 null 的记录
 */
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import tcb from '@cloudbase/node-sdk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env.local') });

const app = tcb.init({
  env: process.env.TCB_ENV_ID!,
  secretId: process.env.TCB_SECRET_ID!,
  secretKey: process.env.TCB_SECRET_KEY!,
});

const db = app.database();

async function fixNullQuery() {
  console.log('🔍 查找 query 为 null 的记录...\n');

  try {
    // 查找所有记录
    const { data } = await db.collection('grammar_cache').get();

    console.log(`总共找到 ${data.length} 条记录\n`);

    // 找出 query 为 null 或 undefined 的记录
    const nullRecords = data.filter(item => !item.query);

    if (nullRecords.length === 0) {
      console.log('✅ 没有发现 query 为 null 的记录');
      return;
    }

    console.log(`⚠️  发现 ${nullRecords.length} 条 query 为 null 的记录：\n`);

    for (const record of nullRecords) {
      console.log(`记录 ID: ${record._id}`);
      console.log(`  query: ${record.query}`);
      console.log(`  result 长度: ${record.result?.length || 0}`);
      console.log('');

      // 删除这条记录
      console.log(`🗑️  删除记录 ${record._id}...`);
      await db.collection('grammar_cache').doc(record._id).remove();
      console.log('✅ 删除成功\n');
    }

    console.log('✅ 所有问题记录已清理');

  } catch (error) {
    console.error('❌ 操作失败:', error);
  }
}

fixNullQuery().then(() => {
  console.log('\n✅ 完成');
  process.exit(0);
});
