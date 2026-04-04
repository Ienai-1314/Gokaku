"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, RefreshCw, CheckCircle, XCircle, Loader2, BookOpen, TrendingUp } from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

interface DailyQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  grammarPoint: string;
  difficulty: "N1" | "N2";
}

export default function PracticePage() {
  const [question, setQuestion] = useState<DailyQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [streak, setStreak] = useState(0);
  const [todayCompleted, setTodayCompleted] = useState(false);

  useEffect(() => {
    loadDailyQuestion();
    loadStreak();
  }, []);

  async function loadDailyQuestion() {
    try {
      const res = await fetch("/api/practice/daily");
      const data = await res.json();

      if (data.question) {
        setQuestion(data.question);
        setTodayCompleted(data.completed || false);
      }
    } catch (error) {
      console.error("加载每日一练失败:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadStreak() {
    try {
      const res = await fetch("/api/practice/streak");
      const data = await res.json();
      if (data.streak !== undefined) {
        setStreak(data.streak);
      }
    } catch (error) {
      console.error("加载连续天数失败:", error);
    }
  }

  async function submitAnswer() {
    if (!selectedAnswer || !question) return;

    setShowResult(true);

    // 提交答案并更新连续天数
    try {
      await fetch("/api/practice/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: question.id,
          answer: selectedAnswer,
          correct: selectedAnswer === question.correctAnswer,
        }),
      });

      if (selectedAnswer === question.correctAnswer) {
        setStreak((prev) => prev + 1);
        setTodayCompleted(true);
      }
    } catch (error) {
      console.error("提交答案失败:", error);
    }
  }

  function resetQuestion() {
    setSelectedAnswer(null);
    setShowResult(false);
  }

  async function getNewQuestion() {
    setLoading(true);
    resetQuestion();
    await loadDailyQuestion();
  }

  const isCorrect = selectedAnswer === question?.correctAnswer;

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

          {/* 连续天数 */}
          <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl">
            <TrendingUp className="w-4 h-4 text-orange-600" />
            <span className="text-sm font-semibold text-orange-600">
              连续 {streak} 天
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* 标题 */}
        <div className="text-center mb-8">
          <h1 className="font-bebas text-5xl text-[#2D2420] mb-2">每日一练</h1>
          <p className="text-sm text-[#6B5E55]">
            每天一道精选真题，保持学习节奏
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#C75B3B] animate-spin" />
          </div>
        ) : !question ? (
          <div className="bg-white rounded-2xl border border-[#E8E0D5] p-12 text-center">
            <p className="text-[#6B5E55] mb-4">暂无题目</p>
            <button
              onClick={getNewQuestion}
              className="px-6 py-2 bg-[#C75B3B] text-white rounded-xl text-sm font-semibold hover:bg-[#A84A2F] transition-colors"
            >
              刷新
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 题目卡片 */}
            <div className="bg-white rounded-2xl border border-[#E8E0D5] p-6 shadow-sm">
              {/* 难度标签 */}
              <div className="flex items-center justify-between mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  question.difficulty === "N1"
                    ? "bg-red-100 text-red-600"
                    : "bg-orange-100 text-orange-600"
                }`}>
                  {question.difficulty}
                </span>
                {todayCompleted && (
                  <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-xs font-semibold">
                    ✓ 今日已完成
                  </span>
                )}
              </div>

              {/* 题目内容 */}
              <div className="mb-6">
                <p className="text-base text-[#2D2420] leading-relaxed whitespace-pre-wrap">
                  {question.question}
                </p>
              </div>

              {/* 选项 */}
              <div className="space-y-3">
                {question.options.map((option, index) => {
                  const optionLabel = String.fromCharCode(65 + index); // A, B, C, D
                  const isSelected = selectedAnswer === option;
                  const isCorrectOption = option === question.correctAnswer;

                  let buttonClass = "w-full text-left p-4 rounded-xl border-2 transition-all ";

                  if (showResult) {
                    if (isCorrectOption) {
                      buttonClass += "bg-green-50 border-green-500 text-green-900";
                    } else if (isSelected && !isCorrect) {
                      buttonClass += "bg-red-50 border-red-500 text-red-900";
                    } else {
                      buttonClass += "bg-gray-50 border-gray-200 text-gray-500";
                    }
                  } else {
                    if (isSelected) {
                      buttonClass += "bg-[#C75B3B]/10 border-[#C75B3B] text-[#2D2420]";
                    } else {
                      buttonClass += "bg-white border-[#E8E0D5] text-[#2D2420] hover:border-[#C75B3B]/40";
                    }
                  }

                  return (
                    <button
                      key={index}
                      onClick={() => !showResult && setSelectedAnswer(option)}
                      disabled={showResult}
                      className={buttonClass}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-sm">{optionLabel}.</span>
                        <span className="text-sm">{option}</span>
                        {showResult && isCorrectOption && (
                          <CheckCircle className="w-5 h-5 text-green-600 ml-auto" />
                        )}
                        {showResult && isSelected && !isCorrect && (
                          <XCircle className="w-5 h-5 text-red-600 ml-auto" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* 提交按钮 */}
              {!showResult && (
                <button
                  onClick={submitAnswer}
                  disabled={!selectedAnswer}
                  className="w-full mt-6 px-6 py-3 bg-[#C75B3B] text-white rounded-xl font-semibold hover:bg-[#A84A2F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  提交答案
                </button>
              )}
            </div>

            {/* 结果和解析 */}
            <AnimatePresence>
              {showResult && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`rounded-2xl border-2 p-6 ${
                    isCorrect
                      ? "bg-green-50 border-green-500"
                      : "bg-red-50 border-red-500"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    {isCorrect ? (
                      <>
                        <CheckCircle className="w-6 h-6 text-green-600" />
                        <h3 className="text-lg font-bold text-green-900">回答正确！</h3>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-6 h-6 text-red-600" />
                        <h3 className="text-lg font-bold text-red-900">回答错误</h3>
                      </>
                    )}
                  </div>

                  {/* 语法点 */}
                  <div className="mb-4 p-3 bg-white/60 rounded-lg">
                    <p className="text-xs text-[#6B5E55] mb-1">考查语法点</p>
                    <p className="text-sm font-semibold text-[#2D2420]">{question.grammarPoint}</p>
                  </div>

                  {/* 解析 */}
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => (
                          <p className="text-sm text-[#2D2420] leading-relaxed mb-2">{children}</p>
                        ),
                        strong: ({ children }) => (
                          <strong className="text-[#C75B3B] font-bold">{children}</strong>
                        ),
                      }}
                    >
                      {question.explanation}
                    </ReactMarkdown>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={getNewQuestion}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#C75B3B] text-white rounded-xl font-semibold hover:bg-[#A84A2F] transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                      下一题
                    </button>
                    <Link
                      href="/tool?tab=query"
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-[#C75B3B] text-[#C75B3B] rounded-xl font-semibold hover:bg-[#C75B3B]/5 transition-colors"
                    >
                      <BookOpen className="w-4 h-4" />
                      查语法
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}
