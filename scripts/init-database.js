/**
 * CloudBase 数据库初始化脚本
 * 创建所有必需的集合
 */

const cloudbase = require("@cloudbase/node-sdk");
require('dotenv').config({ path: '.env.local' });

const app = cloudbase.init({
  env: process.env.TCB_ENV_ID,
  secretId: process.env.TCB_SECRET_ID,
  secretKey: process.env.TCB_SECRET_KEY,
});

const db = app.database();

async function initDatabase() {
  console.log("=== CloudBase 数据库初始化 ===\n");

  const collections = [
    {
      name: "users",
      description: "用户信息表",
      indexes: [
        { keys: [{ name: "device_id", direction: "1" }], unique: true }
      ]
    },
    {
      name: "wrong_questions",
      description: "错题本",
      indexes: [
        { keys: [{ name: "user_id", direction: "1" }] }
      ]
    },
    {
      name: "query_history",
      description: "查询历史",
      indexes: [
        { keys: [{ name: "user_id", direction: "1" }] }
      ]
    },
    {
      name: "collections",
      description: "收藏",
      indexes: [
        { keys: [{ name: "user_id", direction: "1" }] }
      ]
    },
    {
      name: "grammar_weakness",
      description: "语法薄弱点",
      indexes: [
        { keys: [{ name: "user_id", direction: "1" }] }
      ]
    },
    {
      name: "redeem_codes",
      description: "兑换码",
      indexes: [
        { keys: [{ name: "code", direction: "1" }], unique: true }
      ]
    },
    {
      name: "blessing_records",
      description: "祈福记录",
      indexes: [
        { keys: [{ name: "user_id", direction: "1" }] }
      ]
    },
    {
      name: "practice_records",
      description: "练习记录",
      indexes: [
        { keys: [{ name: "user_id", direction: "1" }] }
      ]
    }
  ];

  for (const collection of collections) {
    try {
      console.log(`创建集合: ${collection.name} (${collection.description})...`);

      // 尝试创建集合（如果已存在会报错，但不影响）
      try {
        await db.createCollection(collection.name);
        console.log(`✅ 集合 ${collection.name} 创建成功`);
      } catch (err) {
        if (err.code === 'DATABASE_COLLECTION_EXIST') {
          console.log(`⚠️  集合 ${collection.name} 已存在，跳过创建`);
        } else {
          throw err;
        }
      }

      // 创建索引
      if (collection.indexes && collection.indexes.length > 0) {
        for (const index of collection.indexes) {
          try {
            // CloudBase 的索引创建需要通过控制台或API，这里仅记录
            console.log(`   索引: ${index.keys.map(k => k.name).join(', ')}${index.unique ? ' (唯一)' : ''}`);
          } catch (err) {
            console.log(`   ⚠️  索引创建失败: ${err.message}`);
          }
        }
      }

      console.log();
    } catch (error) {
      console.error(`❌ 创建集合 ${collection.name} 失败:`, error.message);
      console.log();
    }
  }

  console.log("=== 数据库初始化完成 ===\n");
  console.log("注意：索引需要在腾讯云控制台手动创建");
  console.log("访问：https://console.cloud.tencent.com/tcb");
}

initDatabase();
