#!/usr/bin/env tsx
/**
 * 转换为 JSON Lines 格式（CloudBase 导入格式）
 */
import fs from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const inputFile = join(__dirname, '../output/grammar_cache_cloudbase.json');
const outputFile = join(__dirname, '../output/grammar_cache_jsonlines.json');

console.log('📦 转换为 JSON Lines 格式...\n');

// 读取 JSON 数组
const data = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));

console.log(`找到 ${data.length} 条记录\n`);

// 转换为 JSON Lines（每行一个 JSON 对象）
const jsonLines = data.map((item: any) => JSON.stringify(item)).join('\n');

// 写入文件
fs.writeFileSync(outputFile, jsonLines, 'utf-8');

console.log(`✅ 转换完成！`);
console.log(`输出文件: ${outputFile}`);
console.log(`\n现在可以在 CloudBase 控制台导入这个 .json 文件了（内容是 JSON Lines 格式）`);
