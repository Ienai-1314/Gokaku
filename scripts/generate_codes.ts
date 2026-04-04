/**
 * 生成兑换码脚本
 * 运行: npx ts-node scripts/generate_codes.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface RedeemCode {
  code: string;
  status: 'unused' | 'used';
  usedAt?: string;
  usedBy?: string; // IP地址
  createdAt: string;
}

function generateCode(): string {
  // 生成格式: GOKAKU-XXXX-XXXX (易读、易输入)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 去掉易混淆的 0O1I
  const part1 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const part2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `GOKAKU-${part1}-${part2}`;
}

function generateUniqueCodes(count: number): RedeemCode[] {
  const codes = new Set<string>();
  const now = new Date().toISOString();

  while (codes.size < count) {
    codes.add(generateCode());
  }

  return Array.from(codes).map(code => ({
    code,
    status: 'unused',
    createdAt: now
  }));
}

// 生成1000个兑换码
const codes = generateUniqueCodes(1000);

// 保存到 lib/data/redeem_codes.json
const outputPath = path.join(__dirname, '../lib/data/redeem_codes.json');
fs.writeFileSync(outputPath, JSON.stringify(codes, null, 2), 'utf-8');

console.log(`✅ 成功生成 ${codes.length} 个兑换码`);
console.log(`📁 保存位置: ${outputPath}`);
console.log(`\n示例兑换码:`);
codes.slice(0, 5).forEach(c => console.log(`  ${c.code}`));

// 同时生成一个纯文本版本，方便批量发货
const txtPath = path.join(__dirname, '../lib/data/redeem_codes.txt');
fs.writeFileSync(txtPath, codes.map(c => c.code).join('\n'), 'utf-8');
console.log(`\n📄 纯文本版本: ${txtPath}`);
