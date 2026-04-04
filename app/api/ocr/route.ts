import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/ratelimit";
import { validateBase64Image, createSafeErrorResponse, checkRequestRate } from "@/lib/security";

const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
               req.headers.get("x-real-ip") ||
               "unknown";

    // 请求频率限制：每分钟最多5次
    if (!checkRequestRate(`ocr:${ip}`, 5, 60000)) {
      return NextResponse.json({ error: "请求过于频繁，请稍后再试" }, { status: 429 });
    }

    const allowed = await checkRateLimit(req, "ocr");
    if (!allowed) {
      return NextResponse.json({ error: "今日使用次数已达上限，购买后解锁无限使用" }, { status: 429 });
    }

    const { imageBase64, mimeType } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: "请提供图片" }, { status: 400 });
    }

    // 验证图片格式和大小
    const fullBase64 = `data:${mimeType ?? "image/jpeg"};base64,${imageBase64}`;
    validateBase64Image(fullBase64);

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "服务暂时不可用" }, { status: 503 });
    }
    const response = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType ?? "image/jpeg"};base64,${imageBase64}`,
                },
              },
              {
                type: "text",
                text: "请识别图片中的日语题目文字，原样输出题目内容（包括选项），不要添加任何解释或翻译。如果有多道题，只输出最主要的那道。",
              },
            ],
          },
        ],
        temperature: 0,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      // DeepSeek 当前版本可能不支持 vision，返回友好提示
      if (response.status === 400 || response.status === 422) {
        return NextResponse.json(
          { error: "图片识别暂不支持，请手动粘贴题目文字" },
          { status: 422 }
        );
      }
      throw new Error(`API error ${response.status}: ${err}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content ?? "";
    return NextResponse.json({ text });
  } catch (err) {
    console.error("[ocr] error:", err);
    const safeError = createSafeErrorResponse(err);
    return NextResponse.json(safeError, { status: 500 });
  }
}
