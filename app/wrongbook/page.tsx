"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, BookOpen, Trash2, Filter, Download, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

interface WrongQuestion {
  _id: string;
  question: string;
  userAnswer?: string;
  correctAnswer?: string;
  analysis: string;
  errorPatterns: string[];
  createdAt: string;
}

export default function WrongBookPage() {
  const [questions, setQuestions] = useState<WrongQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadWrongQuestions();
  }, []);

  async function loadWrongQuestions() {
    try {
      const res = await fetch("/api/collection?type=wrong_question");
      const data = await res.json();
      if (data.items) {
        setQuestions(data.items);
      }
    } catch (error) {
      console.error("加载错题失败:", error);
    } finally {
      setLoading(false);
    }
  }

  async function deleteQuestion(id: string) {
    if (!confirm("确定要删除这道错题吗？")) return;

    try {
      const res = await fetch("/api/collection", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, type: "wrong_question" }),
      });

      if (res.ok) {
        setQuestions(questions.filter((q) => q._id !== id));
      }
    } catch (error) {
      console.error("删除失败:", error);
    }
  }

  function exportToText() {
    const text = questions
      .map((q, i) => {
        return `
========== 错题 ${i + 1} ==========
题目：${q.question}
${q.userAnswer ? `我的答案：${q.userAnswer}` : ""}
${q.correctAnswer ? `正确答案：${q.correctAnswer}` : ""}
错误类型：${q.errorPatterns.join(", ")}
分析：
${q.analysis}
记录时间：${new Date(q.createdAt).toLocaleString("zh-CN")}
`;
      })
      .join("\n\n");

    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `错题本_${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const filteredQuestions = filter === "all"
    ? questions
    : questions.filter((q) => q.errorPatterns.includes(filter));

  const errorTypes = Array.from(
    new Set(questions.flatMap((q) => q.errorPatterns))
  );

  return (
    <div className="min-h-screen bg-[#FAF6F0]">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-[#E8E0D5]/60 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/tool" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#C75B3B] rounded-xl flex items-center justify-center shadow-[0_2px_10px_rgba(199,91,59,0.25)]">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-noto-jp text-[#2D2420] font-bold text-lg">合格道</span>
              <span className="font-bebas text-[#C75B3B] text-base tracking-widest">GOKAKU</span>
            </div>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* 标题和操作栏 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-bebas text-4xl text-[#2D2420] flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-[#C75B3B]" />
              我的错题本
            </h1>
            <p className="text-sm text-[#6B5E55] mt-1">
              共 {questions.length} 道错题
            </p>
          </div>

          {questions.length > 0 && (
            <button
              onClick={exportToText}
              className="flex items-center gap-2 px-4 py-2 bg-[#C75B3B] text-white rounded-xl text-sm font-semibold hover:bg-[#A84A2F] transition-colors"
            >
              <Download className="w-4 h-4" />
              导出
            </button>
          )}
        </div>

        {/* 筛选器 */}
        {errorTypes.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filter === "all"
                  ? "bg-[#C75B3B] text-white"
                  : "bg-white border border-[#E8E0D5] text-[#6B5E55] hover:border-[#C75B3B]/30"
              }`}
            >
              全部 ({questions.length})
            </button>
            {errorTypes.map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  filter === type
                    ? "bg-[#C75B3B] text-white"
                    : "bg-white border border-[#E8E0D5] text-[#6B5E55] hover:border-[#C75B3B]/30"
                }`}
              >
                {type} ({questions.filter((q) => q.errorPatterns.includes(type)).length})
              </button>
            ))}
          </div>
        )}

        {/* 错题列表 */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#C75B3B] animate-spin" />
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E8E0D5] p-12 text-center">
            <AlertCircle className="w-12 h-12 text-[#6B5E55]/30 mx-auto mb-4" />
            <p className="text-[#6B5E55] mb-2">
              {filter === "all" ? "还没有错题记录" : "该类型暂无错题"}
            </p>
            <Link
              href="/tool?tab=analyze"
              className="inline-block mt-4 px-6 py-2 bg-[#C75B3B] text-white rounded-xl text-sm font-semibold hover:bg-[#A84A2F] transition-colors"
            >
              去分析错题
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredQuestions.map((q) => (
              <motion.div
                key={q._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-[#E8E0D5] overflow-hidden"
              >
                {/* 题目卡片头部 */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <p className="text-sm text-[#2D2420] font-medium line-clamp-2">
                        {q.question}
                      </p>
                      <p className="text-xs text-[#6B5E55] mt-1">
                        {new Date(q.createdAt).toLocaleDateString("zh-CN")}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteQuestion(q._id)}
                      className="p-2 text-[#6B5E55] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* 错误类型标签 */}
                  {q.errorPatterns.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {q.errorPatterns.map((pattern, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-red-50 text-red-600 text-xs rounded-full border border-red-200"
                        >
                          {pattern}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* 答案对比 */}
                  {(q.userAnswer || q.correctAnswer) && (
                    <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
                      {q.userAnswer && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-2">
                          <p className="text-red-600 font-semibold mb-1">我的答案</p>
                          <p className="text-[#2D2420]">{q.userAnswer}</p>
                        </div>
                      )}
                      {q.correctAnswer && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                          <p className="text-green-600 font-semibold mb-1">正确答案</p>
                          <p className="text-[#2D2420]">{q.correctAnswer}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 展开/收起按钮 */}
                  <button
                    onClick={() => setExpandedId(expandedId === q._id ? null : q._id)}
                    className="w-full text-sm text-[#C75B3B] font-medium hover:text-[#A84A2F] transition-colors"
                  >
                    {expandedId === q._id ? "收起分析 ▲" : "查看分析 ▼"}
                  </button>
                </div>

                {/* 分析内容（可展开） */}
                <AnimatePresence>
                  {expandedId === q._id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-[#E8E0D5]"
                    >
                      <div className="p-4 bg-[#FAF6F0]">
                        <div className="prose prose-sm max-w-none">
                          <ReactMarkdown
                            components={{
                              h3: ({ children }) => (
                                <h3 className="text-base font-bold text-[#2D2420] mt-3 mb-2 first:mt-0">
                                  {children}
                                </h3>
                              ),
                              strong: ({ children }) => (
                                <strong className="text-[#C75B3B] font-bold">{children}</strong>
                              ),
                              p: ({ children }) => (
                                <p className="text-sm text-[#2D2420] leading-relaxed mb-2">
                                  {children}
                                </p>
                              ),
                              ul: ({ children }) => (
                                <ul className="space-y-1 mb-2">{children}</ul>
                              ),
                              li: ({ children }) => (
                                <li className="text-sm text-[#2D2420] leading-relaxed ml-4">
                                  {children}
                                </li>
                              ),
                            }}
                          >
                            {q.analysis}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
