/**
 * OpenJoey reply cache: cache agent replies by normalized user message
 * to avoid duplicate expensive Guru calls (Phase 3 cost reduction).
 */

import * as crypto from "node:crypto";
import { redisGet, redisSet } from "./redis.js";

/** Default TTL for reply cache (15 minutes). */
const DEFAULT_TTL_SECONDS = 15 * 60;

/** Normalize user message for cache key: lowercase, collapse whitespace, trim. */
export function normalizeMessageForCache(text: string): string {
  return (text ?? "").trim().replace(/\s+/g, " ").toLowerCase().slice(0, 500);
}

/** Build cache key from normalized message and optional time bucket (e.g. 15-min). */
export function replyCacheKey(
  normalized: string,
  ttlSeconds: number = DEFAULT_TTL_SECONDS,
): string {
  const bucket = Math.floor(Date.now() / ttlSeconds);
  const hash = crypto.createHash("sha256").update(normalized).digest("hex").slice(0, 16);
  return `reply:${hash}:${bucket}`;
}

/**
 * Try to get a cached reply for this user message.
 * Returns the cached reply text or null if miss / Redis unavailable.
 */
export async function getCachedReply(userMessage: string): Promise<string | null> {
  const normalized = normalizeMessageForCache(userMessage);
  if (!normalized) return null;
  const key = replyCacheKey(normalized, DEFAULT_TTL_SECONDS);
  return redisGet(key);
}

/**
 * Store a reply in the cache for the given user message.
 * Safe to call when Redis is unavailable (no-op).
 */
export async function setCachedReply(
  userMessage: string,
  replyText: string,
  ttlSeconds: number = DEFAULT_TTL_SECONDS,
): Promise<void> {
  const normalized = normalizeMessageForCache(userMessage);
  if (!normalized || !replyText?.trim()) return;
  const key = replyCacheKey(normalized, ttlSeconds);
  await redisSet(key, replyText.trim(), ttlSeconds);
}
