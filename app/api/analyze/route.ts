import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/ratelimit";

const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

export async function POST(req: NextRequest) {
  const allowed = await checkRateLimit(req, "analyze");
  if (!allowed) {
    return NextResponse.json({ error: "今日使用次数已达上限，购买后解锁无限使用" }, { status: 429 });
  }

  const { question, userAnswer, correctAnswer } = await req.json();

  if (!question?.trim()) {
    return NextResponse.json({ error: "请提供题目内容" }, { status: 400 });
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "服务暂时不可用" }, { status: 503 });
  }

  const prompt = buildAnalyzePrompt(question, userAnswer, correctAnswer);

  try {
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

    return NextResponse.json({ result: content });
  } catch (err) {
    console.error("[analyze] error:", err);
    return NextResponse.json({ error: "分析失败，请稍后重试" }, { status: 500 });
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
