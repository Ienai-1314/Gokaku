/**
 * 数据迁移脚本：从旧的 user_id (设备ID/IP) 迁移到新的账号系统
 *
 * 迁移策略：
 * 1. 为每个唯一的 user_id 创建一个免费账号
 * 2. 在 device_bindings 表中创建设备绑定记录
 * 3. 将所有集合中的 user_id 字段重命名为 account_id
 *
 * 运行方式：node scripts/migrate-to-account-system.js
 */

require('dotenv').config({ path: '.env.local' });
const cloudbase = require('@cloudbase/node-sdk');

// 初始化 CloudBase
const app = cloudbase.init({
  env: process.env.TCB_ENV_ID,
  secretId: process.env.TCB_SECRET_ID,
  secretKey: process.env.TCB_SECRET_KEY
});

const db = app.database();

// 需要迁移的集合列表
const COLLECTIONS = [
  'users',
  'query_history',
  'collections',
  'wrong_questions',
  'weakness_analysis',
  'practice_records',
  'blessing_records',
  'invitations'
];

/**
 * 收集所有唯一的 user_id
 */
async function collectUniqueUserIds() {
  console.log('\n📊 收集所有唯一的 user_id...');
  const userIds = new Set();

  for (const collectionName of COLLECTIONS) {
    try {
      const collection = db.collection(collectionName);
      const { data } = await collection.get();

      data.forEach(doc => {
        if (doc.user_id) {
          userIds.add(doc.user_id);
        }
      });

      console.log(`  ✓ ${collectionName}: 找到 ${data.length} 条记录`);
    } catch (error) {
      console.log(`  ⚠ ${collectionName}: 集合不存在或为空`);
    }
  }

  console.log(`\n✅ 共找到 ${userIds.size} 个唯一的 user_id`);
  return Array.from(userIds);
}

/**
 * 创建账号和设备绑定
 */
async function createAccountsAndBindings(userIds) {
  console.log('\n🔧 创建账号和设备绑定...');

  const accountsCollection = db.collection('accounts');
  const bindingsCollection = db.collection('device_bindings');

  let successCount = 0;
  let skipCount = 0;

  for (const userId of userIds) {
    try {
      // 检查是否已存在账号
      const { data: existingAccounts } = await accountsCollection
        .where({ account_id: userId })
        .get();

      if (existingAccounts.length > 0) {
        console.log(`  ⊙ ${userId}: 账号已存在，跳过`);
        skipCount++;
        continue;
      }

      // 创建免费账号
      const now = new Date();
      const account = {
        account_id: userId,
        account_type: 'free',
        created_at: now,
        devices: [userId],
        max_devices: 3,
        daily_limit: 3,
        is_premium: false,
        expires_at: null,
        total_queries: 0,
        total_rewards: 0
      };

      await accountsCollection.add(account);

      // 创建设备绑定
      const binding = {
        device_id: userId,
        account_id: userId,
        first_bound_at: now,
        last_active_at: now
      };

      await bindingsCollection.add(binding);

      console.log(`  ✓ ${userId}: 创建账号和绑定`);
      successCount++;
    } catch (error) {
      console.error(`  ✗ ${userId}: 创建失败 - ${error.message}`);
    }
  }

  console.log(`\n✅ 创建完成: ${successCount} 个账号, ${skipCount} 个跳过`);
}

/**
 * 迁移集合数据：将 user_id 字段重命名为 account_id
 */
async function migrateCollectionData(collectionName) {
  console.log(`\n🔄 迁移 ${collectionName}...`);

  try {
    const collection = db.collection(collectionName);
    const { data } = await collection.get();

    if (data.length === 0) {
      console.log(`  ⊙ 集合为空，跳过`);
      return;
    }

    let successCount = 0;
    let skipCount = 0;

    for (const doc of data) {
      try {
        // 如果已经有 account_id 字段，跳过
        if (doc.account_id) {
          skipCount++;
          continue;
        }

        // 如果有 user_id，重命名为 account_id
        if (doc.user_id) {
          await collection.doc(doc._id).update({
            account_id: doc.user_id
          });
          successCount++;
        }
      } catch (error) {
        console.error(`  ✗ 文档 ${doc._id}: 更新失败 - ${error.message}`);
      }
    }

    console.log(`  ✅ 完成: ${successCount} 条更新, ${skipCount} 条跳过`);
  } catch (error) {
    console.error(`  ✗ 迁移失败: ${error.message}`);
  }
}

/**
 * 验证迁移结果
 */
async function verifyMigration() {
  console.log('\n🔍 验证迁移结果...');

  // 检查 accounts 表
  const accountsCollection = db.collection('accounts');
  const { data: accounts } = await accountsCollection.get();
  console.log(`  ✓ accounts 表: ${accounts.length} 个账号`);

  // 检查 device_bindings 表
  const bindingsCollection = db.collection('device_bindings');
  const { data: bindings } = await bindingsCollection.get();
  console.log(`  ✓ device_bindings 表: ${bindings.length} 个绑定`);

  // 检查各集合的 account_id 字段
  for (const collectionName of COLLECTIONS) {
    try {
      const collection = db.collection(collectionName);
      const { data } = await collection.get();

      const withAccountId = data.filter(doc => doc.account_id).length;
      const withUserId = data.filter(doc => doc.user_id && !doc.account_id).length;

      console.log(`  ✓ ${collectionName}: ${withAccountId} 条有 account_id, ${withUserId} 条仍使用 user_id`);
    } catch (error) {
      console.log(`  ⚠ ${collectionName}: 无法验证`);
    }
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 开始数据迁移到账号系统...\n');
  console.log('环境ID:', process.env.TCB_ENV_ID);

  try {
    // 步骤1: 收集所有唯一的 user_id
    const userIds = await collectUniqueUserIds();

    if (userIds.length === 0) {
      console.log('\n⚠️  没有找到需要迁移的数据');
      return;
    }

    // 步骤2: 创建账号和设备绑定
    await createAccountsAndBindings(userIds);

    // 步骤3: 迁移各集合的数据
    console.log('\n📦 迁移集合数据...');
    for (const collectionName of COLLECTIONS) {
      await migrateCollectionData(collectionName);
    }

    // 步骤4: 验证迁移结果
    await verifyMigration();

    console.log('\n✅ 数据迁移完成！');
    console.log('\n⚠️  注意事项：');
    console.log('  1. 旧的 user_id 字段仍然保留，可以手动删除');
    console.log('  2. 所有现有用户都被创建为免费账号');
    console.log('  3. 设备绑定已创建，每个设备绑定到自己的账号');
    console.log('  4. 建议在测试环境验证后再在生产环境运行');
  } catch (error) {
    console.error('\n❌ 迁移失败:', error);
    process.exit(1);
  }
}

// 运行迁移
main();
