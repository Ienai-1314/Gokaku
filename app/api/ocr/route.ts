import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/ratelimit";

const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

export async function POST(req: NextRequest) {
  const allowed = await checkRateLimit(req, "ocr");
  if (!allowed) {
    return NextResponse.json({ error: "今日使用次数已达上限，购买后解锁无限使用" }, { status: 429 });
  }

  const { imageBase64, mimeType } = await req.json();

  if (!imageBase64) {
    return NextResponse.json({ error: "请提供图片" }, { status: 400 });
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "服务暂时不可用" }, { status: 503 });
  }

  try {
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
    return NextResponse.json({ error: "识别失败，请手动粘贴题目" }, { status: 500 });
  }
}
