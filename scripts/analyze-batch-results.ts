#!/usr/bin/env node
/**
 * 分析批量查询结果
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const resultsFile = path.join(__dirname, '../output/grammar_cache_results/batch_results.json');

if (!fs.existsSync(resultsFile)) {
  console.log('❌ 结果文件不存在，请等待批量查询完成');
  process.exit(1);
}

const results = JSON.parse(fs.readFileSync(resultsFile, 'utf-8'));

console.log('📊 批量查询结果分析\n');
console.log('='.repeat(60));

// 基本统计
const total = results.length;
const cached = results.filter(r => r.cached).length;
const generated = total - cached;

console.log(`总计: ${total} 个语法点`);
console.log(`缓存命中: ${cached} 个 (${(cached/total*100).toFixed(1)}%)`);
console.log(`AI生成: ${generated} 个 (${(generated/total*100).toFixed(1)}%)`);

// 响应长度统计
const lengths = results.map(r => r.response.length);
const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
const minLength = Math.min(...lengths);
const maxLength = Math.max(...lengths);

console.log('\n响应长度统计:');
console.log(`  平均: ${avgLength.toFixed(0)} 字符`);
console.log(`  最短: ${minLength} 字符`);
console.log(`  最长: ${maxLength} 字符`);

// 找出最长和最短的响应
const shortest = results.find(r => r.response.length === minLength);
const longest = results.find(r => r.response.length === maxLength);

console.log(`\n最短响应: ${shortest.pattern} (${minLength} 字符)`);
console.log(`最长响应: ${longest.pattern} (${maxLength} 字符)`);

// 显示前5个语法点的预览
console.log('\n前5个语法点预览:');
console.log('='.repeat(60));
results.slice(0, 5).forEach((r, i) => {
  console.log(`\n${i + 1}. ${r.pattern}`);
  console.log(`   长度: ${r.response.length} 字符`);
  console.log(`   缓存: ${r.cached ? '是' : '否'}`);
  console.log(`   预览: ${r.response.substring(0, 100)}...`);
});

console.log('\n' + '='.repeat(60));
console.log('✅ 分析完成');
