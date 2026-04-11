#!/usr/bin/env tsx
/**
 * 验证数据库缓存中的语法点数据
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

async function verifyCache() {
  console.log('🔍 检查数据库缓存...\n');

  try {
    // 查询所有缓存的语法点
    const { data } = await db.collection('grammar_cache')
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    console.log(`✅ 找到 ${data.length} 条缓存记录\n`);

    if (data.length === 0) {
      console.log('⚠️  数据库中还没有缓存数据');
      return;
    }

    // 统计信息
    const totalHits = data.reduce((sum, item) => sum + (item.hitCount || 0), 0);
    const avgHits = totalHits / data.length;

    console.log('📊 统计信息:');
    console.log(`  总命中次数: ${totalHits}`);
    console.log(`  平均命中: ${avgHits.toFixed(1)} 次/语法点`);

    // 显示最近的10条
    console.log('\n📝 最近缓存的10个语法点:');
    console.log('='.repeat(70));

    data.slice(0, 10).forEach((item, i) => {
      const createdAt = new Date(item.createdAt).toLocaleString('zh-CN');
      const response = item.response || '';
      const preview = response.substring(0, 50).replace(/\n/g, ' ');
      console.log(`${i + 1}. ${item.query}`);
      console.log(`   创建时间: ${createdAt}`);
      console.log(`   命中次数: ${item.hitCount || 0}`);
      console.log(`   响应长度: ${response.length} 字符`);
      console.log(`   预览: ${preview}...`);
      console.log('');
    });

    // 查找热门语法点
    const hotGrammar = [...data].sort((a, b) => (b.hitCount || 0) - (a.hitCount || 0)).slice(0, 5);

    if (hotGrammar.length > 0 && hotGrammar[0].hitCount > 0) {
      console.log('🔥 最热门的5个语法点:');
      console.log('='.repeat(70));
      hotGrammar.forEach((item, i) => {
        console.log(`${i + 1}. ${item.query} - ${item.hitCount} 次命中`);
      });
    }

  } catch (error) {
    console.error('❌ 查询失败:', error);
  }
}

verifyCache().then(() => {
  console.log('\n✅ 验证完成');
  process.exit(0);
});
