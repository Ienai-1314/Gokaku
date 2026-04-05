"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { GraduationCap, TrendingUp, AlertTriangle, CheckCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";

interface Weakness {
  grammar_id: string;
  error_count: number;
  last_seen: string;
  frequency?: {
    total_hits: number;
    star: number;
    last_appeared: number;
  } | null;
  priority: number;
}

export default function ReportPage() {
  const [weaknesses, setWeaknesses] = useState<Weakness[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/report")
      .then((r) => r.json())
      .then((d) => setWeaknesses(d.weaknesses ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const total = weaknesses.reduce((s, w) => s + w.error_count, 0);

  // 按优先级分类：高优先级(≥25)、中优先级(15-24)、低优先级(<15)
  // 优先级 = 考频星级 * 10 + 错误次数
  const high = weaknesses.filter((w) => w.priority >= 25);
  const mid = weaknesses.filter((w) => w.priority >= 15 && w.priority < 25);
  const low = weaknesses.filter((w) => w.priority < 15);

  return (
    <div className="min-h-screen bg-[#FAF6F0]">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-[#E8E0D5]/60 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#C75B3B] rounded-xl flex items-center justify-center shadow-[0_2px_10px_rgba(199,91,59,0.25)]">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bebas text-[#C75B3B] text-base tracking-widest">GOKAKU</span>
          </Link>
          <Link href="/tool" className="flex items-center gap-1.5 text-sm text-[#6B5E55] hover:text-[#C75B3B] transition-colors">
            <ArrowLeft className="w-4 h-4" />
            返回工具
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="font-bebas text-4xl text-[#2D2420]">我的薄弱点报告</h1>
          <p className="text-sm text-[#6B5E55] mt-1">基于你的错题分析记录自动生成</p>
        </div>

        {loading ? (
          <div className="text-center py-20 text-[#6B5E55]/50 text-sm">加载中...</div>
        ) : weaknesses.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* 概览 */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <StatCard label="累计错题" value={total} color="text-[#C75B3B]" />
              <StatCard label="高频薄弱点" value={high.length} color="text-[#C75B3B]" />
              <StatCard label="已覆盖语法" value={weaknesses.length} color="text-[#4A7C59]" />
            </div>

            {/* 高优先级（≥25）*/}
            {high.length > 0 && (
              <Section
                title="重点攻克"
                subtitle="高考频 + 多次出错，考前必须搞定"
                icon={<AlertTriangle className="w-4 h-4 text-[#C75B3B]" />}
                items={high}
                barColor="bg-[#C75B3B]"
                maxPriority={high[0]?.priority ?? 1}
              />
            )}

            {/* 中优先级（15-24）*/}
            {mid.length > 0 && (
              <Section
                title="需要巩固"
                subtitle="中等优先级，建议复习"
                icon={<TrendingUp className="w-4 h-4 text-[#E8892B]" />}
                items={mid}
                barColor="bg-[#E8892B]"
                maxPriority={Math.max(...mid.map(w => w.priority))}
              />
            )}

            {/* 低优先级（<15）*/}
            {low.length > 0 && (
              <Section
                title="留意观察"
                subtitle="低考频或偶然失误"
                icon={<CheckCircle className="w-4 h-4 text-[#4A7C59]" />}
                items={low}
                barColor="bg-[#4A7C59]"
                maxPriority={Math.max(...low.map(w => w.priority))}
              />
            )}

            {/* 复习建议 */}
            <div className="mt-6 bg-gradient-to-br from-[#FFF8F0] to-[#FFF0E5] rounded-2xl border border-[#C75B3B]/20 p-5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-[#C75B3B] rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-[#2D2420] mb-2">复习优先级说明</h3>
                  <div className="text-xs text-[#6B5E55] space-y-1.5 leading-relaxed">
                    <p>• <span className="font-semibold text-[#2D2420]">优先级 = 考频星级 × 10 + 错误次数</span></p>
                    <p>• 考频星级来自 2010-2024 年 18 套真题统计（★★★ 高频 / ★★ 中频 / ★ 低频）</p>
                    <p>• 高优先级（≥25）：高考频且多次出错，考前必须搞定</p>
                    <p>• 中优先级（15-24）：中等重要性，建议复习巩固</p>
                    <p>• 低优先级（&lt;15）：低考频或偶然失误，时间充裕再看</p>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs text-[#6B5E55]/40 text-center mt-8">
              数据来自你在错题分析工具中的使用记录 · 每次分析后自动更新
            </p>
          </>
        )}
      </main>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E8E0D5] p-4 text-center">
      <div className={`font-bebas text-3xl ${color}`}>{value}</div>
      <div className="text-xs text-[#6B5E55] mt-0.5">{label}</div>
    </div>
  );
}

function Section({
  title, subtitle, icon, items, barColor, maxPriority,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  items: Weakness[];
  barColor: string;
  maxPriority: number;
}) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <div>
          <span className="text-sm font-bold text-[#2D2420]">{title}</span>
          <span className="text-xs text-[#6B5E55] ml-2">{subtitle}</span>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-[#E8E0D5] divide-y divide-[#E8E0D5]/60 overflow-hidden">
        {items.map((w, i) => (
          <motion.div
            key={w.grammar_id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className="px-4 py-3"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-[#2D2420] truncate font-noto-jp">
                  {w.grammar_id}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {w.frequency && w.frequency.star > 0 && (
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 3 }).map((_, idx) => (
                      <span key={idx} className={`text-xs ${idx < w.frequency!.star ? 'text-[#C75B3B]' : 'text-[#E8E0D5]'}`}>
                        ★
                      </span>
                    ))}
                  </div>
                )}
                <div className="text-xs text-[#6B5E55]">
                  出错 <span className="font-bold text-[#2D2420]">{w.error_count}</span> 次
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-[#E8E0D5] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(w.priority / maxPriority) * 100}%` }}
                  transition={{ duration: 0.5, ease: "easeOut", delay: i * 0.04 }}
                  className={`h-full rounded-full ${barColor}`}
                />
              </div>
              <span className="text-xs text-[#6B5E55]/60 flex-shrink-0">
                优先级 {w.priority}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 bg-[#E8E0D5] rounded-full flex items-center justify-center mx-auto mb-4">
        <TrendingUp className="w-7 h-7 text-[#6B5E55]/50" />
      </div>
      <h3 className="text-base font-bold text-[#2D2420] mb-2">还没有记录</h3>
      <p className="text-sm text-[#6B5E55] mb-6 max-w-xs mx-auto leading-relaxed">
        使用错题分析功能后，系统会自动追踪你的薄弱语法点，在这里生成专属报告
      </p>
      <Link
        href="/tool?tab=analyze"
        className="inline-flex items-center gap-2 bg-[#C75B3B] text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-[#A84A2F] transition-colors"
      >
        去分析错题
      </Link>
    </div>
  );
}
