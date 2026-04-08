/**
 * 查询缓存模块
 * 用于缓存常见语法查询结果，减少 API 调用，提升响应速度
 */

interface CacheEntry {
  result: string;
  matchedGrammar?: any[];
  timestamp: number;
}

class QueryCache {
  private cache: Map<string, CacheEntry>;
  private readonly maxSize: number;
  private readonly ttl: number; // Time to live in milliseconds

  constructor(maxSize = 100, ttlDays = 7) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttlDays * 24 * 60 * 60 * 1000; // 转换为毫秒
  }

  /**
   * 生成缓存键
   */
  private generateKey(query: string, type: 'grammar' | 'vocab' | 'analyze'): string {
    return `${type}:${query.toLowerCase().trim()}`;
  }

  /**
   * 获取缓存
   */
  get(query: string, type: 'grammar' | 'vocab' | 'analyze'): CacheEntry | null {
    const key = this.generateKey(query, type);
    const entry = this.cache.get(key);

    if (!entry) return null;

    // 检查是否过期
    const now = Date.now();
    if (now - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry;
  }

  /**
   * 设置缓存
   */
  set(query: string, type: 'grammar' | 'vocab' | 'analyze', result: string, matchedGrammar?: any[]): void {
    const key = this.generateKey(query, type);

    // LRU 策略：如果缓存已满，删除最旧的条目
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      result,
      matchedGrammar,
      timestamp: Date.now(),
    });
  }

  /**
   * 清除过期缓存
   */
  cleanup(): void {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    for (const [key, entry] of entries) {
      if (now - entry.timestamp > this.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): { size: number; maxSize: number; hitRate?: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
    };
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear();
  }
}

// 创建全局单例
const queryCache = new QueryCache(100, 7);

// 定期清理过期缓存（每小时）
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    queryCache.cleanup();
  }, 60 * 60 * 1000);
}

export default queryCache;
