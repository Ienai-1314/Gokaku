'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookMarked, Trash2, Search, Filter, ArrowLeft, Star, Calendar } from 'lucide-react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';

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
      const res = await fetch('/api/collection');
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
      await fetch('/api/collection', {
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
                  className="bg-white rounded-xl border border-[#E8E0D5] p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
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
                      onClick={() => handleDelete(item._id)}
                      className="text-[#C75B3B] hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <CollectionContent type={item.type} content={item.content} />
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
  if (type === 'grammar' || type === 'vocab') {
    return (
      <div>
        {content.pattern && (
          <h3 className="text-lg font-bold text-[#2D2420] mb-2">{content.pattern}</h3>
        )}
        {content.word && (
          <h3 className="text-lg font-bold text-[#2D2420] mb-2">{content.word}</h3>
        )}
        {content.star && (
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-[#6B5E54]">考频:</span>
            <div className="flex">
              {Array.from({ length: 3 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${i < content.star ? 'fill-[#D4772C] text-[#D4772C]' : 'text-[#E8E0D5]'}`}
                />
              ))}
            </div>
          </div>
        )}
        {content.result && (
          <div className="prose prose-sm max-w-none text-[#2D2420]">
            <ReactMarkdown
              components={{
                strong: ({ children }) => <strong className="text-[#D4772C] font-semibold">{children}</strong>,
                p: ({ children }) => <p className="mb-2 leading-relaxed">{children}</p>,
                ul: ({ children }) => <ul className="list-disc list-inside space-y-1">{children}</ul>,
                li: ({ children }) => <li className="text-sm">{children}</li>
              }}
            >
              {String(content.result).slice(0, 200) + '...'}
            </ReactMarkdown>
          </div>
        )}
      </div>
    );
  }

  if (type === 'error') {
    return (
      <div>
        <p className="text-sm text-[#6B5E54] mb-2">题目: {content.question?.slice(0, 100)}...</p>
        <p className="text-sm">
          <span className="text-red-600">你的答案: {content.userAnswer}</span>
          {' → '}
          <span className="text-green-600">正确答案: {content.correctAnswer}</span>
        </p>
      </div>
    );
  }

  return null;
}
