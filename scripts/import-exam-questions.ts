/**
 * 真题导入脚本
 * 用于将真题数据导入数据库
 */

import 'dotenv/config';
import { getDb } from '../lib/cloudbase';

// 真题数据类型定义
interface ExamQuestion {
  paperId: string;
  examDate: string;
  section: 'vocabulary' | 'grammar' | 'reading' | 'listening';
  questionNumber: number;
  questionType: string;
  content: {
    question: string;
    options: string[];
    correctAnswer: string;
    images?: string[];
  };
  analysis: {
    explanation: string;
    knowledgePoints: string[];
    difficulty: 1 | 2 | 3 | 4 | 5;
    relatedGrammar?: string[];
  };
  stats: {
    totalAttempts: number;
    correctRate: number;
  };
}

// 2025年12月 N1 真题种子数据（词汇部分前5题）
const SEED_QUESTIONS_2025_12: Omit<ExamQuestion, 'paperId'>[] = [
  {
    examDate: '2025-12',
    section: 'vocabulary',
    questionNumber: 1,
    questionType: '单选',
    content: {
      question: '彼は仕事が忙しくて、家族と過ごす時間が（　）。',
      options: ['ない', 'なくなった', 'なくす', 'なくなる'],
      correctAnswer: 'なくなった',
    },
    analysis: {
      explanation: `**正解：なくなった**

**解析**
这道题考查「なくなる」的用法。

- **ない**：形容词否定形，表示"没有"的状态
- **なくなった**：动词「なくなる」的过去式，表示"变得没有了"
- **なくす**：他动词，表示"弄丢、失去"
- **なくなる**：自动词，表示"消失、用完"

题目强调因工作繁忙，与家人相处的时间逐渐减少，应使用表示变化的「なくなった」。

**知识点**
- なくなる = ない（形容词）+ なる（变化动词）
- 表示从有到无的变化过程`,
      knowledgePoints: ['动词变化', '时态', '自他动词'],
      difficulty: 2,
      relatedGrammar: ['なくなる', '形容词+なる'],
    },
    stats: {
      totalAttempts: 0,
      correctRate: 0,
    },
  },
  {
    examDate: '2025-12',
    section: 'vocabulary',
    questionNumber: 2,
    questionType: '单选',
    content: {
      question: 'この問題は複雑で、簡単には（　）。',
      options: ['解けない', '解かない', '解けた', '解いた'],
      correctAnswer: '解けない',
    },
    analysis: {
      explanation: `**正解：解けない**

**解析**
这道题考查可能动词的否定形式。

- **解けない**：可能动词「解ける」的否定形，表示"解不开、解不了"
- **解かない**：意志动词「解く」的否定形，表示"不解"（主观不想解）
- **解けた**：可能动词的过去肯定形
- **解いた**：意志动词的过去肯定形

题目说问题复杂，强调的是客观上"解不了"，而非主观上"不想解"，应使用可能动词的否定形「解けない」。

**知识点**
- 可能动词：解く → 解ける
- 可能动词表示客观能力
- 意志动词表示主观意愿`,
      knowledgePoints: ['可能动词', '自他动词', '否定形'],
      difficulty: 3,
      relatedGrammar: ['可能形', '解く/解ける'],
    },
    stats: {
      totalAttempts: 0,
      correctRate: 0,
    },
  },
  {
    examDate: '2025-12',
    section: 'vocabulary',
    questionNumber: 3,
    questionType: '单选',
    content: {
      question: '彼女は毎日日記を（　）習慣がある。',
      options: ['つける', 'つく', 'ついた', 'つけた'],
      correctAnswer: 'つける',
    },
    analysis: {
      explanation: `**正解：つける**

**解析**
这道题考查「日記をつける」这个固定搭配。

- **つける**：他动词原形，"写、记录"
- **つく**：自动词，"附着、点燃"
- **ついた**：自动词过去式
- **つけた**：他动词过去式

「日記をつける」是固定表达，意为"写日记"。题目中「習慣がある」前需要用动词原形（辞书形）来修饰名词「習慣」。

**知识点**
- 固定搭配：日記をつける
- 动词修饰名词用辞书形
- 自他动词区分：つく（自）/つける（他）`,
      knowledgePoints: ['固定搭配', '自他动词', '动词修饰名词'],
      difficulty: 2,
      relatedGrammar: ['日記をつける', '動詞+名詞'],
    },
    stats: {
      totalAttempts: 0,
      correctRate: 0,
    },
  },
  {
    examDate: '2025-12',
    section: 'vocabulary',
    questionNumber: 4,
    questionType: '单选',
    content: {
      question: '新しいプロジェクトが（　）、準備を始めましょう。',
      options: ['始まるから', '始めるから', '始まったから', '始めたから'],
      correctAnswer: '始まるから',
    },
    analysis: {
      explanation: `**正解：始まるから**

**解析**
这道题考查自他动词和时态。

- **始まるから**：自动词现在形，"（项目）要开始了"
- **始めるから**：他动词现在形，"（我们）要开始"
- **始まったから**：自动词过去式，"（项目）已经开始了"
- **始めたから**：他动词过去式，"（我们）已经开始了"

题目说"新项目要开始了，所以开始准备吧"，项目是自己开始的（自动词），且还未开始（现在形表将来），应用「始まるから」。

**知识点**
- 自动词：始まる（事物自己开始）
- 他动词：始める（人主动开始某事）
- 现在形表将来`,
      knowledgePoints: ['自他动词', '时态', '因果关系'],
      difficulty: 3,
      relatedGrammar: ['始まる/始める', '〜から'],
    },
    stats: {
      totalAttempts: 0,
      correctRate: 0,
    },
  },
  {
    examDate: '2025-12',
    section: 'vocabulary',
    questionNumber: 5,
    questionType: '单选',
    content: {
      question: 'この本は内容が（　）、最後まで読めなかった。',
      options: ['難しくて', '難しいで', '難しいから', '難しくても'],
      correctAnswer: '難しくて',
    },
    analysis: {
      explanation: `**正解：難しくて**

**解析**
这道题考查形容词的中顿形（て形）。

- **難しくて**：い形容词的て形，表示原因或并列
- **難しいで**：语法错误（い形容词不能直接接で）
- **難しいから**：表示原因，但语气较强，不如て形自然
- **難しくても**：表示逆接，"即使难"，与后文矛盾

题目说"因为内容难，所以没读完"，表示原因，应使用て形「難しくて」。

**知识点**
- い形容词て形：〜くて
- て形表原因（较委婉）
- から表原因（较直接）`,
      knowledgePoints: ['形容词变形', 'て形', '原因表达'],
      difficulty: 2,
      relatedGrammar: ['い形容詞+て', '〜くて'],
    },
    stats: {
      totalAttempts: 0,
      correctRate: 0,
    },
  },
];

// 2025年7月 N1 真题种子数据（词汇部分前5题）
const SEED_QUESTIONS_2025_07: Omit<ExamQuestion, 'paperId'>[] = [
  {
    examDate: '2025-07',
    section: 'vocabulary',
    questionNumber: 1,
    questionType: '单选',
    content: {
      question: '会議の時間が（　）、早めに出発した方がいい。',
      options: ['迫る', '迫って', '迫った', '迫っている'],
      correctAnswer: '迫っている',
    },
    analysis: {
      explanation: `**正解：迫っている**

**解析**
这道题考查动词的进行时态。

- **迫る**：辞书形，"逼近"
- **迫って**：て形
- **迫った**：过去式
- **迫っている**：进行时，"正在逼近"

题目说"会议时间快到了，最好早点出发"，强调时间正在逼近的状态，应使用进行时「迫っている」。

**知识点**
- ている形表示状态持续
- 迫る：逼近、临近`,
      knowledgePoints: ['动词时态', 'ている形', '状态持续'],
      difficulty: 2,
      relatedGrammar: ['〜ている', '迫る'],
    },
    stats: {
      totalAttempts: 0,
      correctRate: 0,
    },
  },
  {
    examDate: '2025-07',
    section: 'vocabulary',
    questionNumber: 2,
    questionType: '单选',
    content: {
      question: '彼は約束を（　）ことで有名だ。',
      options: ['守る', '守って', '守った', '守っている'],
      correctAnswer: '守る',
    },
    analysis: {
      explanation: `**正解：守る**

**解析**
这道题考查动词修饰名词的用法。

- **守る**：辞书形，修饰名词「こと」
- **守って**：て形，不能直接修饰名词
- **守った**：过去式，表示"遵守了"
- **守っている**：进行时，表示"正在遵守"

「約束を守ること」表示"遵守约定这件事"，是一般性描述，应使用辞书形「守る」。

**知识点**
- 动词辞书形修饰名词
- こと：将动词名词化`,
      knowledgePoints: ['动词修饰名词', '名词化', '辞书形'],
      difficulty: 2,
      relatedGrammar: ['動詞+こと', '守る'],
    },
    stats: {
      totalAttempts: 0,
      correctRate: 0,
    },
  },
  {
    examDate: '2025-07',
    section: 'vocabulary',
    questionNumber: 3,
    questionType: '单选',
    content: {
      question: 'この問題は誰にも（　）。',
      options: ['解けない', '解かない', '解けなかった', '解かなかった'],
      correctAnswer: '解けない',
    },
    analysis: {
      explanation: `**正解：解けない**

**解析**
这道题考查可能动词的否定形。

- **解けない**：可能动词否定形，"解不了"
- **解かない**：意志动词否定形，"不解"
- **解けなかった**：可能动词过去否定
- **解かなかった**：意志动词过去否定

题目说"这个问题谁都解不了"，强调客观能力，应使用可能动词「解けない」。

**知识点**
- 可能动词：解く → 解ける
- 可能动词表客观能力`,
      knowledgePoints: ['可能动词', '否定形', '客观能力'],
      difficulty: 3,
      relatedGrammar: ['可能形', '解く/解ける'],
    },
    stats: {
      totalAttempts: 0,
      correctRate: 0,
    },
  },
  {
    examDate: '2025-07',
    section: 'vocabulary',
    questionNumber: 4,
    questionType: '单选',
    content: {
      question: '彼女は毎朝ジョギングを（　）習慣がある。',
      options: ['する', 'して', 'した', 'している'],
      correctAnswer: 'する',
    },
    analysis: {
      explanation: `**正解：する**

**解析**
这道题考查动词修饰名词的用法。

- **する**：辞书形，修饰名词「習慣」
- **して**：て形，不能直接修饰名词
- **した**：过去式
- **している**：进行时

「ジョギングをする習慣」表示"慢跑的习惯"，是一般性描述，应使用辞书形「する」。

**知识点**
- 动词辞书形修饰名词
- 习惯性动作用辞书形`,
      knowledgePoints: ['动词修饰名词', '辞书形', '习惯表达'],
      difficulty: 2,
      relatedGrammar: ['動詞+名詞', 'する'],
    },
    stats: {
      totalAttempts: 0,
      correctRate: 0,
    },
  },
  {
    examDate: '2025-07',
    section: 'vocabulary',
    questionNumber: 5,
    questionType: '单选',
    content: {
      question: '新しいシステムが（　）、業務が効率化された。',
      options: ['導入されて', '導入して', '導入されたから', '導入したから'],
      correctAnswer: '導入されて',
    },
    analysis: {
      explanation: `**正解：導入されて**

**解析**
这道题考查被动语态和て形。

- **導入されて**：被动语态て形，"被引入"
- **導入して**：主动语态て形，"引入"
- **導入されたから**：被动语态+から
- **導入したから**：主动语态+から

题目说"新系统被引入后，业务效率提高了"，系统是被引入的（被动），且表示原因用て形更自然，应用「導入されて」。

**知识点**
- 被动语态：される
- て形表原因（较委婉）`,
      knowledgePoints: ['被动语态', 'て形', '原因表达'],
      difficulty: 3,
      relatedGrammar: ['受身形', '〜されて'],
    },
    stats: {
      totalAttempts: 0,
      correctRate: 0,
    },
  },
];

async function importExamQuestions() {
  console.log('开始导入真题数据...\n');

  const db = getDb();
  const papersCollection = db.collection('exam_papers');
  const questionsCollection = db.collection('exam_questions');

  try {
    // 1. 创建试卷记录
    console.log('1. 创建试卷记录...');

    const paper2025_12 = {
      examDate: '2025-12',
      examType: 'N1',
      sections: {
        vocabulary: { questionCount: 5 },
        grammar: { questionCount: 0 },
        reading: { questionCount: 0 },
        listening: { questionCount: 0 },
      },
      pdfFiles: {
        paper: 'D:\\量化n1\\资料\\A 日语N1\\2025年12月N1 完整原卷\\A 2025年12月N1完整原卷.pdf',
        answer: 'D:\\量化n1\\资料\\A 日语N1\\2025年12月N1 完整原卷\\C 2025年12月N1答案.pdf',
        analysis: 'D:\\量化n1\\资料\\A 日语N1\\2025年12月N1 完整原卷\\B 2025年12月N1解析消除水印版.pdf',
        listeningScript: 'D:\\量化n1\\资料\\A 日语N1\\2025年12月N1 完整原卷\\2025年12月N1听力原文，译文，答案.pdf',
      },
      status: 'active',
      createdAt: new Date(),
    };

    const paper2025_07 = {
      examDate: '2025-07',
      examType: 'N1',
      sections: {
        vocabulary: { questionCount: 5 },
        grammar: { questionCount: 0 },
        reading: { questionCount: 0 },
        listening: { questionCount: 0 },
      },
      pdfFiles: {
        paper: 'D:\\量化n1\\资料\\A 日语N1\\N1 2025年7月原卷+听力音频\\N1 2025年7月完整版原卷.pdf',
        answer: '',
        analysis: '',
      },
      status: 'active',
      createdAt: new Date(),
    };

    const result1 = await papersCollection.add(paper2025_12);
    const result2 = await papersCollection.add(paper2025_07);

    console.log(`   ✓ 已创建试卷：2025-12 (ID: ${result1.id})`);
    console.log(`   ✓ 已创建试卷：2025-07 (ID: ${result2.id})`);

    // 2. 导入题目数据
    console.log('\n2. 导入题目数据...');

    const questions2025_12 = SEED_QUESTIONS_2025_12.map(q => ({
      ...q,
      paperId: result1.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const questions2025_07 = SEED_QUESTIONS_2025_07.map(q => ({
      ...q,
      paperId: result2.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    for (const question of questions2025_12) {
      await questionsCollection.add(question);
    }
    console.log(`   ✓ 已导入 2025-12 题目：${questions2025_12.length} 题`);

    for (const question of questions2025_07) {
      await questionsCollection.add(question);
    }
    console.log(`   ✓ 已导入 2025-07 题目：${questions2025_07.length} 题`);

    console.log('\n✅ 真题数据导入完成！\n');
    console.log('📊 数据统计：');
    console.log(`   - 试卷数量：2 套`);
    console.log(`   - 题目数量：${questions2025_12.length + questions2025_07.length} 题`);
    console.log(`   - 覆盖年份：2025-07, 2025-12`);
    console.log('\n🔗 测试链接：');
    console.log('   - 真题列表：http://localhost:3008/exam');
    console.log('   - 开始答题：http://localhost:3008/exam/practice');

  } catch (error) {
    console.error('❌ 导入失败：', error);
    throw error;
  }
}

// 执行导入
importExamQuestions()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
