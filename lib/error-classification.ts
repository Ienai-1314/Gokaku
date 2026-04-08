/**
 * 错题分类系统
 * 5 维度分类：知识点类型、具体知识点、错误原因、难度、考频
 */

export interface ErrorClassification {
  knowledgeType: 'grammar' | 'vocab' | 'kanji' | 'reading' | 'listening';
  specificPoint: string; // 具体知识点，如"使役受身"、"敬语"等
  errorReason: 'concept' | 'careless' | 'unfamiliar' | 'confusion' | 'complex';
  difficulty: 1 | 2 | 3 | 4 | 5; // 1=简单, 5=困难
  frequency: 'high' | 'medium' | 'low'; // 考试出现频率
}

export interface UserProfile {
  accountId: string;
  weakAreas: Array<{
    knowledgeType: string;
    specificPoint: string;
    errorCount: number;
    lastError: Date;
  }>;
  errorPatterns: {
    concept: number; // 概念理解错误次数
    careless: number; // 粗心大意次数
    unfamiliar: number; // 不熟悉次数
    confusion: number; // 混淆次数
    complex: number; // 复杂题目错误次数
  };
  recommendations: string[];
  totalErrors: number;
  lastUpdated: Date;
}

/**
 * 使用 AI 分析错题并分类
 */
export async function classifyError(
  question: string,
  userAnswer: string,
  correctAnswer: string,
  analysis: string
): Promise<ErrorClassification> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error('API key not configured');
  }

  const prompt = `你是 N1 日语考试专家。请分析这道错题并进行分类。

题目：${question}
用户答案：${userAnswer}
正确答案：${correctAnswer}
AI 分析：${analysis}

请按以下 5 个维度分类（只返回 JSON，不要其他文字）：

1. knowledgeType（知识点类型）：
   - grammar: 语法题
   - vocab: 词汇题
   - kanji: 汉字题
   - reading: 阅读理解题
   - listening: 听力题

2. specificPoint（具体知识点）：
   例如："使役受身"、"敬语"、"复合动词"、"副词用法"等

3. errorReason（错误原因）：
   - concept: 概念理解错误（不理解语法规则或词义）
   - careless: 粗心大意（知道但选错了）
   - unfamiliar: 不熟悉（没见过这个知识点）
   - confusion: 混淆（与其他知识点混淆）
   - complex: 复杂题目（题目本身难度高）

4. difficulty（难度）：1-5（1=简单, 5=困难）

5. frequency（考频）：
   - high: 高频考点
   - medium: 中频考点
   - low: 低频考点

返回格式：
{
  "knowledgeType": "grammar",
  "specificPoint": "使役受身",
  "errorReason": "confusion",
  "difficulty": 3,
  "frequency": "high"
}`;

  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '{}';

    // 提取 JSON（可能包含在 markdown 代码块中）
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : content;

    const classification = JSON.parse(jsonStr);

    // 验证数据格式
    if (!classification.knowledgeType || !classification.specificPoint) {
      throw new Error('Invalid classification format');
    }

    return classification as ErrorClassification;
  } catch (error) {
    console.error('Error classifying:', error);
    // 返回默认分类
    return {
      knowledgeType: 'grammar',
      specificPoint: '未分类',
      errorReason: 'unfamiliar',
      difficulty: 3,
      frequency: 'medium',
    };
  }
}

/**
 * 更新用户画像
 */
export async function updateUserProfile(
  accountId: string,
  classification: ErrorClassification
): Promise<void> {
  const { getDb } = await import('./cloudbase');
  const db = getDb();

  try {
    // 获取现有画像
    const profileDoc = await db.collection('user_profiles').doc(accountId).get();

    let profile: UserProfile;

    if (profileDoc.data && profileDoc.data.length > 0) {
      profile = profileDoc.data[0] as UserProfile;
    } else {
      // 创建新画像
      profile = {
        accountId,
        weakAreas: [],
        errorPatterns: {
          concept: 0,
          careless: 0,
          unfamiliar: 0,
          confusion: 0,
          complex: 0,
        },
        recommendations: [],
        totalErrors: 0,
        lastUpdated: new Date(),
      };
    }

    // 更新错误模式统计
    profile.errorPatterns[classification.errorReason]++;
    profile.totalErrors++;

    // 更新薄弱点
    const existingWeak = profile.weakAreas.find(
      (w) => w.specificPoint === classification.specificPoint
    );

    if (existingWeak) {
      existingWeak.errorCount++;
      existingWeak.lastError = new Date();
    } else {
      profile.weakAreas.push({
        knowledgeType: classification.knowledgeType,
        specificPoint: classification.specificPoint,
        errorCount: 1,
        lastError: new Date(),
      });
    }

    // 按错误次数排序薄弱点
    profile.weakAreas.sort((a, b) => b.errorCount - a.errorCount);

    // 生成学习建议
    profile.recommendations = generateRecommendations(profile);
    profile.lastUpdated = new Date();

    // 保存到数据库
    await db.collection('user_profiles').doc(accountId).set(profile);
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}

/**
 * 生成学习建议
 */
function generateRecommendations(profile: UserProfile): string[] {
  const recommendations: string[] = [];

  // 基于薄弱点的建议
  if (profile.weakAreas.length > 0) {
    const top3 = profile.weakAreas.slice(0, 3);
    recommendations.push(
      `重点复习：${top3.map((w) => w.specificPoint).join('、')}`
    );
  }

  // 基于错误模式的建议
  const patterns = profile.errorPatterns;
  const totalErrors = profile.totalErrors || 1;

  if (patterns.concept / totalErrors > 0.4) {
    recommendations.push('建议系统学习基础语法概念，加强理论理解');
  }

  if (patterns.careless / totalErrors > 0.3) {
    recommendations.push('注意审题，做题时放慢速度，减少粗心错误');
  }

  if (patterns.unfamiliar / totalErrors > 0.4) {
    recommendations.push('扩大知识面，多接触不同类型的题目和表达');
  }

  if (patterns.confusion / totalErrors > 0.3) {
    recommendations.push('对比学习易混淆知识点，建立清晰的区分标准');
  }

  if (patterns.complex / totalErrors > 0.3) {
    recommendations.push('加强综合题训练，提升复杂题目的分析能力');
  }

  return recommendations;
}

/**
 * 获取用户画像
 */
export async function getUserProfile(accountId: string): Promise<UserProfile | null> {
  const { getDb } = await import('./cloudbase');
  const db = getDb();

  try {
    const profileDoc = await db.collection('user_profiles').doc(accountId).get();

    if (profileDoc.data && profileDoc.data.length > 0) {
      return profileDoc.data[0] as UserProfile;
    }

    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
}
