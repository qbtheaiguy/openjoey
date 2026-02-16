/**
 * OpenJoey Performance Optimization Layer
 * Caching, batching, and response time improvements
 */

// Cache configuration
const CACHE_TTL = {
  price: 30 * 1000, // 30 seconds for prices
  indicator: 5 * 60 * 1000, // 5 minutes for indicators
  signal: 5 * 60 * 1000, // 5 minutes for signals
  sentiment: 10 * 60 * 1000, // 10 minutes for sentiment
  trending: 2 * 60 * 1000, // 2 minutes for trending
  whale: 3 * 60 * 1000, // 3 minutes for whale events
};

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class PerformanceCache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private hits = 0;
  private misses = 0;

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    return entry.data;
  }

  set(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  getStats(): { hits: number; misses: number; hitRate: number; size: number } {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? this.hits / total : 0,
      size: this.cache.size,
    };
  }

  // Clean expired entries periodically
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Global caches
export const priceCache = new PerformanceCache<any>();
export const indicatorCache = new PerformanceCache<any>();
export const signalCache = new PerformanceCache<any>();
export const analysisCache = new PerformanceCache<any>();

/**
 * Wrap a function with caching
 */
export function withCache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  cache: PerformanceCache<any>,
  keyFn: (...args: Parameters<T>) => string,
  ttl: number,
): T {
  return (async (...args: Parameters<T>) => {
    const key = keyFn(...args);
    const cached = cache.get(key);
    if (cached) {
      return cached;
    }

    const result = await fn(...args);
    cache.set(key, result, ttl);
    return result;
  }) as T;
}

/**
 * Measure execution time of a function
 */
export async function withTiming<T>(
  name: string,
  fn: () => Promise<T>,
): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
  return { result, duration };
}

/**
 * Performance monitoring
 */
class PerformanceMonitor {
  private timings: Map<string, number[]> = new Map();

  record(name: string, duration: number): void {
    if (!this.timings.has(name)) {
      this.timings.set(name, []);
    }
    this.timings.get(name)!.push(duration);
  }

  getStats(name: string): { avg: number; min: number; max: number; count: number } | null {
    const timings = this.timings.get(name);
    if (!timings || timings.length === 0) return null;

    return {
      avg: timings.reduce((a, b) => a + b, 0) / timings.length,
      min: Math.min(...timings),
      max: Math.max(...timings),
      count: timings.length,
    };
  }

  getAllStats(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const stats: Record<string, any> = {};
    for (const [name] of this.timings) {
      stats[name] = this.getStats(name);
    }
    return stats;
  }

  clear(): void {
    this.timings.clear();
  }
}

export const performanceMonitor = new PerformanceMonitor();

/**
 * Batch multiple requests together
 */
export class Batcher<T, R> {
  private queue: Array<{ item: T; resolve: (result: R) => void; reject: (error: any) => void }> =
    [];
  private timeout: NodeJS.Timeout | null = null;
  private batchSize: number;
  private delay: number;
  private processor: (items: T[]) => Promise<R[]>;

  constructor(
    processor: (items: T[]) => Promise<R[]>,
    options: { batchSize?: number; delay?: number } = {},
  ) {
    this.processor = processor;
    this.batchSize = options.batchSize || 10;
    this.delay = options.delay || 50;
  }

  async add(item: T): Promise<R> {
    return new Promise((resolve, reject) => {
      this.queue.push({ item, resolve, reject });

      if (this.queue.length >= this.batchSize) {
        this.flush();
      } else if (!this.timeout) {
        this.timeout = setTimeout(() => this.flush(), this.delay);
      }
    });
  }

  private async flush(): Promise<void> {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }

    if (this.queue.length === 0) return;

    const batch = this.queue.splice(0, this.batchSize);
    const items = batch.map((b) => b.item);

    try {
      const results = await this.processor(items);
      batch.forEach((b, i) => b.resolve(results[i]));
    } catch (error) {
      batch.forEach((b) => b.reject(error));
    }
  }
}

/**
 * Preload common data
 */
export async function preloadCommonData(): Promise<void> {
  console.log("🚀 Preloading common data...");
  const start = performance.now();

  // Preload top 10 crypto prices
  const topSymbols = ["BTC", "ETH", "SOL", "RAY", "AVAX", "MATIC", "DOT", "LINK", "UNI", "AAVE"];

  try {
    // Import price service dynamically to avoid circular deps
    const { getMultiplePrices } = await import("./price-service.js");
    await getMultiplePrices(topSymbols);
    console.log(`✅ Preloaded ${topSymbols.length} price data`);
  } catch (error) {
    console.warn("Failed to preload prices:", error);
  }

  const duration = performance.now() - start;
  console.log(`⏱️ Preload complete: ${duration.toFixed(2)}ms`);
}

/**
 * Cleanup all caches periodically
 */
export function startCacheCleanup(intervalMinutes = 5): void {
  setInterval(
    () => {
      priceCache.cleanup();
      indicatorCache.cleanup();
      signalCache.cleanup();
      analysisCache.cleanup();

      const stats = {
        price: priceCache.getStats(),
        indicator: indicatorCache.getStats(),
        signal: signalCache.getStats(),
      };

      console.log("🧹 Cache cleanup complete:", stats);
    },
    intervalMinutes * 60 * 1000,
  );
}

/**
 * Get performance report
 */
export function getPerformanceReport(): {
  caches: Record<string, ReturnType<PerformanceCache<any>["getStats"]>>;
  timings: ReturnType<PerformanceMonitor["getAllStats"]>;
} {
  return {
    caches: {
      price: priceCache.getStats(),
      indicator: indicatorCache.getStats(),
      signal: signalCache.getStats(),
      analysis: analysisCache.getStats(),
    },
    timings: performanceMonitor.getAllStats(),
  };
}

// Start automatic cache cleanup
startCacheCleanup();
