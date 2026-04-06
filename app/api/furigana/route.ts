import { NextRequest, NextResponse } from 'next/server';
import kuromoji from 'kuromoji';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 缓存tokenizer实例
let tokenizerInstance: any = null;
let tokenizerPromise: Promise<any> | null = null;

// 初始化tokenizer（单例模式，避免重复初始化）
async function getTokenizer() {
  if (tokenizerInstance) {
    return tokenizerInstance;
  }

  // 如果正在初始化，等待初始化完成
  if (tokenizerPromise) {
    return tokenizerPromise;
  }

  tokenizerPromise = new Promise((resolve, reject) => {
    // kuromoji字典路径（使用node_modules中的字典）
    const dicPath = path.join(process.cwd(), 'node_modules', 'kuromoji', 'dict');

    console.log('[Furigana] Initializing tokenizer with dicPath:', dicPath);

    kuromoji.builder({ dicPath }).build((err: any, tokenizer: any) => {
      if (err) {
        console.error('[Furigana] Tokenizer initialization failed:', err);
        tokenizerPromise = null; // 重置以便重试
        reject(err);
      } else {
        console.log('[Furigana] Tokenizer initialized successfully');
        tokenizerInstance = tokenizer;
        resolve(tokenizer);
      }
    });
  });

  return tokenizerPromise;
}

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Invalid text parameter' },
        { status: 400 }
      );
    }

    // 文本长度限制（避免处理过长文本）
    if (text.length > 1000) {
      return NextResponse.json(
        { error: 'Text too long (max 1000 characters)' },
        { status: 400 }
      );
    }

    // 获取tokenizer（首次调用会初始化，后续使用缓存）
    const tokenizer = await getTokenizer();

    // 分词
    const tokens = tokenizer.tokenize(text);

    // 格式化结果
    const formattedTokens = tokens.map((token: any) => ({
      surface_form: token.surface_form,  // 原文
      reading: token.reading || token.surface_form, // 读音（片假名），如果没有则使用原文
      pos: token.pos,                     // 词性
      basic_form: token.basic_form        // 基本形
    }));

    return NextResponse.json({
      tokens: formattedTokens,
      count: formattedTokens.length
    });

  } catch (error: any) {
    console.error('[Furigana] API error:', error);
    return NextResponse.json(
      { error: 'Failed to tokenize text', details: error.message },
      { status: 500 }
    );
  }
}
