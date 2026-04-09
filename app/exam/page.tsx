'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Calendar, FileText, ArrowRight } from 'lucide-react';

interface ExamPaper {
  _id: string;
  examDate: string;
  examType: string;
  sections: {
    vocabulary: { questionCount: number };
    grammar: { questionCount: number };
    reading: { questionCount: number };
    listening: { questionCount: number };
  };
}

export default function ExamListPage() {
  const router = useRouter();
  const [papers, setPapers] = useState<ExamPaper[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPapers();
  }, []);

  async function fetchPapers() {
    try {
      const res = await fetch('/api/exam/papers');
      const json = await res.json();

      if (json.success) {
        setPapers(json.data);
      } else {
        alert('获取试卷列表失败：' + json.error);
      }
    } catch (error) {
      console.error('获取试卷列表失败：', error);
      alert('获取试卷列表失败');
    } finally {
      setLoading(false);
    }
  }

  function startPractice(paper: ExamPaper) {
    router.push(
      `/exam/practice?paperId=${paper._id}&examDate=${paper.examDate}`
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFEF9] flex items-center justify-center">
        <div className="text-[#2D2D2D]">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFEF9]">
      {/* 页头 */}
      <div className="border-b border-[#2D2D2D]/10 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-8 h-8 text-[#C75B3B]" />
            <h1 className="text-3xl font-['Bebas_Neue'] text-[#2D2D2D]">
              JLPT N1 真题
            </h1>
          </div>
          <p className="text-[#2D2D2D]/60">
            历年真题练习，检验学习成果
          </p>
        </div>
      </div>

      {/* 试卷列表 */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {papers.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-[#2D2D2D]/20 mx-auto mb-4" />
            <p className="text-[#2D2D2D]/60">暂无真题数据</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {papers.map((paper) => {
              const totalQuestions =
                paper.sections.vocabulary.questionCount +
                paper.sections.grammar.questionCount +
                paper.sections.reading.questionCount +
                paper.sections.listening.questionCount;

              return (
                <div
                  key={paper._id}
                  className="bg-white rounded-xl border border-[#2D2D2D]/10 p-6 hover:border-[#C75B3B]/30 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Calendar className="w-5 h-5 text-[#C75B3B]" />
                        <h2 className="text-xl font-['Bebas_Neue'] text-[#2D2D2D]">
                          {paper.examDate} {paper.examType}
                        </h2>
                      </div>

                      <div className="flex items-center gap-6 text-sm text-[#2D2D2D]/60 mb-4">
                        <span>共 {totalQuestions} 题</span>
                        {paper.sections.vocabulary.questionCount > 0 && (
                          <span>
                            词汇 {paper.sections.vocabulary.questionCount}
                          </span>
                        )}
                        {paper.sections.grammar.questionCount > 0 && (
                          <span>
                            语法 {paper.sections.grammar.questionCount}
                          </span>
                        )}
                        {paper.sections.reading.questionCount > 0 && (
                          <span>
                            阅读 {paper.sections.reading.questionCount}
                          </span>
                        )}
                        {paper.sections.listening.questionCount > 0 && (
                          <span>
                            听力 {paper.sections.listening.questionCount}
                          </span>
                        )}
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => startPractice(paper)}
                          className="flex items-center gap-2 px-4 py-2 bg-[#C75B3B] text-white rounded-lg hover:bg-[#B54A2A] transition-colors"
                        >
                          <span>开始练习</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
