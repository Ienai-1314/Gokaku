import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/cloudbase";
import path from "path";
import fs from "fs";

function getIp(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

interface FrequencyData {
  number: number;
  pattern: string;
  total_hits: number;
  star: number;
  last_appeared: number;
  gap_years: number;
  recent_hits: number;
}

let frequencyCache: FrequencyData[] | null = null;

function loadFrequency(): FrequencyData[] {
  if (frequencyCache) return frequencyCache;

  const candidates = [
    path.join(process.cwd(), "lib/data/grammar_frequency.json"),
    path.join(process.env.DATA_DIR ?? "d:/量化n1/structured_data", "grammar_frequency.json"),
  ];

  for (const p of candidates) {
    try {
      const raw = fs.readFileSync(p, "utf-8");
      frequencyCache = JSON.parse(raw);
      return frequencyCache!;
    } catch {}
  }

  return [];
}

// 计算复习优先级分数：考频星级 * 10 + 错误次数
function calculatePriority(errorCount: number, star: number): number {
  return star * 10 + errorCount;
}

// GET /api/report — 返回当前 IP 的薄弱点统计（带考频和优先级）
export async function GET(req: NextRequest) {
  const ip = getIp(req);
  try {
    const db = getDb();
    const { data } = await db
      .collection("grammar_weakness")
      .where({ user_id: ip })
      .orderBy("error_count", "desc")
      .limit(20)
      .get();

    const freqData = loadFrequency();
    const freqMap = new Map(freqData.map(f => [f.pattern, f]));

    // 为每个薄弱点附加考频和优先级
    const enriched = (data ?? []).map((w: any) => {
      const freq = freqMap.get(w.grammar_id);
      const star = freq?.star ?? 0;
      const priority = calculatePriority(w.error_count, star);

      return {
        ...w,
        frequency: freq ? {
          total_hits: freq.total_hits,
          star: freq.star,
          last_appeared: freq.last_appeared,
        } : null,
        priority,
      };
    });

    // 按优先级重新排序
    enriched.sort((a, b) => b.priority - a.priority);

    return NextResponse.json({ weaknesses: enriched });
  } catch {
    return NextResponse.json({ weaknesses: [] });
  }
}
