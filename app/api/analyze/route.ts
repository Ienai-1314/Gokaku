import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/ratelimit";
import { getDb } from "@/lib/cloudbase";
import { sanitizeInput, hashIP, createSafeErrorResponse, checkRequestRate, detectPromptInjection } from "@/lib/security";

function getIp(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function getUserId(req: NextRequest): string {
  // 优先使用设备ID，其次使用IP（向后兼容）
  const deviceId = req.headers.get("x-device-id");
  if (deviceId) return deviceId;

  // 降级到IP识别
  const ip = getIp(req);
  return hashIP(ip);
}

async function saveToWrongBook(
  userId: string,
  data: {
    question: string;
    userAnswer?: string;
    correctAnswer?: string;
    analysis: string;
    errorPatterns: string[];
  }
) {
  try {
    const db = getDb();
    await db.collection("wrong_questions").add({
      user_id: userId,
      question: data.question,
      userAnswer: data.userAnswer || "",
      correctAnswer: data.correctAnswer || "",
      analysis: data.analysis,
      errorPatterns: data.errorPatterns,
      createdAt: new Date().toISOString(),
    });

    // 检查是否达到100道错题，自动延长会员
    await checkAndRewardMembership(userId);
  } catch (err) {
    console.error("保存错题失败:", err);
  }
}

async function checkAndRewardMembership(userId: string) {
  try {
    const db = getDb();

    // 查询用户错题总数
    const { data: wrongQuestions } = await db
      .collection("wrong_questions")
      .where({ user_id: userId })
      .get();

    const totalErrors = wrongQuestions?.length || 0;

    // 每100道题延长1个月会员
    if (totalErrors > 0 && totalErrors % 100 === 0) {
      // 查询用户信息
      const { data: users } = await db
        .collection("users")
        .where({ device_id: userId })
        .limit(1)
        .get();

      if (users && users.length > 0) {
        const user = users[0];
        const currentExpiry = user.membership_expiry
          ? new Date(user.membership_expiry)
          : new Date();

        // 如果已过期，从当前时间开始计算
        const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();

        // 延长1个月
        const newExpiry = new Date(baseDate);
        newExpiry.setMonth(newExpiry.getMonth() + 1);

        await db
          .collection("users")
          .doc(user._id as string)
          .update({
            membership_expiry: newExpiry.toISOString(),
            last_reward_at: new Date().toISOString(),
            total_rewards: (user.total_rewards || 0) + 1
          });

        console.log(`用户 ${userId} 完成 ${totalErrors} 道错题，会员延长至 ${newExpiry.toISOString()}`);
      }
    }
  } catch (err) {
    console.error("检查返现失败:", err);
  }
}

async function recordWeakness(userId: string, grammarPattern: string) {
  try {
    const db = getDb();
    const { data } = await db
      .collection("grammar_weakness")
      .where({ user_id: userId, grammar_id: grammarPattern })
      .get();
    if (data && data.length > 0) {
      await db
        .collection("grammar_weakness")
        .doc(data[0]._id as string)
        .update({ error_count: db.command.inc(1), last_seen: new Date().toISOString() });
    } else {
      await db.collection("grammar_weakness").add({
        user_id: userId,
        grammar_id: grammarPattern,
        error_count: 1,
        last_seen: new Date().toISOString(),
      });
    }
  } catch {
    // 非关键路径，静默失败
  }
}

const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

export async function POST(req: NextRequest) {
  try {
    const userId = getUserId(req);
    const ip = getIp(req);

    // 请求频率限制：每分钟最多10次
    if (!checkRequestRate(`analyze:${ip}`, 10, 60000)) {
      return NextResponse.json({ error: "请求过于频繁，请稍后再试" }, { status: 429 });
    }

    const allowed = await checkRateLimit(req, "analyze");
    if (!allowed) {
      return NextResponse.json({ error: "今日使用次数已达上限，购买后解锁无限使用" }, { status: 429 });
    }

    const { question, userAnswer, correctAnswer } = await req.json();

    // 输入验证和清洗
    if (!question?.trim()) {
      return NextResponse.json({ error: "请提供题目内容" }, { status: 400 });
    }

    // Prompt 注入攻击检测 - 检查所有输入字段
    const injectionCheckQuestion = detectPromptInjection(question);
    if (!injectionCheckQuestion.safe) {
      return NextResponse.json({
        error: injectionCheckQuestion.reason || "题目内容不符合规范"
      }, { status: 400 });
    }

    if (userAnswer) {
      const injectionCheckUser = detectPromptInjection(userAnswer);
      if (!injectionCheckUser.safe) {
        return NextResponse.json({
          error: injectionCheckUser.reason || "答案内容不符合规范"
        }, { status: 400 });
      }
    }

    if (correctAnswer) {
      const injectionCheckCorrect = detectPromptInjection(correctAnswer);
      if (!injectionCheckCorrect.safe) {
        return NextResponse.json({
          error: injectionCheckCorrect.reason || "答案内容不符合规范"
        }, { status: 400 });
      }
    }

    const sanitizedQuestion = sanitizeInput(question, 1000);
    const sanitizedUserAnswer = userAnswer ? sanitizeInput(userAnswer, 200) : '';
    const sanitizedCorrectAnswer = correctAnswer ? sanitizeInput(correctAnswer, 200) : '';

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "服务暂时不可用" }, { status: 503 });
    }

    const prompt = buildAnalyzePrompt(sanitizedQuestion, sanitizedUserAnswer, sanitizedCorrectAnswer);

    const response = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? "";

    // 提取错误模式标签
    const errorPatterns = extractErrorPatterns(content);

    // 异步保存到错题本（不阻塞响应）
    saveToWrongBook(userId, {
      question: sanitizedQuestion,
      userAnswer: sanitizedUserAnswer,
      correctAnswer: sanitizedCorrectAnswer,
      analysis: content,
      errorPatterns,
    }).catch((err) => console.error("保存错题失败:", err));

    // 异步提取语法点并记录薄弱点（不阻塞响应）
    extractGrammarPattern(content).then((pattern) => {
      if (pattern) recordWeakness(userId, pattern);
    });

    return NextResponse.json({ result: content, errorPatterns });
  } catch (err) {
    console.error("[analyze] error:", err);
    const safeError = createSafeErrorResponse(err);
    return NextResponse.json(safeError, { status: 500 });
  }
}

function buildAnalyzePrompt(
  question: string,
  userAnswer?: string,
  correctAnswer?: string
): string {
  let prompt = `你是一位专业的日语教师，擅长 JLPT N1/N2 语法教学。请分析以下题目，用中文解释。

【题目】
${question}`;

  if (userAnswer?.trim()) {
    prompt += `\n\n【我选的答案】${userAnswer}`;
  }
  if (correctAnswer?.trim()) {
    prompt += `\n\n【正确答案】${correctAnswer}`;
  }

  prompt += `

请按照以下格式回答：

**错误模式**
[从以下类型中选择1-2个最符合的：语法混淆、时态错误、助词误用、接续错误、语义理解、词汇辨析、敬语误用、其他。用一句话说明为什么会犯这个错误]

**错误分析**
[解释这道题的考查重点，以及错误选项为什么容易让人迷惑]

**核心语法点**
[用简洁的语言说明核心语法的含义、接续方式和使用场景]

**近义混淆点**
[如果有容易混淆的近义语法，列出区别；没有则跳过此项]

**记忆方法**
[给出1-2个帮助记住该语法的技巧或规律]`;

  return prompt;
}

// 从 AI 回复中提取核心语法点（取**核心语法点**段落第一行的日语部分）
async function extractGrammarPattern(content: string): Promise<string | null> {
  const match = content.match(/\*\*核心语法点\*\*[\s\S]*?([～〜]?[ぁ-んァ-ヶー一-龯々〆〤a-zA-Z～〜・]+(?:[にをはがでもとのへ]?[ぁ-んァ-ヶー一-龯々]+)*)/);
  if (match) return match[1].slice(0, 30); // 最多30字符作为 key
  return null;
}

// 从 AI 回复中提取错误模式标签
function extractErrorPatterns(content: string): string[] {
  const match = content.match(/\*\*错误模式\*\*\s*\n\s*\[?([^\]]+)\]?/);
  if (!match) return [];

  const text = match[1];
  const patterns = [];
  const keywords = [
    "语法混淆", "时态错误", "助词误用", "接续错误",
    "语义理解", "词汇辨析", "敬语误用", "其他"
  ];

  for (const kw of keywords) {
    if (text.includes(kw)) patterns.push(kw);
  }

  return patterns.slice(0, 2); // 最多返回2个
}
