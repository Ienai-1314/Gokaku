/**
 * 预填充常见语法到缓存
 *
 * 用途：
 * 1. 从 N1 高频语法列表中提取 50-100 个常见语法
 * 2. 批量调用 AI 生成解析
 * 3. 存入 grammar_cache 集合
 * 4. 用户查询时直接返回，无需等待 AI
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

// N1 高频语法列表（从真题统计 + 常见语法书整理）
const HIGH_FREQUENCY_GRAMMAR = [
  // 测试阶段：先填充 5 个超高频语法
  "ところを", "に至って", "をものともせず", "ならいざ知らず", "ないまでも",

  // 后续批量填充时取消注释
  // "ともあれ", "ならでは", "にして", "をもって",
  // "といったところだ", "ずにはいられない", "ずにはおかない", "ないではいられない", "てやまない",
  // "かたわら", "かたがた", "がてら", "ついでに", "つつ",
  // "にあたって", "にあたり", "に際して", "に際し", "をきっかけに",
  // "を契機に", "を機に", "にともなって", "に伴い", "につれて",
  // "にしたがって", "に従い", "とともに", "と共に", "にかけて",
  // "にわたって", "に渡り", "を通じて", "を通して", "をめぐって",
  // "をめぐり", "に関して", "に関し", "について", "に対して",
  // "に対し", "に反して", "に反し", "にもかかわらず", "にかかわらず",
  // "といえども", "とはいえ", "ものの", "ながら", "つつも",
  // "一方で", "反面", "半面", "逆に", "かわりに",
  // "代わりに", "のに対して", "のに対し", "に比べて", "に比べ",
  // "ばかりに", "ばかりか", "どころか", "はおろか", "はもちろん",
  // "はもとより", "のみならず", "だけでなく", "上に", "うえに",
  // "あげく", "末に", "結果", "ために", "せいで",
  // "おかげで", "ことから", "ことで", "ことに", "ことには",
  // "ものだ", "ものではない", "ものか", "ものの", "わけだ",
  // "わけではない", "わけがない", "わけにはいかない", "べきだ", "べきではない",
];

// 调用 AI 生成语法解析
async function generateGrammarAnalysis(grammar: string): Promise<{ result: string; matchedGrammar: any[] }> {
  console.log(`  🤖 正在生成「${grammar}」的解析...`);

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/api/query/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": process.env.ADMIN_SECRET_KEY || "dev-admin-key-2024"
      },
      body: JSON.stringify({ query: grammar, skipCache: true, skipRateLimit: true }),
    });

    if (!response.ok) {
      throw new Error(`API 返回错误: ${response.status}`);
    }

    // 读取流式响应
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let result = "";

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        result += decoder.decode(value, { stream: true });
      }
    }

    // 查询真题匹配数据
    const grammarData = db.collection("grammar_patterns");
    const matchedGrammar = await grammarData
      .where({
        pattern: db.RegExp({
          regexp: grammar,
          options: "i",
        }),
      })
      .limit(5)
      .get();

    return {
      result,
      matchedGrammar: matchedGrammar.data || [],
    };
  } catch (error) {
    console.error(`  ❌ 生成失败:`, error);
    throw error;
  }
}

// 保存到缓存
async function saveToCache(grammar: string, result: string, matchedGrammar: any[]) {
  const cache = db.collection("grammar_cache");

  try {
    await cache.add({
      query: grammar,
      result,
      matchedGrammar,
      hitCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    console.log(`  ✅ 已保存到缓存`);
  } catch (error: any) {
    if (error.code === "DATABASE_DUPLICATE_KEY") {
      console.log(`  ⚠️  已存在，跳过`);
    } else {
      throw error;
    }
  }
}

async function seedGrammarCache() {
  console.log("🚀 开始预填充语法缓存...\n");

  // 确保集合存在（通过写入一条测试数据）
  console.log("📦 确保 grammar_cache 集合存在...");
  const cache = db.collection("grammar_cache");
  try {
    await cache.where({ query: "__test__" }).limit(1).get();
    console.log("✅ grammar_cache 集合已存在\n");
  } catch (error: any) {
    if (error.code === 'DATABASE_COLLECTION_NOT_EXIST') {
      console.log("⚠️  集合不存在，创建测试记录...");
      await cache.add({
        query: "__test__",
        result: "test",
        matchedGrammar: [],
        hitCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log("✅ 集合已创建\n");
    } else {
      throw error;
    }
  }

  console.log(`📊 共 ${HIGH_FREQUENCY_GRAMMAR.length} 个语法需要处理\n`);

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (let i = 0; i < HIGH_FREQUENCY_GRAMMAR.length; i++) {
    const grammar = HIGH_FREQUENCY_GRAMMAR[i];
    console.log(`\n[${i + 1}/${HIGH_FREQUENCY_GRAMMAR.length}] 处理「${grammar}」`);

    try {
      // 检查是否已存在
      const existing = await cache.where({ query: grammar }).limit(1).get();

      if (existing.data.length > 0) {
        console.log(`  ⏭️  已存在缓存，跳过`);
        skipCount++;
        continue;
      }

      // 生成解析
      const { result, matchedGrammar } = await generateGrammarAnalysis(grammar);

      // 保存到缓存
      await saveToCache(grammar, result, matchedGrammar);
      successCount++;

      // 避免 API 限流，每次请求间隔 2 秒
      if (i < HIGH_FREQUENCY_GRAMMAR.length - 1) {
        console.log(`  ⏳ 等待 2 秒...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

    } catch (error) {
      console.error(`  ❌ 处理失败:`, error);
      errorCount++;
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log("📊 预填充完成！");
  console.log(`✅ 成功: ${successCount} 个`);
  console.log(`⏭️  跳过: ${skipCount} 个`);
  console.log(`❌ 失败: ${errorCount} 个`);
  console.log("=".repeat(50));
}

seedGrammarCache().catch(console.error);
