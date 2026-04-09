'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SmartText from '@/components/SmartText';
import { BookOpen, TrendingUp, Target, ArrowRight } from 'lucide-react';

interface WeakArea {
  knowledgeType: string;
  specificPoint: string;
  errorCount: number;
  lastError: Date;
}

interface ErrorPatterns {
  concept: number;
  careless: number;
  unfamiliar: number;
  confusion: number;
  complex: number;
}

interface Question {
  id: string;
  question: string;
  userAnswer: string;
  correctAnswer: string;
  analysis: string;
  classification?: any;
}

interface PracticeGroup {
  weakPoint: string;
  questions: Question[];
}

interface PracticeData {
  profile: {
    weakAreas: WeakArea[];
    errorPatterns: ErrorPatterns;
    recommendations: string[];
    totalErrors: number;
  };
  practiceQuestions: PracticeGroup[];
  generatedAt: string;
}

export default function PersonalizedPracticePage() {
  const [data, setData] = useState<PracticeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchPractice() {
      try {
        const response = await fetch('/api/practice/personalized');

        if (!response.ok) {
          if (response.status === 401) {
            router.push('/login');
            return;
          }
          throw new Error('获取练习失败');
        }

        const result = await response.json();
        setData(result);
      } catch (err: any) {
        console.error('获取个性化练习失败:', err);
        setError(err.message || '加载失败');
      } finally {
        setLoading(false);
      }
    }

    fetchPractice();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF6F0] flex items-center justify-center">
        <div className="text-[#2D2420] text-lg">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FAF6F0] flex items-center justify-center">
        <div className="text-red-600 text-lg">{error}</div>
      </div>
    );
  }

  if (!data || data.practiceQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-[#FAF6F0] flex items-center justify-center">
        <div className="text-center">
          <BookOpen size={64} className="mx-auto mb-4 text-[#C75B3B]" />
          <h2 className="text-2xl font-bold text-[#2D2420] mb-2">暂无练习数据</h2>
          <p className="text-gray-600 mb-6">请先完成一些练习，系统会根据你的错题生成个性化练习</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-[#C75B3B] text-white px-6 py-3 rounded-lg hover:bg-[#A04A2F] transition-colors cursor-pointer"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  const { profile, practiceQuestions } = data;

  return (
    <div className="min-h-screen bg-[#FAF6F0] py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* 标题 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#2D2420] mb-2 font-bebas">
            个性化练习
          </h1>
          <p className="text-gray-600">
            基于你的错题画像，为你量身定制的练习题集
          </p>
        </div>

        {/* 学习画像概览 */}
        <div className="bg-white rounded-lg border-2 border-[#E8E0D5] p-6 mb-8 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={24} className="text-[#C75B3B]" />
            <h2 className="text-2xl font-bold text-[#2D2420]">你的学习画像</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* 薄弱知识点 */}
            <div>
              <h3 className="font-semibold text-[#2D2420] mb-3 flex items-center gap-2">
                <Target size={18} className="text-[#C75B3B]" />
                薄弱知识点
              </h3>
              <div className="space-y-2">
                {profile.weakAreas.map((area, i) => (
                  <div key={i} className="flex justify-between items-center text-sm">
                    <span className="text-gray-700 font-noto-jp">{area.specificPoint}</span>
                    <span className="text-[#C75B3B] font-semibold">
                      {area.errorCount} 次
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 学习建议 */}
            <div>
              <h3 className="font-semibold text-[#2D2420] mb-3">学习建议</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                {profile.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <ArrowRight size={16} className="text-[#C75B3B] mt-0.5 flex-shrink-0" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* 练习题集 */}
        <div className="space-y-6">
          {practiceQuestions.map((group, groupIndex) => (
            <div
              key={groupIndex}
              className="bg-white rounded-lg border-2 border-[#E8E0D5] p-6 shadow-sm"
            >
              <h3 className="text-xl font-bold text-[#2D2420] mb-4 flex items-center gap-2">
                <BookOpen size={20} className="text-[#C75B3B]" />
                {group.weakPoint}
                <span className="text-sm font-normal text-gray-500">
                  ({group.questions.length} 题)
                </span>
              </h3>

              <div className="space-y-6">
                {group.questions.map((q, qIndex) => (
                  <div
                    key={q.id}
                    className="border-l-4 border-[#C75B3B] pl-4 py-2"
                  >
                    <div className="text-sm text-gray-500 mb-2">
                      题目 {qIndex + 1}
                    </div>

                    <div className="text-[#2D2420] mb-3 font-noto-jp leading-relaxed">
                      <SmartText text={q.question} />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 text-sm mb-3">
                      <div>
                        <span className="text-gray-600">你的答案：</span>
                        <span className="text-red-600 font-semibold ml-2 font-noto-jp">
                          {q.userAnswer}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">正确答案：</span>
                        <span className="text-green-600 font-semibold ml-2 font-noto-jp">
                          {q.correctAnswer}
                        </span>
                      </div>
                    </div>

                    <details className="text-sm">
                      <summary className="cursor-pointer text-[#C75B3B] hover:text-[#A04A2F] font-medium">
                        查看解析
                      </summary>
                      <div className="mt-3 text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {q.analysis}
                      </div>
                    </details>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 底部操作 */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-[#C75B3B] text-white px-8 py-3 rounded-lg hover:bg-[#A04A2F] transition-colors cursor-pointer font-semibold"
          >
            返回首页
          </button>
        </div>
      </div>
    </div>
  );
}
