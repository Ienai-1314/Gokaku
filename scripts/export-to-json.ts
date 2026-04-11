#!/usr/bin/env tsx
/**
 * 将批量查询结果导出为 CloudBase 可导入的 JSON 格式
 */
import fs from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function exportToJSON() {
  console.log('📦 导出批量查询结果为 JSON 格式...\n');

  try {
    // 读取批量查询结果
    const resultsFile = join(__dirname, '../output/grammar_cache_results/batch_results.json');

    if (!fs.existsSync(resultsFile)) {
      console.log('❌ 批量查询结果文件不存在');
      return;
    }

    const results = JSON.parse(fs.readFileSync(resultsFile, 'utf-8'));
    console.log(`找到 ${results.length} 条查询结果\n`);

    // 转换为 CloudBase 导入格式
    const cloudbaseFormat = results.map((item: any) => ({
      query: item.pattern.toLowerCase().trim(),
      result: item.response,
      hitCount: 0,
      createdAt: item.timestamp,
      updatedAt: item.timestamp,
    }));

    // 保存为新文件
    const outputFile = join(__dirname, '../output/grammar_cache_cloudbase.json');
    fs.writeFileSync(outputFile, JSON.stringify(cloudbaseFormat, null, 2), 'utf-8');

    console.log(`✅ 导出成功！`);
    console.log(`   文件路径: ${outputFile}`);
    console.log(`   记录数: ${cloudbaseFormat.length}`);
    console.log(`\n📋 下一步操作:`);
    console.log(`   1. 登录 CloudBase 控制台`);
    console.log(`   2. 删除 grammar_cache 集合（或创建新集合 grammar_cache_v2）`);
    console.log(`   3. 重新创建集合，配置索引: { "query": 1 } (唯一索引)`);
    console.log(`   4. 使用控制台的"导入数据"功能，上传 grammar_cache_cloudbase.json`);

  } catch (error) {
    console.error('❌ 操作失败:', error);
  }
}

exportToJSON().then(() => {
  console.log('\n✅ 完成');
  process.exit(0);
});
