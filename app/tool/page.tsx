"use client";

import React, { useState, useRef, useCallback, Suspense, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import {
  GraduationCap,
  Search,
  BookOpen,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Lock,
  X,
  Copy,
  Check,
  Sparkles,
  User,
  Share2,
  Users,
  BookMarked,
  Zap,
  RefreshCw,
  BarChart2,
  TrendingUp,
  Keyboard,
  Mic,
} from "lucide-react";
import Link from "next/link";
import FuriganaText from "@/components/FuriganaText";
import { useSearchParams } from "next/navigation";
import JapaneseKeyboard from "@/components/JapaneseKeyboard";
import VoiceInput from "@/components/VoiceInput";
import { apiFetch } from "@/lib/api-client";

type Tab = "query" | "vocab" | "analyze";
const SHOP_URL = "https://www.xiaohongshu.com/";

// 语法快捷示例
const QUICK_EXAMPLES = ["なり", "ところを", "に至って", "をものともせず", "ならいざ知らず"];

// 最近更新日志
const UPDATES = [
  { date: "2026-04-02", text: "语法查询结果真题例句高亮显示" },
  { date: "2026-04-01", text: "AI 工具正式上线" },
];

export default function ToolPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAF6F0]" />}>
      <ToolPageInner />
    </Suspense>
  );
}

function ToolPageInner() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as Tab) === "analyze" ? "analyze" : "query";
  const [tab, setTab] = useState<Tab>(initialTab);

  // 自动核销邀请码
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (!ref) return;
    apiFetch("/api/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: ref }),
    }).catch(() => {});
  }, []);

  // 自动聚焦输入框（从首页跳转过来）
  useEffect(() => {
    const shouldFocus = searchParams.get("focus");
    if (shouldFocus === "true" && queryInputRef.current) {
      setTimeout(() => {
        queryInputRef.current?.focus();
      }, 100);
    }
  }, [searchParams]);

  // 语法查询
  const [queryInput, setQueryInput] = useState("");
  const [queryResult, setQueryResult] = useState("");
  const [matchedGrammar, setMatchedGrammar] = useState<any[]>([]);
  const [queryLoading, setQueryLoading] = useState(false);
  const queryInputRef = useRef<HTMLInputElement>(null);

  // 词汇查询
  const [vocabInput, setVocabInput] = useState("");
  const [vocabResult, setVocabResult] = useState("");
  const [matchedVocab, setMatchedVocab] = useState<any[]>([]);
  const [vocabLoading, setVocabLoading] = useState(false);
  const [vocabCollected, setVocabCollected] = useState(false);

  // 错题分析
  const [questionInput, setQuestionInput] = useState("");
  const [userAnswerInput, setUserAnswerInput] = useState("");
  const [correctAnswerInput, setCorrectAnswerInput] = useState("");
  const [analyzeResult, setAnalyzeResult] = useState("");
  const [errorPatterns, setErrorPatterns] = useState<string[]>([]);
  const [analyzeLoading, setAnalyzeLoading] = useState(false);

  // 移动端辅助输入
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [showVoiceInput, setShowVoiceInput] = useState(false);
  const [activeInputField, setActiveInputField] = useState<"query" | "vocab" | "question" | null>(null);

  const [error, setError] = useState("");
  const [showPaywall, setShowPaywall] = useState(false);

  const [menuOpen, setMenuOpen] = useState(false);
  const [usage, setUsage] = useState<{
    query: { used: number; limit: number };
    vocab: { used: number; limit: number };
    analyze: { used: number; limit: number };
  } | null>(null);
  const [quota, setQuota] = useState<{ remaining: number; hasQuota: boolean } | null>(null);
  const [showUpdates, setShowUpdates] = useState(false);

  // 处理键盘输入
  const handleKeyboardInsert = (text: string) => {
    if (activeInputField === "query") {
      setQueryInput((prev) => prev + text);
    } else if (activeInputField === "vocab") {
      setVocabInput((prev) => prev + text);
    } else if (activeInputField === "question") {
      setQuestionInput((prev) => prev + text);
    }
  };

  // 处理语音输入
  const handleVoiceResult = (text: string) => {
    if (activeInputField === "query") {
      setQueryInput((prev) => prev + text);
    } else if (activeInputField === "vocab") {
      setVocabInput((prev) => prev + text);
    } else if (activeInputField === "question") {
      setQuestionInput((prev) => prev + text);
    }
    setShowVoiceInput(false);
  };

  // 刷新额度
  const refreshUsage = async () => {
    try {
      const res = await apiFetch("/api/usage");
      const data = await res.json();
      setUsage(data);
    } catch (err) {
      console.error("刷新额度失败:", err);
    }
  };

  useEffect(() => {
    refreshUsage();
    apiFetch("/api/quota")
      .then((r) => r.json())
      .then(setQuota)
      .catch(() => {});
  }, []);

  async function handleQuery(q?: string) {
    const text = (q ?? queryInput).trim();
    if (!text) return;

    // 检查额度
    if (usage && usage.query.used >= usage.query.limit && !quota?.hasQuota) {
      setShowPaywall(true);
      return;
    }

    setQueryLoading(true);
    setError("");
    setQueryResult("");
    setMatchedGrammar([]);
    if (q) setQueryInput(q);

    try {
      const res = await apiFetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text }),
      });
      const data = await res.json();
      if (res.status === 429) {
        setShowPaywall(true);
        await refreshUsage();
        return;
      }
      if (data.error) throw new Error(data.error);
      setQueryResult(data.result);
      setMatchedGrammar(data.matchedGrammar || []);

      // 刷新额度
      await refreshUsage();

      // 保存查询历史
      apiFetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "grammar", query: text, result: data.result })
      }).catch(() => {});
    } catch (e: any) {
      setError(e.message ?? "查询失败，请稍后重试");
    } finally {
      setQueryLoading(false);
    }
  }

  // 处理点击单词查询
  function handleWordClick(word: string) {
    setTab("vocab");
    setVocabInput(word);
    // 延迟执行查询，确保tab切换完成
    setTimeout(() => {
      handleVocabQuery(word);
    }, 100);
  }

  async function handleVocabQuery(customQuery?: string) {
    const text = (customQuery || vocabInput).trim();
    console.log('[handleVocabQuery] 开始查询:', { customQuery, vocabInput, text });
    if (!text) return;

    // 检查额度
    if (usage && usage.vocab.used >= usage.vocab.limit && !quota?.hasQuota) {
      setShowPaywall(true);
      return;
    }

    setVocabLoading(true);
    setError("");
    setVocabResult("");
    setMatchedVocab([]);
    setVocabCollected(false);

    try {
      const requestBody = { query: text };
      console.log('[handleVocabQuery] 发送请求:', requestBody);
      const res = await apiFetch("/api/vocab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      const data = await res.json();
      console.log('[handleVocabQuery] 收到响应:', {
        status: res.status,
        resultPreview: data.result?.substring(0, 100),
        matchedVocab: data.matchedVocab?.map((v: any) => v.word)
      });
      if (res.status === 429) {
        setShowPaywall(true);
        await refreshUsage();
        return;
      }
      if (data.error) throw new Error(data.error);
      setVocabResult(data.result);
      setMatchedVocab(data.matchedVocab || []);

      // 刷新额度
      await refreshUsage();

      // 保存查询历史
      apiFetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "vocab", query: text, result: data.result })
      }).catch(() => {});
    } catch (e: any) {
      setError(e.message ?? "查询失败，请稍后重试");
    } finally {
      setVocabLoading(false);
    }
  }

  async function handleAnalyze() {
    if (!questionInput.trim()) return;

    // 检查额度
    if (usage && usage.analyze.used >= usage.analyze.limit && !quota?.hasQuota) {
      setShowPaywall(true);
      return;
    }

    setAnalyzeLoading(true);
    setError("");
    setAnalyzeResult("");
    setErrorPatterns([]);

    try {
      const res = await apiFetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: questionInput,
          userAnswer: userAnswerInput,
          correctAnswer: correctAnswerInput,
        }),
      });
      const data = await res.json();
      if (res.status === 429) {
        setShowPaywall(true);
        await refreshUsage();
        return;
      }
      if (data.error) throw new Error(data.error);
      setAnalyzeResult(data.result);
      setErrorPatterns(data.errorPatterns || []);

      // 刷新额度
      await refreshUsage();
    } catch (e: any) {
      setError(e.message ?? "分析失败，请稍后重试");
    } finally {
      setAnalyzeLoading(false);
    }
  }


  return (
    <div className="min-h-screen bg-[#FAF6F0] flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-[#E8E0D5]/60 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#C75B3B] rounded-xl flex items-center justify-center shadow-[0_2px_10px_rgba(199,91,59,0.25)]">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-noto-jp text-[#2D2420] font-bold text-lg">合格道</span>
              <span className="font-bebas text-[#C75B3B] text-base tracking-widest">GOKAKU</span>
            </div>
          </Link>
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-9 h-9 rounded-full bg-[#FAF6F0] border border-[#E8E0D5] flex items-center justify-center hover:border-[#C75B3B]/40 transition-colors"
            >
              <User className="w-4 h-4 text-[#6B5E55]" />
            </button>

            <AnimatePresence>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.12 }}
                    className="absolute right-0 top-12 w-64 bg-white rounded-2xl border border-[#E8E0D5] shadow-xl overflow-hidden z-50"
                  >
                    {/* 兑换码额度（如果有） */}
                    {quota && quota.hasQuota && (
                      <div className="px-4 py-3 bg-gradient-to-r from-[#D4772C]/10 to-[#E89A5C]/10 border-b border-[#E8E0D5]">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-[#D4772C]">💎 已解锁额度</span>
                          <span className="text-sm font-bold text-[#D4772C]">{quota.remaining} 次</span>
                        </div>
                        <p className="text-xs text-[#6B5E55]">永久有效 · 优先使用</p>
                      </div>
                    )}

                    {/* 用量进度条 */}
                    <div className="px-4 py-3 bg-[#FAF6F0] border-b border-[#E8E0D5]">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold text-[#2D2420]">今日免费额度</span>
                        {usage ? (
                          <span className="text-xs text-[#6B5E55]">
                            {usage.query.used + usage.vocab.used + usage.analyze.used} / {usage.query.limit + usage.vocab.limit + usage.analyze.limit}
                          </span>
                        ) : (
                          <span className="text-xs text-[#6B5E55]/40">加载中...</span>
                        )}
                      </div>
                      <div className="h-1.5 bg-[#E8E0D5] rounded-full overflow-hidden">
                        {usage && (
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{
                              width: `${Math.min(
                                ((usage.query.used + usage.vocab.used + usage.analyze.used) /
                                 (usage.query.limit + usage.vocab.limit + usage.analyze.limit)) * 100,
                                100
                              )}%`
                            }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className={`h-full rounded-full ${
                              (usage.query.used + usage.vocab.used + usage.analyze.used) >=
                              (usage.query.limit + usage.vocab.limit + usage.analyze.limit)
                                ? "bg-[#C75B3B]"
                                : (usage.query.used + usage.vocab.used + usage.analyze.used) >=
                                  (usage.query.limit + usage.vocab.limit + usage.analyze.limit) * 0.7
                                ? "bg-[#E8892B]"
                                : "bg-[#4A7C59]"
                            }`}
                          />
                        )}
                      </div>
                      {usage &&
                       (usage.query.used >= usage.query.limit &&
                        usage.vocab.used >= usage.vocab.limit &&
                        usage.analyze.used >= usage.analyze.limit) &&
                       !quota?.hasQuota && (
                        <p className="text-xs text-[#C75B3B] mt-1">免费额度已用完</p>
                      )}
                    </div>

                    {/* 菜单项 */}
                    <div className="py-1">
                      {!quota?.hasQuota && (
                        <>
                          <MenuItem
                            icon={<Zap className="w-4 h-4 text-[#D4772C]" />}
                            label="兑换码解锁"
                            onClick={() => { setMenuOpen(false); window.location.href = "/redeem"; }}
                            desc="输入购买后获得的兑换码"
                            highlight
                          />
                          <div className="mx-3 my-1 border-t border-[#E8E0D5]" />
                        </>
                      )}
                      <MenuItem
                        icon={<BookMarked className="w-4 h-4" />}
                        label="我的收藏"
                        onClick={() => { setMenuOpen(false); window.location.href = "/collection"; }}
                        desc="查看收藏的语法和词汇"
                      />
                      <MenuItem
                        icon={<Sparkles className="w-4 h-4" />}
                        label="每日一练"
                        onClick={() => { setMenuOpen(false); window.location.href = "/practice"; }}
                        desc="每天一道精选真题"
                      />
                      <MenuItem
                        icon={<BookOpen className="w-4 h-4 text-red-500" />}
                        label="我的错题本"
                        onClick={() => { setMenuOpen(false); window.location.href = "/wrongbook"; }}
                        desc="查看分析过的错题"
                      />
                      <MenuItem
                        icon={<TrendingUp className="w-4 h-4" />}
                        label="学习进度"
                        onClick={() => { setMenuOpen(false); window.location.href = "/dashboard"; }}
                        desc="查看学习统计和成就"
                      />
                      <MenuItem
                        icon={<Share2 className="w-4 h-4" />}
                        label="分享给朋友"
                        onClick={() => { setMenuOpen(false); window.location.href = "/invite"; }}
                        desc="邀请朋友，双方各得额外免费额度"
                      />
                      <MenuItem
                        icon={<BarChart2 className="w-4 h-4" />}
                        label="我的薄弱点报告"
                        onClick={() => { setMenuOpen(false); window.location.href = "/report"; }}
                        desc="查看你的高频错题语法分布"
                      />
                      <MenuItem
                        icon={<Users className="w-4 h-4" />}
                        label="备考交流群"
                        onClick={() => { setMenuOpen(false); window.open(SHOP_URL, "_blank"); }}
                        desc="加入 N1 备考打卡社群"
                      />
                      <MenuItem
                        icon={<BookMarked className="w-4 h-4" />}
                        label="使用指南"
                        onClick={() => { setMenuOpen(false); window.open("https://gokaku.app/guide", "_blank"); }}
                        desc="如何用好 AI 工具"
                      />
                      <MenuItem
                        icon={<RefreshCw className="w-4 h-4" />}
                        label="最近更新"
                        badge={true}
                        onClick={() => { setMenuOpen(false); setShowUpdates(true); }}
                        desc="查看新功能日志"
                      />
                      <div className="mx-3 my-1 border-t border-[#E8E0D5]" />
                      <MenuItem
                        icon={<Zap className="w-4 h-4 text-[#C75B3B]" />}
                        label="购买解锁更多额度"
                        onClick={() => { setMenuOpen(false); window.open(SHOP_URL, "_blank"); }}
                        desc="¥19 AI工具 / ¥39 工具+资料"
                        highlight
                      />
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        <div className="mb-6">
          <h1 className="font-bebas text-4xl text-[#2D2420]">AI 备考工具</h1>
          <p className="text-sm text-[#6B5E55] mt-1">
            {usage ? (
              <>
                语法查询 {usage.query.used}/{usage.query.limit} ·
                词汇查询 {usage.vocab.used}/{usage.vocab.limit} ·
                错题分析 {usage.analyze.used}/{usage.analyze.limit}
                {quota?.hasQuota && " · 会员无限使用"}
              </>
            ) : (
              "语法查询、词汇查询和错题分析 · 每位用户每个功能免费试用 3 次"
            )}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(["query", "vocab", "analyze"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => {
                setTab(t);
                setError("");
                // 切换Tab时清空所有结果
                setQueryResult("");
                setMatchedGrammar([]);
                setVocabResult("");
                setMatchedVocab([]);
                setAnalyzeResult("");
                setErrorPatterns([]);
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                tab === t
                  ? "bg-[#C75B3B] text-white shadow-sm"
                  : "bg-white text-[#6B5E55] border border-[#E8E0D5] hover:border-[#C75B3B]/30"
              }`}
            >
              {t === "query" ? <Search className="w-4 h-4" /> : t === "vocab" ? <BookOpen className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
              {t === "query" ? "语法查询" : t === "vocab" ? "词汇查询" : "错题分析"}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === "query" && (
            <motion.div key="query" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
              <div className="bg-white rounded-2xl border border-[#E8E0D5] p-6 shadow-sm">
                <p className="text-sm text-[#6B5E55] mb-3">
                  输入你想了解的语法，例如「なり」「ところを」「に至って」
                </p>

                {/* 快捷示例 */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {QUICK_EXAMPLES.map((ex) => (
                    <button
                      key={ex}
                      onClick={() => handleQuery(ex)}
                      className="text-xs px-3 py-1.5 rounded-full border border-[#C75B3B]/25 text-[#C75B3B] bg-[#C75B3B]/5 hover:bg-[#C75B3B]/10 transition-colors font-medium"
                    >
                      {ex}
                    </button>
                  ))}
                  <span className="text-xs text-[#6B5E55]/50 self-center">点击快速查询 →</span>
                </div>

                <div className="flex gap-3">
                  <input
                    ref={queryInputRef}
                    type="text"
                    value={queryInput}
                    onChange={(e) => setQueryInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleQuery()}
                    onFocus={() => setActiveInputField("query")}
                    placeholder="输入语法，按 Enter 查询..."
                    autoComplete="off"
                    className="flex-1 px-4 py-3 bg-[#FAF6F0] border border-[#E8E0D5] rounded-xl text-sm text-[#2D2420] placeholder:text-[#6B5E55]/50 focus:outline-none focus:ring-2 focus:ring-[#C75B3B]/30"
                  />
                  <button
                    onClick={() => { setActiveInputField("query"); setShowKeyboard(!showKeyboard); }}
                    className="px-3 py-3 bg-white border border-[#E8E0D5] hover:border-[#C75B3B]/30 rounded-xl transition-all"
                    title="日语键盘"
                  >
                    <Keyboard className="w-4 h-4 text-[#6B5E55]" />
                  </button>
                  <button
                    onClick={() => { setActiveInputField("query"); setShowVoiceInput(!showVoiceInput); }}
                    className="px-3 py-3 bg-white border border-[#E8E0D5] hover:border-[#C75B3B]/30 rounded-xl transition-all"
                    title="语音输入"
                  >
                    <Mic className="w-4 h-4 text-[#6B5E55]" />
                  </button>
                  <button
                    onClick={() => handleQuery()}
                    disabled={queryLoading || !queryInput.trim()}
                    className="px-5 py-3 bg-[#C75B3B] hover:bg-[#A84A2F] disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all flex items-center gap-2"
                  >
                    {queryLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    查询
                  </button>
                </div>

                {/* 日语键盘 */}
                {showKeyboard && activeInputField === "query" && (
                  <div className="mt-4">
                    <JapaneseKeyboard onInsert={handleKeyboardInsert} />
                  </div>
                )}

                {/* 语音输入 */}
                {showVoiceInput && activeInputField === "query" && (
                  <div className="mt-4 flex justify-center">
                    <VoiceInput onResult={handleVoiceResult} language="ja-JP" />
                  </div>
                )}

                {error && tab === "query" && <ErrorBanner message={error} />}
                {matchedGrammar.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-semibold text-[#6B5E55] mb-2">📊 真题考频数据</p>
                    {matchedGrammar.map((g: any, idx: number) => (
                      <div key={idx} className="bg-[#FFF8F0] border border-[#C75B3B]/20 rounded-xl p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <p className="text-sm font-bold text-[#2D2420] mb-1">{g.pattern}</p>
                            <p className="text-xs text-[#6B5E55] line-clamp-1">{g.meaning}</p>
                          </div>
                          {g.source && (
                            <div className="flex flex-col items-end gap-1">
                              <div className="flex items-center gap-1">
                                {Array.from({ length: 3 }).map((_, i) => (
                                  <span key={i} className={`text-sm ${i < g.source.star ? 'text-[#C75B3B]' : 'text-[#E8E0D5]'}`}>
                                    ★
                                  </span>
                                ))}
                              </div>
                              <p className="text-xs text-[#6B5E55]">
                                出现 <span className="font-semibold text-[#C75B3B]">{g.source.total_hits}</span> 次
                              </p>
                              {g.source.occurrences && g.source.occurrences.length > 0 && (
                                <p className="text-xs text-[#6B5E55]/70">
                                  {g.source.occurrences.slice(0, 3).map((o: any) => o.exam).join(", ")}
                                  {g.source.occurrences.length > 3 ? " 等" : ""}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {queryResult && <ResultBox content={queryResult} onWordClick={handleWordClick} />}
              </div>
            </motion.div>
          )}

          {tab === "vocab" && (
            <motion.div key="vocab" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
              <div className="bg-white rounded-2xl border border-[#E8E0D5] p-6 shadow-sm">
                <p className="text-sm text-[#6B5E55] mb-3">
                  输入你想了解的词汇，例如「相手」「一方」「結局」
                </p>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={vocabInput}
                    onChange={(e) => setVocabInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleVocabQuery()}
                    onFocus={() => setActiveInputField("vocab")}
                    placeholder="输入词汇..."
                    autoComplete="off"
                    className="flex-1 px-4 py-2.5 border border-[#E8E0D5] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C75B3B]/20 focus:border-[#C75B3B]/40"
                  />
                  <button
                    onClick={() => { setActiveInputField("vocab"); setShowKeyboard(!showKeyboard); }}
                    className="px-3 py-2.5 bg-white border border-[#E8E0D5] hover:border-[#C75B3B]/30 rounded-xl transition-all"
                    title="日语键盘"
                  >
                    <Keyboard className="w-4 h-4 text-[#6B5E55]" />
                  </button>
                  <button
                    onClick={() => { setActiveInputField("vocab"); setShowVoiceInput(!showVoiceInput); }}
                    className="px-3 py-2.5 bg-white border border-[#E8E0D5] hover:border-[#C75B3B]/30 rounded-xl transition-all"
                    title="语音输入"
                  >
                    <Mic className="w-4 h-4 text-[#6B5E55]" />
                  </button>
                  <button
                    onClick={() => handleVocabQuery()}
                    disabled={vocabLoading || !vocabInput.trim()}
                    className="px-6 py-2.5 bg-[#C75B3B] text-white rounded-xl text-sm font-semibold hover:bg-[#B54A2A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {vocabLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    查询
                  </button>
                </div>

                {/* 日语键盘 */}
                {showKeyboard && activeInputField === "vocab" && (
                  <div className="mt-4">
                    <JapaneseKeyboard onInsert={handleKeyboardInsert} />
                  </div>
                )}

                {/* 语音输入 */}
                {showVoiceInput && activeInputField === "vocab" && (
                  <div className="mt-4 flex justify-center">
                    <VoiceInput onResult={handleVoiceResult} language="ja-JP" />
                  </div>
                )}

                {error && tab === "vocab" && <ErrorBanner message={error} />}
                {matchedVocab.length > 0 && (
                  <div className="mt-4 space-y-3">
                    {matchedVocab.map((v: any, idx: number) => (
                      <div key={idx} className="bg-gradient-to-br from-[#FFF8F0] to-[#FFF0E5] border-2 border-[#C75B3B]/30 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                        {/* 词汇标题 */}
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-2xl font-bold text-[#2D2420] tracking-wide">{v.word}</h3>
                          <div className="flex items-center gap-1.5">
                            {Array.from({ length: 3 }).map((_, i) => (
                              <span key={i} className={`text-xl ${i < v.star ? 'text-[#C75B3B]' : 'text-[#E8E0D5]'}`}>
                                ★
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* 考频数据 */}
                        <div className="flex items-center gap-4 mb-3">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-xs text-[#6B5E55] font-medium">真题出现</span>
                            <span className="text-3xl font-bebas text-[#C75B3B]">{v.total_hits}</span>
                            <span className="text-xs text-[#6B5E55] font-medium">次</span>
                          </div>
                          {v.last_appeared && (
                            <div className="flex items-center gap-1 px-2.5 py-1 bg-[#4A7C59]/10 rounded-lg">
                              <span className="text-xs text-[#4A7C59] font-semibold">最近: {v.last_appeared}</span>
                            </div>
                          )}
                        </div>

                        {/* 真题出处 */}
                        {v.occurrences && v.occurrences.length > 0 && (
                          <div className="pt-3 border-t border-[#C75B3B]/10">
                            <p className="text-xs text-[#6B5E55]/60 mb-1.5">出现在以下真题：</p>
                            <div className="flex flex-wrap gap-1.5">
                              {v.occurrences.slice(0, 6).map((o: any, i: number) => (
                                <span key={i} className="px-2 py-0.5 bg-white/60 border border-[#C75B3B]/20 rounded text-xs text-[#2D2420] font-medium">
                                  {o.exam}
                                </span>
                              ))}
                              {v.occurrences.length > 6 && (
                                <span className="px-2 py-0.5 text-xs text-[#6B5E55]/70">
                                  +{v.occurrences.length - 6} 套
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {vocabResult && (
                  <div className="mt-4 bg-gradient-to-br from-white to-[#FFF8F0] rounded-2xl border-2 border-[#C75B3B]/20 overflow-hidden shadow-sm">
                    {/* 标题栏 - 添加收藏按钮 */}
                    <div className="flex items-center justify-between px-4 py-3 bg-[#FAF6F0] border-b border-[#C75B3B]/10">
                      <span className="text-sm font-semibold text-[#2D2420]">AI 分析结果</span>
                      <button
                        onClick={async () => {
                          try {
                            await apiFetch("/api/collection", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                type: "vocab",
                                content: {
                                  query: vocabInput,
                                  result: vocabResult,
                                  matchedVocab: matchedVocab
                                }
                              })
                            });
                            setVocabCollected(true);
                            setTimeout(() => setVocabCollected(false), 2000);
                          } catch (error) {
                            alert("收藏失败");
                          }
                        }}
                        className="flex items-center gap-1.5 text-xs text-[#6B5E55] hover:text-[#D4772C] transition-colors px-2 py-1 rounded-lg hover:bg-white"
                        title="收藏"
                      >
                        {vocabCollected ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-[#4A7C59]" />
                            <span className="text-[#4A7C59]">已收藏</span>
                          </>
                        ) : (
                          <>
                            <BookMarked className="w-3.5 h-3.5" />
                            收藏
                          </>
                        )}
                      </button>
                    </div>

                    {/* 内容区域 */}
                    <div className="p-6 prose prose-sm max-w-none">
                      <ReactMarkdown
                        components={{
                          h3: ({ children }) => (
                            <h3 className="text-lg font-bold text-[#2D2420] mt-4 mb-2 first:mt-0 flex items-center gap-2">
                              {children}
                            </h3>
                          ),
                          strong: ({ children }) => (
                            <strong className="text-[#C75B3B] font-bold">{children}</strong>
                          ),
                          p: ({ children }) => (
                            <p className="text-sm text-[#2D2420] leading-relaxed mb-3">{children}</p>
                          ),
                          ul: ({ children }) => (
                            <ul className="space-y-1.5 mb-3">{children}</ul>
                          ),
                          li: ({ children }) => (
                            <li className="text-sm text-[#2D2420] leading-relaxed ml-4">{children}</li>
                          ),
                        }}
                      >
                        {vocabResult}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {tab === "analyze" && (
            <motion.div key="analyze" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
              <div className="bg-white rounded-2xl border border-[#E8E0D5] p-6 shadow-sm">
                <p className="text-sm text-[#6B5E55] mb-4">
                  粘贴做错的题目，AI 帮你找出陷阱，理解考点
                </p>

                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-[#2D2420]">题目内容 *</label>
                      </div>

                    <div className="relative">
                      <textarea
                        value={questionInput}
                        onChange={(e) => setQuestionInput(e.target.value)}
                        onFocus={() => setActiveInputField("question")}
                        placeholder="粘贴完整题目，包括选项（如果有的话）..."
                        rows={4}
                        autoComplete="off"
                        className="w-full px-4 py-3 bg-[#FAF6F0] border border-[#E8E0D5] rounded-xl text-sm text-[#2D2420] placeholder:text-[#6B5E55]/50 focus:outline-none focus:ring-2 focus:ring-[#C75B3B]/30 resize-none"
                      />
                      {questionInput && (
                        <button
                          onClick={() => { setQuestionInput(""); setAnalyzeResult(""); }}
                          className="absolute top-2 right-2 text-[#6B5E55]/50 hover:text-[#6B5E55] transition-colors"
                          title="清空"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* 日语键盘和语音输入 */}
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => { setActiveInputField("question"); setShowKeyboard(!showKeyboard); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E8E0D5] hover:border-[#C75B3B]/30 rounded-lg text-xs text-[#6B5E55] transition-all"
                      >
                        <Keyboard className="w-3.5 h-3.5" />
                        日语键盘
                      </button>
                      <button
                        onClick={() => { setActiveInputField("question"); setShowVoiceInput(!showVoiceInput); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E8E0D5] hover:border-[#C75B3B]/30 rounded-lg text-xs text-[#6B5E55] transition-all"
                      >
                        <Mic className="w-3.5 h-3.5" />
                        语音输入
                      </button>
                    </div>

                    {/* 日语键盘 */}
                    {showKeyboard && activeInputField === "question" && (
                      <div className="mt-3">
                        <JapaneseKeyboard onInsert={handleKeyboardInsert} />
                      </div>
                    )}

                    {/* 语音输入 */}
                    {showVoiceInput && activeInputField === "question" && (
                      <div className="mt-3 flex justify-center">
                        <VoiceInput onResult={handleVoiceResult} language="ja-JP" />
                      </div>
                    )}
                    <p className="text-right text-xs text-[#6B5E55]/40 mt-1">{questionInput.length} 字</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#2D2420] mb-1.5">我的答案（可选）</label>
                      <input
                        type="text"
                        value={userAnswerInput}
                        onChange={(e) => setUserAnswerInput(e.target.value)}
                        placeholder="例如：①或 A"
                        autoComplete="off"
                        className="w-full px-4 py-2.5 bg-[#FAF6F0] border border-[#E8E0D5] rounded-xl text-sm text-[#2D2420] placeholder:text-[#6B5E55]/50 focus:outline-none focus:ring-2 focus:ring-[#C75B3B]/30"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#2D2420] mb-1.5">正确答案（可选）</label>
                      <input
                        type="text"
                        value={correctAnswerInput}
                        onChange={(e) => setCorrectAnswerInput(e.target.value)}
                        placeholder="例如：③或 C"
                        autoComplete="off"
                        className="w-full px-4 py-2.5 bg-[#FAF6F0] border border-[#E8E0D5] rounded-xl text-sm text-[#2D2420] placeholder:text-[#6B5E55]/50 focus:outline-none focus:ring-2 focus:ring-[#C75B3B]/30"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleAnalyze}
                  disabled={analyzeLoading || !questionInput.trim()}
                  className="mt-4 w-full py-3 bg-[#C75B3B] hover:bg-[#A84A2F] disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
                >
                  {analyzeLoading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />分析中，请稍候...</>
                  ) : (
                    <><Sparkles className="w-4 h-4" />分析这道题</>
                  )}
                </button>

                {error && tab === "analyze" && <ErrorBanner message={error} />}
                {errorPatterns.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="text-xs font-semibold text-[#6B5E55]">🎯 错误模式：</span>
                    {errorPatterns.map((pattern, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#C75B3B]/10 text-[#C75B3B] border border-[#C75B3B]/20"
                      >
                        {pattern}
                      </span>
                    ))}
                  </div>
                )}
                {analyzeResult && <ResultBox content={analyzeResult} onWordClick={handleWordClick} />}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Paywall */}
        <AnimatePresence>
          {showPaywall && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center px-4"
              onClick={() => setShowPaywall(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-12 h-12 bg-[#C75B3B]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-6 h-6 text-[#C75B3B]" />
                </div>
                <h2 className="text-lg font-bold text-[#2D2420] text-center mb-2">免费次数已用完</h2>
                <p className="text-sm text-[#6B5E55] text-center mb-6 leading-relaxed">
                  购买后可无限使用 AI 工具，直到 2026 年 7 月考试结束
                </p>
                <a
                  href={SHOP_URL} target="_blank" rel="noopener noreferrer"
                  className="w-full block text-center bg-[#C75B3B] hover:bg-[#A84A2F] text-white py-3 rounded-xl font-semibold text-sm transition-colors mb-3"
                >
                  ¥39 解锁无限使用
                </a>
                <button onClick={() => setShowPaywall(false)} className="w-full text-sm text-[#6B5E55] hover:text-[#2D2420] py-2 transition-colors">
                  关闭
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 最近更新弹窗 */}
        <AnimatePresence>
          {showUpdates && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center px-4"
              onClick={() => setShowUpdates(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-[#2D2420]">最近更新</h2>
                  <button onClick={() => setShowUpdates(false)} className="w-7 h-7 rounded-full bg-[#FAF6F0] flex items-center justify-center hover:bg-[#E8E0D5] transition-colors">
                    <X className="w-3.5 h-3.5 text-[#6B5E55]" />
                  </button>
                </div>
                <div className="space-y-3">
                  {UPDATES.map((u, i) => (
                    <div key={i} className="flex gap-3">
                      <span className="text-xs text-[#6B5E55]/60 w-20 flex-shrink-0 mt-0.5">{u.date}</span>
                      <span className="text-sm text-[#2D2420]">{u.text}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="border-t border-[#E8E0D5] py-6 text-center text-xs text-[#6B5E55]">
        <Link href="/" className="hover:text-[#C75B3B] transition-colors">← 返回首页</Link>
        <span className="mx-3">·</span>
        <Link href="/download" className="hover:text-[#C75B3B] transition-colors">资料领取</Link>
        <span className="mx-3">·</span>
        <a href="mailto:contact@gokaku.app" className="hover:text-[#C75B3B] transition-colors">联系我们</a>
      </footer>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="mt-4 flex items-start gap-2 text-sm text-[#C75B3B] bg-[#C75B3B]/6 rounded-xl p-3">
      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
      {message}
    </div>
  );
}

// ── ResultBox：分节渲染，真题例句高亮，一键复制 ──────────────────────────────
const EXAMPLE_SECTION_KEYS = ["真题例句", "真題例句", "例句"];

function ResultBox({ content, onWordClick }: { content: string; onWordClick?: (word: string) => void }) {
  const [expanded, setExpanded] = useState(true);
  const [copied, setCopied] = useState(false);
  const [collected, setCollected] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleCollect = async () => {
    try {
      await apiFetch("/api/collection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "grammar",
          content: { result: content }
        })
      });
      setCollected(true);
      setTimeout(() => setCollected(false), 2000);
    } catch (error) {
      alert("收藏失败");
    }
  };

  const sections = parseContent(content);

  return (
    <div className="mt-5 border border-[#E8E0D5] rounded-2xl overflow-hidden">
      {/* 标题栏 */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#FAF6F0] border-b border-[#E8E0D5]">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-sm font-semibold text-[#2D2420] hover:text-[#C75B3B] transition-colors"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          AI 分析结果
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCollect}
            className="flex items-center gap-1.5 text-xs text-[#6B5E55] hover:text-[#D4772C] transition-colors px-2 py-1 rounded-lg hover:bg-white"
            title="收藏"
          >
            {collected ? <><Check className="w-3.5 h-3.5 text-[#4A7C59]" /><span className="text-[#4A7C59]">已收藏</span></> : <><BookMarked className="w-3.5 h-3.5" />收藏</>}
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs text-[#6B5E55] hover:text-[#2D2420] transition-colors px-2 py-1 rounded-lg hover:bg-white"
            title="复制全文"
          >
            {copied ? <><Check className="w-3.5 h-3.5 text-[#4A7C59]" /><span className="text-[#4A7C59]">已复制</span></> : <><Copy className="w-3.5 h-3.5" />复制</>}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="divide-y divide-[#E8E0D5]/60">
          {sections.map((section, idx) => (
            <Section key={idx} section={section} onWordClick={onWordClick} />
          ))}
        </div>
      )}
    </div>
  );
}

interface ContentSection {
  heading: string | null;
  isExample: boolean;
  lines: string[];
}

function parseContent(content: string): ContentSection[] {
  const rawLines = content.split("\n");
  const sections: ContentSection[] = [];
  let current: ContentSection = { heading: null, isExample: false, lines: [] };

  for (const line of rawLines) {
    const trimmed = line.trim();
    // 检测 **标题** 行
    if (/^\*\*[^*]+\*\*$/.test(trimmed)) {
      if (current.lines.length > 0 || current.heading) {
        sections.push(current);
      }
      const headingText = trimmed.replace(/\*\*/g, "");
      current = {
        heading: headingText,
        isExample: EXAMPLE_SECTION_KEYS.some((k) => headingText.includes(k)),
        lines: [],
      };
    } else {
      current.lines.push(line);
    }
  }
  if (current.lines.length > 0 || current.heading) sections.push(current);
  return sections;
}

function Section({ section, onWordClick }: { section: ContentSection; onWordClick?: (word: string) => void }) {
  if (section.isExample) {
    // 真题例句区块：暖色高亮背景
    return (
      <div className="px-5 py-4 bg-[#FFF8F0]">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1 h-4 rounded-full bg-[#C75B3B] inline-block" />
          <span className="text-xs font-bold text-[#C75B3B] tracking-wide uppercase">
            {section.heading}
          </span>
        </div>
        <div className="space-y-3">
          {section.lines
            .filter((l) => l.trim())
            .map((line, i) => (
              <ExampleLine key={i} line={line} onWordClick={onWordClick} />
            ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 py-4">
      {section.heading && (
        <div className="flex items-center gap-2 mb-2.5">
          <span className="w-1 h-4 rounded-full bg-[#C75B3B]/40 inline-block" />
          <span className="text-xs font-bold text-[#C75B3B] tracking-wide">
            {section.heading}
          </span>
        </div>
      )}
      <div className="space-y-1.5 text-sm text-[#6B5E55] leading-relaxed">
        {section.lines.map((line, i) => (
          <RichLine key={i} line={line} />
        ))}
      </div>
    </div>
  );
}

// 带日语文字检测的例句行
function ExampleLine({ line, onWordClick }: { line: string; onWordClick?: (word: string) => void }) {
  const trimmed = line.trim();
  if (!trimmed) return null;
  const isJapanese = /[\u3040-\u30FF\u4E00-\u9FFF]/.test(trimmed);
  if (isJapanese && !trimmed.startsWith("（") && !trimmed.startsWith("(")) {
    // 日语句子：加红色左边框，显示振假名
    return (
      <div className="pl-3 border-l-2 border-[#C75B3B]/50">
        <FuriganaText
          text={trimmed}
          onWordClick={onWordClick}
          className="text-sm text-[#2D2420] font-medium leading-relaxed"
        />
      </div>
    );
  }
  // 中文翻译或说明
  return (
    <div className="pl-3">
      <RichLine line={trimmed} className="text-xs text-[#6B5E55]" />
    </div>
  );
}

// 渲染内嵌 **粗体** 和普通文字
function RichLine({ line, className = "text-sm text-[#6B5E55] leading-relaxed" }: { line: string; className?: string }) {
  if (!line.trim()) return null;
  const parts = line.split(/\*\*(.+?)\*\*/g);
  return (
    <p className={className}>
      {parts.map((part, j) =>
        j % 2 === 1 ? (
          <strong key={j} className="text-[#2D2420] font-semibold">
            {part}
          </strong>
        ) : (
          part
        )
      )}
    </p>
  );
}

function MenuItem({
  icon,
  label,
  desc,
  badge,
  highlight,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  desc?: string;
  badge?: boolean;
  highlight?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[#FAF6F0] transition-colors ${highlight ? "text-[#C75B3B]" : "text-[#2D2420]"}`}
    >
      <span className={highlight ? "text-[#C75B3B]" : "text-[#6B5E55]"}>{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{label}</span>
          {badge && <span className="w-1.5 h-1.5 rounded-full bg-[#C75B3B] flex-shrink-0" />}
        </div>
        {desc && <p className="text-xs text-[#6B5E55]/70 truncate mt-0.5">{desc}</p>}
      </div>
    </button>
  );
}
