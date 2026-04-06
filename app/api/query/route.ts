import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import path from "path";
import { checkRateLimit } from "@/lib/ratelimit";
import { sanitizeInput, hashIP, createSafeErrorResponse, checkRequestRate, detectPromptInjection } from "@/lib/security";
import { getAccountIdFromRequest } from "@/lib/account";

// 禁用 Next.js 路由缓存
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

// 语法库缓存（进程内复用，避免每次读文件）
let grammarCache: GrammarEntry[] | null = null;
let grammarSourceCache: GrammarSourceEntry[] | null = null;

interface GrammarEntry {
  number: number;
  pattern: string;
  meaning: string;
  examples: string[];
  raw?: string;
}

interface GrammarSourceEntry {
  number: number;
  pattern: string;
  total_hits: number;
  star: number;
  occurrences: Array<{
    exam: string;
    count: number;
  }>;
}

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

function loadGrammar(): GrammarEntry[] {
  if (grammarCache) return grammarCache;
  // 优先用项目内打包的数据（Vercel 生产环境）
  const candidates = [
    path.join(process.cwd(), "lib/data/grammar_231.json"),
    path.join(process.env.DATA_DIR ?? "d:/量化n1/structured_data", "grammar_231.json"),
  ];
  for (const filePath of candidates) {
    try {
      const raw = readFileSync(filePath, "utf-8");
      grammarCache = JSON.parse(raw);
      return grammarCache!;
    } catch {
      // 尝试下一个路径
    }
  }
  return [];
}

function loadGrammarSource(): Record<number, GrammarSourceEntry> {
  if (grammarSourceCache) {
    return grammarSourceCache.reduce((acc, item) => {
      acc[item.number] = item;
      return acc;
    }, {} as Record<number, GrammarSourceEntry>);
  }

  const candidates = [
    path.join(process.cwd(), "lib/data/grammar_with_source.json"),
    path.join(process.env.DATA_DIR ?? "d:/量化n1/reports_comprehensive", "grammar_with_source.json"),
  ];

  for (const filePath of candidates) {
    try {
      const raw = readFileSync(filePath, "utf-8");
      grammarSourceCache = JSON.parse(raw);
      return grammarSourceCache!.reduce((acc, item) => {
        acc[item.number] = item;
        return acc;
      }, {} as Record<number, GrammarSourceEntry>);
    } catch {
      // 尝试下一个路径
    }
  }
  return {};
}

function searchGrammar(query: string): Array<GrammarEntry & { source?: GrammarSourceEntry }> {
  const grammar = loadGrammar();
  const sourceMap = loadGrammarSource();
  const q = query.toLowerCase();

  return grammar
    .filter(
      (g) =>
        g.pattern?.toLowerCase().includes(q) ||
        g.meaning?.toLowerCase().includes(q)
    )
    .slice(0, 3)
    .map(g => ({
      ...g,
      source: sourceMap[g.number]
    }));
}

export async function POST(req: NextRequest) {
  try {
    const accountId = await getAccountIdFromRequest(req);
    const ip = getIp(req);

    // 请求频率限制：每分钟最多10次
    if (!checkRequestRate(`query:${ip}`, 10, 60000)) {
      return NextResponse.json({ error: "请求过于频繁，请稍后再试" }, { status: 429 });
    }

    const allowed = await checkRateLimit(req, "query");
    if (!allowed) {
      return NextResponse.json({ error: "今日使用次数已达上限，购买后解锁无限使用" }, { status: 429 });
    }

    const { query } = await req.json();

    // 输入验证和清洗
    if (!query?.trim()) {
      return NextResponse.json({ error: "请输入要查询的语法" }, { status: 400 });
    }

    // Prompt 注入攻击检测
    const injectionCheck = detectPromptInjection(query);
    if (!injectionCheck.safe) {
      return NextResponse.json({
        error: injectionCheck.reason || "输入内容不符合规范"
      }, { status: 400 });
    }

    const sanitizedQuery = sanitizeInput(query, 200);

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "服务暂时不可用" }, { status: 503 });
    }

    // 从本地语法库检索相关条目
    const matches = searchGrammar(sanitizedQuery);

    const prompt = buildQueryPrompt(sanitizedQuery, matches);

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
        max_tokens: 900,
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? "";

    return NextResponse.json({ result: content, matchedGrammar: matches });
  } catch (err) {
    console.error("[query] error:", err);
    const safeError = createSafeErrorResponse(err);
    return NextResponse.json(safeError, { status: 500 });
  }
}

function buildQueryPrompt(query: string, matches: Array<GrammarEntry & { source?: GrammarSourceEntry }>): string {
  let context = "";
  if (matches.length > 0) {
    context = "\n\n【来自N1真题语法库的相关条目】\n";
    context += matches
      .map((m) => {
        let entry = `▸ ${m.pattern}\n  含义：${m.meaning}\n  例句：${(m.examples ?? []).slice(0, 2).join("；")}`;

        // 添加真题出处信息
        if (m.source) {
          const { total_hits, star, occurrences } = m.source;
          const starDisplay = "★".repeat(star) + "☆".repeat(3 - star);
          entry += `\n  真题考频：${starDisplay} 共出现${total_hits}次`;

          if (occurrences && occurrences.length > 0) {
            const exams = occurrences.map(o => o.exam).slice(0, 5).join(", ");
            entry += `\n  出现场次：${exams}${occurrences.length > 5 ? " 等" : ""}`;
          }
        }

        return entry;
      })
      .join("\n\n");
  }

  return `你是一位专业的JLPT N1/N2日语教师。用户想了解以下语法：「${query}」${context}

请用中文按照以下格式回答：

**含义与用法**
[解释该语法的核心含义和使用场景，要通俗易懂]

**接续方式**
[列出接续规则，如：动词辞書形＋なり、名词＋なり等]

**真题例句**
[提供2-3个接近JLPT真题风格的例句，并附中文翻译]

**易混淆语法**
[列出1-2个最容易混淆的近义语法，说明区别；没有则跳过]

**考试要点**
[该语法在N1考试中的常见考法，或需要特别注意的地方]`;
}
