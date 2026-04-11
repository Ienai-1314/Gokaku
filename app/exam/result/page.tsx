'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, XCircle, ArrowLeft, TrendingUp } from 'lucide-react';
import SmartText from '@/components/SmartText';

export const dynamic = 'force-dynamic';

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
  };
}

interface Answer {
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
}

interface Score {
  vocabulary: { correct: number; total: number };
  grammar: { correct: number; total: number };
  reading: { correct: number; total: number };
  listening: { correct: number; total: number };
  overall: { correct: number; total: number; percentage: number };
}

interface Record {
  _id: string;
  examDate: string;
  answers: Answer[];
  score: Score;
}

function ExamResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const recordId = searchParams.get('recordId');

  const [record, setRecord] = useState<Record | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!recordId) {
      router.push('/exam');
      return;
    }

    fetchResult();
  }, [recordId]);

  async function fetchResult() {
    try {
      const res = await fetch(`/api/exam/result?recordId=${recordId}`);
      const json = await res.json();

      if (json.success) {
        setRecord(json.data.record);
        setQuestions(json.data.questions);
      } else {
        alert('获取成绩失败：' + json.error);
      }
    } catch (error) {
      console.error('获取成绩失败：', error);
      alert('获取成绩失败');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFEF9] flex items-center justify-center">
        <div className="text-[#2D2D2D]">加载中...</div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="min-h-screen bg-[#FFFEF9] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#2D2D2D] mb-4">未找到成绩记录</p>
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

  const wrongAnswers = record.answers.filter((a) => !a.isCorrect);

  return (
    <div className="min-h-screen bg-[#FFFEF9]">
      {/* 顶部导航 */}
      <div className="border-b border-[#2D2D2D]/10 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push('/exam')}
            className="flex items-center gap-2 text-[#2D2D2D] hover:text-[#C75B3B] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>返回真题列表</span>
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* 成绩概览 */}
        <div className="bg-white rounded-xl border border-[#2D2D2D]/10 p-8 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-6 h-6 text-[#C75B3B]" />
            <h2 className="text-2xl font-['Bebas_Neue'] text-[#2D2D2D]">
              成绩报告
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="text-center p-4 bg-[#C75B3B]/5 rounded-lg">
              <div className="text-3xl font-['Bebas_Neue'] text-[#C75B3B] mb-1">
                {record.score.overall.percentage}%
              </div>
              <div className="text-sm text-[#2D2D2D]/60">总分</div>
            </div>

            {record.score.vocabulary.total > 0 && (
              <div className="text-center p-4 bg-[#2D2D2D]/5 rounded-lg">
                <div className="text-2xl font-['Bebas_Neue'] text-[#2D2D2D] mb-1">
                  {record.score.vocabulary.correct}/
                  {record.score.vocabulary.total}
                </div>
                <div className="text-sm text-[#2D2D2D]/60">词汇</div>
              </div>
            )}

            {record.score.grammar.total > 0 && (
              <div className="text-center p-4 bg-[#2D2D2D]/5 rounded-lg">
                <div className="text-2xl font-['Bebas_Neue'] text-[#2D2D2D] mb-1">
                  {record.score.grammar.correct}/{record.score.grammar.total}
                </div>
                <div className="text-sm text-[#2D2D2D]/60">语法</div>
              </div>
            )}

            {record.score.reading.total > 0 && (
              <div className="text-center p-4 bg-[#2D2D2D]/5 rounded-lg">
                <div className="text-2xl font-['Bebas_Neue'] text-[#2D2D2D] mb-1">
                  {record.score.reading.correct}/{record.score.reading.total}
                </div>
                <div className="text-sm text-[#2D2D2D]/60">阅读</div>
              </div>
            )}

            {record.score.listening.total > 0 && (
              <div className="text-center p-4 bg-[#2D2D2D]/5 rounded-lg">
                <div className="text-2xl font-['Bebas_Neue'] text-[#2D2D2D] mb-1">
                  {record.score.listening.correct}/
                  {record.score.listening.total}
                </div>
                <div className="text-sm text-[#2D2D2D]/60">听力</div>
              </div>
            )}
          </div>
        </div>

        {/* 错题解析 */}
        {wrongAnswers.length > 0 && (
          <div className="bg-white rounded-xl border border-[#2D2D2D]/10 p-8">
            <h3 className="text-xl font-['Bebas_Neue'] text-[#2D2D2D] mb-6">
              错题解析 ({wrongAnswers.length} 题)
            </h3>

            <div className="space-y-6">
              {wrongAnswers.map((answer) => {
                const question = questions.find(
                  (q) => q._id === answer.questionId
                );
                if (!question) return null;

                return (
                  <div
                    key={answer.questionId}
                    className="border border-[#2D2D2D]/10 rounded-lg p-6"
                  >
                    {/* 题号 */}
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-lg font-['Bebas_Neue'] text-[#C75B3B]">
                        Q{question.questionNumber}
                      </span>
                      <XCircle className="w-5 h-5 text-red-500" />
                    </div>

                    {/* 题干 */}
                    <div className="mb-4">
                      <SmartText
                        text={question.content.question}
                        className="text-[#2D2D2D]"
                      />
                    </div>

                    {/* 答案对比 */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="text-sm text-red-600 mb-1">
                          你的答案
                        </div>
                        <SmartText
                          text={answer.userAnswer}
                          className="text-[#2D2D2D]"
                        />
                      </div>
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="text-sm text-green-600 mb-1">
                          正确答案
                        </div>
                        <SmartText
                          text={question.content.correctAnswer}
                          className="text-[#2D2D2D]"
                        />
                      </div>
                    </div>

                    {/* 解析 */}
                    <div className="p-4 bg-[#FFFEF9] rounded-lg">
                      <div className="text-sm font-medium text-[#2D2D2D] mb-2">
                        解析
                      </div>
                      <SmartText
                        text={question.analysis.explanation}
                        className="text-sm text-[#2D2D2D]/80 whitespace-pre-wrap"
                      />
                    </div>

                    {/* 知识点 */}
                    {question.analysis.knowledgePoints.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {question.analysis.knowledgePoints.map((point, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-[#C75B3B]/10 text-[#C75B3B] text-xs rounded"
                          >
                            {point}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {wrongAnswers.length === 0 && (
          <div className="bg-white rounded-xl border border-[#2D2D2D]/10 p-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-['Bebas_Neue'] text-[#2D2D2D] mb-2">
              全部正确！
            </h3>
            <p className="text-[#2D2D2D]/60">恭喜你，本次练习全部答对！</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ExamResultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FFFEF9] flex items-center justify-center">
          <div className="text-[#2D2D2D]">加载中...</div>
        </div>
      }
    >
      <ExamResultContent />
    </Suspense>
  );
}
