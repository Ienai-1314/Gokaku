/**
 * 数据库持久化缓存模块
 * 用于缓存 AI 查询结果到 CloudBase，实现跨会话持久化
 */

import cloudbase from "@cloudbase/node-sdk";

interface CacheEntry {
  result: string;
  matchedGrammar?: any[];
  matchedVocab?: any[];
  hitCount: number;
  createdAt: string;
  updatedAt: string;
}

class DatabaseCache {
  private app: any;
  private db: any;
  private memoryCache: Map<string, CacheEntry>; // 内存缓存加速

  constructor() {
    // 延迟初始化，避免在构建时连接数据库
    this.memoryCache = new Map();
  }

  /**
   * 初始化数据库连接
   */
  private initDB() {
    if (this.db) return;

    const envId = process.env.NEXT_PUBLIC_ENV_ID || process.env.TCB_ENV_ID;
    const secretId = process.env.CLOUDBASE_SECRET_ID || process.env.TCB_SECRET_ID;
    const secretKey = process.env.CLOUDBASE_SECRET_KEY || process.env.TCB_SECRET_KEY;

    if (!envId || !secretId || !secretKey) {
      console.warn("[DatabaseCache] CloudBase 环境变量未配置，缓存功能将降级为内存缓存");
      return;
    }

    try {
      this.app = cloudbase.init({
        env: envId,
        secretId,
        secretKey,
      });
      this.db = this.app.database();
    } catch (error) {
      console.error("[DatabaseCache] 初始化失败:", error);
    }
  }

  /**
   * 生成缓存键
   */
  private generateKey(query: string, type: 'grammar' | 'vocab'): string {
    return query.toLowerCase().trim();
  }

  /**
   * 获取缓存（先查内存，再查数据库）
   */
  async get(query: string, type: 'grammar' | 'vocab'): Promise<CacheEntry | null> {
    const key = this.generateKey(query, type);

    // 1. 先查内存缓存
    const memCached = this.memoryCache.get(`${type}:${key}`);
    if (memCached) {
      return memCached;
    }

    // 2. 查数据库
    this.initDB();
    if (!this.db) return null;

    try {
      const collection = this.db.collection(type === 'grammar' ? 'n1_grammar_cache' : 'vocab_cache');
      const res = await collection.where({ query: key }).limit(1).get();

      if (res.data && res.data.length > 0) {
        const entry = res.data[0];

        // 更新命中次数（异步，不阻塞返回）
        collection.doc(entry._id).update({
          hitCount: this.db.command.inc(1),
          updatedAt: new Date().toISOString(),
        }).catch((err: any) => console.error("[DatabaseCache] 更新 hitCount 失败:", err));

        // 存入内存缓存
        const cacheEntry: CacheEntry = {
          result: entry.result,
          matchedGrammar: entry.matchedGrammar,
          matchedVocab: entry.matchedVocab,
          hitCount: entry.hitCount || 0,
          createdAt: entry.createdAt,
          updatedAt: entry.updatedAt,
        };
        this.memoryCache.set(`${type}:${key}`, cacheEntry);

        return cacheEntry;
      }

      return null;
    } catch (error) {
      console.error("[DatabaseCache] 查询失败:", error);
      return null;
    }
  }

  /**
   * 设置缓存（同时写入内存和数据库）
   */
  async set(
    query: string,
    type: 'grammar' | 'vocab',
    result: string,
    matchedData?: any[]
  ): Promise<void> {
    const key = this.generateKey(query, type);
    const now = new Date().toISOString();

    const entry: CacheEntry = {
      result,
      matchedGrammar: type === 'grammar' ? matchedData : undefined,
      matchedVocab: type === 'vocab' ? matchedData : undefined,
      hitCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    // 1. 写入内存缓存
    this.memoryCache.set(`${type}:${key}`, entry);

    // 2. 写入数据库（异步，不阻塞）
    this.initDB();
    if (!this.db) return;

    try {
      const collectionName = type === 'grammar' ? 'grammar_cache' : 'vocab_cache';
      const collection = this.db.collection(collectionName);

      // 直接尝试插入（如果集合不存在，CloudBase 会自动创建）
      try {
        await collection.add({
          query: key,
          result,
          ...(type === 'grammar' ? { matchedGrammar: matchedData } : { matchedVocab: matchedData }),
          hitCount: 0,
          createdAt: now,
          updatedAt: now,
        });
      } catch (addError: any) {
        // 如果是重复键错误，尝试更新
        if (addError.code === "DATABASE_DUPLICATE_KEY") {
          const existing = await collection.where({ query: key }).limit(1).get();
          if (existing.data && existing.data.length > 0) {
            await collection.doc(existing.data[0]._id).update({
              result,
              ...(type === 'grammar' ? { matchedGrammar: matchedData } : { matchedVocab: matchedData }),
              updatedAt: now,
            });
          }
        } else {
          throw addError;
        }
      }
    } catch (error: any) {
      console.error("[DatabaseCache] 保存失败:", error);
    }
  }

  /**
   * 获取热门查询（按 hitCount 排序）
   */
  async getTopQueries(type: 'grammar' | 'vocab', limit = 10): Promise<Array<{ query: string; hitCount: number }>> {
    this.initDB();
    if (!this.db) return [];

    try {
      const collection = this.db.collection(type === 'grammar' ? 'n1_grammar_cache' : 'vocab_cache');
      const res = await collection
        .orderBy('hitCount', 'desc')
        .limit(limit)
        .field({ query: true, hitCount: true })
        .get();

      return res.data || [];
    } catch (error) {
      console.error("[DatabaseCache] 获取热门查询失败:", error);
      return [];
    }
  }

  /**
   * 获取缓存统计
   */
  async getStats(type: 'grammar' | 'vocab'): Promise<{ total: number; memorySize: number }> {
    this.initDB();
    if (!this.db) {
      return { total: 0, memorySize: this.memoryCache.size };
    }

    try {
      const collection = this.db.collection(type === 'grammar' ? 'n1_grammar_cache' : 'vocab_cache');
      const res = await collection.count();

      return {
        total: res.total || 0,
        memorySize: this.memoryCache.size,
      };
    } catch (error) {
      console.error("[DatabaseCache] 获取统计失败:", error);
      return { total: 0, memorySize: this.memoryCache.size };
    }
  }

  /**
   * 清空内存缓存
   */
  clearMemory(): void {
    this.memoryCache.clear();
  }
}

// 创建全局单例
const dbCache = new DatabaseCache();

export default dbCache;
