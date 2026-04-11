/**
 * 通过 API 路由创建缓存集合
 *
 * CloudBase 不支持通过 SDK 直接创建集合，
 * 但可以通过首次写入来触发集合自动创建
 */

async function createCollections() {
  console.log("🚀 通过 API 创建缓存集合...\n");

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';

  try {
    // 1. 触发 grammar_cache 集合创建
    console.log("📦 创建 grammar_cache 集合...");
    const grammarRes = await fetch(`${baseUrl}/api/query/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: '__init_test__' }),
    });

    if (grammarRes.ok) {
      console.log("✅ grammar_cache 集合已创建");
    } else {
      console.error("❌ 创建失败:", await grammarRes.text());
    }

    // 2. 触发 vocab_cache 集合创建
    console.log("\n📦 创建 vocab_cache 集合...");
    const vocabRes = await fetch(`${baseUrl}/api/vocab`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word: '__init_test__' }),
    });

    if (vocabRes.ok) {
      console.log("✅ vocab_cache 集合已创建");
    } else {
      console.error("❌ 创建失败:", await vocabRes.text());
    }

    console.log("\n✅ 集合创建完成！");
    console.log("\n💡 下一步：运行 npm run seed-grammar 预填充常见语法");

  } catch (error) {
    console.error("❌ 创建失败:", error);
    process.exit(1);
  }
}

createCollections();
