"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Sparkles,
  BookText,
  Lock,
  Eye,
  CheckCircle2,
  Star,
  TrendingUp,
  Lightbulb,
  AlertCircle,
  ShoppingBag,
  Download,
} from "lucide-react";

// TODO: 替换为你的小红书店铺/笔记链接
const XIAOHONGSHU_SHOP_URL = "https://www.xiaohongshu.com/";

interface ContentPreviewProps {
  activeLevel: "N1" | "N2";
}

type ReportData = {
  analysis: any;
  predictions: any;
  vocabulary: any;
};

export function ContentPreview({ activeLevel }: ContentPreviewProps) {
  const [activeTab, setActiveTab] = useState<"analysis" | "predictions" | "vocabulary">("analysis");
  const [reports, setReports] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/reports/01_高频考点分析报告_${activeLevel}.json`).then((r) => r.json()),
      fetch(`/reports/02_押题预测单_2026年7月_${activeLevel}.json`).then((r) => r.json()),
      fetch(`/reports/03_高频词汇表_${activeLevel}.json`).then((r) => r.json()),
    ])
      .then(([analysis, predictions, vocabulary]) => {
        setReports({ analysis, predictions, vocabulary });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [activeLevel]);

  const tabs = [
    { id: "analysis", label: "考点分析", icon: BarChart3 },
    { id: "predictions", label: "押题预测", icon: Sparkles },
    { id: "vocabulary", label: "高频词汇", icon: BookText },
  ] as const;

  return (
    <section className="py-16 md:py-24 bg-[#FAF6F0]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="inline-block text-xs font-semibold tracking-widest text-[#C75B3B] uppercase mb-3">
            Reports
          </span>
          <h2 className="font-bebas text-5xl md:text-6xl text-[#2D2420] mb-3">
            全料包内容预览
          </h2>
          <p className="text-[#6B5E55] max-w-md mx-auto text-sm">
            基于18套含题目+听力+解析的完整真题构建的频率分析数据库，另有语法/听力/词汇/惯用语/真题库等176份原始资料。以下为主报告前20%免费预览，<span className="text-[#6B5E55]/60 text-xs">例句仅用于学习分析</span>。
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-white rounded-2xl p-1.5 gap-1 shadow-[0_2px_12px_rgba(45,36,32,0.06)]">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer",
                  activeTab === tab.id
                    ? "bg-[#C75B3B] text-white shadow-sm"
                    : "text-[#6B5E55] hover:text-[#2D2420] hover:bg-[#F5EFE6]"
                )}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab + activeLevel}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="relative bg-white rounded-3xl overflow-hidden shadow-[0_4px_32px_rgba(45,36,32,0.08)] border border-[#E8E0D5]"
          >
            {loading || !reports ? (
              <div className="p-10 flex items-center justify-center text-[#6B5E55]">
                <div className="w-6 h-6 border-2 border-[#E8E0D5] border-t-[#C75B3B] rounded-full animate-spin mr-3" />
                加载资料中…
              </div>
            ) : (
              <>
                {/* Card Header */}
                <div className="px-6 py-5 border-b border-[#E8E0D5] flex items-center justify-between bg-[#FDF8F3]">
                  <div>
                    <h3 className="text-[#2D2420] font-semibold text-base">
                      {reports[activeTab].title}
                    </h3>
                    <p className="text-xs text-[#6B5E55] mt-0.5 font-noto-jp">
                      {activeLevel} · 2026年7月版 · 真题数据支撑
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 border border-[#C75B3B]/30 bg-[#C75B3B]/8 text-[#C75B3B] px-3 py-1.5 rounded-full">
                    <Lock className="w-3 h-3" />
                    <span className="text-xs font-medium">付费内容</span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6">
                  {activeTab === "analysis" && <AnalysisTab data={reports.analysis} level={activeLevel} />}
                  {activeTab === "predictions" && <PredictionsTab data={reports.predictions} level={activeLevel} />}
                  {activeTab === "vocabulary" && <VocabularyTab data={reports.vocabulary} level={activeLevel} />}
                </div>

                {/* Gradient Lock Overlay */}
                <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-white via-white/90 to-transparent pointer-events-none rounded-b-3xl" />

                {/* Unlock CTA */}
                <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-2 z-10">
                  <a
                    href={XIAOHONGSHU_SHOP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#C75B3B] hover:bg-[#A84A2F] text-white px-8 py-3 rounded-2xl font-semibold text-sm transition-all duration-200 shadow-[0_4px_20px_rgba(199,91,59,0.25)] hover:shadow-[0_6px_24px_rgba(199,91,59,0.35)] cursor-pointer flex items-center gap-2"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    解锁完整资料 · ¥39
                  </a>
                  <a
                    href="/download"
                    className="text-xs text-[#C75B3B] hover:underline flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    已购买？点击领取下载链接
                  </a>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

function AnalysisTab({ data, level }: { data: any; level: string }) {
  const grammarTop = (data.grammar_top || []).slice(0, 4);
  const contrasts = (data.grammar_contrasts || []).slice(0, 3);
  const vocabBusiness = (data.vocab_business || []).slice(0, 6);
  const themes = (data.reading_themes || []).slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Grammar Top */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-[#C75B3B]" />
          <span className="text-sm font-semibold text-[#2D2420]">语法高频考点 TOP {grammarTop.length}</span>
        </div>
        <div className="grid gap-2">
          {grammarTop.map((g: any, idx: number) => (
            <div
              key={idx}
              className="bg-[#FDF8F3] rounded-xl px-4 py-3 border border-[#E8E0D5]"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-white bg-[#C75B3B] w-5 h-5 rounded-full flex items-center justify-center">
                    {g.rank}
                  </span>
                  <span className="text-sm font-noto-jp font-medium text-[#2D2420]">{g.pattern}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#6B5E55]">
                  <span className="flex items-center gap-0.5">
                    <Star className="w-3 h-3 text-[#F0A500] fill-[#F0A500]" />
                    {"★".repeat(g.star || 0)}
                  </span>
                  <span className="text-[#6B5E55]/60">|</span>
                  <span>出现 {g.exam_hits || "—"} 次</span>
                </div>
              </div>
              {g.meaning_summary && (
                <p className="text-xs text-[#6B5E55] mb-1">{g.meaning_summary}</p>
              )}
              {g.example_sentence && (
                <p className="text-xs text-[#4A7C59] font-noto-jp">{g.example_sentence}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contrasts */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle className="w-4 h-4 text-[#4A7C59]" />
          <span className="text-sm font-semibold text-[#2D2420]">近义辨析精选</span>
        </div>
        <div className="grid gap-2">
          {contrasts.map((c: any, idx: number) => (
            <div key={idx} className="bg-[#FDF8F3] rounded-xl px-4 py-3 border border-[#E8E0D5]">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-noto-jp font-medium text-[#C75B3B]">{c.a}</span>
                <span className="text-xs text-[#6B5E55]">vs</span>
                <span className="text-sm font-noto-jp font-medium text-[#C75B3B]">{c.b}</span>
              </div>
              <p className="text-xs text-[#6B5E55] leading-relaxed mb-2">{c.diff}</p>
              {(c.a_example || c.b_example) && (
                <div className="space-y-1 text-xs border-t border-[#E8E0D5] pt-2">
                  {c.a_example && (
                    <div className="flex gap-2">
                      <span className="text-[#C75B3B] font-bold">A</span>
                      <span className="text-[#2D2420] font-noto-jp">{c.a_example}</span>
                    </div>
                  )}
                  {c.b_example && (
                    <div className="flex gap-2">
                      <span className="text-[#4A7C59] font-bold">B</span>
                      <span className="text-[#2D2420] font-noto-jp">{c.b_example}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Split row: vocab + reading */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <BookText className="w-4 h-4 text-[#C75B3B]" />
            <span className="text-sm font-semibold text-[#2D2420]">商务职场精品词</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {vocabBusiness.map((w: any, idx: number) => (
              <span
                key={idx}
                className="px-2.5 py-1 bg-white border border-[#E8E0D5] text-[#2D2420] rounded-lg text-xs font-noto-jp shadow-sm"
              >
                {w.word}
              </span>
            ))}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Eye className="w-4 h-4 text-[#4A7C59]" />
            <span className="text-sm font-semibold text-[#2D2420]">读解高频主题</span>
          </div>
          <div className="space-y-2">
            {themes.map((t: any, idx: number) => (
              <div key={idx} className="flex items-center gap-2 text-sm text-[#2D2420]">
                <span className="text-xs text-[#6B5E55]">{t.rank}.</span>
                <span className="font-noto-jp">{t.theme}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PredictionsTab({ data, level }: { data: any; level: string }) {
  const high = (data.grammar_high || []).slice(0, 3);
  const mid = (data.grammar_mid || []).slice(0, 3);
  const must = (data.must_memorize || []).slice(0, 3);
  const traps = (data.traps || []).slice(0, 3);

  return (
    <div className="space-y-6">
      {/* High 押中概率 */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-[#C75B3B]" />
          <span className="text-sm font-semibold text-[#2D2420]">高押中概率语法预测</span>
        </div>
        <div className="grid gap-2">
          {high.map((g: any, idx: number) => (
            <div
              key={idx}
              className="bg-[#C75B3B]/6 rounded-xl px-4 py-3 border border-[#C75B3B]/20"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-noto-jp font-medium text-[#2D2420]">{g.pattern}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#6B5E55]">轮空 {g.gap_years < 99 ? `${g.gap_years}年` : "未统计"}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#C75B3B] text-white">
                    高
                  </span>
                </div>
              </div>
              {g.meaning_summary && (
                <p className="text-xs text-[#6B5E55] mb-1">{g.meaning_summary}</p>
              )}
              {g.example_sentence && (
                <p className="text-xs text-[#4A7C59] font-noto-jp">{g.example_sentence}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Mid 押中概率 */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-4 h-4 text-[#4A7C59]" />
          <span className="text-sm font-semibold text-[#2D2420]">中押中概率关注区</span>
        </div>
        <div className="grid gap-2">
          {mid.map((g: any, idx: number) => (
            <div
              key={idx}
              className="bg-[#FDF8F3] rounded-xl px-4 py-3 border border-[#E8E0D5]"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-noto-jp font-medium text-[#2D2420]">{g.pattern}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#6B5E55]">轮空 {g.gap_years < 99 ? `${g.gap_years}年` : "未统计"}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#4A7C59] text-white">
                    中
                  </span>
                </div>
              </div>
              {g.meaning_summary && (
                <p className="text-xs text-[#6B5E55] mb-1">{g.meaning_summary}</p>
              )}
              {g.example_sentence && (
                <p className="text-xs text-[#4A7C59] font-noto-jp">{g.example_sentence}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Must Memorize */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Star className="w-4 h-4 text-[#F0A500]" />
          <span className="text-sm font-semibold text-[#2D2420]">考前1晚必背（精选）</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {must.map((g: any, idx: number) => (
            <div
              key={idx}
              className="px-3 py-1.5 bg-[#FDF8F3] border border-[#E8E0D5] text-[#2D2420] rounded-lg text-xs font-noto-jp"
            >
              <span>{g.pattern}</span>
              {g.meaning_summary && (
                <span className="text-[#6B5E55] ml-1">· {g.meaning_summary}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Traps */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle className="w-4 h-4 text-[#C75B3B]" />
          <span className="text-sm font-semibold text-[#2D2420]">必错陷阱点</span>
        </div>
        <div className="grid gap-2">
          {traps.map((t: any, idx: number) => (
            <div key={idx} className="bg-[#FDF8F3] rounded-xl px-4 py-3 border border-[#E8E0D5]">
              <div className="text-sm font-noto-jp font-medium text-[#2D2420] mb-1">{t.trap}</div>
              <p className="text-xs text-[#6B5E55]">{t.fix}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function VocabularyTab({ data, level }: { data: any; level: string }) {
  const words = (data.kanji_nouns || []).slice(0, 8);
  const idioms = (data.idioms || []).slice(0, 4);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <BookText className="w-4 h-4 text-[#C75B3B]" />
          <span className="text-sm font-semibold text-[#2D2420]">核心名词预览</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {words.map((w: any, idx: number) => (
            <div
              key={idx}
              className="flex items-center justify-between bg-[#FDF8F3] rounded-xl px-4 py-3 border border-[#E8E0D5]"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-noto-jp font-medium text-[#2D2420]">{w.word}</span>
                <span className="text-xs text-[#6B5E55] font-noto-jp">{w.reading}</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-[#E8E0D5] text-[#6B5E55]">
                名词
              </span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-4 h-4 text-[#4A7C59]" />
          <span className="text-sm font-semibold text-[#2D2420]">惯用语预览</span>
        </div>
        <div className="grid gap-2">
          {idioms.map((item: any, idx: number) => (
            <div
              key={idx}
              className="flex items-start gap-3 bg-[#FDF8F3] rounded-xl px-4 py-3 border border-[#E8E0D5]"
            >
              <CheckCircle2 className="w-4 h-4 text-[#4A7C59] mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-sm font-noto-jp font-medium text-[#2D2420]">{item.idiom}</span>
                <p className="text-xs text-[#6B5E55] mt-0.5">{item.meaning || "惯用表达"}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center pt-2">
        <div className="inline-flex items-center gap-2 text-[#6B5E55] text-sm bg-white border border-[#E8E0D5] px-4 py-2 rounded-full">
          <Eye className="w-4 h-4" />
          <span>还有 {((data.kanji_nouns || []).length - 8).toLocaleString()}+ 词汇待解锁</span>
        </div>
      </div>
    </div>
  );
}
