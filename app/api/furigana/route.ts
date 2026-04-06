import { NextRequest, NextResponse } from 'next/server';
import kuromoji from 'kuromoji';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 缓存tokenizer实例
let tokenizerInstance: any = null;

// 初始化tokenizer
async function getTokenizer() {
  if (tokenizerInstance) {
    return tokenizerInstance;
  }

  return new Promise((resolve, reject) => {
    // kuromoji字典路径（使用node_modules中的字典）
    const dicPath = path.join(process.cwd(), 'node_modules', 'kuromoji', 'dict');

    kuromoji.builder({ dicPath }).build((err: any, tokenizer: any) => {
      if (err) {
        reject(err);
      } else {
        tokenizerInstance = tokenizer;
        resolve(tokenizer);
      }
    });
  });
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

    // 获取tokenizer
    const tokenizer = await getTokenizer();

    // 分词
    const tokens = tokenizer.tokenize(text);

    // 格式化结果
    const formattedTokens = tokens.map((token: any) => ({
      surface_form: token.surface_form,  // 原文
      reading: token.reading,             // 读音（片假名）
      pos: token.pos,                     // 词性
      basic_form: token.basic_form        // 基本形
    }));

    return NextResponse.json({
      tokens: formattedTokens,
      count: formattedTokens.length
    });

  } catch (error: any) {
    console.error('Furigana API error:', error);
    return NextResponse.json(
      { error: 'Failed to tokenize text', details: error.message },
      { status: 500 }
    );
  }
}
