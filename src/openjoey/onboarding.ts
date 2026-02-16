/**
 * OpenJoey Onboarding
 *
 * Welcome messages, trial management, and command handlers for
 * /start, /subscribe, /status, /referral, /cancel, /help
 */

import type { OpenJoeyRole } from "./session-isolation.js";
import { attributeReferral } from "./referral-system.js";
import { getSubscriberAllowedSkills, getTierLimits } from "./session-isolation.js";
import { getOpenJoeyDB } from "./supabase-client.js";

// ──────────────────────────────────────────────
// Welcome message for new users
// ──────────────────────────────────────────────

const TELEGRAM_BOT_USERNAME = "OpenJoeyBot";

/**
 * Day-1 welcome message: warm, compelling, benefit-focused.
 * Introduces Joey's personality and core value proposition.
 */
export function getWelcomeMessage(
  displayName: string,
  _referralCode: string,
  _trialEndsAt: string,
): string {
  return (
    `Hey there ${displayName}! I'm Joey �💙\n\n` +
    `Your personal AI trading companion, here to make crypto simple, smart, and stress-free.\n\n` +
    `✨ *WHAT I DO FOR YOU:*\n\n` +
    `🔍 *Instant Market Intel*\n` +
    `→ Check any token price in 3 seconds\n` +
    `→ Spot trending opportunities before they blow up\n` +
    `→ Get chain-specific risk analysis (not just raw numbers)\n\n` +
    `🎯 *Smart Alerts*\n` +
    `→ "Hey Joey, alert me when ETH hits \$2,500"\n` +
    `→ I watch the markets 24/7 so you don't have to\n` +
    `→ Never miss a move that matters to YOUR portfolio\n\n` +
    `📊 *Your Portfolio, Understood*\n` +
    `→ See your holdings across all chains\n` +
    `→ Risk-adjusted insights, not just dollar values\n` +
    `→ Know when to hold, when to watch, when to act\n\n` +
    `🐋 *Whale Intelligence*\n` +
    `→ Track big money moves before they hit the news\n` +
    `→ Know when smart money is buying or selling\n` +
    `→ Stay ahead of market sentiment shifts\n\n` +
    `� *Just Talk to Me*\n` +
    `No need to learn complex commands! Just ask naturally:\n` +
    `• "Should I buy SOL right now?"\n` +
    `• "What's hot in the market today?"\n` +
    `• "Is my portfolio looking risky?"\n` +
    `• "Alert me if BNB drops 5%"\n\n` +
    `🛡️ *TRADE SMARTER, NOT HARDER*\n\n` +
    `I combine real-time data from Binance & DexScreener with AI-powered analysis to give you:\n` +
    `✓ Clear, actionable insights (no cryptic charts)\n` +
    `✓ Risk warnings when things look shaky\n` +
    `✓ Confidence scores so you know what's solid vs. speculative\n\n` +
    `Ready to dive in? Try:\n` +
    `• /price ETH — Check Ethereum now\n` +
    `• /trending — See what's heating up\n` +
    `• /help — Learn all my tricks\n\n` +
    `Or just tell me what you're curious about! 💙`
  );
}

/**
 * Returning-user welcome: warm re-engagement with clear next steps.
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
    `Welcome back, ${displayName}! 💙\n\n` +
    `Joey's been watching the markets for you. Here's what's ready:\n\n` +
    `• /price — Check any token instantly\n` +
    `• /trending — See what's heating up\n` +
    `• /portfolio — Your holdings & risk analysis\n` +
    `• /alerts — Your price alerts\n\n` +
    `Or just ask me anything! 💙`;

  if (tier === "trial") {
    text += `\n\n⏳ You're on a free trial. /subscribe to keep full access.`;
  }

  if (referralLink) {
    text += `\n\n💰 Share & earn: ${referralLink}`;
  }

  return text;
}

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
    if (!user) {
      return "Something went wrong. Please try again.";
    }
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
  if (!user) {
    return "Send /start first!";
  }

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

  let msg = `🤖💙 *Joey's Command Guide*\n\n`;

  msg += `*🎯 CORE COMMANDS — Start Here:*\n\n`;

  msg += `💰 */price* — Check any token instantly\n`;
  msg += `   _Example: /price ETH or just "What's SOL doing?"_\n\n`;

  msg += `🔥 */trending* — See what's heating up right now\n`;
  msg += `   _Spot opportunities before they blow up_\n\n`;

  msg += `📊 */portfolio* — Your complete holdings & risk analysis\n`;
  msg += `   _Know when to hold, when to watch, when to act_\n\n`;

  msg += `🔔 */alerts* — Set smart price alerts\n`;
  msg += `   _Example: "Alert me when ETH hits $2,500"_\n\n`;

  msg += `🐋 */whale* — Track big money moves\n`;
  msg += `   _See what smart money is doing before the news_\n\n`;

  msg += `*💬 JUST TALK TO ME:*\n`;
  msg += `No need to memorize commands! Ask naturally:\n`;
  msg += `• "Should I buy SOL right now?"\n`;
  msg += `• "Is my portfolio looking risky?"\n`;
  msg += `• "What's hot in the market today?"\n`;
  msg += `• "Compare ETH vs BNB"\n\n`;

  msg += `*⚙️ ACCOUNT:*\n`;
  msg += `• /status — Your account & usage\n`;
  msg += `• /subscribe — Upgrade your plan\n`;
  msg += `• /referral — Share & earn rewards\n`;
  msg += `• /start — Restart this welcome message\n\n`;

  if (tier === "free" || tier === "trial") {
    msg += `⏳ *You're on ${tier}.* Upgrade for unlimited access → /subscribe\n\n`;
  }

  msg += `*Need more help?* Just ask me anything! 💙`;

  return msg;
}

// ──────────────────────────────────────────────
// /cancel command handler
// ──────────────────────────────────────────────

export async function handleCancel(telegramId: number): Promise<string> {
  const db = getOpenJoeyDB();
  const user = await db.getUser(telegramId);
  if (!user) {
    return "Send /start first!";
  }

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
    `We're sorry to see you go! �💙`
  );
}

// ──────────────────────────────────────────────
// /stop — unsubscribe from admin broadcast announcements
// ──────────────────────────────────────────────

export async function handleStop(telegramId: number): Promise<string> {
  const db = getOpenJoeyDB();
  await db.setBroadcastOptOut(telegramId, true).catch(() => {});
  return "🔕 You've unsubscribed from announcements.\n\nUse /start to resubscribe.";
}
