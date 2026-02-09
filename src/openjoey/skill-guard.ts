/**
 * OpenJoey Skill Guard
 *
 * Intercepts skill execution requests and enforces tier + quota limits.
 * Part of the V2 Multi-Layer Enforcement Architecture.
 */

import { getAllowedSkills } from "./session-isolation.js";
import { getOpenJoeyDB } from "./supabase-client.js";

export interface SkillExecutionContext {
  telegramId: number;
  userId: string;
  tier: string;
  skillName: string;
  userQuery: string;
}

export interface SkillGuardDecision {
  allowed: boolean;
  blockMessage?: string;
  shouldLogUsage: boolean;
  costTier: "free" | "standard" | "expensive";
}

// Skill definitions with metadata
export const SKILL_METADATA: Record<
  string,
  {
    displayName: string;
    costTier: "free" | "standard" | "expensive";
  }
> = {
  // Trading Skills (Most tiers)
  "signal-guru": { displayName: "Signal Guru", costTier: "standard" },
  "research-guru": { displayName: "Research Guru", costTier: "standard" },
  "crypto-guru": { displayName: "Crypto Guru", costTier: "standard" },
  "meme-guru": { displayName: "Meme Guru", costTier: "standard" },
  "stock-guru": { displayName: "Stock Guru", costTier: "standard" },
  "forex-guru": { displayName: "Forex Guru", costTier: "standard" },
  "commodity-guru": { displayName: "Commodity Guru", costTier: "standard" },
  "whale-guru": { displayName: "Whale Guru", costTier: "standard" },
  "alert-guru": { displayName: "Alert Guru", costTier: "free" },
  "sentiment-tracker": { displayName: "Sentiment Tracker", costTier: "standard" },
  "dex-scanner": { displayName: "DEX Scanner", costTier: "standard" },
  "insider-tracker": { displayName: "Insider Tracker", costTier: "standard" },
  "penny-stock-scanner": { displayName: "Penny Stock Scanner", costTier: "standard" },
  "market-scanner": { displayName: "Market Scanner", costTier: "standard" },
  "news-alerts": { displayName: "News Alerts", costTier: "standard" },
  "economic-calendar": { displayName: "Economic Calendar", costTier: "standard" },

  // Subscriber-only skills
  "unusual-options": { displayName: "Unusual Options", costTier: "standard" },
  "central-bank-watch": { displayName: "Central Bank Watch", costTier: "standard" },
  "correlation-tracker": { displayName: "Correlation Tracker", costTier: "standard" },
  "futures-analyzer": { displayName: "Futures Analyzer", costTier: "standard" },
  "cot-analyzer": { displayName: "COT Analyzer", costTier: "standard" },

  // Premium-only skills
  "options-guru": { displayName: "Options Guru", costTier: "expensive" },
  "options-strategy": { displayName: "Options Strategy", costTier: "expensive" },
  "trading-god-pro": { displayName: "Trading God Pro", costTier: "expensive" },
  edy: { displayName: "Edy", costTier: "standard" },
};

// Daily limits per tier (calls per day)
// -1 = unlimited
const DAILY_LIMITS: Record<string, { standard: number; expensive: number }> = {
  trial: { standard: 50, expensive: 10 },
  free: { standard: 5, expensive: 1 },
  trader: { standard: 200, expensive: 20 },
  annual: { standard: 200, expensive: 20 },
  premium: { standard: -1, expensive: 100 },
};

/**
 * Check if a user can use a specific skill based on tier and quotas.
 */
export async function guardSkillExecution(ctx: SkillExecutionContext): Promise<SkillGuardDecision> {
  const db = getOpenJoeyDB();

  // 1. Fetch skill metadata from DB or fallback
  let skillMeta = SKILL_METADATA[ctx.skillName];
  try {
    const catalogRow = await db.getSkillMetadata(ctx.skillName);
    if (catalogRow) {
      skillMeta = {
        displayName: catalogRow.display_name,
        costTier: catalogRow.cost_tier as any,
      };
    }
  } catch (err) {
    console.error("[openjoey] failed to fetch skill metadata from DB:", err);
  }

  // 2. Check tier access (Role-Based Access Control)
  const allowedSkills = getAllowedSkills(ctx.tier);
  if (!allowedSkills.includes(ctx.skillName)) {
    const displayName = skillMeta?.displayName || ctx.skillName;
    return {
      allowed: false,
      blockMessage: `🔒 ${displayName} is not available on your current plan. Upgrade to unlock it → /subscribe`,
      shouldLogUsage: false,
      costTier: skillMeta?.costTier || "standard",
    };
  }

  const costTier = skillMeta?.costTier ?? "standard";

  // 3. Check daily quotas (Resource-Based Access Control)
  const limits = DAILY_LIMITS[ctx.tier] || DAILY_LIMITS.free;

  try {
    const quota = await db.getUserQuota(ctx.userId);

    if (costTier === "expensive" && limits.expensive >= 0) {
      if (quota.daily_expensive_skill_calls_used >= limits.expensive) {
        return {
          allowed: false,
          blockMessage: `⚠️ You've reached your daily limit for advanced analysis (${limits.expensive} calls). Resets at midnight UTC. Upgrade for higher limits → /upgrade`,
          shouldLogUsage: false,
          costTier,
        };
      }
    }

    if (costTier === "standard" && limits.standard >= 0) {
      if (quota.daily_skill_calls_used >= limits.standard) {
        return {
          allowed: false,
          blockMessage: `⚠️ Daily analysis limit reached (${limits.standard} calls). Upgrade for unlimited access → /subscribe`,
          shouldLogUsage: false,
          costTier,
        };
      }
    }
  } catch (err) {
    // Fail open - don't block users due to database errors
    console.error("[openjoey] quota check failed:", err);
  }

  return {
    allowed: true,
    shouldLogUsage: true,
    costTier,
  };
}

/**
 * Log the execution of a skill and increment quota counters.
 */
export async function logSkillExecution(
  ctx: SkillExecutionContext,
  costTier: "free" | "standard" | "expensive",
  success: boolean,
  executionTimeMs: number,
  tokensUsed?: number,
  errorMessage?: string,
): Promise<void> {
  const db = getOpenJoeyDB();

  // Cost estimation (rough, for analytics)
  const costMap = { free: 0, standard: 0.05, expensive: 0.15 };
  const cost = costMap[costTier];

  try {
    await db.logSkillUsage(ctx.userId, ctx.skillName, {
      cost_usd: cost,
      tokens_used: tokensUsed ?? 0,
      execution_time_ms: executionTimeMs,
      success,
      error_message: errorMessage,
      skill_category: ctx.tier === "premium" ? "premium" : "standard",
    });

    // Increment quota counters
    await db.incrementQuota(ctx.userId, costTier);
  } catch (err) {
    console.error("[openjoey] failed to log skill usage:", err);
  }
}
