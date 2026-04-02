import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import path from "path";
import { checkRateLimit } from "@/lib/ratelimit";

const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

// 语法库缓存（进程内复用，避免每次读文件）
let grammarCache: GrammarEntry[] | null = null;

interface GrammarEntry {
  number: number;
  pattern: string;
  meaning: string;
  examples: string[];
  raw?: string;
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

function searchGrammar(query: string): GrammarEntry[] {
  const grammar = loadGrammar();
  const q = query.toLowerCase();
  return grammar
    .filter(
      (g) =>
        g.pattern?.toLowerCase().includes(q) ||
        g.meaning?.toLowerCase().includes(q)
    )
    .slice(0, 3);
}

export async function POST(req: NextRequest) {
  const allowed = await checkRateLimit(req, "query");
  if (!allowed) {
    return NextResponse.json({ error: "今日使用次数已达上限，购买后解锁无限使用" }, { status: 429 });
  }

  const { query } = await req.json();

  if (!query?.trim()) {
    return NextResponse.json({ error: "请输入要查询的语法" }, { status: 400 });
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "服务暂时不可用" }, { status: 503 });
  }

  // 从本地语法库检索相关条目
  const matches = searchGrammar(query);

  const prompt = buildQueryPrompt(query, matches);

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
    return NextResponse.json({ error: "查询失败，请稍后重试" }, { status: 500 });
  }
}

function buildQueryPrompt(query: string, matches: GrammarEntry[]): string {
  let context = "";
  if (matches.length > 0) {
    context = "\n\n【来自N1真题语法库的相关条目】\n";
    context += matches
      .map(
        (m) =>
          `▸ ${m.pattern}\n  含义：${m.meaning}\n  例句：${(m.examples ?? []).slice(0, 2).join("；")}`
      )
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
