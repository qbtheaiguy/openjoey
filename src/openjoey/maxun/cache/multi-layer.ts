/**
 * Maxun Multi-Layer Cache System
 * 5-tier caching: Redis (hot) → File (warm) → Maxun DB (fallback) → Robot (scrape)
 * Optimized for 100k+ users/day with 99% cache hit rate target
 */

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { CacheEntry, CacheStats, CacheTier, RobotCategory } from "../types/index.js";
import { CACHE_TIERS } from "../types/index.js";

// ============================================================================
// Redis Cache Layer (Tier 1 - Hot Data)
// ============================================================================

let redisClient: any = null;
let redisAvailable = false;

async function getRedisClient() {
  if (!redisAvailable) return null;
  if (redisClient) return redisClient;

  try {
    // Dynamic import to avoid hard dependency
    const { default: Redis } = await import("ioredis");
    redisClient = new Redis({
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379", 10),
      retryStrategy: (times: number) => Math.min(times * 50, 2000),
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
    });

    redisClient.on("error", (err: Error) => {
      console.error("Redis error:", err.message);
      redisClient = null;
      redisAvailable = false;
    });

    redisAvailable = true;
    return redisClient;
  } catch {
    console.log("Redis not available, using file cache only");
    redisAvailable = false;
    return null;
  }
}

export async function getFromRedis<T>(key: string): Promise<T | null> {
  try {
    const redis = await getRedisClient();
    if (!redis) return null;

    const data = await redis.get(`maxun:${key}`);
    if (!data) return null;

    const entry: CacheEntry<T> = JSON.parse(data);

    // Check if expired
    if (entry.expiresAt < Date.now()) {
      await redis.del(`maxun:${key}`);
      return null;
    }

    return entry.data;
  } catch (error) {
    console.error("Redis get error:", error);
    return null;
  }
}

export async function setToRedis<T>(
  key: string,
  data: T,
  ttlSeconds: number,
  robotName: string,
): Promise<void> {
  try {
    const redis = await getRedisClient();
    if (!redis) return;

    const entry: CacheEntry<T> = {
      data,
      cachedAt: Date.now(),
      expiresAt: Date.now() + ttlSeconds * 1000,
      tier: "redis",
      robotName,
    };

    await redis.setex(`maxun:${key}`, ttlSeconds, JSON.stringify(entry));
  } catch (error) {
    console.error("Redis set error:", error);
  }
}

export async function invalidateRedis(key: string): Promise<void> {
  try {
    const redis = await getRedisClient();
    if (!redis) return;
    await redis.del(`maxun:${key}`);
  } catch {
    // Ignore errors
  }
}

// ============================================================================
// File Cache Layer (Tier 2 - Warm Data)
// ============================================================================

const FILE_CACHE_DIR = path.join(os.homedir(), ".openjoey", "cache", "maxun");

async function ensureCacheDir(): Promise<void> {
  try {
    await fs.mkdir(FILE_CACHE_DIR, { recursive: true });
  } catch {
    // Ignore
  }
}

function getCacheFilePath(key: string): string {
  // Sanitize key for filesystem
  const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, "_");
  return path.join(FILE_CACHE_DIR, `${safeKey}.json`);
}

export async function getFromFileCache<T>(key: string): Promise<T | null> {
  try {
    const filePath = getCacheFilePath(key);
    const content = await fs.readFile(filePath, "utf-8");
    const entry: CacheEntry<T> = JSON.parse(content);

    // Check if expired
    if (entry.expiresAt < Date.now()) {
      await fs.unlink(filePath).catch(() => {});
      return null;
    }

    return entry.data;
  } catch {
    return null;
  }
}

export async function setToFileCache<T>(
  key: string,
  data: T,
  ttlSeconds: number,
  robotName: string,
): Promise<void> {
  await ensureCacheDir();

  const entry: CacheEntry<T> = {
    data,
    cachedAt: Date.now(),
    expiresAt: Date.now() + ttlSeconds * 1000,
    tier: "file",
    robotName,
  };

  const filePath = getCacheFilePath(key);

  try {
    await fs.writeFile(filePath, JSON.stringify(entry), "utf-8");
  } catch (error) {
    console.error("File cache write error:", error);
  }
}

// ============================================================================
// In-Memory Cache Layer (Tier 3 - Ultra-Hot)
// ============================================================================

const memoryCache = new Map<string, CacheEntry<unknown>>();
const MEMORY_CACHE_MAX_SIZE = 1000;

export function getFromMemoryCache<T>(key: string): T | null {
  const entry = memoryCache.get(key) as CacheEntry<T> | undefined;

  if (!entry) return null;

  // Check if expired
  if (entry.expiresAt < Date.now()) {
    memoryCache.delete(key);
    return null;
  }

  return entry.data;
}

export function setToMemoryCache<T>(
  key: string,
  data: T,
  ttlSeconds: number,
  robotName: string,
): void {
  // Evict oldest if at capacity
  if (memoryCache.size >= MEMORY_CACHE_MAX_SIZE) {
    const oldestKeyResult = memoryCache.keys().next();
    if (!oldestKeyResult.done && oldestKeyResult.value) {
      memoryCache.delete(oldestKeyResult.value as string);
    }
  }

  const entry: CacheEntry<T> = {
    data,
    cachedAt: Date.now(),
    expiresAt: Date.now() + ttlSeconds * 1000,
    tier: "memory",
    robotName,
  };

  memoryCache.set(key, entry);
}

// ============================================================================
// Unified Multi-Layer Cache API
// ============================================================================

export interface GetCacheOptions {
  category?: RobotCategory;
  ttlOverride?: number;
  allowStale?: boolean;
  staleThresholdMinutes?: number;
}

export async function getCachedData<T>(
  key: string,
  robotName: string,
  category: RobotCategory,
  options: GetCacheOptions = {},
): Promise<{ data: T | null; source: string; age: number }> {
  const now = Date.now();
  const tiers = (CACHE_TIERS as Record<RobotCategory, { redis: number; file: number }>)[category];
  const redisTtl = options.ttlOverride || tiers.redis;
  const fileTtl = options.ttlOverride || tiers.file;

  // Tier 1: Memory cache (fastest)
  const memoryData = getFromMemoryCache<T>(key);
  if (memoryData) {
    return { data: memoryData, source: "memory", age: 0 };
  }

  // Tier 2: Redis
  const redisData = await getFromRedis<T>(key);
  if (redisData) {
    // Promote to memory cache
    setToMemoryCache(key, redisData, redisTtl, robotName);
    return { data: redisData, source: "redis", age: 0 };
  }

  // Tier 3: File cache
  const fileData = await getFromFileCache<T>(key);
  if (fileData) {
    const age = now - (await getFileCacheEntry(key))!.cachedAt;

    // Check if stale
    const staleThreshold = (options.staleThresholdMinutes || 60) * 60 * 1000;
    if (!options.allowStale && age > staleThreshold) {
      // Data is stale, return null to trigger fresh fetch
      return { data: null, source: "file-stale", age };
    }

    // Promote to Redis and memory
    await setToRedis(key, fileData, redisTtl, robotName);
    setToMemoryCache(key, fileData, redisTtl, robotName);

    return { data: fileData, source: "file", age };
  }

  // Cache miss
  return { data: null, source: "miss", age: 0 };
}

async function getFileCacheEntry<T>(key: string): Promise<CacheEntry<T> | null> {
  try {
    const filePath = getCacheFilePath(key);
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}

export async function setCachedData<T>(
  key: string,
  data: T,
  robotName: string,
  category: RobotCategory,
  options: { skipMemory?: boolean; skipRedis?: boolean; skipFile?: boolean } = {},
): Promise<void> {
  const tiers = (CACHE_TIERS as Record<RobotCategory, { redis: number; file: number }>)[category];

  // Set in all tiers concurrently
  await Promise.all([
    !options.skipMemory && setToMemoryCache(key, data, tiers.redis, robotName),
    !options.skipRedis && setToRedis(key, data, tiers.redis, robotName),
    !options.skipFile && setToFileCache(key, data, tiers.file, robotName),
  ]);
}

// ============================================================================
// Cache Statistics
// ============================================================================

const stats = {
  hits: { memory: 0, redis: 0, file: 0 },
  misses: 0,
  sets: 0,
};

export function recordCacheHit(tier: "memory" | "redis" | "file"): void {
  stats.hits[tier]++;
}

export function recordCacheMiss(): void {
  stats.misses++;
}

export function recordCacheSet(): void {
  stats.sets++;
}

export function getCacheStats(): CacheStats {
  const totalHits = stats.hits.memory + stats.hits.redis + stats.hits.file;
  const total = totalHits + stats.misses;

  return {
    hits: totalHits,
    misses: stats.misses,
    evictions: 0, // Not tracked for memory cache
    hitRate: total > 0 ? (totalHits / total) * 100 : 0,
    size: memoryCache.size,
    oldestEntry: 0, // Not tracked
  };
}

export function resetCacheStats(): void {
  stats.hits = { memory: 0, redis: 0, file: 0 };
  stats.misses = 0;
  stats.sets = 0;
}

// ============================================================================
// Cache Key Utilities
// ============================================================================

export function generateCacheKey(
  robotName: string,
  params?: Record<string, string | number>,
): string {
  if (!params || Object.keys(params).length === 0) {
    return robotName;
  }

  const paramString = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");

  return `${robotName}:${paramString}`;
}

export function invalidateCache(key: string): Promise<void> {
  memoryCache.delete(key);
  return invalidateRedis(key);
}

export async function invalidateCachePattern(pattern: string): Promise<void> {
  // Clear memory cache matching pattern
  for (const key of memoryCache.keys()) {
    if (key.includes(pattern)) {
      memoryCache.delete(key);
    }
  }

  // Clear Redis matching pattern
  try {
    const redis = await getRedisClient();
    if (redis) {
      const keys = await redis.keys(`maxun:*${pattern}*`);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    }
  } catch {
    // Ignore
  }
}

// ============================================================================
// Bulk Cache Operations
// ============================================================================

export async function warmCache<T>(
  robotName: string,
  category: RobotCategory,
  fetcher: () => Promise<T>,
): Promise<T> {
  const key = robotName;

  // Try cache first
  const cached = await getCachedData<T>(key, robotName, category);
  if (cached.data) {
    recordCacheHit(cached.source as "memory" | "redis" | "file");
    return cached.data;
  }

  recordCacheMiss();

  // Fetch fresh data
  const data = await fetcher();

  // Cache it
  await setCachedData(key, data, robotName, category);
  recordCacheSet();

  return data;
}

export async function getStaleOrFresh<T>(
  key: string,
  robotName: string,
  category: RobotCategory,
  fetcher: () => Promise<T>,
  maxStaleMinutes: number = 60,
): Promise<T> {
  // Try to get cached data (allowing stale)
  const cached = await getCachedData<T>(key, robotName, category, {
    allowStale: true,
    staleThresholdMinutes: maxStaleMinutes,
  });

  if (cached.data && cached.source !== "file-stale") {
    recordCacheHit(cached.source as "memory" | "redis" | "file");
    return cached.data;
  }

  // If we have stale data, return it while fetching in background
  if (cached.data && cached.source === "file-stale") {
    // Fetch in background
    fetcher()
      .then(async (fresh) => {
        await setCachedData(key, fresh, robotName, category);
      })
      .catch(() => {});

    return cached.data;
  }

  // No cached data, must fetch
  recordCacheMiss();
  const data = await fetcher();
  await setCachedData(key, data, robotName, category);
  return data;
}
