'use client';

import { useState, useRef, useEffect } from 'react';
import FuriganaText from './FuriganaText';
import { X } from 'lucide-react';

interface SmartTextProps {
  text: string;
  className?: string;
}

interface WordDefinition {
  word: string;
  reading?: string;
  meaning?: string;
  examples?: string[];
  loading: boolean;
}

export default function SmartText({ text, className = '' }: SmartTextProps) {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [definition, setDefinition] = useState<WordDefinition | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  const handleWordClick = async (word: string, event?: React.MouseEvent) => {
    if (event) {
      const rect = (event.target as HTMLElement).getBoundingClientRect();
      setTooltipPosition({
        x: rect.left + rect.width / 2,
        y: rect.bottom + 8
      });
    }

    setSelectedWord(word);
    setDefinition({ word, loading: true });

    try {
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: word })
      });

      if (!response.ok) {
        throw new Error('查询失败');
      }

      const data = await response.json();

      setDefinition({
        word,
        reading: data.reading,
        meaning: data.meaning || data.result?.slice(0, 150),
        examples: data.examples,
        loading: false
      });
    } catch (error) {
      console.error('查询词汇失败:', error);
      setDefinition({
        word,
        meaning: '查询失败，请稍后重试',
        loading: false
      });
    }
  };

  const handleClose = () => {
    setSelectedWord(null);
    setDefinition(null);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        handleClose();
      }
    };

    if (selectedWord) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [selectedWord]);

  return (
    <div className="relative">
      <FuriganaText
        text={text}
        onWordClick={(word) => handleWordClick(word)}
        className={className}
      />

      {selectedWord && definition && (
        <div
          ref={tooltipRef}
          className="fixed z-50 bg-white border-2 border-[#C75B3B] rounded-lg shadow-lg p-4 max-w-sm animate-fade-in"
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            transform: 'translateX(-50%)'
          }}
        >
          <button
            onClick={handleClose}
            className="absolute top-2 right-2 text-gray-400 hover:text-[#C75B3B] transition-colors cursor-pointer"
            aria-label="关闭"
          >
            <X size={16} />
          </button>

          <div className="pr-6">
            <div className="font-bold text-lg text-[#2D2420] mb-2 font-noto-jp">
              {definition.word}
            </div>

            {definition.loading ? (
              <div className="text-sm text-gray-500">加载中...</div>
            ) : (
              <>
                {definition.reading && (
                  <div className="text-sm text-gray-600 mb-2 font-noto-jp">
                    {definition.reading}
                  </div>
                )}

                {definition.meaning && (
                  <div className="text-sm text-[#2D2420] mb-3">
                    {definition.meaning}
                  </div>
                )}

                {definition.examples && definition.examples.length > 0 && (
                  <div className="text-xs text-gray-600 mb-3 space-y-1 font-noto-jp">
                    {definition.examples.slice(0, 2).map((ex, i) => (
                      <div key={i}>• {ex}</div>
                    ))}
                  </div>
                )}

                <a
                  href={`/query?q=${encodeURIComponent(definition.word)}`}
                  className="inline-block text-sm text-[#C75B3B] hover:text-[#A04A2F] font-medium transition-colors cursor-pointer"
                >
                  查看完整解析 →
                </a>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
