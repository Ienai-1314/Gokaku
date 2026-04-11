/**
 * 初始化 AI 查询缓存集合
 *
 * 用途：
 * 1. 创建 grammar_cache 和 vocab_cache 集合
 * 2. 为 query 字段创建唯一索引，加速查询
 * 3. 为 hitCount 创建索引，方便统计热门查询
 */

import cloudbase from "@cloudbase/node-sdk";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const envId = process.env.NEXT_PUBLIC_ENV_ID || process.env.TCB_ENV_ID;
const secretId = process.env.CLOUDBASE_SECRET_ID || process.env.TCB_SECRET_ID;
const secretKey = process.env.CLOUDBASE_SECRET_KEY || process.env.TCB_SECRET_KEY;

if (!envId || !secretId || !secretKey) {
  console.error("❌ 缺少必要的环境变量：");
  console.error("  - ENV_ID:", envId ? "✓" : "✗");
  console.error("  - SECRET_ID:", secretId ? "✓" : "✗");
  console.error("  - SECRET_KEY:", secretKey ? "✓" : "✗");
  process.exit(1);
}

const app = cloudbase.init({
  env: envId,
  secretId,
  secretKey,
});

const db = app.database();

async function initCacheCollections() {
  console.log("🚀 开始初始化缓存集合...\n");

  try {
    // 1. 创建 grammar_cache 集合
    console.log("📦 创建 grammar_cache 集合...");
    const grammarCache = db.collection("grammar_cache");

    // 检查集合是否已存在（通过尝试查询）
    try {
      await grammarCache.limit(1).get();
      console.log("✅ grammar_cache 集合已存在");
    } catch (error) {
      console.log("⚠️  grammar_cache 集合不存在，将在首次写入时自动创建");
    }

    // 2. 创建 vocab_cache 集合
    console.log("\n📦 创建 vocab_cache 集合...");
    const vocabCache = db.collection("vocab_cache");

    try {
      await vocabCache.limit(1).get();
      console.log("✅ vocab_cache 集合已存在");
    } catch (error) {
      console.log("⚠️  vocab_cache 集合不存在，将在首次写入时自动创建");
    }

    // 3. 创建索引（CloudBase 需要在控制台手动创建，这里只是记录）
    console.log("\n📋 索引创建说明：");
    console.log("请在 CloudBase 控制台为以下集合创建索引：");
    console.log("\ngrammar_cache 集合：");
    console.log("  - query: 唯一索引（加速查询 + 防止重复）");
    console.log("  - hitCount: 普通索引（统计热门查询）");
    console.log("  - createdAt: 普通索引（按时间排序）");
    console.log("\nvocab_cache 集合：");
    console.log("  - query: 唯一索引");
    console.log("  - hitCount: 普通索引");
    console.log("  - createdAt: 普通索引");

    console.log("\n✅ 初始化完成！");
    console.log("\n💡 下一步：运行 npm run seed-grammar-cache 预填充常见语法");

  } catch (error) {
    console.error("❌ 初始化失败:", error);
    process.exit(1);
  }
}

initCacheCollections();
