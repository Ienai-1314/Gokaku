/**
 * 检查缓存集合是否存在
 */

import cloudbase from "@cloudbase/node-sdk";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const envId = process.env.NEXT_PUBLIC_ENV_ID || process.env.TCB_ENV_ID;
const secretId = process.env.CLOUDBASE_SECRET_ID || process.env.TCB_SECRET_ID;
const secretKey = process.env.CLOUDBASE_SECRET_KEY || process.env.TCB_SECRET_KEY;

if (!envId || !secretId || !secretKey) {
  console.error("❌ 缺少必要的环境变量");
  process.exit(1);
}

const app = cloudbase.init({
  env: envId,
  secretId,
  secretKey,
});

const db = app.database();

async function checkCollections() {
  console.log("🔍 检查缓存集合...\n");

  // 检查 grammar_cache
  try {
    console.log("📦 检查 grammar_cache...");
    const grammarCache = db.collection("grammar_cache");
    const count = await grammarCache.count();
    console.log(`✅ grammar_cache 存在，共 ${count.total} 条记录`);

    // 显示前 3 条记录
    const sample = await grammarCache.limit(3).get();
    console.log("   示例记录:", sample.data.map((d: any) => d.query).join(", "));
  } catch (error: any) {
    console.error("❌ grammar_cache 不存在:", error.code);
  }

  // 检查 vocab_cache
  try {
    console.log("\n📦 检查 vocab_cache...");
    const vocabCache = db.collection("vocab_cache");
    const count = await vocabCache.count();
    console.log(`✅ vocab_cache 存在，共 ${count.total} 条记录`);

    const sample = await vocabCache.limit(3).get();
    console.log("   示例记录:", sample.data.map((d: any) => d.query).join(", "));
  } catch (error: any) {
    console.error("❌ vocab_cache 不存在:", error.code);
  }
}

checkCollections();
