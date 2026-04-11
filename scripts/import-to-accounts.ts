#!/usr/bin/env tsx
/**
 * 导入到新集合 n1_grammar_cache
 */
import dotenv from 'dotenv';
import tcb from '@cloudbase/node-sdk';
import fs from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

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

async function importToNewCollection() {
  console.log('📦 导入语法缓存到 n1_grammar_cache 集合...\n');

  try {
    // 读取导出的数据
    const dataFile = join(__dirname, '../output/grammar_cache_cloudbase.json');
    const data = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));

    console.log(`找到 ${data.length} 条记录\n`);

    const collection = db.collection('n1_grammar_cache');

    let successCount = 0;
    let errorCount = 0;

    for (const item of data) {
      try {
        await collection.add(item);
        successCount++;
        if (successCount % 10 === 0) {
          console.log(`✅ 已导入 ${successCount}/${data.length}`);
        }
      } catch (error: any) {
        errorCount++;
        console.error(`❌ 导入失败: ${item.query} - ${error.message}`);
      }
    }

    console.log(`\n📊 导入完成:`);
    console.log(`   成功: ${successCount}`);
    console.log(`   失败: ${errorCount}`);
    console.log(`   总计: ${data.length}`);

    if (successCount > 0) {
      console.log(`\n✅ 数据已导入到 n1_grammar_cache 集合`);
      console.log(`\n📝 下一步: 修改 lib/db-cache.ts 使用新集合名称`);
    }

  } catch (error) {
    console.error('❌ 操作失败:', error);
  }
}

importToNewCollection().then(() => {
  console.log('\n✅ 完成');
  process.exit(0);
});
