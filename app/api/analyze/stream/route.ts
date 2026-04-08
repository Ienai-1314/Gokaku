import { NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/ratelimit";
import { getDb } from "@/lib/cloudbase";
import { sanitizeInput, checkRequestRate, detectPromptInjection } from "@/lib/security";
import { getAccountIdFromRequest } from "@/lib/account";
import queryCache from "@/lib/query-cache";
import { classifyError, updateUserProfile } from "@/lib/error-classification";

// 禁用 Next.js 路由缓存
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

function getIp(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
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

export async function POST(req: NextRequest) {
  try {
    const accountId = await getAccountIdFromRequest(req);
    const ip = getIp(req);

    // 请求频率限制
    if (!checkRequestRate(`analyze:${ip}`, 10, 60000)) {
      return new Response(
        JSON.stringify({ error: "请求过于频繁，请稍后再试" }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    const allowed = await checkRateLimit(req, "analyze");
    if (!allowed) {
      return new Response(
        JSON.stringify({ error: "今日使用次数已达上限，购买后解锁无限使用" }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    const { question, userAnswer, correctAnswer } = await req.json();

    // 输入验证
    if (!question?.trim()) {
      return new Response(
        JSON.stringify({ error: "请提供题目内容" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Prompt 注入检测
    const injectionCheckQuestion = detectPromptInjection(question);
    if (!injectionCheckQuestion.safe) {
      return new Response(
        JSON.stringify({ error: injectionCheckQuestion.reason || "题目内容不符合规范" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (userAnswer) {
      const injectionCheckUser = detectPromptInjection(userAnswer);
      if (!injectionCheckUser.safe) {
        return new Response(
          JSON.stringify({ error: injectionCheckUser.reason || "答案内容不符合规范" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    if (correctAnswer) {
      const injectionCheckCorrect = detectPromptInjection(correctAnswer);
      if (!injectionCheckCorrect.safe) {
        return new Response(
          JSON.stringify({ error: injectionCheckCorrect.reason || "答案内容不符合规范" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    const sanitizedQuestion = sanitizeInput(question, 1000);
    const sanitizedUserAnswer = userAnswer ? sanitizeInput(userAnswer, 200) : '';
    const sanitizedCorrectAnswer = correctAnswer ? sanitizeInput(correctAnswer, 200) : '';

    // 生成缓存键（基于题目内容）
    const cacheKey = `${sanitizedQuestion}|${sanitizedUserAnswer}|${sanitizedCorrectAnswer}`;

    // 检查缓存
    const cached = queryCache.get(cacheKey, 'analyze');
    if (cached) {
      // 返回缓存的结果（模拟流式输出）
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          const chunkSize = 10;
          let index = 0;
          const text = cached.result;

          const sendChunk = () => {
            if (index < text.length) {
              const chunk = text.slice(index, index + chunkSize);
              controller.enqueue(encoder.encode(chunk));
              index += chunkSize;
              setTimeout(sendChunk, 10);
            } else {
              controller.close();
            }
          };

          sendChunk();
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'X-Cache-Hit': 'true',
        },
      });
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "服务暂时不可用" }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }

    const prompt = buildAnalyzePrompt(sanitizedQuestion, sanitizedUserAnswer, sanitizedCorrectAnswer);

    // 调用 DeepSeek API 并启用流式输出
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
        stream: true, // 启用流式输出
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    // 创建 TransformStream 来处理 SSE 数据
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    let fullContent = ''; // 收集完整内容用于保存

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            // 解析 SSE 数据
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.trim() !== '');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;

                try {
                  const json = JSON.parse(data);
                  const content = json.choices?.[0]?.delta?.content;
                  if (content) {
                    fullContent += content;
                    // 发送内容块
                    controller.enqueue(encoder.encode(content));
                  }
                } catch (e) {
                  // 忽略解析错误
                }
              }
            }
          }

          // 流式输出完成后，异步保存到错题本
          if (fullContent) {
            // 保存到缓存
            queryCache.set(cacheKey, 'analyze', fullContent);

            // 异步分类并更新用户画像
            classifyError(
              sanitizedQuestion,
              sanitizedUserAnswer,
              sanitizedCorrectAnswer,
              fullContent
            ).then(async (classification) => {
              // 保存到错题本（包含分类信息）
              await saveToWrongBook(accountId, {
                question: sanitizedQuestion,
                userAnswer: sanitizedUserAnswer,
                correctAnswer: sanitizedCorrectAnswer,
                analysis: fullContent,
                errorPatterns: extractErrorPatterns(fullContent),
                classification,
              });

              // 更新用户画像
              await updateUserProfile(accountId, classification);
            }).catch((err) => console.error("分类和保存错题失败:", err));

            // 异步提取语法点并记录薄弱点
            extractGrammarPattern(fullContent).then((pattern) => {
              if (pattern) recordWeakness(accountId, pattern);
            });
          }

        } catch (error) {
          console.error('Stream error:', error);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (err) {
    console.error("[analyze/stream] error:", err);
    return new Response(
      JSON.stringify({ error: "服务器错误，请稍后重试" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// 辅助函数
async function saveToWrongBook(
  accountId: string,
  data: {
    question: string;
    userAnswer?: string;
    correctAnswer?: string;
    analysis: string;
    errorPatterns: string[];
    classification?: any;
  }
) {
  try {
    const db = getDb();
    await db.collection("wrong_questions").add({
      user_id: accountId,
      account_id: accountId,
      question: data.question,
      userAnswer: data.userAnswer || "",
      correctAnswer: data.correctAnswer || "",
      analysis: data.analysis,
      errorPatterns: data.errorPatterns,
      classification: data.classification || null,
      createdAt: new Date().toISOString(),
    });

    // 检查是否达到100道错题，自动延长会员
    await checkAndRewardMembership(accountId);
  } catch (err) {
    console.error("保存错题失败:", err);
  }
}

async function checkAndRewardMembership(accountId: string) {
  try {
    const db = getDb();

    const { data: wrongQuestions } = await db
      .collection("wrong_questions")
      .where({ account_id: accountId })
      .get();

    const totalErrors = wrongQuestions?.length || 0;

    if (totalErrors > 0 && totalErrors % 100 === 0) {
      const { data: accounts } = await db
        .collection("accounts")
        .where({ account_id: accountId })
        .limit(1)
        .get();

      if (accounts && accounts.length > 0) {
        const account = accounts[0];
        const rewardTimes = Math.floor(totalErrors / 100);
        const existingRewards = account.total_rewards || 0;

        if (rewardTimes > existingRewards) {
          const currentExpiry = account.membership_expiry
            ? new Date(account.membership_expiry)
            : new Date();

          const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
          const newExpiry = new Date(baseDate);
          newExpiry.setMonth(newExpiry.getMonth() + 1);

          const now = new Date().toISOString();

          await db.collection("cashback_history").add({
            account_id: accountId,
            milestone: totalErrors,
            reward_type: 'membership_extension',
            reward_value: 1,
            old_expiry: account.membership_expiry || null,
            new_expiry: newExpiry.toISOString(),
            created_at: now
          });

          await db
            .collection("accounts")
            .doc(account._id as string)
            .update({
              membership_expiry: newExpiry.toISOString(),
              last_reward_at: now,
              total_rewards: rewardTimes
            });

          console.log(`[返现] 账号 ${accountId} 完成 ${totalErrors} 道错题，会员延长至 ${newExpiry.toISOString()}`);
        }
      }
    }
  } catch (err) {
    console.error("[返现] 检查失败:", err);
  }
}

async function recordWeakness(accountId: string, grammarPattern: string) {
  try {
    const db = getDb();
    const { data } = await db
      .collection("grammar_weakness")
      .where({ account_id: accountId, grammar_id: grammarPattern })
      .get();
    if (data && data.length > 0) {
      await db
        .collection("grammar_weakness")
        .doc(data[0]._id as string)
        .update({ error_count: db.command.inc(1), last_seen: new Date().toISOString() });
    } else {
      await db.collection("grammar_weakness").add({
        user_id: accountId,
        account_id: accountId,
        grammar_id: grammarPattern,
        error_count: 1,
        last_seen: new Date().toISOString(),
      });
    }
  } catch {
    // 非关键路径，静默失败
  }
}

async function extractGrammarPattern(content: string): Promise<string | null> {
  const match = content.match(/\*\*核心语法点\*\*[\s\S]*?([～〜]?[ぁ-んァ-ヶー一-龯々〆〤a-zA-Z～〜・]+(?:[にをはがでもとのへ]?[ぁ-んァ-ヶー一-龯々]+)*)/);
  if (match) return match[1].slice(0, 30);
  return null;
}

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

  return patterns.slice(0, 2);
}
