/**
 * OpenJoey Session Isolation
 *
 * Each Telegram user gets their own isolated session.
 * Session key format: user:{telegram_id}
 *
 * This module maps Telegram user IDs to OpenClaw session keys
 * and ensures strict data isolation between users.
 */

import { getOpenJoeyDB } from "./supabase-client.js";

export interface SessionInfo {
  sessionKey: string;
  userId: string;
  telegramId: number;
  tier: string;
  status: string;
}

/**
 * Derive the OpenClaw session key from a Telegram user ID.
 * This key is used by the gateway to isolate memory, history, and context.
 */
export function deriveSessionKey(telegramId: number): string {
  return `user:${telegramId}`;
}

/**
 * Determine which skills a user has access to based on their tier.
 *
 * Guru Skills Hierarchy:
 * - Free/Trial: Basic analysis skills
 * - Trader/Annual: Multi-asset + alerts + whale tracking
 * - Premium: Everything + options + advanced features
 */
export function getAllowedSkills(tier: string): string[] {
  // Core analysis skills - available to most tiers except Free
  const CORE_SKILLS = [
    "edy", // Personalized skill for Edy (GBP/USD, Gold, DJ30, GER40, NSDQ100) 💕
  ];

  // Professional trading skills - available to trial and subscribers
  const TRADING_SKILLS = [
    "signal-guru", // Master multi-asset analyzer
    "research-guru", // Deep research system
    "crypto-guru", // Crypto-specific deep dives
    "meme-guru", // Meme coin degen intelligence
    "stock-guru", // Stocks & ETFs
    "forex-guru", // Currency pairs
    "commodity-guru", // Gold, oil, etc.
    "sentiment-tracker", // NEW: Social sentiment
    "dex-scanner", // NEW: DEX discovery
    "insider-tracker", // NEW: SEC/Whale tracking
    "penny-stock-scanner", // NEW: Micro-cap breaks
    "market-scanner", // NEW: Global filtering
    "news-alerts", // NEW: Breaking news
    "economic-calendar", // NEW: Macro events
  ];

  // Subscriber-only skills - trader, annual, premium
  const SUBSCRIBER_SKILLS = [
    "whale-guru", // Whale tracking & smart money
    "alert-guru", // Price alerts (background monitoring)
    "unusual-options", // NEW: Block trades/sweeps
    "central-bank-watch", // NEW: Fed/ECB policy
    "correlation-tracker", // NEW: Cross-asset links
    "futures-analyzer", // NEW: OI/Funding/Liqs
    "cot-analyzer", // NEW: Institutional positions
  ];

  // Premium-only skills
  const PREMIUM_SKILLS = [
    "options-guru", // Options chain analysis & Greeks
    "options-strategy", // NEW: Multi-leg builder
    "trading-god-pro", // NEW: Institutional research
    "api-access", // Direct API access
  ];

  switch (tier) {
    case "trial":
      // Trial gets absolute access to trading skills + alerts
      return [...CORE_SKILLS, ...TRADING_SKILLS, "alert-guru"];
    case "free":
      // Free tier gets minimal skills
      return CORE_SKILLS;
    case "trader":
    case "annual":
      // Full subscriber access except premium specific
      return [...CORE_SKILLS, ...TRADING_SKILLS, ...SUBSCRIBER_SKILLS];
    case "premium":
      // Everything unlocked
      return [...CORE_SKILLS, ...TRADING_SKILLS, ...SUBSCRIBER_SKILLS, ...PREMIUM_SKILLS];
    default:
      return CORE_SKILLS;
  }
}

/**
 * Determine which permissions a user has based on their tier.
 */
export function getTierPermissions(tier: string): string[] {
  const BASE = ["run_analysis"];
  const SUBSCRIBER = [
    "create_alerts",
    "view_history",
    "referral_program",
    "data_export",
    "cron_jobs",
  ];
  const PREMIUM = ["api_access", "priority_support"];

  switch (tier) {
    case "trial":
      return [...BASE, "create_alerts"]; // Limited alerts
    case "free":
      return BASE;
    case "trader":
    case "annual":
      return [...BASE, ...SUBSCRIBER];
    case "premium":
      return [...BASE, ...SUBSCRIBER, ...PREMIUM];
    default:
      return BASE;
  }
}

/**
 * Get tier limits for display or enforcement.
 */
export function getTierLimits(tier: string): {
  chartsPerDay: number | "unlimited";
  maxAlerts: number | "unlimited";
  cronJobs: boolean;
  dataExport: boolean;
  whaleTracking: boolean;
  apiAccess: boolean;
} {
  switch (tier) {
    case "trial":
      return {
        chartsPerDay: "unlimited",
        maxAlerts: 5,
        cronJobs: false,
        dataExport: false,
        whaleTracking: false,
        apiAccess: false,
      };
    case "free":
      return {
        chartsPerDay: 1,
        maxAlerts: 0,
        cronJobs: false,
        dataExport: false,
        whaleTracking: false,
        apiAccess: false,
      };
    case "trader":
    case "annual":
      return {
        chartsPerDay: "unlimited",
        maxAlerts: "unlimited",
        cronJobs: true,
        dataExport: true,
        whaleTracking: true,
        apiAccess: false,
      };
    case "premium":
      return {
        chartsPerDay: "unlimited",
        maxAlerts: "unlimited",
        cronJobs: true,
        dataExport: true,
        whaleTracking: true,
        apiAccess: true,
      };
    default:
      return {
        chartsPerDay: 1,
        maxAlerts: 0,
        cronJobs: false,
        dataExport: false,
        whaleTracking: false,
        apiAccess: false,
      };
  }
}

/**
 * Resolve a Telegram message into a session context.
 * Called by the gateway when a Telegram message arrives.
 */
export async function resolveSession(
  telegramId: number,
  telegramUsername?: string,
  telegramChatId?: number,
): Promise<SessionInfo> {
  const db = getOpenJoeyDB();
  const sessionKey = deriveSessionKey(telegramId);

  // Get or create user
  const user = await db.getUser(telegramId);
  if (!user) {
    // Auto-register on first message (Supabase users + sessions tables; gateway has session)
    const result = await db.registerUser(telegramId, telegramUsername);
    await db.upsertSession(result.user_id, sessionKey, telegramChatId);
    await db.logUsage(result.user_id, "user_registered").catch(() => {});
    return {
      sessionKey,
      userId: result.user_id,
      telegramId,
      tier: result.tier,
      status: "trial",
    };
  }

  // Update session activity
  await db.upsertSession(user.id, sessionKey, telegramChatId);

  return {
    sessionKey,
    userId: user.id,
    telegramId,
    tier: user.tier,
    status: user.status,
  };
}
