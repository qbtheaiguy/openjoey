/**
 * File-based Cache Layer for OpenJoey Data Harvester
 * Rule 4: Caching results to reduce API calls and scraping
 */

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const CACHE_DIR = path.join(os.homedir(), ".openjoey", "cache");
const DEFAULT_TTL_MINUTES = 5;

type CacheEntry<T> = {
  data: T;
  cachedAtMs: number;
  ttlMinutes: number;
};

// In-memory cache for hot data
const memoryCache = new Map<string, CacheEntry<unknown>>();

/**
 * Ensure cache directory exists
 */
async function ensureCacheDir(): Promise<void> {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  } catch {
    // Ignore
  }
}

/**
 * Get cache file path for a key
 */
function getCacheFilePath(key: string): string {
  // Sanitize key for filesystem
  const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, "_");
  return path.join(CACHE_DIR, `${safeKey}.json`);
}

/**
 * Check if cache entry is still valid
 */
function isValid(entry: CacheEntry<unknown>): boolean {
  const ageMs = Date.now() - entry.cachedAtMs;
  const ttlMs = entry.ttlMinutes * 60 * 1000;
  return ageMs < ttlMs;
}

/**
 * Get cached data by key
 * Checks memory first, then filesystem
 */
export async function getCached<T>(key: string): Promise<T | null> {
  // Check memory cache first
  const memEntry = memoryCache.get(key) as CacheEntry<T> | undefined;
  if (memEntry && isValid(memEntry)) {
    return memEntry.data;
  }

  // Check filesystem cache
  try {
    const filePath = getCacheFilePath(key);
    const content = await fs.readFile(filePath, "utf-8");
    const entry = JSON.parse(content) as CacheEntry<T>;

    if (isValid(entry)) {
      // Promote to memory cache
      memoryCache.set(key, entry);
      return entry.data;
    }

    // Expired - clean up
    await fs.unlink(filePath).catch(() => {});
    return null;
  } catch {
    return null;
  }
}

/**
 * Store data in cache
 */
export async function setCached<T>(
  key: string,
  data: T,
  ttlMinutes: number = DEFAULT_TTL_MINUTES,
): Promise<void> {
  const entry: CacheEntry<T> = {
    data,
    cachedAtMs: Date.now(),
    ttlMinutes,
  };

  // Store in memory
  memoryCache.set(key, entry);

  // Store in filesystem
  await ensureCacheDir();
  const filePath = getCacheFilePath(key);

  try {
    await fs.writeFile(filePath, JSON.stringify(entry), "utf-8");
  } catch {
    // Ignore filesystem errors - memory cache still works
  }
}

/**
 * Get or compute cached value
 */
export async function getOrCompute<T>(
  key: string,
  compute: () => Promise<T>,
  ttlMinutes: number = DEFAULT_TTL_MINUTES,
): Promise<T> {
  const cached = await getCached<T>(key);
  if (cached !== null) {
    return cached;
  }

  const computed = await compute();
  await setCached(key, computed, ttlMinutes);
  return computed;
}

/**
 * Clear all cache entries
 */
export async function clearCache(): Promise<void> {
  memoryCache.clear();

  try {
    const files = await fs.readdir(CACHE_DIR);
    for (const file of files) {
      if (file.endsWith(".json")) {
        await fs.unlink(path.join(CACHE_DIR, file)).catch(() => {});
      }
    }
  } catch {
    // Ignore
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { memoryEntries: number; hitCount: number } {
  return {
    memoryEntries: memoryCache.size,
    hitCount: 0, // Would need to track hits
  };
}
