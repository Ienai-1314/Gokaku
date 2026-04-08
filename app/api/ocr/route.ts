import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { checkRateLimit } from "@/lib/ratelimit";
import { validateBase64Image, createSafeErrorResponse, checkRequestRate } from "@/lib/security";
import { getAccountIdFromRequest } from "@/lib/account";

// 禁用 Next.js 路由缓存
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const accountId = await getAccountIdFromRequest(req);
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
               req.headers.get("x-real-ip") ||
               "unknown";

    // 请求频率限制：每分钟最多5次
    if (!checkRequestRate(`ocr:${ip}`, 5, 60000)) {
      return NextResponse.json({ error: "请求过于频繁，请稍后再试" }, { status: 429 });
    }

    const allowed = await checkRateLimit(req, "query");
    if (!allowed) {
      return NextResponse.json({ error: "今日使用次数已达上限，购买后解锁无限使用" }, { status: 429 });
    }

    const { imageBase64, mimeType, type } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: "请提供图片" }, { status: 400 });
    }

    // 验证图片格式和大小
    const fullBase64 = `data:${mimeType ?? "image/jpeg"};base64,${imageBase64}`;
    validateBase64Image(fullBase64);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OCR 服务暂时不可用" }, { status: 503 });
    }

    // 初始化 Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // 根据类型构建不同的 prompt
    let prompt = "";
    if (type === "question") {
      prompt = `请识别图片中的日语题目内容。这是一道 JLPT N1/N2 考试题目。

要求：
1. 准确识别所有日语文字（包括汉字、平假名、片假名）
2. 保持原有的格式和换行
3. 如果有选项（1、2、3、4），请完整识别
4. 如果有下划线或空格表示填空，请保留
5. 只返回识别的文字内容，不要添加任何解释

请开始识别：`;
    } else if (type === "vocab") {
      prompt = `请识别图片中的日语词汇。

要求：
1. 准确识别日语文字（汉字、平假名、片假名）
2. 如果是单个词汇，直接返回该词汇
3. 如果是多个词汇，每行一个
4. 只返回识别的词汇，不要添加任何解释或翻译

请开始识别：`;
    } else {
      // 默认为题目识别
      prompt = "请识别图片中的日语题目文字，原样输出题目内容（包括选项），不要添加任何解释或翻译。如果有多道题，只输出最主要的那道。";
    }

    // 调用 Gemini Vision API
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: mimeType ?? "image/jpeg",
          data: imageBase64,
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: "未能识别图片中的文字，请确保图片清晰" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      text: text.trim(),
      type: type || "question"
    });

  } catch (err: any) {
    console.error("[ocr] error:", err);

    // 处理 Gemini API 特定错误
    if (err.message?.includes("quota") || err.message?.includes("RESOURCE_EXHAUSTED")) {
      return NextResponse.json(
        { error: "OCR 服务配额已用完，请稍后再试" },
        { status: 429 }
      );
    }

    const safeError = createSafeErrorResponse(err);
    return NextResponse.json(safeError, { status: 500 });
  }
}
