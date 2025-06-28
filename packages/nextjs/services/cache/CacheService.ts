// Advanced caching service for the autonomous shopping agent
// Implements multi-level caching with TTL and intelligent invalidation

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
}

class CacheService {
  private static instance: CacheService;
  private memoryCache: Map<string, CacheEntry<any>> = new Map();
  private stats: CacheStats = { hits: 0, misses: 0, size: 0, hitRate: 0 };
  private maxSize: number = 1000;
  private defaultTTL: number = 5 * 60 * 1000; // 5 minutes

  private constructor() {
    // Start cleanup interval
    setInterval(() => this.cleanup(), 60 * 1000); // Cleanup every minute
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  // Get data from cache
  public get<T>(key: string): T | null {
    const entry = this.memoryCache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.memoryCache.delete(key);
      this.stats.misses++;
      this.stats.size--;
      this.updateHitRate();
      return null;
    }

    // Update access stats
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.stats.hits++;
    this.updateHitRate();

    return entry.data;
  }

  // Set data in cache
  public set<T>(key: string, data: T, ttl?: number): void {
    const actualTTL = ttl || this.defaultTTL;
    
    // Check if we need to evict entries
    if (this.memoryCache.size >= this.maxSize) {
      this.evictLRU();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: actualTTL,
      accessCount: 1,
      lastAccessed: Date.now()
    };

    this.memoryCache.set(key, entry);
    this.stats.size = this.memoryCache.size;
  }

  // Delete from cache
  public delete(key: string): boolean {
    const deleted = this.memoryCache.delete(key);
    if (deleted) {
      this.stats.size = this.memoryCache.size;
    }
    return deleted;
  }

  // Clear all cache
  public clear(): void {
    this.memoryCache.clear();
    this.stats.size = 0;
  }

  // Check if key exists and is valid
  public has(key: string): boolean {
    const entry = this.memoryCache.get(key);
    if (!entry) return false;
    
    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.memoryCache.delete(key);
      this.stats.size--;
      return false;
    }
    
    return true;
  }

  // Get or set pattern
  public async getOrSet<T>(
    key: string, 
    fetcher: () => Promise<T>, 
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const data = await fetcher();
    this.set(key, data, ttl);
    return data;
  }

  // Cache product search results
  public cacheProductSearch(
    query: string, 
    filters: Record<string, any>, 
    results: any[], 
    ttl: number = 5 * 60 * 1000
  ): void {
    const key = this.generateSearchKey(query, filters);
    this.set(key, results, ttl);
  }

  // Get cached product search results
  public getCachedProductSearch(
    query: string, 
    filters: Record<string, any>
  ): any[] | null {
    const key = this.generateSearchKey(query, filters);
    return this.get<any[]>(key);
  }

  // Cache user recommendations
  public cacheUserRecommendations(
    userAddress: string, 
    recommendations: any[], 
    ttl: number = 10 * 60 * 1000
  ): void {
    const key = `recommendations:${userAddress}`;
    this.set(key, recommendations, ttl);
  }

  // Get cached user recommendations
  public getCachedUserRecommendations(userAddress: string): any[] | null {
    const key = `recommendations:${userAddress}`;
    return this.get<any[]>(key);
  }

  // Cache agent responses
  public cacheAgentResponse(
    messageHash: string, 
    response: string, 
    ttl: number = 2 * 60 * 1000
  ): void {
    const key = `agent:${messageHash}`;
    this.set(key, response, ttl);
  }

  // Get cached agent response
  public getCachedAgentResponse(messageHash: string): string | null {
    const key = `agent:${messageHash}`;
    return this.get<string>(key);
  }

  // Invalidate related cache entries
  public invalidatePattern(pattern: string): number {
    let count = 0;
    for (const key of this.memoryCache.keys()) {
      if (key.includes(pattern)) {
        this.memoryCache.delete(key);
        count++;
      }
    }
    this.stats.size = this.memoryCache.size;
    return count;
  }

  // Get cache statistics
  public getStats(): CacheStats {
    return { ...this.stats };
  }

  // Get detailed cache info
  public getCacheInfo(): {
    stats: CacheStats;
    entries: Array<{
      key: string;
      size: number;
      age: number;
      accessCount: number;
      lastAccessed: number;
    }>;
  } {
    const entries = Array.from(this.memoryCache.entries()).map(([key, entry]) => ({
      key,
      size: JSON.stringify(entry.data).length,
      age: Date.now() - entry.timestamp,
      accessCount: entry.accessCount,
      lastAccessed: entry.lastAccessed
    }));

    return {
      stats: this.getStats(),
      entries: entries.sort((a, b) => b.accessCount - a.accessCount)
    };
  }

  // Private methods
  private generateSearchKey(query: string, filters: Record<string, any>): string {
    const filterStr = JSON.stringify(filters, Object.keys(filters).sort());
    return `search:${query}:${filterStr}`;
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }

  private evictLRU(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.memoryCache.delete(oldestKey);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.memoryCache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.memoryCache.delete(key));
    this.stats.size = this.memoryCache.size;

    if (keysToDelete.length > 0) {
      console.log(`🧹 Cache cleanup: removed ${keysToDelete.length} expired entries`);
    }
  }
}

// Utility function to create cache keys
export function createCacheKey(...parts: (string | number | boolean)[]): string {
  return parts.map(part => String(part)).join(':');
}

// Utility function to hash messages for caching
export function hashMessage(message: string): string {
  let hash = 0;
  for (let i = 0; i < message.length; i++) {
    const char = message.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

// Create and export singleton instance
export const cacheService = CacheService.getInstance();

export default CacheService;
