'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookMarked, Trash2, Search, Filter, ArrowLeft, Star, Calendar } from 'lucide-react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { apiFetch } from '@/lib/api-client';

type CollectionType = 'grammar' | 'vocab' | 'error';

interface Collection {
  _id: string;
  type: CollectionType;
  content: any;
  createdAt: string;
}

export default function CollectionPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<CollectionType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadCollections();
  }, []);

  async function loadCollections() {
    try {
      const res = await apiFetch('/api/collection');
      const data = await res.json();
      setCollections(data.collections || []);
    } catch (error) {
      console.error('Load collections error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('确定要删除这条收藏吗？')) return;

    try {
      await apiFetch('/api/collection', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      setCollections(collections.filter(c => c._id !== id));
    } catch (error) {
      alert('删除失败');
    }
  }

  const filteredCollections = collections
    .filter(c => filter === 'all' || c.type === filter)
    .filter(c => {
      if (!searchQuery) return true;
      const content = JSON.stringify(c.content).toLowerCase();
      return content.includes(searchQuery.toLowerCase());
    });

  const typeLabels = {
    grammar: '语法',
    vocab: '词汇',
    error: '错题'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF6F0] to-[#FFF8F0]">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-[#E8E0D5] sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/tool" className="text-[#6B5E54] hover:text-[#2D2420]">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <BookMarked className="w-6 h-6 text-[#D4772C]" />
              <h1 className="text-xl font-bold text-[#2D2420]">我的收藏</h1>
            </div>
            <div className="text-sm text-[#6B5E54]">
              共 {filteredCollections.length} 条
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* 搜索和筛选 */}
        <div className="mb-6 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B5E54]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索收藏内容..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E8E0D5] rounded-xl focus:border-[#D4772C] focus:outline-none text-sm"
            />
          </div>

          <div className="flex gap-2">
            {(['all', 'grammar', 'vocab', 'error'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === type
                    ? 'bg-[#D4772C] text-white'
                    : 'bg-white text-[#6B5E54] border border-[#E8E0D5] hover:border-[#D4772C]'
                }`}
              >
                {type === 'all' ? '全部' : typeLabels[type]}
              </button>
            ))}
          </div>
        </div>

        {/* 收藏列表 */}
        {loading ? (
          <div className="text-center py-12 text-[#6B5E54]">加载中...</div>
        ) : filteredCollections.length === 0 ? (
          <div className="text-center py-12">
            <BookMarked className="w-12 h-12 text-[#E8E0D5] mx-auto mb-3" />
            <p className="text-[#6B5E54]">还没有收藏内容</p>
            <Link href="/tool" className="text-sm text-[#D4772C] hover:underline mt-2 inline-block">
              去查询语法和词汇
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredCollections.map((item) => (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  className="bg-white rounded-xl border border-[#E8E0D5] hover:shadow-md transition-shadow"
                >
                  <div className="p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          item.type === 'grammar' ? 'bg-blue-50 text-blue-700' :
                          item.type === 'vocab' ? 'bg-green-50 text-green-700' :
                          'bg-orange-50 text-orange-700'
                        }`}>
                          {typeLabels[item.type]}
                        </span>
                        <span className="text-xs text-[#6B5E54] flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(item.createdAt).toLocaleDateString('zh-CN')}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(item._id);
                        }}
                        className="text-[#C75B3B] hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <CollectionContent type={item.type} content={item.content} />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}

function CollectionContent({ type, content }: { type: CollectionType; content: any }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (type === 'grammar' || type === 'vocab') {
    // 直接使用用户查询的原词作为标题
    const title = content.query?.trim() || '查询记录';
    const resultText = String(content.result || '');

    return (
      <div
        className="cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* 预览模式 - 只显示查询词，不显示其他内容 */}
        {!isExpanded && (
          <div>
            {/* 只显示查询词 */}
            <h3 className="text-2xl font-bold text-[#2D2420]">
              {title}
            </h3>
          </div>
        )}

        {/* 完整内容（展开时显示） */}
        {isExpanded && (
          <AnimatePresence>
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden space-y-4 pt-3 border-t border-[#E8E0D5] mt-3"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 查询词 */}
              <div className="bg-[#FAF6F0] rounded-lg p-4">
                <h3 className="text-2xl font-bold text-[#2D2420] mb-2">{title}</h3>
                <span className="text-sm text-[#6B5E54]">{type === 'vocab' ? '词汇查询' : '语法查询'}</span>
              </div>

              {/* 词汇考频数据 */}
              {content.matchedVocab && content.matchedVocab.length > 0 && (
                <div className="space-y-2">
                  {content.matchedVocab.map((v: any, idx: number) => (
                    <div key={idx} className="bg-gradient-to-br from-[#FFF8F0] to-[#FFF0E5] border border-[#C75B3B]/20 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <span className="text-lg font-bold text-[#2D2420]">{v.word}</span>
                          {v.reading && <span className="text-sm text-[#6B5E54] ml-2">【{v.reading}】</span>}
                        </div>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 3 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${i < v.star ? 'fill-[#D4772C] text-[#D4772C]' : 'text-[#E8E0D5]'}`}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="text-xs text-[#6B5E54]">
                        真题出现 <span className="font-semibold text-[#C75B3B]">{v.total_hits}</span> 次
                        {v.last_appeared && <span className="ml-2">· 最近: {v.last_appeared}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 完整解析 */}
              <div className="bg-white rounded-lg p-4 border border-[#E8E0D5]">
                <h4 className="text-sm font-semibold text-[#D4772C] mb-3">AI 分析结果</h4>
                <div className="prose prose-sm max-w-none text-[#2D2420]">
                  <ReactMarkdown
                    components={{
                      strong: ({ children }) => <strong className="text-[#D4772C] font-semibold">{children}</strong>,
                      p: ({ children }) => <p className="mb-3 leading-relaxed text-[15px]">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc list-inside space-y-2 ml-2">{children}</ul>,
                      li: ({ children }) => <li className="text-[15px] leading-relaxed">{children}</li>,
                      h3: ({ children }) => <h3 className="text-base font-bold text-[#2D2420] mt-4 mb-2">{children}</h3>,
                      h4: ({ children }) => <h4 className="text-sm font-semibold text-[#6B5E54] mt-3 mb-2">{children}</h4>,
                    }}
                  >
                    {resultText}
                  </ReactMarkdown>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        )}

      </div>
    );
  }

  if (type === 'error') {
    // 错题：直接显示题目
    const question = content.question || '未知题目';

    return (
      <div
        className="cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* 预览模式 - 只显示题目 */}
        {!isExpanded && (
          <div className="space-y-3">
            {/* 题目 */}
            <p className="text-base text-[#2D2420] leading-relaxed line-clamp-2">
              {question}
            </p>

            {/* 展开提示 */}
            <div className="flex items-center justify-center pt-2 border-t border-[#E8E0D5]">
              <div className="text-xs text-[#6B5E54] flex items-center gap-1">
                点击查看详情
                <svg className="w-3 h-3 text-[#D4772C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* 完整内容（展开时显示） */}
        {isExpanded && (
          <AnimatePresence>
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden space-y-3 pt-3 border-t border-[#E8E0D5] mt-3"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-[#FAF6F0] rounded-lg p-3">
                <p className="text-sm text-[#6B5E54] mb-1 font-medium">题目</p>
                <p className="text-[15px] text-[#2D2420] leading-relaxed">{question}</p>
              </div>

              {content.userAnswer && content.correctAnswer && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-2 bg-red-50 px-3 py-2 rounded-lg">
                    <span className="text-[#6B5E54]">你的答案:</span>
                    <span className="font-semibold text-red-600">{content.userAnswer}</span>
                  </div>
                  <span className="text-[#6B5E54]">→</span>
                  <div className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-lg">
                    <span className="text-[#6B5E54]">正确答案:</span>
                    <span className="font-semibold text-green-600">{content.correctAnswer}</span>
                  </div>
                </div>
              )}

              {/* 收起按钮 */}
              <div className="flex items-center justify-center pt-2 border-t border-[#E8E0D5]">
                <div className="text-xs text-[#6B5E54] flex items-center gap-1">
                  收起
                  <motion.svg
                    animate={{ rotate: 180 }}
                    className="w-3 h-3 text-[#D4772C]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </motion.svg>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    );
  }

  return null;
}
