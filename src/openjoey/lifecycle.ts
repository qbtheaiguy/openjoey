/**
 * OpenJoey Lifecycle
 *
 * Computes the user's lifecycle stage (day1, active, power) from stored data.
 * Used to decide which keyboard and UI elements to show on /start.
 *
 * Pure function — no side effects. Call getUserLifecycleData() for the
 * convenience wrapper that reads from DB and returns stage + raw data.
 */

import type { OpenJoeyDB, OpenJoeyUser } from "./supabase-client.js";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export type LifecycleStage = "day1" | "active" | "power";

export interface LifecycleInput {
  /** ISO timestamp from users.created_at */
  createdAt: string;
  /** Number of symbols in user_watchlist */
  watchlistCount: number;
  /** Number of entries in user_favorite_skills */
  favoriteCount: number;
  /** User's subscription tier (optional; subscriber/premium/annual → power) */
  tier?: string;
}

export interface LifecycleData extends LifecycleInput {
  stage: LifecycleStage;
  /** Whether user account is older than 24 hours */
  isOver24h: boolean;
}

// ──────────────────────────────────────────────
// Pure computation
// ──────────────────────────────────────────────

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

/** Paid tiers that qualify for "power" stage. */
const POWER_TIERS = new Set(["trader", "premium", "annual"]);

/**
 * Compute lifecycle stage from user data.
 *
 * Rules (from doc §2.5):
 * - day1:   created_at < 24h AND watchlistCount === 0 AND favoriteCount === 0
 * - power:  active + paid tier (trader/premium/annual)
 * - active: everything else (> 24h, or has watchlist/favorites)
 */
export function getLifecycleStage(input: LifecycleInput): LifecycleStage {
  const ageMs = Date.now() - new Date(input.createdAt).getTime();
  const isOver24h = ageMs >= TWENTY_FOUR_HOURS_MS;

  // Day 1: fresh user with no watchlist or favorites
  if (!isOver24h && input.watchlistCount === 0 && input.favoriteCount === 0) {
    return "day1";
  }

  // Power: active user on a paid tier
  if (input.tier && POWER_TIERS.has(input.tier)) {
    return "power";
  }

  return "active";
}

// ──────────────────────────────────────────────
// DB convenience wrapper
// ──────────────────────────────────────────────

/**
 * Fetch all data needed for lifecycle computation and return stage + raw counts.
 * Requires a registered user (userId from users.id).
 */
export async function getUserLifecycleData(
  db: OpenJoeyDB,
  user: OpenJoeyUser,
): Promise<LifecycleData> {
  const [watchlistCount, favoriteCount] = await Promise.all([
    db.getWatchlistCount(user.id),
    db.getFavoriteCount(user.id),
  ]);

  const input: LifecycleInput = {
    createdAt: user.created_at,
    watchlistCount,
    favoriteCount,
    tier: user.tier,
  };

  const ageMs = Date.now() - new Date(user.created_at).getTime();

  return {
    ...input,
    stage: getLifecycleStage(input),
    isOver24h: ageMs >= TWENTY_FOUR_HOURS_MS,
  };
}
