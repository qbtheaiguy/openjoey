/**
 * OpenJoey Keyboard Builder
 *
 * Builds Telegram InlineKeyboard button rows for /start and main menu.
 * Output is a 2D array of { text, callback_data } objects — the same shape
 * that buildInlineKeyboard() in src/telegram/send.ts expects.
 * Uses FAVORITES_CAP for "My Skills (X/10)" label (§9.3).
 *
 * All callback_data uses the namespaced prefixes from doc §2.7:
 *   m: = menu/navigation, w: = watchlist, s: = skills/favorites,
 *   r: = referral, a: = alerts
 */

import type { LifecycleStage } from "./lifecycle.js";
import { FAVORITES_CAP } from "./constants.js";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface KeyboardButton {
  text: string;
  callback_data: string;
}

export interface KeyboardContext {
  stage: LifecycleStage;
  /** Referral stats from getReferralStats(); null = no stats yet */
  referralStats?: { total_earned: number; current_balance: number } | null;
  /** User's referral code for the share link */
  referralCode?: string;
  /** First few watchlist symbols (max 5) */
  watchlistSymbols?: string[];
  /** First few favorite skill names (max 5) */
  favoriteSkills?: string[];
  /** Whether the user account is older than 24 hours */
  userAge24h?: boolean;
}

// ──────────────────────────────────────────────
// Builder
// ──────────────────────────────────────────────

/**
 * Build the inline keyboard for /start based on lifecycle stage and user data.
 *
 * - day1:         3 buttons only (first win in one tap)
 * - active/power: 3 buttons + optional watchlist strip + optional My Skills + optional referral
 */
export function buildStartKeyboard(ctx: KeyboardContext): KeyboardButton[][] {
  const rows: KeyboardButton[][] = [];

  // Row 1: Core actions (always present) — newbie-friendly labels
  rows.push([
    { text: "\u{1F50D} Understand a coin or stock", callback_data: "m:check" },
    { text: "\u{1F4CA} What's going on in the markets?", callback_data: "m:market" },
    { text: "\u{1F4AC} Ask me anything (markets & money)", callback_data: "m:ask" },
  ]);

  // Day 1 users: only the 3 buttons above — no clutter
  if (ctx.stage === "day1") {
    return rows;
  }

  // ── Active / Power: add contextual rows ──

  // Watchlist strip (only if user has 1+ symbols)
  if (ctx.watchlistSymbols && ctx.watchlistSymbols.length > 0) {
    const symbols = ctx.watchlistSymbols.slice(0, 5);
    const label = symbols.join(" \u00B7 ");
    const count = ctx.watchlistSymbols.length;
    rows.push([
      { text: `\u{1F4CB} ${label} (${count})`, callback_data: "w:open" },
      { text: "\u2795 Add", callback_data: "w:add" },
    ]);
  }

  // My Skills (only if user has 1+ favorites); show X/10 per §9.3
  if (ctx.favoriteSkills && ctx.favoriteSkills.length > 0) {
    const count = ctx.favoriteSkills.length;
    rows.push([
      { text: `\u2B50 My Skills (${count}/${FAVORITES_CAP})`, callback_data: "s:favorites" },
    ]);
  }

  // Referral line (only if user is over 24h)
  if (ctx.userAge24h) {
    const earned = ctx.referralStats?.total_earned ?? 0;
    if (earned > 0) {
      rows.push([
        { text: `\u{1F4B0} Earned: $${earned.toFixed(2)}`, callback_data: "r:details" },
        { text: "\u{1F4E4} Share", callback_data: "r:share" },
      ]);
    } else {
      rows.push([{ text: "\u{1F4B0} Refer friends \u2192 earn credit", callback_data: "r:share" }]);
    }
  }

  // Power users: grouped category menu
  if (ctx.stage === "power") {
    rows.push([
      { text: "\u{1F50D} Research", callback_data: "m:research" },
      { text: "\u{1F4CA} Trading", callback_data: "m:trading" },
      { text: "\u{1F514} Alerts", callback_data: "m:alerts" },
    ]);
  }

  return rows;
}
