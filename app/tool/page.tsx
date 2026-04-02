"use client";

import React, { useState, useRef, useCallback, Suspense, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  Search,
  BookOpen,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Lock,
  Camera,
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
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type Tab = "query" | "analyze";
const SHOP_URL = "https://www.xiaohongshu.com/";
const FREE_LIMIT = 3;

// 语法快捷示例
const QUICK_EXAMPLES = ["なり", "ところを", "に至って", "をものともせず", "ならいざ知らず"];

// 最近更新日志
const UPDATES = [
  { date: "2026-04-03", text: "新增拍照识别题目功能" },
  { date: "2026-04-02", text: "语法查询结果真题例句高亮显示" },
  { date: "2026-04-01", text: "AI 工具正式上线" },
];


function useLocalCount(key: string) {
  const get = () => {
    if (typeof window === "undefined") return 0;
    return parseInt(localStorage.getItem(key) ?? "0", 10);
  };
  const inc = () => {
    const n = get() + 1;
    localStorage.setItem(key, String(n));
    return n;
  };
  return { get, inc };
}

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
    fetch("/api/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: ref }),
    }).catch(() => {});
  }, []);

  // 语法查询
  const [queryInput, setQueryInput] = useState("");
  const [queryResult, setQueryResult] = useState("");
  const [queryLoading, setQueryLoading] = useState(false);

  // 错题分析
  const [questionInput, setQuestionInput] = useState("");
  const [userAnswerInput, setUserAnswerInput] = useState("");
  const [correctAnswerInput, setCorrectAnswerInput] = useState("");
  const [analyzeResult, setAnalyzeResult] = useState("");
  const [analyzeLoading, setAnalyzeLoading] = useState(false);

  // OCR
  const [ocrLoading, setOcrLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [error, setError] = useState("");
  const [showPaywall, setShowPaywall] = useState(false);

  const queryCounter = useLocalCount("gk_query_count");
  const analyzeCounter = useLocalCount("gk_analyze_count");

  const [menuOpen, setMenuOpen] = useState(false);
  const [usage, setUsage] = useState<{ used: number; limit: number } | null>(null);
  const [showUpdates, setShowUpdates] = useState(false);

  useEffect(() => {
    fetch("/api/usage")
      .then((r) => r.json())
      .then(setUsage)
      .catch(() => {});
  }, []);

  async function handleQuery(q?: string) {
    const text = (q ?? queryInput).trim();
    if (!text) return;
    if (!q) {} // triggered by button/enter, not chip
    const count = queryCounter.get();
    if (count >= FREE_LIMIT) { setShowPaywall(true); return; }
    setQueryLoading(true);
    setError("");
    setQueryResult("");
    if (q) setQueryInput(q);
    queryCounter.inc();
    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text }),
      });
      const data = await res.json();
      if (res.status === 429) { setShowPaywall(true); return; }
      if (data.error) throw new Error(data.error);
      setQueryResult(data.result);
    } catch (e: any) {
      setError(e.message ?? "查询失败，请稍后重试");
    } finally {
      setQueryLoading(false);
    }
  }

  async function handleAnalyze() {
    if (!questionInput.trim()) return;
    const count = analyzeCounter.get();
    if (count >= FREE_LIMIT) { setShowPaywall(true); return; }
    setAnalyzeLoading(true);
    setError("");
    setAnalyzeResult("");
    analyzeCounter.inc();
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: questionInput,
          userAnswer: userAnswerInput,
          correctAnswer: correctAnswerInput,
        }),
      });
      const data = await res.json();
      if (res.status === 429) { setShowPaywall(true); return; }
      if (data.error) throw new Error(data.error);
      setAnalyzeResult(data.result);
    } catch (e: any) {
      setError(e.message ?? "分析失败，请稍后重试");
    } finally {
      setAnalyzeLoading(false);
    }
  }

  const handleImageSelect = useCallback(async (file: File) => {
    if (file.size > 8 * 1024 * 1024) {
      setError("图片太大，请使用 8MB 以内的图片");
      return;
    }
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      setImagePreview(dataUrl);
      setOcrLoading(true);
      setError("");
      try {
        // 提取 base64 数据部分
        const base64 = dataUrl.split(",")[1];
        const mimeType = file.type || "image/jpeg";
        const res = await fetch("/api/ocr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64, mimeType }),
        });
        const data = await res.json();
        if (data.error) {
          setError(data.error);
        } else if (data.text) {
          setQuestionInput(data.text);
          setImagePreview(null); // 识别成功后清除预览
        }
      } catch {
        setError("识别失败，请手动粘贴题目");
      } finally {
        setOcrLoading(false);
      }
    };
    reader.readAsDataURL(file);
  }, []);

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
                    {/* 用量进度条 */}
                    <div className="px-4 py-3 bg-[#FAF6F0] border-b border-[#E8E0D5]">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold text-[#2D2420]">今日额度</span>
                        {usage ? (
                          <span className="text-xs text-[#6B5E55]">
                            {usage.used} / {usage.limit}
                          </span>
                        ) : (
                          <span className="text-xs text-[#6B5E55]/40">加载中...</span>
                        )}
                      </div>
                      <div className="h-1.5 bg-[#E8E0D5] rounded-full overflow-hidden">
                        {usage && (
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((usage.used / usage.limit) * 100, 100)}%` }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className={`h-full rounded-full ${
                              usage.used >= usage.limit
                                ? "bg-[#C75B3B]"
                                : usage.used >= usage.limit * 0.7
                                ? "bg-[#E8892B]"
                                : "bg-[#4A7C59]"
                            }`}
                          />
                        )}
                      </div>
                      {usage && usage.used >= usage.limit && (
                        <p className="text-xs text-[#C75B3B] mt-1">额度已用完 · 购买解锁无限使用</p>
                      )}
                    </div>

                    {/* 菜单项 */}
                    <div className="py-1">
                      <MenuItem
                        icon={<Share2 className="w-4 h-4" />}
                        label="分享给朋友"
                        onClick={() => { setMenuOpen(false); window.location.href = "/invite"; }}
                        desc="邀请朋友，双方各得额外免费额度"
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
                        label="升级 · 解锁无限次"
                        onClick={() => { setMenuOpen(false); window.open(SHOP_URL, "_blank"); }}
                        desc="¥39 用到 7 月考试结束"
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
            语法查询和错题分析 · 每位用户每个功能免费试用 {FREE_LIMIT} 次
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(["query", "analyze"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(""); }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                tab === t
                  ? "bg-[#C75B3B] text-white shadow-sm"
                  : "bg-white text-[#6B5E55] border border-[#E8E0D5] hover:border-[#C75B3B]/30"
              }`}
            >
              {t === "query" ? <Search className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
              {t === "query" ? "语法查询" : "错题分析"}
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
                    type="text"
                    value={queryInput}
                    onChange={(e) => setQueryInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleQuery()}
                    placeholder="输入语法，按 Enter 查询..."
                    className="flex-1 px-4 py-3 bg-[#FAF6F0] border border-[#E8E0D5] rounded-xl text-sm text-[#2D2420] placeholder:text-[#6B5E55]/50 focus:outline-none focus:ring-2 focus:ring-[#C75B3B]/30"
                  />
                  <button
                    onClick={() => handleQuery()}
                    disabled={queryLoading || !queryInput.trim()}
                    className="px-5 py-3 bg-[#C75B3B] hover:bg-[#A84A2F] disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all flex items-center gap-2"
                  >
                    {queryLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    查询
                  </button>
                </div>

                {error && tab === "query" && <ErrorBanner message={error} />}
                {queryResult && <ResultBox content={queryResult} />}
              </div>
            </motion.div>
          )}

          {tab === "analyze" && (
            <motion.div key="analyze" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
              <div className="bg-white rounded-2xl border border-[#E8E0D5] p-6 shadow-sm">
                <p className="text-sm text-[#6B5E55] mb-4">
                  粘贴或拍照上传做错的题目，AI 帮你找出陷阱，理解考点
                </p>

                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-[#2D2420]">题目内容 *</label>
                      {/* 拍照/上传按钮 */}
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={ocrLoading}
                        className="flex items-center gap-1.5 text-xs text-[#C75B3B] bg-[#C75B3B]/8 hover:bg-[#C75B3B]/15 border border-[#C75B3B]/20 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {ocrLoading ? (
                          <><Loader2 className="w-3 h-3 animate-spin" />识别中...</>
                        ) : (
                          <><Camera className="w-3 h-3" />拍照识别</>
                        )}
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleImageSelect(f);
                          e.target.value = "";
                        }}
                      />
                    </div>

                    {/* 图片预览 */}
                    {imagePreview && (
                      <div className="relative mb-2 inline-block">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imagePreview} alt="题目图片" className="max-h-32 rounded-xl border border-[#E8E0D5] object-contain" />
                        <button
                          onClick={() => setImagePreview(null)}
                          className="absolute -top-2 -right-2 w-5 h-5 bg-[#6B5E55] text-white rounded-full flex items-center justify-center hover:bg-[#2D2420] transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        {ocrLoading && (
                          <div className="absolute inset-0 bg-white/70 rounded-xl flex items-center justify-center">
                            <Loader2 className="w-5 h-5 text-[#C75B3B] animate-spin" />
                          </div>
                        )}
                      </div>
                    )}

                    <div className="relative">
                      <textarea
                        value={questionInput}
                        onChange={(e) => setQuestionInput(e.target.value)}
                        placeholder="粘贴完整题目，包括选项（如果有的话）..."
                        rows={4}
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
                {analyzeResult && <ResultBox content={analyzeResult} />}
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

function ResultBox({ content }: { content: string }) {
  const [expanded, setExpanded] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
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
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-[#6B5E55] hover:text-[#2D2420] transition-colors px-2 py-1 rounded-lg hover:bg-white"
          title="复制全文"
        >
          {copied ? <><Check className="w-3.5 h-3.5 text-[#4A7C59]" /><span className="text-[#4A7C59]">已复制</span></> : <><Copy className="w-3.5 h-3.5" />复制</>}
        </button>
      </div>

      {expanded && (
        <div className="divide-y divide-[#E8E0D5]/60">
          {sections.map((section, idx) => (
            <Section key={idx} section={section} />
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

function Section({ section }: { section: ContentSection }) {
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
              <ExampleLine key={i} line={line} />
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
function ExampleLine({ line }: { line: string }) {
  const trimmed = line.trim();
  if (!trimmed) return null;
  const isJapanese = /[\u3040-\u30FF\u4E00-\u9FFF]/.test(trimmed);
  if (isJapanese && !trimmed.startsWith("（") && !trimmed.startsWith("(")) {
    // 日语句子：加红色左边框
    return (
      <div className="pl-3 border-l-2 border-[#C75B3B]/50">
        <RichLine line={trimmed} className="text-sm text-[#2D2420] font-medium leading-relaxed" />
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
