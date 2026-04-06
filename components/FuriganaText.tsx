'use client';

import { useEffect, useState, useRef } from 'react';

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

// 全局缓存 tokenizer 实例
let tokenizerCache: any = null;
let tokenizerPromise: Promise<any> | null = null;

// 初始化 kuromoji tokenizer（从 CDN 加载词典）
async function getTokenizer() {
  if (tokenizerCache) {
    return tokenizerCache;
  }

  if (tokenizerPromise) {
    return tokenizerPromise;
  }

  tokenizerPromise = new Promise((resolve, reject) => {
    // 动态加载 kuromoji 浏览器版本
    if (typeof window === 'undefined') {
      reject(new Error('Kuromoji only works in browser'));
      return;
    }

    // 检查是否已加载
    if ((window as any).kuromoji) {
      const kuromoji = (window as any).kuromoji;
      // 使用 jsDelivr CDN 托管的词典文件
      kuromoji.builder({ dicPath: 'https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/dict/' })
        .build((err: any, tokenizer: any) => {
          if (err) {
            tokenizerPromise = null;
            reject(err);
          } else {
            tokenizerCache = tokenizer;
            resolve(tokenizer);
          }
        });
    } else {
      // 动态加载 kuromoji 脚本
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/build/kuromoji.js';
      script.async = true;
      script.onload = () => {
        const kuromoji = (window as any).kuromoji;
        kuromoji.builder({ dicPath: 'https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/dict/' })
          .build((err: any, tokenizer: any) => {
            if (err) {
              tokenizerPromise = null;
              reject(err);
            } else {
              tokenizerCache = tokenizer;
              resolve(tokenizer);
            }
          });
      };
      script.onerror = () => {
        tokenizerPromise = null;
        reject(new Error('Failed to load kuromoji script'));
      };
      document.head.appendChild(script);
    }
  });

  return tokenizerPromise;
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

        // 获取 tokenizer（首次会从 CDN 加载）
        const tokenizer = await getTokenizer();

        // 分词
        const result = tokenizer.tokenize(text);

        // 格式化结果
        const formattedTokens = result.map((token: any) => ({
          surface_form: token.surface_form,
          reading: token.reading || token.surface_form,
          pos: token.pos,
          basic_form: token.basic_form
        }));

        setTokens(formattedTokens);
      } catch (err: any) {
        console.error('Tokenization error:', err);
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
