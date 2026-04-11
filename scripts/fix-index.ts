#!/usr/bin/env tsx
/**
 * 检查并修复数据库索引
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

async function fixIndex() {
  console.log('🔍 检查数据库索引...\n');

  try {
    const collection = db.collection('grammar_cache');

    // 1. 查询所有记录，检查是否有问题
    console.log('📊 查询所有记录...');
    const { data } = await collection.get();
    console.log(`找到 ${data.length} 条记录\n`);

    // 检查每条记录的 query 字段
    let hasIssue = false;
    for (const item of data) {
      if (!item.query || item.query === null || item.query === undefined || item.query === '') {
        console.log(`⚠️  发现问题记录:`);
        console.log(`   ID: ${item._id}`);
        console.log(`   query: ${JSON.stringify(item.query)}`);
        console.log(`   result 长度: ${item.result?.length || 0}\n`);
        hasIssue = true;

        // 删除问题记录
        console.log(`🗑️  删除问题记录 ${item._id}...`);
        await collection.doc(item._id).remove();
        console.log('✅ 删除成功\n');
      }
    }

    if (!hasIssue) {
      console.log('✅ 所有记录的 query 字段都正常\n');
    }

    // 2. 尝试插入一条测试记录
    console.log('🧪 测试插入新记录...');
    const testQuery = 'test-index-' + Date.now();

    try {
      await collection.add({
        query: testQuery,
        result: '测试数据',
        hitCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      console.log('✅ 插入成功！\n');

      // 删除测试记录
      const testData = await collection.where({ query: testQuery }).get();
      if (testData.data && testData.data.length > 0) {
        await collection.doc(testData.data[0]._id).remove();
        console.log('✅ 测试记录已清理\n');
      }

      console.log('🎉 数据库索引正常，可以正常插入数据！');

    } catch (insertError: any) {
      console.error('❌ 插入失败:', insertError.message);
      console.log('\n建议：请在 CloudBase 控制台手动删除并重建 grammar_cache 集合');
    }

  } catch (error) {
    console.error('❌ 操作失败:', error);
  }
}

fixIndex().then(() => {
  console.log('\n✅ 完成');
  process.exit(0);
});
