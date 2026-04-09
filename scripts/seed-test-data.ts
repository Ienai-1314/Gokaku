/**
 * 测试数据生成脚本
 * 用于生成个性化练习功能所需的测试数据
 */

import 'dotenv/config';
import { getDb } from '../lib/cloudbase';

// 测试用户 ID（请替换为你的实际账号 ID）
const TEST_ACCOUNT_ID = 'device-1775493097380-96rfyhdju';

// 示例错题数据
const sampleWrongQuestions = [
  {
    question: '彼は仕事が忙しくて、家族と過ごす時間が（　）。',
    userAnswer: 'ない',
    correctAnswer: 'なくなった',
    analysis: `**错误模式**
[时态错误、语法混淆]

**错误分析**
这道题考查的是「なくなる」的用法。「ない」是形容词否定形，表示"没有"的状态；而「なくなる」是动词，表示"变得没有了"的变化过程。题目强调的是因为工作忙碌，时间逐渐减少的过程。

**核心语法点**
「なくなる」= ない（形容词）+ なる（变化动词）
表示从有到无的变化过程，常用于描述事物的消失或减少。

**近义混淆点**
- ない：单纯表示"没有"的状态
- なくなる：表示"变得没有"的变化
- なくす：他动词，表示"弄丢、失去"（主语有意或无意造成）

**记忆方法**
记住公式：形容词词干 + なる = 表示变化
例：多い → 多くなる（变多）、少ない → 少なくなる（变少）`,
    errorPatterns: ['时态错误', '语法混淆'],
    classification: {
      knowledgeType: 'grammar',
      specificPoint: '形容词变化',
      errorReason: 'confusion',
      difficulty: 3,
      frequency: 'high'
    }
  },
  {
    question: '彼女は日本語が上手（　）、英語も話せます。',
    userAnswer: 'で',
    correctAnswer: 'な上に',
    analysis: `**错误模式**
[接续错误、语法混淆]

**错误分析**
这道题考查「な上に」的用法。「で」虽然可以表示并列，但语气较弱；「な上に」强调在前项基础上进一步添加，有"不仅...而且..."的递进关系。

**核心语法点**
「な上に」接在な形容词后，表示递进关系
- な形容词 + な上に
- い形容词 + い上に
- 动词普通形 + 上に

**近义混淆点**
- で：简单并列，语气平淡
- し：列举理由，可以多项并列
- な上に：强调递进，"不仅...而且..."

**记忆方法**
「上に」= 在...之上，表示在原有基础上再加一层，自然就是递进关系。`,
    errorPatterns: ['接续错误', '语法混淆'],
    classification: {
      knowledgeType: 'grammar',
      specificPoint: '递进表达',
      errorReason: 'confusion',
      difficulty: 3,
      frequency: 'high'
    }
  },
  {
    question: '雨が降り（　）、試合は中止になった。',
    userAnswer: 'そうで',
    correctAnswer: 'そうなので',
    analysis: `**错误模式**
[接续错误、语法混淆]

**错误分析**
这道题考查「そうだ（样态）」的接续。「降りそうで」表示"好像要下的样子"，但后续需要用「降りそうなので」才能接原因。样态助动词「そうだ」是な形容词型活用。

**核心语法点**
「そうだ（样态）」的活用：
- 中顿：そうで
- 原因：そうなので / そうだから
- 修饰名词：そうな + 名词

**近义混淆点**
- そうで：中顿形，后续需要继续描述
- そうなので：表示原因，"因为看起来..."
- そうだから：口语化的原因表达

**记忆方法**
记住「そうだ」是な形容词型活用，接续方式和「静かだ」一样：静かなので = そうなので`,
    errorPatterns: ['接续错误', '语法混淆'],
    classification: {
      knowledgeType: 'grammar',
      specificPoint: '样态助动词',
      errorReason: 'confusion',
      difficulty: 4,
      frequency: 'high'
    }
  },
  {
    question: '彼は医者（　）、弁護士でもある。',
    userAnswer: 'で',
    correctAnswer: 'であると同時に',
    analysis: `**错误模式**
[语法混淆、词汇辨析]

**错误分析**
这道题考查「であると同時に」的用法。虽然「で」也能表示并列，但题目强调的是"同时具备两种身份"，需要用更正式的表达。

**核心语法点**
「であると同時に」= である + と同時に
表示两件事同时成立，强调同时性
接续：名词 + であると同時に

**近义混淆点**
- で：简单并列
- であると同時に：强调同时性，更正式
- でありながら：表示转折，"虽然...但是..."

**记忆方法**
「同時」= 同时，看到这个词就知道强调两件事同时发生或同时成立。`,
    errorPatterns: ['语法混淆', '词汇辨析'],
    classification: {
      knowledgeType: 'grammar',
      specificPoint: '并列表达',
      errorReason: 'unfamiliar',
      difficulty: 4,
      frequency: 'medium'
    }
  },
  {
    question: '彼は約束を守らない（　）、嘘ばかりつく。',
    userAnswer: 'し',
    correctAnswer: 'ばかりか',
    analysis: `**错误模式**
[语法混淆、语义理解]

**错误分析**
这道题考查「ばかりか」的用法。「し」表示简单列举，而「ばかりか」强调"不仅...甚至..."的递进关系，语气更强烈。

**核心语法点**
「ばかりか」表示递进，"不仅...甚至..."
接续：
- 名词 + ばかりか
- 动词普通形 + ばかりか
- い形容词 + ばかりか
- な形容词词干 + ばかりか

**近义混淆点**
- し：简单列举，语气平淡
- ばかりか：强调递进，"不仅...甚至..."
- のみならず：书面语，"不仅...而且..."

**记忆方法**
「ばかり」= 只、光，「ばかりか」= 不光是这样，还有更甚的，自然就是递进。`,
    errorPatterns: ['语法混淆', '语义理解'],
    classification: {
      knowledgeType: 'grammar',
      specificPoint: '递进表达',
      errorReason: 'confusion',
      difficulty: 3,
      frequency: 'high'
    }
  },
  {
    question: '彼は優秀な学生（　）、スポーツも得意だ。',
    userAnswer: 'で',
    correctAnswer: 'であるばかりでなく',
    analysis: `**错误模式**
[语法混淆、接续错误]

**错误分析**
这道题考查「であるばかりでなく」的用法。这是「ばかりでなく」接在名词后的形式，需要加「である」。

**核心语法点**
「ばかりでなく」= 不仅...而且...
接续：
- 名词 + であるばかりでなく
- 动词普通形 + ばかりでなく
- い形容词 + ばかりでなく
- な形容词词干 + であるばかりでなく

**近义混淆点**
- で：简单并列
- ばかりでなく：递进，"不仅...而且..."
- だけでなく：同义，稍微口语化

**记忆方法**
名词后面要加「である」才能接「ばかりでなく」，就像「である」是名词的"桥梁"。`,
    errorPatterns: ['语法混淆', '接续错误'],
    classification: {
      knowledgeType: 'grammar',
      specificPoint: '递进表达',
      errorReason: 'confusion',
      difficulty: 4,
      frequency: 'high'
    }
  }
];

async function seedTestData() {
  try {
    console.log('开始生成测试数据...');

    const db = getDb();

    // 1. 清理现有测试数据
    console.log('\n1. 清理现有测试数据...');
    const { data: existingQuestions } = await db
      .collection('wrong_questions')
      .where({ account_id: TEST_ACCOUNT_ID })
      .get();

    if (existingQuestions && existingQuestions.length > 0) {
      for (const q of existingQuestions) {
        await db.collection('wrong_questions').doc(q._id as string).remove();
      }
      console.log(`   已删除 ${existingQuestions.length} 条旧数据`);
    }

    // 2. 插入错题数据
    console.log('\n2. 插入错题数据...');
    for (const q of sampleWrongQuestions) {
      await db.collection('wrong_questions').add({
        ...q,
        account_id: TEST_ACCOUNT_ID,
        user_id: TEST_ACCOUNT_ID,
        createdAt: new Date().toISOString()
      });
    }
    console.log(`   已插入 ${sampleWrongQuestions.length} 条错题`);

    // 3. 生成用户画像
    console.log('\n3. 生成用户画像...');

    // 统计错误模式
    const errorPatterns = {
      concept: 0,
      careless: 0,
      unfamiliar: 1,
      confusion: 5,
      complex: 0
    };

    // 统计薄弱点
    const weakAreasMap = new Map<string, { count: number; type: string }>();
    for (const q of sampleWrongQuestions) {
      const point = q.classification.specificPoint;
      const type = q.classification.knowledgeType;
      if (weakAreasMap.has(point)) {
        weakAreasMap.get(point)!.count++;
      } else {
        weakAreasMap.set(point, { count: 1, type });
      }
    }

    const weakAreas = Array.from(weakAreasMap.entries())
      .map(([point, data]) => ({
        knowledgeType: data.type,
        specificPoint: point,
        errorCount: data.count,
        lastError: new Date()
      }))
      .sort((a, b) => b.errorCount - a.errorCount);

    const profile = {
      accountId: TEST_ACCOUNT_ID,
      weakAreas,
      errorPatterns,
      recommendations: [
        '重点复习：递进表达、形容词变化、样态助动词',
        '对比学习易混淆知识点，建立清晰的区分标准',
        '加强接续词的系统学习，注意不同表达的语气差异'
      ],
      totalErrors: sampleWrongQuestions.length,
      lastUpdated: new Date()
    };

    await db.collection('user_profiles').doc(TEST_ACCOUNT_ID).set(profile);
    console.log('   用户画像已生成');

    console.log('\n✅ 测试数据生成完成！');
    console.log('\n📊 数据统计：');
    console.log(`   - 错题数量：${sampleWrongQuestions.length} 条`);
    console.log(`   - 薄弱知识点：${weakAreas.length} 个`);
    console.log(`   - 主要错误类型：混淆 (${errorPatterns.confusion} 次)`);
    console.log('\n🔗 测试链接：');
    console.log(`   - 个性化练习：http://localhost:3008/practice/personalized`);
    console.log(`   - 学习画像：http://localhost:3008/api/profile/learning`);
    console.log('\n⚠️  注意：请确保你已登录账号 ${TEST_ACCOUNT_ID}，或修改脚本中的 TEST_ACCOUNT_ID');

  } catch (error) {
    console.error('❌ 生成测试数据失败:', error);
    throw error;
  }
}

// 运行脚本
seedTestData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
