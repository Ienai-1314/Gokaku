#!/usr/bin/env tsx
/**
 * 将内存缓存的结果导出到新集合
 */
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import tcb from '@cloudbase/node-sdk';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env.local') });

const app = tcb.init({
  env: process.env.TCB_ENV_ID!,
  secretId: process.env.TCB_SECRET_ID!,
  secretKey: process.env.TCB_SECRET_KEY!,
});

const db = app.database();

async function exportToNewCollection() {
  console.log('📦 导出批量查询结果到新集合...\n');

  try {
    // 读取批量查询结果
    const resultsFile = join(__dirname, '../output/grammar_cache_results/batch_results.json');

    if (!fs.existsSync(resultsFile)) {
      console.log('❌ 批量查询结果文件不存在');
      console.log('   文件路径:', resultsFile);
      return;
    }

    const results = JSON.parse(fs.readFileSync(resultsFile, 'utf-8'));
    console.log(`找到 ${results.length} 条查询结果\n`);

    if (results.length === 0) {
      console.log('⚠️  结果文件为空，请等待批量查询完成');
      return;
    }

    // 使用新集合名称
    const newCollectionName = 'grammar_cache_v2';
    const collection = db.collection(newCollectionName);

    console.log(`📝 开始导入到集合: ${newCollectionName}\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const item of results) {
      try {
        await collection.add({
          query: item.pattern.toLowerCase().trim(),
          result: item.response,
          hitCount: 0,
          createdAt: item.timestamp,
          updatedAt: item.timestamp,
        });
        successCount++;
        if (successCount % 10 === 0) {
          console.log(`✅ 已导入 ${successCount}/${results.length}`);
        }
      } catch (error: any) {
        errorCount++;
        console.error(`❌ 导入失败: ${item.pattern} - ${error.message}`);
      }
    }

    console.log(`\n📊 导入完成:`);
    console.log(`   成功: ${successCount}`);
    console.log(`   失败: ${errorCount}`);
    console.log(`   总计: ${results.length}`);

  } catch (error) {
    console.error('❌ 操作失败:', error);
  }
}

exportToNewCollection().then(() => {
  console.log('\n✅ 完成');
  process.exit(0);
});
