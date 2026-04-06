/**
 * 返现功能测试脚本
 * 用途：测试错题返现逻辑
 * 运行：node scripts/test-cashback.js
 */

// 模拟测试数据
const testCases = [
  {
    name: "未达到100道错题",
    totalErrors: 50,
    existingRewards: 0,
    shouldReward: false
  },
  {
    name: "刚好100道错题",
    totalErrors: 100,
    existingRewards: 0,
    shouldReward: true,
    expectedRewards: 1
  },
  {
    name: "200道错题",
    totalErrors: 200,
    existingRewards: 1,
    shouldReward: true,
    expectedRewards: 2
  },
  {
    name: "已经发放过的里程碑",
    totalErrors: 100,
    existingRewards: 1,
    shouldReward: false
  },
  {
    name: "跨越多个里程碑（150道，但只发放过1次）",
    totalErrors: 150,
    existingRewards: 1,
    shouldReward: false
  }
];

function checkShouldReward(totalErrors, existingRewards) {
  if (totalErrors === 0 || totalErrors % 100 !== 0) {
    return { shouldReward: false, reason: "未达到100的倍数" };
  }

  const rewardTimes = Math.floor(totalErrors / 100);

  if (rewardTimes > existingRewards) {
    return {
      shouldReward: true,
      newRewardCount: rewardTimes,
      reason: `应发放第 ${rewardTimes} 次返现`
    };
  }

  return {
    shouldReward: false,
    reason: `已发放过 ${existingRewards} 次，无需重复发放`
  };
}

console.log("=== 返现逻辑测试 ===\n");

testCases.forEach((testCase, index) => {
  console.log(`测试 ${index + 1}: ${testCase.name}`);
  console.log(`  错题数: ${testCase.totalErrors}`);
  console.log(`  已发放: ${testCase.existingRewards} 次`);

  const result = checkShouldReward(testCase.totalErrors, testCase.existingRewards);

  console.log(`  结果: ${result.shouldReward ? '✓ 应发放返现' : '✗ 不发放返现'}`);
  console.log(`  原因: ${result.reason}`);

  if (testCase.shouldReward !== result.shouldReward) {
    console.log(`  ❌ 测试失败！期望 ${testCase.shouldReward ? '发放' : '不发放'}，实际 ${result.shouldReward ? '发放' : '不发放'}`);
  } else {
    console.log(`  ✅ 测试通过`);
  }

  if (result.shouldReward && testCase.expectedRewards) {
    if (result.newRewardCount === testCase.expectedRewards) {
      console.log(`  ✅ 返现次数正确: ${result.newRewardCount}`);
    } else {
      console.log(`  ❌ 返现次数错误！期望 ${testCase.expectedRewards}，实际 ${result.newRewardCount}`);
    }
  }

  console.log("");
});

console.log("=== 进度计算测试 ===\n");

const progressTests = [
  { totalErrors: 0, expected: { current: 0, next: 100, remaining: 100 } },
  { totalErrors: 50, expected: { current: 50, next: 100, remaining: 50 } },
  { totalErrors: 99, expected: { current: 99, next: 100, remaining: 1 } },
  { totalErrors: 100, expected: { current: 0, next: 200, remaining: 100 } },
  { totalErrors: 150, expected: { current: 50, next: 200, remaining: 50 } },
  { totalErrors: 250, expected: { current: 50, next: 300, remaining: 50 } }
];

progressTests.forEach((test, index) => {
  const currentProgress = test.totalErrors % 100;
  const nextMilestone = Math.floor(test.totalErrors / 100) * 100 + 100;
  const remainingForNext = nextMilestone - test.totalErrors;

  console.log(`测试 ${index + 1}: ${test.totalErrors} 道错题`);
  console.log(`  当前进度: ${currentProgress}/100`);
  console.log(`  下个里程碑: ${nextMilestone}`);
  console.log(`  还需: ${remainingForNext} 道`);

  const passed =
    currentProgress === test.expected.current &&
    nextMilestone === test.expected.next &&
    remainingForNext === test.expected.remaining;

  if (passed) {
    console.log(`  ✅ 测试通过`);
  } else {
    console.log(`  ❌ 测试失败`);
    console.log(`  期望: 当前${test.expected.current}, 下个${test.expected.next}, 还需${test.expected.remaining}`);
  }
  console.log("");
});

console.log("=== 会员延长计算测试 ===\n");

function calculateNewExpiry(currentExpiry, monthsToAdd) {
  const current = currentExpiry ? new Date(currentExpiry) : new Date();
  const baseDate = current > new Date() ? current : new Date();
  const newExpiry = new Date(baseDate);
  newExpiry.setMonth(newExpiry.getMonth() + monthsToAdd);
  return newExpiry;
}

const expiryTests = [
  {
    name: "未过期会员延长",
    currentExpiry: "2026-12-31T23:59:59Z",
    monthsToAdd: 1,
    shouldExtendFrom: "current"
  },
  {
    name: "已过期会员延长",
    currentExpiry: "2025-01-01T00:00:00Z",
    monthsToAdd: 1,
    shouldExtendFrom: "now"
  },
  {
    name: "无会员记录",
    currentExpiry: null,
    monthsToAdd: 1,
    shouldExtendFrom: "now"
  }
];

expiryTests.forEach((test, index) => {
  console.log(`测试 ${index + 1}: ${test.name}`);
  console.log(`  当前到期: ${test.currentExpiry || '无'}`);

  const newExpiry = calculateNewExpiry(test.currentExpiry, test.monthsToAdd);
  const now = new Date();

  console.log(`  新到期时间: ${newExpiry.toISOString()}`);

  if (test.shouldExtendFrom === "current" && test.currentExpiry) {
    const current = new Date(test.currentExpiry);
    const expectedMonth = current.getMonth() + test.monthsToAdd;
    const actualMonth = newExpiry.getMonth();

    if (newExpiry > current) {
      console.log(`  ✅ 从当前到期时间延长`);
    } else {
      console.log(`  ❌ 延长计算错误`);
    }
  } else if (test.shouldExtendFrom === "now") {
    if (newExpiry > now) {
      console.log(`  ✅ 从当前时间延长`);
    } else {
      console.log(`  ❌ 延长计算错误`);
    }
  }

  console.log("");
});

console.log("=== 测试完成 ===");
