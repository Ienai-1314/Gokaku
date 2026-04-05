/**
 * 兑换码发货消息生成器
 * 用法：node scripts/generate_delivery_message.js
 */

const fs = require('fs');
const path = require('path');

// 读取兑换码文件
const codesPath = path.join(__dirname, '../lib/data/redeem_codes.json');
const codes = JSON.parse(fs.readFileSync(codesPath, 'utf-8'));

// 找到第一个未使用的兑换码
const unusedCode = codes.find(c => c.status === 'unused');

if (!unusedCode) {
  console.error('❌ 没有可用的兑换码了！');
  process.exit(1);
}

// 生成发货消息
const message = `
【Gokaku 合格道 - 专属兑换码】

你的兑换码：${unusedCode.code}

使用步骤：
1. 访问 www.gokaku.cn
2. 点击右上角"兑换码"
3. 输入上面的码
4. 立即获得100次AI查询额度

⚠️ 每个码只能用1次，请尽快兑换
💡 有问题随时联系我

祝你7月N1一次过！🎉
`;

console.log(message);
console.log('\n---');
console.log(`✅ 已生成发货消息，兑换码：${unusedCode.code}`);
console.log(`📋 请复制上面的消息发送给买家`);
console.log(`⚠️  记得在 Excel 中记录这个码已发放`);

// 统计剩余兑换码
const remainingCodes = codes.filter(c => c.status === 'unused').length;
console.log(`\n📊 剩余可用兑换码：${remainingCodes} 个`);
