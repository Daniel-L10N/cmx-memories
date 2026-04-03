/**
 * Simple in-memory cache for search results
 * Phase 2.5: Performance Optimization
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  hits: number;
}

class MemoryCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private maxSize: number;
  private ttl: number; // Time to live in ms

  constructor(maxSize = 100, ttl = 5 * 60 * 1000) { // 5 min default
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  private generateKey(...args: unknown[]): string {
    return JSON.stringify(args);
  }

  get(...args: unknown[]): T | null {
    const key = this.generateKey(...args);
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Increment hits and update timestamp
    entry.hits++;
    entry.timestamp = Date.now();
    return entry.data;
  }

  set(data: T, ...args: unknown[]): void {
    const key = this.generateKey(...args);

    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      let oldest: string | null = null;
      let oldestTime = Infinity;

      for (const [k, v] of this.cache) {
        if (v.timestamp < oldestTime) {
          oldestTime = v.timestamp;
          oldest = k;
        }
      }
      if (oldest) this.cache.delete(oldest);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      hits: 0
    });
  }

  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  stats(): { size: number; hits: number; oldest: number } {
    let totalHits = 0;
    let oldest = Date.now();

    for (const entry of this.cache.values()) {
      totalHits += entry.hits;
      if (entry.timestamp < oldest) oldest = entry.timestamp;
    }

    return {
      size: this.cache.size,
      hits: totalHits,
      oldest: Date.now() - oldest
    };
  }
}

// Export singleton instances
export const searchCache = new MemoryCache<unknown>(50, 2 * 60 * 1000); // 2 min for search
export const memoryCache = new MemoryCache<unknown>(20, 5 * 60 * 1000); // 5 min for memory reads

export default { searchCache, memoryCache };
