import { NextRequest } from "next/server";
import { readFileSync } from "fs";
import path from "path";
import { checkRateLimit } from "@/lib/ratelimit";
import { sanitizeInput, hashIP, checkRequestRate, detectPromptInjection } from "@/lib/security";
import { getAccountIdFromRequest } from "@/lib/account";
import queryCache from "@/lib/query-cache";
import dbCache from "@/lib/db-cache";

// 禁用 Next.js 路由缓存
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

// 语法库缓存
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

function loadGrammar(): GrammarEntry[] {
  if (grammarCache) return grammarCache;
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

function buildQueryPrompt(query: string, matches: Array<GrammarEntry & { source?: GrammarSourceEntry }>): string {
  let context = "";
  if (matches.length > 0) {
    context = "\n\n【来自N1真题语法库的相关条目】\n";
    context += matches
      .map((m) => {
        let entry = `▸ ${m.pattern}\n  含义：${m.meaning}\n  例句：${(m.examples ?? []).slice(0, 2).join("；")}`;

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

// 流式返回缓存结果
function streamCachedResult(text: string, source: 'memory' | 'database') {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // 将缓存结果分块发送，模拟流式效果
      const chunkSize = 10; // 每次发送10个字符
      let index = 0;

      const sendChunk = () => {
        if (index < text.length) {
          const chunk = text.slice(index, index + chunkSize);
          controller.enqueue(encoder.encode(chunk));
          index += chunkSize;
          setTimeout(sendChunk, 10); // 10ms 延迟模拟打字效果
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
      'X-Cache-Source': source, // 标记缓存来源
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const accountId = await getAccountIdFromRequest(req);
    const ip = getIp(req);

    // 检查是否是管理员请求（用于预填充缓存）
    const body = await req.json();
    const isAdminRequest = body.skipRateLimit && req.headers.get('x-admin-key') === process.env.ADMIN_SECRET_KEY;

    // 请求频率限制（管理员请求跳过）
    if (!isAdminRequest && !checkRequestRate(`query:${ip}`, 10, 60000)) {
      return new Response(
        JSON.stringify({ error: "请求过于频繁，请稍后再试" }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!isAdminRequest) {
      const allowed = await checkRateLimit(req, "query");
      if (!allowed) {
        return new Response(
          JSON.stringify({ error: "今日使用次数已达上限，购买后解锁无限使用" }),
          { status: 429, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    const { query } = body;

    // 输入验证
    if (!query?.trim()) {
      return new Response(
        JSON.stringify({ error: "请输入要查询的语法" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Prompt 注入检测
    const injectionCheck = detectPromptInjection(query);
    if (!injectionCheck.safe) {
      return new Response(
        JSON.stringify({ error: injectionCheck.reason || "输入内容不符合规范" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const sanitizedQuery = sanitizeInput(query, 200);

    // 1. 先查内存缓存
    const memoryCached = queryCache.get(sanitizedQuery, 'grammar');
    if (memoryCached) {
      return streamCachedResult(memoryCached.result, 'memory');
    }

    // 2. 再查数据库缓存
    const dbCached = await dbCache.get(sanitizedQuery, 'grammar');
    if (dbCached) {
      // 同步到内存缓存
      queryCache.set(sanitizedQuery, 'grammar', dbCached.result, dbCached.matchedGrammar);
      return streamCachedResult(dbCached.result, 'database');
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "服务暂时不可用" }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }

    // 从本地语法库检索
    const matches = searchGrammar(sanitizedQuery);
    const prompt = buildQueryPrompt(sanitizedQuery, matches);

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
        max_tokens: 900,
        stream: true, // 启用流式输出
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    // 创建 TransformStream 来处理 SSE 数据
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    let fullContent = ''; // 收集完整内容用于缓存

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

          // 流式输出完成后，保存到缓存
          if (fullContent) {
            queryCache.set(sanitizedQuery, 'grammar', fullContent, matches);
            // 异步保存到数据库（不阻塞响应）
            dbCache.set(sanitizedQuery, 'grammar', fullContent, matches).catch(err => {
              console.error('[query/stream] 保存到数据库失败:', err);
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
    console.error("[query/stream] error:", err);
    return new Response(
      JSON.stringify({ error: "服务器错误，请稍后重试" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
