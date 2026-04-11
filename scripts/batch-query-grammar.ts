#!/usr/bin/env node
/**
 * 批量查询N1语法点并保存到缓存
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 读取环境变量
const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || 'dev-admin-key-2024';
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

// 读取语法点列表
const grammarPatternsFile = path.join(__dirname, '../output/grammar_patterns_list.json');
const grammarPatterns = JSON.parse(fs.readFileSync(grammarPatternsFile, 'utf-8'));

console.log(`📚 准备批量查询 ${grammarPatterns.length} 个语法点\n`);

// 批量查询函数
async function batchQueryGrammar() {
  const results = [];
  const errors = [];
  let successCount = 0;
  let cacheHitCount = 0;

  for (let i = 0; i < grammarPatterns.length; i++) {
    const pattern = grammarPatterns[i];
    const progress = `[${i + 1}/${grammarPatterns.length}]`;

    try {
      console.log(`${progress} 查询: ${pattern}`);

      const response = await fetch(`${API_BASE_URL}/api/query/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': ADMIN_SECRET_KEY
        },
        body: JSON.stringify({
          query: pattern,
          skipCache: false,
          skipRateLimit: true  // 管理员模式跳过速率限制
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // 读取流式响应
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullResponse += chunk;
      }

      // 检查是否命中缓存
      const isCached = response.headers.get('x-cache-hit') === 'true';
      if (isCached) {
        cacheHitCount++;
        console.log(`  ✅ 缓存命中 (${fullResponse.length} 字符)`);
      } else {
        console.log(`  ✅ AI生成 (${fullResponse.length} 字符)`);
      }

      results.push({
        pattern,
        response: fullResponse,
        cached: isCached,
        timestamp: new Date().toISOString()
      });

      successCount++;

      // 避免请求过快，稍微延迟
      if (!isCached) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        await new Promise(resolve => setTimeout(resolve, 500));
      }

    } catch (error) {
      console.error(`  ❌ 失败: ${error.message}`);
      errors.push({
        pattern,
        error: error.message
      });
    }
  }

  // 保存结果
  const outputDir = path.join(__dirname, '../output/grammar_cache_results');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const resultsFile = path.join(outputDir, 'batch_results.json');
  fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2), 'utf-8');

  if (errors.length > 0) {
    const errorsFile = path.join(outputDir, 'batch_errors.json');
    fs.writeFileSync(errorsFile, JSON.stringify(errors, null, 2), 'utf-8');
  }

  // 打印统计
  console.log('\n' + '='.repeat(60));
  console.log('📊 批量查询完成统计');
  console.log('='.repeat(60));
  console.log(`总计: ${grammarPatterns.length} 个语法点`);
  console.log(`成功: ${successCount} 个`);
  console.log(`失败: ${errors.length} 个`);
  console.log(`缓存命中: ${cacheHitCount} 个`);
  console.log(`新生成: ${successCount - cacheHitCount} 个`);
  console.log(`\n结果已保存到: ${resultsFile}`);

  if (errors.length > 0) {
    console.log(`错误日志: ${path.join(outputDir, 'batch_errors.json')}`);
  }
}

// 运行
batchQueryGrammar().catch(console.error);
