/**
 * 兑换码数据迁移脚本
 * 将 JSON 文件中的兑换码迁移到腾讯云数据库
 */

import 'dotenv/config';
import { getDb } from '../lib/cloudbase';
import * as fs from 'fs';
import * as path from 'path';

const JSON_FILE_PATH = 'D:\\量化n1\\lib\\data\\redeem_codes.json';

interface CodeFromJSON {
  code: string;
  status: 'available' | 'delivered' | 'used';
  createdAt: string;
  deliveredAt: string | null;
  deliveredTo: string | null;
  orderId: string | null;
  usedAt: string | null;
  usedBy: string | null;
}

interface CodeForDB {
  code: string;
  status: 'available' | 'delivered' | 'used';
  createdAt: Date;
  deliveredAt?: Date;
  deliveredTo?: string;
  orderId?: string;
  usedAt?: Date;
  usedBy?: string;
  membershipType: 'monthly';
  membershipDays: 30;
  batchId?: string;
  platform?: string;
  notes?: string;
}

async function migrateCodes() {
  console.log('开始迁移兑换码数据...\n');

  try {
    // 1. 读取 JSON 文件
    console.log('1. 读取 JSON 文件...');
    if (!fs.existsSync(JSON_FILE_PATH)) {
      console.error(`❌ 文件不存在：${JSON_FILE_PATH}`);
      process.exit(1);
    }

    const fileContent = fs.readFileSync(JSON_FILE_PATH, 'utf-8');
    const jsonData = JSON.parse(fileContent);
    const codesFromJSON: CodeFromJSON[] = jsonData.codes || [];

    console.log(`   ✓ 读取到 ${codesFromJSON.length} 个兑换码`);

    // 2. 初始化数据库
    console.log('\n2. 连接数据库...');
    const db = getDb();
    const collection = db.collection('redeem_codes');

    // 3. 检查集合是否存在
    console.log('\n3. 检查集合...');
    try {
      await db.createCollection('redeem_codes');
      console.log('   ✓ 已创建集合：redeem_codes');
    } catch (error: any) {
      if (error.code === 'DATABASE_COLLECTION_EXIST' || error.code === 'DATABASE_COLLECTION_ALREADY_EXIST') {
        console.log('   - 集合已存在：redeem_codes');
      } else {
        throw error;
      }
    }

    // 4. 清空现有数据（可选）
    console.log('\n4. 清空现有数据...');
    const { data: existingCodes } = await collection.limit(1000).get();
    if (existingCodes && existingCodes.length > 0) {
      console.log(`   - 发现 ${existingCodes.length} 条现有数据`);
      const confirm = process.argv.includes('--force');
      if (!confirm) {
        console.log('   ⚠️  使用 --force 参数强制覆盖');
        process.exit(0);
      }

      for (const code of existingCodes) {
        await collection.doc(code._id).remove();
      }
      console.log('   ✓ 已清空现有数据');
    } else {
      console.log('   - 集合为空，无需清空');
    }

    // 5. 转换数据格式
    console.log('\n5. 转换数据格式...');
    const codesForDB: CodeForDB[] = codesFromJSON.map((code) => ({
      code: code.code,
      status: code.status,
      createdAt: new Date(code.createdAt),
      deliveredAt: code.deliveredAt ? new Date(code.deliveredAt) : undefined,
      deliveredTo: code.deliveredTo || undefined,
      orderId: code.orderId || undefined,
      usedAt: code.usedAt ? new Date(code.usedAt) : undefined,
      usedBy: code.usedBy || undefined,
      membershipType: 'monthly',
      membershipDays: 30,
      batchId: 'initial-batch',
      platform: code.orderId ? 'xiaohongshu' : undefined,
    }));

    console.log(`   ✓ 已转换 ${codesForDB.length} 条数据`);

    // 6. 批量插入数据库
    console.log('\n6. 插入数据库...');
    let insertedCount = 0;
    const batchSize = 100;

    for (let i = 0; i < codesForDB.length; i += batchSize) {
      const batch = codesForDB.slice(i, i + batchSize);

      for (const code of batch) {
        try {
          await collection.add(code);
          insertedCount++;
        } catch (error: any) {
          console.error(`   ❌ 插入失败：${code.code}`, error.message);
        }
      }

      console.log(`   - 已插入 ${insertedCount}/${codesForDB.length}`);
    }

    console.log(`   ✓ 成功插入 ${insertedCount} 条数据`);

    // 7. 验证数据
    console.log('\n7. 验证数据...');
    const { data: allCodes } = await collection.limit(1000).get();
    const stats = {
      total: allCodes?.length || 0,
      available: allCodes?.filter((c: any) => c.status === 'available').length || 0,
      delivered: allCodes?.filter((c: any) => c.status === 'delivered').length || 0,
      used: allCodes?.filter((c: any) => c.status === 'used').length || 0,
    };

    console.log(`   ✓ 数据库中共有 ${stats.total} 条数据`);
    console.log(`     - 可用：${stats.available}`);
    console.log(`     - 已发放：${stats.delivered}`);
    console.log(`     - 已使用：${stats.used}`);

    // 8. 对比原始数据
    console.log('\n8. 对比原始数据...');
    const originalStats = {
      total: codesFromJSON.length,
      available: codesFromJSON.filter((c) => c.status === 'available').length,
      delivered: codesFromJSON.filter((c) => c.status === 'delivered').length,
      used: codesFromJSON.filter((c) => c.status === 'used').length,
    };

    const isMatch =
      stats.total === originalStats.total &&
      stats.available === originalStats.available &&
      stats.delivered === originalStats.delivered &&
      stats.used === originalStats.used;

    if (isMatch) {
      console.log('   ✅ 数据一致性验证通过！');
    } else {
      console.log('   ⚠️  数据不一致：');
      console.log(`     原始：总数 ${originalStats.total}, 可用 ${originalStats.available}, 已发放 ${originalStats.delivered}, 已使用 ${originalStats.used}`);
      console.log(`     数据库：总数 ${stats.total}, 可用 ${stats.available}, 已发放 ${stats.delivered}, 已使用 ${stats.used}`);
    }

    console.log('\n✅ 迁移完成！\n');
    console.log('📊 统计信息：');
    console.log(`   - 总兑换码：${stats.total}`);
    console.log(`   - 可用：${stats.available}`);
    console.log(`   - 已发放：${stats.delivered}`);
    console.log(`   - 已使用：${stats.used}`);
    console.log('\n🔗 下一步：');
    console.log('   - 访问管理后台：http://localhost:3008/admin');

  } catch (error) {
    console.error('\n❌ 迁移失败：', error);
    throw error;
  }
}

// 执行迁移
migrateCodes()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
