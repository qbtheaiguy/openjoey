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

/** Admin = full skill access (including coding). Subscriber = trading, research, chat only. */
export type OpenJoeyRole = "admin" | "subscriber";

export interface SessionInfo {
  sessionKey: string;
  userId: string;
  telegramId: number;
  tier: string;
  status: string;
  /** Determines skill access: admin = all skills, subscriber = trading/research/chat only. */
  role: OpenJoeyRole;
}

/**
 * Derive the OpenClaw session key from a Telegram user ID.
 * This key is used by the gateway to isolate memory, history, and context.
 */
export function deriveSessionKey(telegramId: number): string {
  return `user:${telegramId}`;
}

/**
 * Whether the Telegram user is an admin (full skill access including coding).
 * Set OPENJOEY_ADMIN_TELEGRAM_IDS to a comma-separated list of Telegram user IDs.
 */
export function isAdmin(telegramId: number): boolean {
  const raw = process.env.OPENJOEY_ADMIN_TELEGRAM_IDS?.trim();
  if (!raw) {
    return false;
  }
  const ids = raw.split(",").map((s) => parseInt(s.trim(), 10));
  return ids.includes(telegramId);
}

/**
 * Skills allowed for subscribers only (trading, research, conversational).
 * No coding / app / website skills — those are admin-only.
 */
export function getSubscriberAllowedSkills(): string[] {
  const CORE = ["edy", "signal-guru", "research-guru", "crypto-guru", "meme-guru"];
  const TRADING = [
    "stock-guru",
    "forex-guru",
    "commodity-guru",
    "sentiment-tracker",
    "dex-scanner",
    "insider-tracker",
    "penny-stock-scanner",
    "market-scanner",
    "news-alerts",
    "economic-calendar",
  ];
  const SUBSCRIBER = [
    "whale-guru",
    "alert-guru",
    "unusual-options",
    "central-bank-watch",
    "correlation-tracker",
    "futures-analyzer",
    "cot-analyzer",
  ];
  const PREMIUM = ["options-guru", "options-strategy", "trading-god-pro"];
  return [...CORE, ...TRADING, ...SUBSCRIBER, ...PREMIUM];
}

/**
 * Skills allowed for this role. Admin gets undefined (no filter = all skills).
 * Subscriber gets trading/research/chat only.
 */
export function getAllowedSkillsForRole(role: OpenJoeyRole): string[] | undefined {
  if (role === "admin") {
    return undefined;
  }
  return getSubscriberAllowedSkills();
}

/**
 * @deprecated Use getAllowedSkillsForRole(session.role). Kept for skill-guard backward compat.
 */
export function getAllowedSkills(_tier: string): string[] {
  return getSubscriberAllowedSkills();
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

  const role: OpenJoeyRole = isAdmin(telegramId) ? "admin" : "subscriber";

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
      role,
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
    role,
  };
}
