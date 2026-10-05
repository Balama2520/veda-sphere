import { CacheStats } from '@vedasphere/shared';

export interface CacheEntry<T = unknown> {
  value: T;
  expiresAt: number;
}

export interface Cache {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<void>;
  getStats(): CacheStats;
}

export class InMemoryCache implements Cache {
  private cache = new Map<string, CacheEntry>();
  private maxSize: number;
  private hits = 0;
  private misses = 0;

  constructor(maxSize = 1000) {
    this.maxSize = maxSize;
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    // Refresh position for LRU
    this.cache.delete(key);
    this.cache.set(key, entry);
    this.hits++;

    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    const expiresAt = Date.now() + ttlSeconds * 1000;

    // Delete existing to update order if exists
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // LRU eviction: first key in map is oldest used
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, { value, expiresAt });
  }

  async delete(key: string): Promise<boolean> {
    return this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  getStats(): CacheStats {
    const totalRequests = this.hits + this.misses;
    const hitRate = totalRequests > 0 ? Number((this.hits / totalRequests).toFixed(4)) : 0;

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      hitRate,
    };
  }
}

// Global cache instance (factory allows Redis switching in future phases)
export function createCache(): Cache {
  const cacheDriver = process.env.CACHE_DRIVER || 'in-memory';
  if (cacheDriver === 'redis') {
    // Stub ready for Redis implementation in future phases if REDIS_URL provided
    // For now fallback to in-memory cache
    return new InMemoryCache();
  }
  return new InMemoryCache();
}
