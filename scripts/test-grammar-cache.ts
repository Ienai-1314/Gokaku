#!/usr/bin/env tsx
/**
 * 测试语法缓存功能
 */
import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dbCache from '../lib/db-cache.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 加载环境变量
dotenv.config({ path: join(__dirname, '../.env.local') });

async function testCache() {
  console.log('🧪 测试语法缓存功能...\n');

  // 测试查询一个已缓存的语法点
  const testQuery = 'に際して';

  console.log(`📝 查询: ${testQuery}`);
  console.log('⏱️  开始时间:', new Date().toISOString());

  const startTime = Date.now();
  const result = await dbCache.get(testQuery, 'grammar');
  const endTime = Date.now();

  console.log(`⏱️  耗时: ${endTime - startTime}ms\n`);

  if (result) {
    console.log('✅ 缓存命中！');
    console.log(`📊 命中次数: ${result.hitCount}`);
    console.log(`📅 创建时间: ${result.createdAt}`);
    console.log(`📅 更新时间: ${result.updatedAt}`);
    console.log(`📝 结果长度: ${result.result.length} 字符`);
    console.log(`\n前100字符预览:\n${result.result.substring(0, 100)}...`);
  } else {
    console.log('❌ 缓存未命中');
  }

  // 获取统计信息
  console.log('\n📊 缓存统计:');
  const stats = await dbCache.getStats('grammar');
  console.log(`   数据库记录数: ${stats.total}`);
  console.log(`   内存缓存数: ${stats.memorySize}`);

  // 获取热门查询
  console.log('\n🔥 热门查询 Top 5:');
  const topQueries = await dbCache.getTopQueries('grammar', 5);
  topQueries.forEach((item, index) => {
    console.log(`   ${index + 1}. ${item.query} (${item.hitCount} 次)`);
  });
}

testCache().catch(console.error);
