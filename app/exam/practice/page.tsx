'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Clock, CheckCircle2, Circle } from 'lucide-react';
import SmartText from '@/components/SmartText';

interface Question {
  _id: string;
  questionNumber: number;
  section: string;
  content: {
    question: string;
    options: string[];
    correctAnswer: string;
  };
  analysis: {
    explanation: string;
    knowledgePoints: string[];
    difficulty: number;
  };
}

interface Answer {
  questionId: string;
  userAnswer: string;
  timeSpent: number;
}

export default function ExamPracticePage({
  searchParams,
}: {
  searchParams: { paperId?: string; examDate?: string };
}) {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, string>>(new Map());
  const [startTime] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const paperId = searchParams.paperId;
  const examDate = searchParams.examDate;

  useEffect(() => {
    if (!paperId) {
      router.push('/exam');
      return;
    }

    fetchQuestions();
  }, [paperId]);

  async function fetchQuestions() {
    try {
      const res = await fetch(`/api/exam/questions?paperId=${paperId}`);
      const json = await res.json();

      if (json.success) {
        setQuestions(json.data);
      } else {
        alert('获取题目失败：' + json.error);
      }
    } catch (error) {
      console.error('获取题目失败：', error);
      alert('获取题目失败');
    } finally {
      setLoading(false);
    }
  }

  function handleAnswer(answer: string) {
    const newAnswers = new Map(answers);
    newAnswers.set(questions[currentIndex]._id, answer);
    setAnswers(newAnswers);
  }

  function goToNext() {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }

  function goToPrevious() {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }

  function goToQuestion(index: number) {
    setCurrentIndex(index);
  }

  async function handleSubmit() {
    if (answers.size === 0) {
      alert('请至少回答一道题目');
      return;
    }

    const confirmed = confirm(
      `你已回答 ${answers.size}/${questions.length} 题，确定提交吗？`
    );
    if (!confirmed) return;

    setSubmitting(true);

    try {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      const answerArray = Array.from(answers.entries()).map(
        ([questionId, userAnswer]) => ({
          questionId,
          userAnswer,
          timeSpent: 0,
        })
      );

      const res = await fetch('/api/exam/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paperId,
          examDate,
          answers: answerArray,
          startedAt: startTime,
          timeSpent,
        }),
      });

      const json = await res.json();

      if (json.success) {
        router.push(`/exam/result?recordId=${json.data.recordId}`);
      } else {
        alert('提交失败：' + json.error);
      }
    } catch (error) {
      console.error('提交失败：', error);
      alert('提交失败');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFEF9] flex items-center justify-center">
        <div className="text-[#2D2D2D]">加载中...</div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-[#FFFEF9] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#2D2D2D] mb-4">暂无题目</p>
          <button
            onClick={() => router.push('/exam')}
            className="text-[#C75B3B] hover:underline"
          >
            返回真题列表
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const currentAnswer = answers.get(currentQuestion._id);

  return (
    <div className="min-h-screen bg-[#FFFEF9]">
      {/* 顶部导航 */}
      <div className="border-b border-[#2D2D2D]/10 bg-white sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push('/exam')}
            className="flex items-center gap-2 text-[#2D2D2D] hover:text-[#C75B3B] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>返回</span>
          </button>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-[#2D2D2D]">
              <Clock className="w-5 h-5" />
              <span>{examDate} N1 真题</span>
            </div>
            <div className="text-[#2D2D2D]">
              已答 {answers.size}/{questions.length}
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-2 bg-[#C75B3B] text-white rounded-lg hover:bg-[#B54A2A] transition-colors disabled:opacity-50"
          >
            {submitting ? '提交中...' : '提交答卷'}
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-[1fr_240px] gap-8">
          {/* 题目区域 */}
          <div className="bg-white rounded-xl border border-[#2D2D2D]/10 p-8">
            {/* 题号和难度 */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-['Bebas_Neue'] text-[#C75B3B]">
                  Q{currentQuestion.questionNumber}
                </span>
                <span className="text-sm text-[#2D2D2D]/60">
                  {currentQuestion.section === 'vocabulary' && '词汇'}
                  {currentQuestion.section === 'grammar' && '语法'}
                  {currentQuestion.section === 'reading' && '阅读'}
                  {currentQuestion.section === 'listening' && '听力'}
                </span>
              </div>
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${
                      i < currentQuestion.analysis.difficulty
                        ? 'bg-[#C75B3B]'
                        : 'bg-[#2D2D2D]/10'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* 题干 */}
            <div className="mb-8">
              <SmartText
                text={currentQuestion.content.question}
                className="text-lg text-[#2D2D2D] leading-relaxed"
              />
            </div>

            {/* 选项 */}
            <div className="space-y-3">
              {currentQuestion.content.options.map((option, index) => {
                const optionLabel = String.fromCharCode(65 + index); // A, B, C, D
                const isSelected = currentAnswer === option;

                return (
                  <button
                    key={index}
                    onClick={() => handleAnswer(option)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-[#C75B3B] bg-[#C75B3B]/5'
                        : 'border-[#2D2D2D]/10 hover:border-[#C75B3B]/30'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                          isSelected
                            ? 'bg-[#C75B3B] text-white'
                            : 'bg-[#2D2D2D]/5 text-[#2D2D2D]'
                        }`}
                      >
                        {optionLabel}
                      </span>
                      <SmartText
                        text={option}
                        className="flex-1 text-[#2D2D2D]"
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* 导航按钮 */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-[#2D2D2D]/10">
              <button
                onClick={goToPrevious}
                disabled={currentIndex === 0}
                className="px-4 py-2 text-[#2D2D2D] hover:text-[#C75B3B] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                上一题
              </button>
              <span className="text-sm text-[#2D2D2D]/60">
                {currentIndex + 1} / {questions.length}
              </span>
              <button
                onClick={goToNext}
                disabled={currentIndex === questions.length - 1}
                className="px-4 py-2 text-[#2D2D2D] hover:text-[#C75B3B] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                下一题
              </button>
            </div>
          </div>

          {/* 题目导航 */}
          <div className="bg-white rounded-xl border border-[#2D2D2D]/10 p-4 h-fit sticky top-24">
            <h3 className="text-sm font-medium text-[#2D2D2D] mb-3">
              题目导航
            </h3>
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, index) => {
                const isAnswered = answers.has(q._id);
                const isCurrent = index === currentIndex;

                return (
                  <button
                    key={q._id}
                    onClick={() => goToQuestion(index)}
                    className={`aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-all ${
                      isCurrent
                        ? 'bg-[#C75B3B] text-white'
                        : isAnswered
                        ? 'bg-[#C75B3B]/10 text-[#C75B3B]'
                        : 'bg-[#2D2D2D]/5 text-[#2D2D2D]/60 hover:bg-[#2D2D2D]/10'
                    }`}
                  >
                    {q.questionNumber}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
