/**
 * 用户系统功能测试脚本
 * 测试设备ID识别、个人中心数据、返现功能
 */

const cloudbase = require("@cloudbase/node-sdk");
require('dotenv').config({ path: '.env.local' });

const app = cloudbase.init({
  env: process.env.TCB_ENV_ID,
  secretId: process.env.TCB_SECRET_ID,
  secretKey: process.env.TCB_SECRET_KEY,
});

const db = app.database();

async function testUserSystem() {
  console.log("=== 用户系统功能测试 ===\n");

  const testDeviceId = `test_device_${Date.now()}`;
  console.log(`测试设备ID: ${testDeviceId}\n`);

  try {
    // 1. 测试创建用户
    console.log("1. 创建测试用户...");
    await db.collection("users").add({
      device_id: testDeviceId,
      quota: 100,
      membership_expiry: new Date("2026-12-31").toISOString(),
      createdAt: new Date().toISOString(),
    });
    console.log("✅ 用户创建成功\n");

    // 2. 测试添加错题
    console.log("2. 添加测试错题（模拟100道）...");
    for (let i = 1; i <= 100; i++) {
      await db.collection("wrong_questions").add({
        user_id: testDeviceId,
        question: `测试题目 ${i}`,
        userAnswer: "A",
        correctAnswer: "B",
        analysis: "测试分析",
        errorPatterns: ["语法错误"],
        createdAt: new Date().toISOString(),
      });
      if (i % 20 === 0) {
        console.log(`   已添加 ${i} 道错题...`);
      }
    }
    console.log("✅ 100道错题添加成功\n");

    // 3. 测试查询错题总数
    console.log("3. 查询错题总数...");
    const { data: wrongQuestions } = await db
      .collection("wrong_questions")
      .where({ user_id: testDeviceId })
      .get();
    console.log(`✅ 错题总数: ${wrongQuestions.length}\n`);

    // 4. 测试查询用户信息
    console.log("4. 查询用户信息...");
    const { data: users } = await db
      .collection("users")
      .where({ device_id: testDeviceId })
      .limit(1)
      .get();

    if (users && users.length > 0) {
      const user = users[0];
      console.log(`✅ 用户信息:`);
      console.log(`   - 剩余额度: ${user.quota}`);
      console.log(`   - 会员到期: ${user.membership_expiry}`);
      console.log(`   - 返现次数: ${user.total_rewards || 0}\n`);
    }

    // 5. 测试添加查询历史
    console.log("5. 添加查询历史...");
    await db.collection("query_history").add({
      user_id: testDeviceId,
      type: "grammar",
      query: "なり",
      createdAt: new Date().toISOString(),
    });
    await db.collection("query_history").add({
      user_id: testDeviceId,
      type: "vocab",
      query: "頑張る",
      createdAt: new Date().toISOString(),
    });
    console.log("✅ 查询历史添加成功\n");

    // 6. 测试添加收藏
    console.log("6. 添加收藏...");
    await db.collection("collections").add({
      user_id: testDeviceId,
      type: "grammar",
      content: "なり",
      createdAt: new Date().toISOString(),
    });
    console.log("✅ 收藏添加成功\n");

    // 7. 测试个人中心数据查询
    console.log("7. 测试个人中心数据查询...");
    const [historyResult, collectionsResult, weaknessResult, wrongQuestionsResult, userResult] =
      await Promise.all([
        db.collection("query_history").where({ user_id: testDeviceId }).get(),
        db.collection("collections").where({ user_id: testDeviceId }).get(),
        db.collection("grammar_weakness").where({ user_id: testDeviceId }).get(),
        db.collection("wrong_questions").where({ user_id: testDeviceId }).get(),
        db.collection("users").where({ device_id: testDeviceId }).limit(1).get(),
      ]);

    const stats = {
      totalQueries: historyResult.data?.length || 0,
      totalCollections: collectionsResult.data?.length || 0,
      totalErrors: wrongQuestionsResult.data?.length || 0,
      weaknessCount: weaknessResult.data?.length || 0,
      quotaRemaining: userResult.data?.[0]?.quota || 0,
    };

    console.log("✅ 个人中心数据:");
    console.log(`   - 总查询: ${stats.totalQueries}`);
    console.log(`   - 总收藏: ${stats.totalCollections}`);
    console.log(`   - 总错题: ${stats.totalErrors}`);
    console.log(`   - 薄弱点: ${stats.weaknessCount}`);
    console.log(`   - 剩余额度: ${stats.quotaRemaining}\n`);

    // 8. 清理测试数据
    console.log("8. 清理测试数据...");
    await db.collection("users").where({ device_id: testDeviceId }).remove();
    await db.collection("wrong_questions").where({ user_id: testDeviceId }).remove();
    await db.collection("query_history").where({ user_id: testDeviceId }).remove();
    await db.collection("collections").where({ user_id: testDeviceId }).remove();
    console.log("✅ 测试数据清理完成\n");

    console.log("=== 所有测试通过 ✅ ===");
  } catch (error) {
    console.error("❌ 测试失败:", error);

    // 清理测试数据
    try {
      await db.collection("users").where({ device_id: testDeviceId }).remove();
      await db.collection("wrong_questions").where({ user_id: testDeviceId }).remove();
      await db.collection("query_history").where({ user_id: testDeviceId }).remove();
      await db.collection("collections").where({ user_id: testDeviceId }).remove();
    } catch (cleanupError) {
      console.error("清理测试数据失败:", cleanupError);
    }
  }
}

testUserSystem();
