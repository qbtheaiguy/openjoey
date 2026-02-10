/**
 * OpenJoey Onboarding
 *
 * Welcome messages, trial management, and command handlers for
 * /start, /subscribe, /status, /referral, /cancel, /help
 */

import type { OpenJoeyRole } from "./session-isolation.js";
import { attributeReferral } from "./referral-system.js";
import {
  deriveSessionKey,
  getSubscriberAllowedSkills,
  getTierLimits,
} from "./session-isolation.js";
import { getOpenJoeyDB } from "./supabase-client.js";

// ──────────────────────────────────────────────
// Welcome message for new users
// ──────────────────────────────────────────────

const TELEGRAM_BOT_USERNAME = "OpenJoeyBot";

/**
 * Day-1 welcome message: short, clear, matches progressive disclosure.
 * No referral, no trial dates, no clutter. The inline keyboard handles CTAs.
 */
export function getWelcomeMessage(
  displayName: string,
  _referralCode: string,
  _trialEndsAt: string,
): string {
  return (
    `Hey ${displayName} — I'm Joey. 🦞\n\n` +
    `I'm your AI trading assistant. I research markets 24/7 so you can focus on execution.\n\n` +
    `Let's start with something simple:\n\n` +
    `💡 Try: "What's happening with SOL?" or "Find new meme coins"`
  );
}

/**
 * Returning-user welcome: shown when existing user taps /start again.
 * Includes referral line + trial/subscription reminder since they're past day-1.
 */
export function getReturningWelcomeMessage(
  displayName: string,
  referralCode: string,
  tier: string,
): string {
  const referralLink = referralCode
    ? `https://t.me/${TELEGRAM_BOT_USERNAME}?start=${referralCode}`
    : "";

  let text =
    `Welcome back, ${displayName}! 🦞\n\n` +
    `Your AI trading assistant is ready. Ask anything or tap the buttons below.`;

  if (tier === "trial") {
    text += `\n\n⏳ You're on a free trial. /subscribe to keep full access.`;
  }

  if (referralLink) {
    text += `\n\n💰 Share & earn: ${referralLink}`;
  }

  return text;
}

// ──────────────────────────────────────────────
// /start command handler
// ──────────────────────────────────────────────

export async function handleStart(
  telegramId: number,
  username?: string,
  displayName?: string,
  referralCode?: string,
): Promise<string> {
  const db = getOpenJoeyDB();
  const result = await db.registerUser(telegramId, username, displayName, referralCode);

  // Resubscribe to announcements when user taps /start
  await db.setBroadcastOptOut(telegramId, false).catch(() => {});

  // If new user and was referred, attribute the referral
  if (result.status === "created" && referralCode) {
    await attributeReferral(result.user_id, referralCode).catch((err) => {
      console.error("[start] attributeReferral failed:", err);
    });
  }

  if (result.status === "existing") {
    const user = await db.getUser(telegramId);
    if (!user) return "Something went wrong. Please try again.";
    return getReturningWelcomeMessage(
      displayName ?? username ?? "trader",
      user.referral_code ?? "",
      user.tier,
    );
  }

  return getWelcomeMessage(
    displayName ?? username ?? "trader",
    result.referral_code ?? "",
    result.trial_ends_at,
  );
}

// ──────────────────────────────────────────────
// /status command handler
// ──────────────────────────────────────────────

interface UserLike {
  tier: string;
  status: string;
  trial_ends_at: string | null;
  subscription_ends_at: string | null;
  credit_balance: number;
  charts_used_today: number;
  referral_code: string;
}

export function getStatusMessage(user: UserLike): string {
  const limits = getTierLimits(user.tier);
  const tierEmoji: Record<string, string> = {
    trial: "🆓",
    free: "🔒",
    trader: "📈",
    premium: "💎",
    annual: "🗓️",
  };

  let msg = `${tierEmoji[user.tier] ?? "📊"} OpenJoey Status\n\n`;
  msg += `Tier: ${user.tier.charAt(0).toUpperCase() + user.tier.slice(1)}\n`;
  msg += `Status: ${user.status}\n`;

  if (user.tier === "trial" && user.trial_ends_at) {
    const hoursLeft = Math.max(
      0,
      Math.round((new Date(user.trial_ends_at).getTime() - Date.now()) / 3600000),
    );
    msg += `Trial ends in: ${hoursLeft} hours\n`;
  }

  if (user.subscription_ends_at) {
    const daysLeft = Math.ceil(
      (new Date(user.subscription_ends_at).getTime() - Date.now()) / 86400000,
    );
    msg += `Subscription renews in: ${daysLeft} days\n`;
  }

  msg += `\n📊 Usage today: ${user.charts_used_today}`;
  if (limits.chartsPerDay !== "unlimited") {
    msg += `/${limits.chartsPerDay}`;
  }
  msg += ` charts\n`;
  msg += `💰 Credit balance: $${user.credit_balance.toFixed(2)}\n`;
  msg += `🔗 Referral code: ${user.referral_code}\n`;

  if (user.tier === "free" || user.status === "expired") {
    msg += `\n→ Subscribe for $10/month: /subscribe`;
  }

  return msg;
}

export async function handleStatus(telegramId: number): Promise<string> {
  const db = getOpenJoeyDB();
  const user = await db.getUser(telegramId);
  if (!user) {
    return "You don't have an account yet. Send /start to begin your free trial!";
  }
  return getStatusMessage(user);
}

// ──────────────────────────────────────────────
// /subscribe command handler
// ──────────────────────────────────────────────

export async function handleSubscribe(
  telegramId: number,
  tier: "trader" | "premium" | "annual" = "trader",
): Promise<string> {
  const db = getOpenJoeyDB();
  const user = await db.getUser(telegramId);
  if (!user) {
    return "Send /start first to create your account!";
  }

  if (user.tier === "trader" || user.tier === "premium" || user.tier === "annual") {
    return `You're already subscribed on the *${user.tier}* plan! 🎉`;
  }

  try {
    const checkout = await db.createCheckoutSession(telegramId, tier);
    const prices: Record<string, string> = {
      trader: "$10/month",
      premium: "$29/month",
      annual: "$96/year (save $24!)",
    };

    return (
      `💳 *Subscribe to OpenJoey ${tier.charAt(0).toUpperCase() + tier.slice(1)}*\n\n` +
      `Price: ${prices[tier]}\n\n` +
      `Click below to complete your subscription:\n${checkout.checkout_url}\n\n` +
      `After payment, your account upgrades instantly.`
    );
  } catch (err) {
    console.error("[openjoey] checkout error:", err);
    return "Something went wrong creating your checkout. Please try again in a moment.";
  }
}

// ──────────────────────────────────────────────
// /referral command handler
// ──────────────────────────────────────────────

export async function handleReferral(telegramId: number): Promise<string> {
  const db = getOpenJoeyDB();
  const user = await db.getUser(telegramId);
  if (!user) return "Send /start first!";

  const stats = await db.getReferralStats(user.id);

  let msg = `🔗 *Your Referral Program*\n\n`;
  msg += `Your link: openjoey.com/start?ref=${user.referral_code}\n\n`;
  msg += `How it works:\n`;
  msg += `• You get $1.80 per referred subscriber\n`;
  msg += `• They get $1.20 off their first month\n`;
  msg += `• Credits stack — refer 6 friends = free month!\n\n`;

  if (stats) {
    msg += `📊 Your Stats:\n`;
    msg += `• Total referrals: ${stats.total_referrals}\n`;
    msg += `• Converted: ${stats.converted_referrals}\n`;
    msg += `• Total earned: $${Number(stats.total_earned).toFixed(2)}\n`;
    msg += `• Current balance: $${Number(stats.current_balance).toFixed(2)}\n`;
  } else {
    msg += `No referrals yet — share your link to start earning!`;
  }

  return msg;
}

// ──────────────────────────────────────────────
// /help command handler
// ──────────────────────────────────────────────

export function getHelpMessage(tier: string, role: OpenJoeyRole): string {
  const skills = getSubscriberAllowedSkills();

  let msg = `🦞 *OpenJoey Help*\n\n`;
  msg += `*Trading Commands:*\n`;
  msg += `• Send any token symbol for analysis (e.g. "SOL", "BONK")\n`;
  msg += `• "Analyze [token]" — Full signal fusion report\n`;
  msg += `• "Deep dive [token]" — Trading god research\n`;
  msg += `• "Alert me when [token] hits $X" — Set price alert\n`;
  msg += `• /alerts — View your active alerts\n`;
  msg += `• "Track wallet [address]" — Watch a whale wallet\n`;
  msg += `• "Check whales" — See whale activity\n`;

  msg += `\n*Account Commands:*\n`;
  msg += `/start — Create account / restart\n`;
  msg += `/status — Your account status\n`;
  msg += `/subscribe — Upgrade your plan\n`;
  msg += `/referral — Your referral link & stats\n`;
  msg += `/cancel — Cancel subscription\n`;
  msg += `/help — This message\n`;

  msg += `\n*Your tier:* ${tier}\n`;
  msg += `*Available skills:* ${skills.join(", ")}\n`;
  if (role === "admin") {
    msg += `\n🔧 *You're logged in as Admin* — full skill access (including coding).\n`;
  }

  if (tier === "free") {
    msg += `\n💡 Upgrade for higher limits and more → /subscribe`;
  }

  return msg;
}

// ──────────────────────────────────────────────
// /cancel command handler
// ──────────────────────────────────────────────

export async function handleCancel(telegramId: number): Promise<string> {
  const db = getOpenJoeyDB();
  const user = await db.getUser(telegramId);
  if (!user) return "Send /start first!";

  if (user.tier === "free" || user.tier === "trial") {
    return "You don't have an active subscription to cancel.";
  }

  // Note: actual Stripe cancellation happens via Stripe customer portal
  // This just provides the info
  return (
    `To cancel your subscription:\n\n` +
    `1. Your access continues until the end of your billing period\n` +
    `2. Your data is retained for 30 days\n` +
    `3. Credits remain for 30 days (reactivate to restore)\n\n` +
    `To proceed, visit your billing portal or contact support.\n` +
    `We're sorry to see you go! 🦞`
  );
}

// ──────────────────────────────────────────────
// /stop — unsubscribe from admin broadcast announcements
// ──────────────────────────────────────────────

export async function handleStop(telegramId: number): Promise<string> {
  const db = getOpenJoeyDB();
  await db.setBroadcastOptOut(telegramId, true).catch(() => {});
  return "🔕 You've unsubscribed from announcements.\n\n" + "Use /start to resubscribe.";
}
