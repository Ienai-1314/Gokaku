import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import path from "path";
import { checkRateLimit } from "@/lib/ratelimit";
import { sanitizeInput, createSafeErrorResponse, checkRequestRate, detectPromptInjection } from "@/lib/security";

const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

let vocabCache: VocabEntry[] | null = null;

interface VocabEntry {
  word: string;
  total_hits: number;
  star: number;
  occurrences: Array<{
    exam: string;
    count: number;
  }>;
  last_appeared: number;
}

function loadVocab(): VocabEntry[] {
  if (vocabCache) return vocabCache;

  const candidates = [
    path.join(process.cwd(), "lib/data/kanji_vocab_frequency.json"),
    path.join(process.env.DATA_DIR ?? "d:/量化n1/reports_comprehensive", "kanji_vocab_frequency.json"),
  ];

  for (const filePath of candidates) {
    try {
      const raw = readFileSync(filePath, "utf-8");
      vocabCache = JSON.parse(raw);
      return vocabCache!;
    } catch {
      // 尝试下一个路径
    }
  }
  return [];
}

function searchVocab(query: string): VocabEntry[] {
  const vocab = loadVocab();
  const q = query.trim();

  // 精确匹配优先
  const exactMatch = vocab.filter(v => v.word === q);
  if (exactMatch.length > 0) return exactMatch.slice(0, 5);

  // 包含匹配
  return vocab
    .filter(v => v.word.includes(q))
    .sort((a, b) => b.total_hits - a.total_hits)
    .slice(0, 5);
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
               req.headers.get("x-real-ip") ||
               "unknown";

    // 请求频率限制：每分钟最多10次
    if (!checkRequestRate(`vocab:${ip}`, 10, 60000)) {
      return NextResponse.json({ error: "请求过于频繁，请稍后再试" }, { status: 429 });
    }

    const allowed = await checkRateLimit(req, "query");
    if (!allowed) {
      return NextResponse.json({ error: "今日使用次数已达上限，购买后解锁无限使用" }, { status: 429 });
    }

    const { query } = await req.json();

    // 输入验证和清洗
    if (!query?.trim()) {
      return NextResponse.json({ error: "请输入要查询的词汇" }, { status: 400 });
    }

    // Prompt 注入攻击检测
    const injectionCheck = detectPromptInjection(query);
    if (!injectionCheck.safe) {
      return NextResponse.json({
        error: injectionCheck.reason || "输入内容不符合规范"
      }, { status: 400 });
    }

    const sanitizedQuery = sanitizeInput(query, 100);

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "服务暂时不可用" }, { status: 503 });
    }

    // 从本地词汇库检索
    const matches = searchVocab(sanitizedQuery);

    const prompt = buildVocabPrompt(sanitizedQuery, matches);

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

    return NextResponse.json({ result: content, matchedVocab: matches });
  } catch (err) {
    console.error("[vocab] error:", err);
    const safeError = createSafeErrorResponse(err);
    return NextResponse.json(safeError, { status: 500 });
  }
}

function buildVocabPrompt(query: string, matches: VocabEntry[]): string {
  let context = "";
  if (matches.length > 0) {
    context = "\n\n【来自N1真题词汇库的相关条目】\n";
    context += matches
      .map((m) => {
        const starDisplay = "★".repeat(m.star) + "☆".repeat(3 - m.star);
        let entry = `▸ ${m.word}\n  真题考频：${starDisplay} 共出现${m.total_hits}次`;

        if (m.occurrences && m.occurrences.length > 0) {
          const exams = m.occurrences.map(o => o.exam).slice(0, 5).join(", ");
          entry += `\n  出现场次：${exams}${m.occurrences.length > 5 ? " 等" : ""}`;
        }

        return entry;
      })
      .join("\n\n");
  }

  return `你是一位专业的JLPT N1日语教师。用户想了解以下词汇：「${query}」${context}

请用中文按照以下格式回答（严格使用markdown格式）：

### 📖 读音
かっとう

### 💡 核心含义
**纠葛、矛盾**（多指内心或人际关系的冲突）

### 🎯 真题考频
${matches.length > 0 && matches[0].star >= 2 ? '⭐⭐⭐ **高频词！近10年N1真题多次出现，务必掌握**' : matches.length > 0 ? '⭐ 真题出现过，建议掌握' : '📚 了解即可'}

### 📝 用法说明
- 常见搭配：「〜が生じる」「〜を抱える」「心の葛藤」
- 使用场景：描述内心矛盾、人际冲突、理想与现实的纠结
- 注意：属于书面语，日常会话较少使用

### ✍️ 真题例句
1. 進学か就職か、彼は深刻な葛藤を抱えている。
   （是升学还是就业，他内心充满矛盾。）

2. 家族との葛藤をテーマにした小説を読んだ。
   （读了一本以家庭矛盾为主题的小说。）

要求：
- **用加粗标注关键词汇和重点信息**
- 例句中的关键词用**加粗**
- 简洁实用，每部分2-3行即可
- emoji 让内容更易读`;
}
