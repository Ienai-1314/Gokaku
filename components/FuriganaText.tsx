'use client';

import { useEffect, useState } from 'react';

interface Token {
  surface_form: string;
  reading: string;
  pos: string;
  basic_form: string;
}

interface FuriganaTextProps {
  text: string;
  onWordClick?: (word: string) => void;
  className?: string;
}

export default function FuriganaText({ text, onWordClick, className = '' }: FuriganaTextProps) {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function tokenize() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/furigana', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text })
        });

        if (!response.ok) {
          throw new Error('Failed to tokenize text');
        }

        const data = await response.json();
        setTokens(data.tokens || []);
      } catch (err: any) {
        console.error('Tokenization error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (text && text.trim()) {
      tokenize();
    }
  }, [text]);

  if (loading) {
    return <span className={className}>{text}</span>;
  }

  if (error || tokens.length === 0) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={className}>
      {tokens.map((token, i) => {
        const hasKanji = /[\u4E00-\u9FFF]/.test(token.surface_form);
        const isClickable = onWordClick && token.surface_form.length > 1;

        // 如果有汉字且有读音，显示振假名
        if (hasKanji && token.reading && token.reading !== token.surface_form) {
          return (
            <ruby
              key={i}
              className={isClickable ? 'cursor-pointer hover:text-[#C75B3B] transition-colors' : ''}
              onClick={() => isClickable && onWordClick(token.surface_form)}
            >
              {token.surface_form}
              <rt className="text-[0.5em] text-[#6B5E55]/70">{token.reading}</rt>
            </ruby>
          );
        }

        // 否则只显示原文（可点击）
        return (
          <span
            key={i}
            className={isClickable ? 'cursor-pointer hover:text-[#C75B3B] transition-colors' : ''}
            onClick={() => isClickable && onWordClick(token.surface_form)}
          >
            {token.surface_form}
          </span>
        );
      })}
    </span>
  );
}
