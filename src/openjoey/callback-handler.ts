/**
 * OpenJoey Callback Handler
 *
 * Prefix-based router for Telegram inline keyboard callbacks.
 * Each feature owns a namespace (w: watchlist, s: skills, m: menu, r: referral, a: alerts).
 * New features = new prefix + handler; no changes to existing handlers.
 *
 * Returns null if the callback_data is not an OpenJoey callback,
 * so the existing bot-handlers.ts can continue processing.
 */

import type { KeyboardButton } from "./keyboard-builder.js";
import { FAVORITES_CAP } from "./constants.js";
import { buildStartKeyboard } from "./keyboard-builder.js";
import { getUserLifecycleData } from "./lifecycle.js";
import {
  buildCategoryView,
  buildSkillDetailView,
  buildSkillsOverview,
  getCategoryLabel,
} from "./skill-browser.js";
import { getOpenJoeyDB } from "./supabase-client.js";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface CallbackResult {
  /** Text for answerCallbackQuery (toast). */
  answerText?: string;
  /** If set, edit the original message text to this. */
  editText?: string;
  /** If set, replace the original keyboard with this. */
  editMarkup?: KeyboardButton[][];
  /** If set, prepended to editText for modal breadcrumb (§9.2), e.g. "Main → Skills → Trading". */
  breadcrumb?: string;
  /** If set, send a new message with this text. */
  sendText?: string;
  /** If set, attach this keyboard to the new message. */
  sendMarkup?: KeyboardButton[][];
}

/** Prefixes that belong to OpenJoey callbacks. */
const OPENJOEY_PREFIXES = ["w:", "s:", "m:", "r:", "a:"];

/**
 * Returns true if the callback_data looks like an OpenJoey callback.
 * Use this to short-circuit before calling handleOpenJoeyCallback.
 */
export function isOpenJoeyCallback(data: string): boolean {
  return OPENJOEY_PREFIXES.some((p) => data.startsWith(p));
}

// ──────────────────────────────────────────────
// Main router
// ──────────────────────────────────────────────

/**
 * Handle an OpenJoey callback. Returns null if the data is not recognized.
 */
export async function handleOpenJoeyCallback(
  data: string,
  userId: string,
  telegramId: number,
): Promise<CallbackResult | null> {
  if (data.startsWith("w:")) return handleWatchlistCallback(data, userId);
  if (data.startsWith("s:")) return handleSkillsCallback(data, userId);
  if (data.startsWith("m:")) return handleMenuCallback(data, userId, telegramId);
  if (data.startsWith("r:")) return handleReferralCallback(data, userId, telegramId);
  if (data.startsWith("a:")) return handleAlertsCallback(data, userId);
  return null;
}

// ──────────────────────────────────────────────
// Watchlist (w:)
// ──────────────────────────────────────────────

async function handleWatchlistCallback(
  data: string,
  userId: string,
): Promise<CallbackResult | null> {
  const db = getOpenJoeyDB();

  // w:add:SYMBOL — add symbol to watchlist
  const addMatch = data.match(/^w:add:(.+)$/);
  if (addMatch) {
    const symbol = addMatch[1].toUpperCase();
    try {
      await db.addToWatchlist(userId, symbol);
      return {
        answerText: `${symbol} added to watchlist!`,
        editText: `\u2705 ${symbol} added to your watchlist.`,
      };
    } catch (err) {
      // Likely unique constraint violation = already in list
      return { answerText: `${symbol} is already in your watchlist.` };
    }
  }

  // w:remove:SYMBOL — remove symbol from watchlist
  const removeMatch = data.match(/^w:remove:(.+)$/);
  if (removeMatch) {
    const symbol = removeMatch[1].toUpperCase();
    await db.removeFromWatchlist(userId, symbol);
    return { answerText: `${symbol} removed.` };
  }

  // w:open — show full watchlist, grouped by type + optional Active alerts (doc §3.7, §9.10)
  if (data === "w:open") {
    const items = await db.getUserWatchlist(userId);
    if (items.length === 0) {
      return {
        sendText:
          "\u{1F4CB} Your watchlist is empty.\n\nSend a token symbol (e.g. SOL, AAPL) to check it, then add it to your watchlist.",
      };
    }

    // Group by symbol_type
    const tokens = items.filter((i) => i.symbol_type === "crypto_token");
    const stocks = items.filter((i) => i.symbol_type === "stock");
    const penny = items.filter((i) => i.symbol_type === "penny_stock");

    let text = "\u{1F4CB} *Your Watchlist*\n";
    text += "One-tap to check or set alerts.\n";

    if (tokens.length > 0) {
      text += `\n\u{1FA99} *TOKENS (${tokens.length})*\n`;
      for (const t of tokens) text += `\u2022 ${t.symbol}\n`;
    }
    if (stocks.length > 0) {
      text += `\n\u{1F4C8} *STOCKS (${stocks.length})*\n`;
      for (const s of stocks) text += `\u2022 ${s.symbol}\n`;
    }
    if (penny.length > 0) {
      text += `\n\u{1F4C9} *PENNY (${penny.length})*\n`;
      for (const p of penny) text += `\u2022 ${p.symbol}\n`;
    }

    // Active alerts section (optional, doc §3.7)
    const alerts = await db.getUserAlerts(userId, true).catch(() => []);
    if (alerts.length > 0) {
      text += `\n\u{1F514} *ACTIVE ALERTS (${alerts.length})*\n`;
      for (const a of alerts.slice(0, 5)) {
        const cond = a.condition === "above" ? "\u2191" : "\u2193";
        text += `\u2022 ${a.token_symbol} ${cond} $${Number(a.target_price).toLocaleString()}\n`;
      }
      if (alerts.length > 5) text += `\u2026 and ${alerts.length - 5} more\n`;
    }

    // Build per-symbol buttons (grouped, max 10 total)
    const rows: KeyboardButton[][] = [];
    const allGrouped = [...tokens, ...stocks, ...penny];
    for (const item of allGrouped.slice(0, 10)) {
      rows.push([
        { text: `\u{1F4CA} ${item.symbol}`, callback_data: `w:check:${item.symbol}` },
        { text: "\u{1F514}", callback_data: `w:alert:${item.symbol}` },
        { text: "\u{1F5D1}", callback_data: `w:remove:${item.symbol}` },
      ]);
    }
    if (alerts.length > 0) {
      rows.push([
        { text: `\u{1F514} View all alerts (${alerts.length})`, callback_data: "a:open" },
      ]);
    }
    rows.push([
      { text: "\u2795 Add", callback_data: "w:add" },
      { text: "\u{1F519} Back", callback_data: "m:main" },
    ]);
    return { editText: text, editMarkup: rows, breadcrumb: "Main → Watchlist" };
  }

  // w:check:SYMBOL — shortcut: tell user to type "Check SYMBOL"
  const checkMatch = data.match(/^w:check:(.+)$/);
  if (checkMatch) {
    const symbol = checkMatch[1].toUpperCase();
    return { sendText: `Check ${symbol}` };
  }

  // w:alert:SYMBOL — shortcut: tell user to set alert
  const alertMatch = data.match(/^w:alert:(.+)$/);
  if (alertMatch) {
    const symbol = alertMatch[1].toUpperCase();
    return { sendText: `Set alert for ${symbol}` };
  }

  // w:add — generic "add" prompt
  if (data === "w:add") {
    return { sendText: "Send a symbol to add to your watchlist (e.g. SOL, AAPL, BONK)." };
  }

  // w:dismiss — user tapped "Not now" on add-to-watchlist prompt
  if (data === "w:dismiss") {
    return { answerText: "Got it." };
  }

  return null;
}

// ──────────────────────────────────────────────
// Skills / Favorites (s:)
// ──────────────────────────────────────────────

async function handleSkillsCallback(data: string, userId: string): Promise<CallbackResult | null> {
  const db = getOpenJoeyDB();

  // s:fav:SKILL or s:fav:SKILL:detail:CATEGORY — add skill to favorites
  const favDetailMatch = data.match(/^s:fav:([^:]+):detail:([^:]+)$/);
  const favSimpleMatch = !favDetailMatch && data.match(/^s:fav:([^:]+)$/);
  const favMatch = favDetailMatch ?? favSimpleMatch;
  if (favMatch) {
    const skill = favMatch[1];
    const count = await db.getFavoriteCount(userId).catch(() => 0);
    if (count >= FAVORITES_CAP) {
      return {
        answerText: `Favorites full (${count}/${FAVORITES_CAP}). Remove one to add another.`,
      };
    }
    try {
      await db.addFavorite(userId, skill);
      const category = favDetailMatch ? favDetailMatch[2] : null;
      if (category != null) {
        const favorites = await db.getUserFavorites(userId).catch(() => []);
        const favNames = favorites.map((f) => f.skill_name);
        const result = await buildSkillDetailView(skill, category, favNames);
        const breadcrumb = `Main → Skills → ${getCategoryLabel(category)} → ${skill}`;
        return {
          answerText: `${skill} favorited!`,
          editText: result.text,
          editMarkup: result.keyboard,
          breadcrumb,
        };
      }
      return {
        answerText: `${skill} favorited!`,
        editText: `\u2B50 ${skill} added to your favorites.`,
      };
    } catch {
      return { answerText: `${skill} is already in your favorites.` };
    }
  }

  // s:unfav:SKILL or s:unfav:SKILL:detail:CATEGORY — remove from favorites
  const unfavDetailMatch = data.match(/^s:unfav:([^:]+):detail:([^:]+)$/);
  const unfavSimpleMatch = !unfavDetailMatch && data.match(/^s:unfav:([^:]+)$/);
  const unfavMatch = unfavDetailMatch ?? unfavSimpleMatch;
  if (unfavMatch) {
    const skill = unfavMatch[1];
    await db.removeFavorite(userId, skill);
    const category = unfavDetailMatch ? unfavDetailMatch[2] : null;
    if (category != null) {
      const favorites = await db.getUserFavorites(userId).catch(() => []);
      const favNames = favorites.map((f) => f.skill_name);
      const result = await buildSkillDetailView(skill, category, favNames);
      const breadcrumb = `Main → Skills → ${getCategoryLabel(category)} → ${skill}`;
      return {
        answerText: `${skill} removed.`,
        editText: result.text,
        editMarkup: result.keyboard,
        breadcrumb,
      };
    }
    return { answerText: `${skill} removed from favorites.` };
  }

  // s:favorites — show favorites list
  if (data === "s:favorites") {
    const favorites = await db.getUserFavorites(userId);
    const cap = FAVORITES_CAP;
    if (favorites.length === 0) {
      return {
        sendText: `\u2B50 *Your Favorite Skills (0/${cap})*\n\nNo favorites yet. Use skills and I'll suggest adding them!`,
      };
    }
    let text = `\u2B50 *Your Favorite Skills (${favorites.length}/${cap})*\n\n`;
    for (const fav of favorites) {
      text += `\u2022 ${fav.skill_name}${fav.category ? ` (${fav.category})` : ""}\n`;
    }
    const rows: KeyboardButton[][] = favorites.slice(0, 8).map((fav) => [
      { text: `\u{1F680} ${fav.skill_name}`, callback_data: `s:use:${fav.skill_name}` },
      { text: "\u2699\uFE0F", callback_data: `s:settings:${fav.skill_name}` },
      { text: "\u{1F5D1}", callback_data: `s:unfav:${fav.skill_name}` },
    ]);
    rows.push([{ text: "\u{1F519} Back", callback_data: "m:main" }]);
    return { editText: text, editMarkup: rows, breadcrumb: "Main → My Favorites" };
  }

  // s:settings:SKILL — per-skill settings (§3.3/§4.3); placeholder "Coming soon"
  const settingsMatch = data.match(/^s:settings:([^:]+)$/);
  if (settingsMatch) {
    const skillName = settingsMatch[1];
    const text = `\u2699\uFE0F *Settings: ${skillName}*\n\nPer-skill preferences are coming soon. You can use the skill as-is until then.`;
    const keyboard: KeyboardButton[][] = [
      [{ text: "\u{1F519} Back to Favorites", callback_data: "s:favorites" }],
    ];
    return { editText: text, editMarkup: keyboard, breadcrumb: "Main → My Favorites → Settings" };
  }

  // s:cat:CATEGORY — drill into a category
  const catMatch = data.match(/^s:cat:(.+)$/);
  if (catMatch) {
    const category = catMatch[1];
    const favorites = await db.getUserFavorites(userId).catch(() => []);
    const favNames = favorites.map((f) => f.skill_name);
    const result = await buildCategoryView(category, favNames);
    const breadcrumb = `Main → Skills → ${getCategoryLabel(category)}`;
    return { editText: result.text, editMarkup: result.keyboard, breadcrumb };
  }

  // s:detail:SKILL_ID:CATEGORY — individual skill detail view (§3.4)
  const detailMatch = data.match(/^s:detail:(.+):([^:]+)$/);
  if (detailMatch) {
    const [, skillId, category] = detailMatch;
    const favorites = await db.getUserFavorites(userId).catch(() => []);
    const favNames = favorites.map((f) => f.skill_name);
    const result = await buildSkillDetailView(skillId, category, favNames);
    const breadcrumb = `Main → Skills → ${getCategoryLabel(category)} → ${skillId}`;
    return { editText: result.text, editMarkup: result.keyboard, breadcrumb };
  }

  // s:use:SKILL — use a skill (send as text so agent picks it up)
  const useMatch = data.match(/^s:use:(.+)$/);
  if (useMatch) {
    const skill = useMatch[1];
    return { sendText: `Use ${skill}` };
  }

  // s:dismiss — user tapped "No" on favorite prompt
  if (data === "s:dismiss") {
    return { answerText: "Got it." };
  }

  return null;
}

// ──────────────────────────────────────────────
// Menu / Navigation (m:)
// ──────────────────────────────────────────────

async function handleMenuCallback(
  data: string,
  userId: string,
  telegramId: number,
): Promise<CallbackResult | null> {
  // m:check — user tapped "Understand a coin or stock"
  if (data === "m:check") {
    return {
      sendText:
        "*Understand a coin or stock*\n\n" +
        "You can send me the *name or ticker* of any crypto (e.g. Bitcoin, SOL, BONK) or stock (e.g. AAPL, Tesla).\n\n" +
        "I'll give you a *plain-English summary*: what it is, why it might be moving, and whether it's worth a closer look — no jargon, no assumed experience.\n\n" +
        "Try it: just type a symbol or name and I'll break it down for you.",
    };
  }

  // m:market — user tapped "What's going on in the markets?"
  if (data === "m:market") {
    return {
      sendText:
        "*What's going on in the markets?*\n\n" +
        '"Markets" here means: *crypto* (Bitcoin, Ethereum, memecoins, etc.), *stocks* (US and global), *commodities* (gold, oil), and *big-picture trends* — what is up, what is down, what people are talking about.\n\n' +
        "I can give you a *short, simple snapshot*: what's hot, what's not, and one or two things that might matter for your next move. No prior knowledge needed.\n\n" +
        'Reply with something like *"Give me a quick overview"* or *"What\'s moving today?"* and I\'ll break it down.',
    };
  }

  // m:ask — user tapped "Ask me anything (markets & money)"
  if (data === "m:ask") {
    return {
      sendText:
        "*Ask me anything — in plain English*\n\n" +
        "You don't need to know fancy terms. Ask the way you'd ask a friend:\n" +
        '• *"What\'s Bitcoin and should I care?"*\n' +
        '• *"Why did [this coin] go up or down?"*\n' +
        '• *"What\'s a good first step to start trading?"*\n' +
        '• *"Explain this news headline."*\n\n' +
        "I'm here for *crypto, stocks, and basic trading ideas*. If you're not sure how to ask, just type what you're curious about and I'll work with it.",
    };
  }

  // m:skills — show /skills overview
  if (data === "m:skills") {
    try {
      const db = getOpenJoeyDB();
      const favorites = await db.getUserFavorites(userId).catch(() => []);
      const favNames = favorites.map((f) => f.skill_name);
      const result = await buildSkillsOverview(favNames);
      return { editText: result.text, editMarkup: result.keyboard, breadcrumb: "Main → Skills" };
    } catch {
      return null;
    }
  }

  // m:main — return to main /start keyboard
  if (data === "m:main") {
    try {
      const db = getOpenJoeyDB();
      const user = await db.getUser(telegramId);
      if (!user) return null;
      const lifecycle = await getUserLifecycleData(db, user);
      const referralStats =
        lifecycle.stage !== "day1" ? await db.getReferralStats(user.id).catch(() => null) : null;
      const watchlistItems =
        lifecycle.stage !== "day1" ? await db.getUserWatchlist(user.id).catch(() => []) : [];
      const favoriteItems =
        lifecycle.stage !== "day1" ? await db.getUserFavorites(user.id).catch(() => []) : [];
      const keyboard = buildStartKeyboard({
        stage: lifecycle.stage,
        referralStats,
        referralCode: user.referral_code,
        watchlistSymbols: watchlistItems.map((w) => w.symbol).slice(0, 5),
        favoriteSkills: favoriteItems.map((f) => f.skill_name).slice(0, 5),
        userAge24h: lifecycle.isOver24h,
      });
      return {
        editText: "\u{1F99E} *OpenJoey* \u2014 Main Menu",
        editMarkup: keyboard,
        breadcrumb: "Main",
      };
    } catch {
      return null;
    }
  }

  // m:research, m:trading, m:alerts — category drill-down (power user)
  if (data === "m:research") {
    return {
      sendText:
        "What do you want to research? Try: 'analyze SOL', 'find new meme coins', or 'crypto news'",
    };
  }
  if (data === "m:trading") {
    return {
      sendText:
        "Trading mode. Try: 'signal for SOL', 'options flow for AAPL', or 'forex analysis EUR/USD'",
    };
  }
  if (data === "m:alerts") {
    return {
      sendText:
        "Alerts & Tracking. Try: 'set alert for SOL above $200', 'track wallet <address>', or /alerts",
    };
  }

  // m:referral — show referral (alias for r:details)
  if (data === "m:referral") {
    return handleReferralCallback("r:details", userId, telegramId);
  }

  return null;
}

// ──────────────────────────────────────────────
// Referral (r:)
// ──────────────────────────────────────────────

async function handleReferralCallback(
  data: string,
  userId: string,
  telegramId: number,
): Promise<CallbackResult | null> {
  const db = getOpenJoeyDB();
  const user = await db.getUser(telegramId);
  if (!user) return null;

  // r:details — full referral modal
  if (data === "r:details") {
    const stats = await db.getReferralStats(user.id);
    const link = `https://t.me/OpenJoeyBot?start=${user.referral_code}`;
    let text = "\u{1F4B0} *Referral Program*\n\n";
    if (stats && stats.total_earned > 0) {
      text += `Earned so far: *$${Number(stats.total_earned).toFixed(2)}*\n`;
      text += `Current balance: $${Number(stats.current_balance).toFixed(2)}\n\n`;
      text += `\u{1F4CA} Stats\n`;
      text += `\u2022 Total referrals: ${stats.total_referrals}\n`;
      text += `\u2022 Converted: ${stats.converted_referrals}\n\n`;
    } else {
      text += "$0.00 earned \u2014 share your link to start!\n\n";
    }
    text += "How it works:\n";
    text += "\u2022 You get $1.80 when they *pay* (first subscription)\n";
    text += "\u2022 They get $1.20 off their first month\n";
    text += "\u2022 Refer 6 friends \u2248 free month\n\n";
    text += `Your link (tap to copy):\n${link}`;
    const rows: KeyboardButton[][] = [
      [
        { text: "\u{1F4E4} Share Link", callback_data: "r:share" },
        { text: "\u{1F519} Back", callback_data: "m:main" },
      ],
    ];
    return { editText: text, editMarkup: rows, breadcrumb: "Main → Referral" };
  }

  // r:share — send the link as a standalone message (easy to forward)
  if (data === "r:share") {
    const link = `https://t.me/OpenJoeyBot?start=${user.referral_code}`;
    return {
      answerText: "Link ready to share!",
      sendText: `Join me on OpenJoey \u2014 you get $1.20 off:\n${link}`,
    };
  }

  return null;
}

// ──────────────────────────────────────────────
// Alerts (a:) — doc §3.7, §5
// ──────────────────────────────────────────────

async function handleAlertsCallback(data: string, userId: string): Promise<CallbackResult | null> {
  const db = getOpenJoeyDB();

  // a:open — show full alerts list (from watchlist "View all alerts")
  if (data === "a:open") {
    const alerts = await db.getUserAlerts(userId, true).catch(() => []);
    if (alerts.length === 0) {
      return {
        sendText:
          '\u{1F514} *Your Active Alerts*\n\nNo active alerts. Say "Set alert for SOL above $200" or use /alerts to create one.',
      };
    }
    let text = "\u{1F514} *Your Active Alerts*\n\n";
    for (const a of alerts) {
      const cond = a.condition === "above" ? "\u2191" : "\u2193";
      text += `\u2022 ${a.token_symbol} ${cond} $${Number(a.target_price).toLocaleString()}\n`;
    }
    text += "\nUse /alerts to manage or turn off alerts.";
    return { sendText: text };
  }

  return null;
}
