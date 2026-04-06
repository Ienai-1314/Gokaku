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

// 全局缓存：文本 -> tokens
const tokenCache = new Map<string, Token[]>();

// 调用后端 API 获取振假名
async function fetchFurigana(text: string): Promise<Token[]> {
  // 检查缓存
  if (tokenCache.has(text)) {
    return tokenCache.get(text)!;
  }

  const response = await fetch('/api/furigana', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  const tokens = data.tokens || [];

  // 缓存结果
  tokenCache.set(text, tokens);

  return tokens;
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

        // 调用后端 API
        const result = await fetchFurigana(text);
        setTokens(result);
      } catch (err: any) {
        console.error('Furigana error:', err);
        setError(err.message);
        // 失败时显示原文
        setTokens([]);
      } finally {
        setLoading(false);
      }
    }

    if (text && text.trim()) {
      tokenize();
    } else {
      setLoading(false);
      setTokens([]);
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
              <rt className="text-[0.45em] leading-none">{token.reading}</rt>
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
