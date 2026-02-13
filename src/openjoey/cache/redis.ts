/**
 * OpenJoey Redis cache client.
 * Optional: if REDIS_URL (or OPENJOEY_REDIS_URL) is not set, all ops are no-ops.
 */

import { createClient, type RedisClientType } from "redis";

const REDIS_URL = process.env.OPENJOEY_REDIS_URL ?? process.env.REDIS_URL;

let client: RedisClientType | null = null;
let connectPromise: Promise<RedisClientType | null> | null = null;

async function getClient(): Promise<RedisClientType | null> {
  if (!REDIS_URL?.trim()) {
    return null;
  }
  if (client) {
    return client;
  }
  if (connectPromise) {
    return connectPromise;
  }
  connectPromise = (async (): Promise<RedisClientType | null> => {
    try {
      const c = createClient({ url: REDIS_URL.trim() }).on("error", (err) => {
        console.error("[openjoey] Redis error:", err);
      }) as RedisClientType;
      await c.connect();
      client = c;
      return c;
    } catch (err) {
      console.error("[openjoey] Redis connect failed:", err);
      connectPromise = null;
      return null;
    }
  })();
  return connectPromise;
}

const PREFIX = "openjoey:";

/**
 * Get a string value. Returns null if key missing or Redis unavailable.
 */
export async function redisGet(key: string): Promise<string | null> {
  const c = await getClient();
  if (!c) {
    return null;
  }
  try {
    const fullKey = PREFIX + key;
    const v = await c.get(fullKey);
    return v ?? null;
  } catch (err) {
    console.error("[openjoey] Redis get failed:", err);
    return null;
  }
}

/**
 * Set a string value with optional TTL in seconds.
 */
export async function redisSet(key: string, value: string, ttlSeconds?: number): Promise<boolean> {
  const c = await getClient();
  if (!c) {
    return false;
  }
  try {
    const fullKey = PREFIX + key;
    if (ttlSeconds != null && ttlSeconds > 0) {
      await c.setEx(fullKey, ttlSeconds, value);
    } else {
      await c.set(fullKey, value);
    }
    return true;
  } catch (err) {
    console.error("[openjoey] Redis set failed:", err);
    return false;
  }
}

/**
 * Run an async function; if the result is cached (key exists), return it.
 * Otherwise run fn(), cache the result (as JSON if not string), and return.
 */
export async function withCache<T>(params: {
  key: string;
  ttlSeconds: number;
  fn: () => Promise<T>;
  serialize?: (v: T) => string;
  deserialize?: (s: string) => T;
}): Promise<T> {
  const { key, ttlSeconds, fn, serialize, deserialize } = params;
  const raw = await redisGet(key);
  if (raw != null) {
    if (deserialize) {
      try {
        return deserialize(raw);
      } catch {
        // invalid cache entry, fall through to fn
      }
    } else {
      return raw as T;
    }
  }
  const value = await fn();
  const out = serialize
    ? serialize(value)
    : typeof value === "string"
      ? value
      : JSON.stringify(value);
  await redisSet(key, out, ttlSeconds);
  return value;
}

/**
 * TTLs by asset type (seconds). Used for analysis cache.
 */
export const CACHE_TTL_BY_ASSET: Record<string, number> = {
  crypto: 15 * 60, // 15 min
  stock: 30 * 60, // 30 min
  forex: 30 * 60,
  commodity: 30 * 60,
  default: 15 * 60,
};

export function getTtlSeconds(assetType: string): number {
  return CACHE_TTL_BY_ASSET[assetType?.toLowerCase()] ?? CACHE_TTL_BY_ASSET.default;
}
