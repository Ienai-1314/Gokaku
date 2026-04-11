#!/usr/bin/env tsx
/**
 * 测试数据库缓存保存功能
 */
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 加载环境变量
dotenv.config({ path: join(__dirname, '../.env.local') });

// 动态导入 db-cache
async function testDbCache() {
  console.log('🧪 测试数据库缓存保存功能\n');

  // 检查环境变量
  console.log('环境变量检查:');
  console.log(`  TCB_ENV_ID: ${process.env.TCB_ENV_ID ? '✅' : '❌'}`);
  console.log(`  TCB_SECRET_ID: ${process.env.TCB_SECRET_ID ? '✅' : '❌'}`);
  console.log(`  TCB_SECRET_KEY: ${process.env.TCB_SECRET_KEY ? '✅' : '❌'}`);
  console.log('');

  try {
    // 动态导入
    const dbCacheModule = await import('../lib/db-cache.js');
    const dbCache = dbCacheModule.default;

    console.log('📝 测试保存数据...');
    const testQuery = 'test-grammar-' + Date.now();
    const testResult = '这是一个测试结果，用于验证数据库保存功能是否正常工作。';

    await dbCache.set(testQuery, 'grammar', testResult, []);
    console.log('✅ 保存成功（异步）\n');

    // 等待2秒让异步保存完成
    console.log('⏳ 等待2秒让异步保存完成...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('🔍 尝试读取刚保存的数据...');
    const cached = await dbCache.get(testQuery, 'grammar');

    if (cached) {
      console.log('✅ 读取成功！');
      console.log(`   查询: ${testQuery}`);
      console.log(`   结果长度: ${cached.result.length} 字符`);
      console.log(`   预览: ${cached.result.substring(0, 50)}...`);
    } else {
      console.log('❌ 读取失败 - 数据未保存到数据库');
      console.log('   可能原因：');
      console.log('   1. 数据库连接失败');
      console.log('   2. 集合不存在');
      console.log('   3. 权限不足');
    }

  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

testDbCache().then(() => {
  console.log('\n✅ 测试完成');
  process.exit(0);
});
