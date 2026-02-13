import type { OpenJoeyRole } from "./session-isolation.js";
import { getAllowedSkillsForRole } from "./session-isolation.js";
import { getOpenJoeyDB } from "./supabase-client.js";

export interface SkillExecutionContext {
  telegramId: number;
  userId: string;
  tier: string;
  role: OpenJoeyRole;
  skillName: string;
  userQuery: string;
}

export interface SkillGuardDecision {
  allowed: boolean;
  blockMessage?: string;
  shouldLogUsage: boolean;
  costTier: "free" | "standard" | "expensive";
}

type CostTier = SkillGuardDecision["costTier"];

export const SKILL_METADATA: Record<
  string,
  {
    displayName: string;
    costTier: "free" | "standard" | "expensive";
  }
> = {
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
  "unusual-options": { displayName: "Unusual Options", costTier: "standard" },
  "central-bank-watch": { displayName: "Central Bank Watch", costTier: "standard" },
  "correlation-tracker": { displayName: "Correlation Tracker", costTier: "standard" },
  "futures-analyzer": { displayName: "Futures Analyzer", costTier: "standard" },
  "cot-analyzer": { displayName: "COT Analyzer", costTier: "standard" },
  "options-guru": { displayName: "Options Guru", costTier: "expensive" },
  "options-strategy": { displayName: "Options Strategy", costTier: "expensive" },
  "trading-god-pro": { displayName: "Trading God Pro", costTier: "expensive" },
  edy: { displayName: "Edy", costTier: "standard" },
};
const DAILY_LIMITS: Record<string, { standard: number; expensive: number }> = {
  trial: { standard: 50, expensive: 10 },
  free: { standard: 5, expensive: 1 },
  trader: { standard: 200, expensive: 20 },
  annual: { standard: 200, expensive: 20 },
  premium: { standard: -1, expensive: 100 },
};

const ALLOWED_CATEGORIES = new Set(["trading", "research", "alerts", "crypto", "options"]);

export async function guardSkillExecution(ctx: SkillExecutionContext): Promise<SkillGuardDecision> {
  const db = getOpenJoeyDB();

  let skillMeta = SKILL_METADATA[ctx.skillName];
  try {
    const catalogRow = await db.getSkillMetadata(ctx.skillName);
    if (catalogRow) {
      const costTier: CostTier =
        catalogRow.cost_tier === "free" ||
        catalogRow.cost_tier === "standard" ||
        catalogRow.cost_tier === "expensive"
          ? catalogRow.cost_tier
          : "standard";
      skillMeta = {
        displayName: catalogRow.display_name,
        costTier,
      };
    }
  } catch (err) {
    console.error("[openjoey] failed to fetch skill metadata from DB:", err);
  }

  const allowedSkills = getAllowedSkillsForRole(ctx.role);
  if (allowedSkills !== undefined && !allowedSkills.includes(ctx.skillName)) {
    const displayName = skillMeta?.displayName || ctx.skillName;
    return {
      allowed: false,
      blockMessage: `🔒 ${displayName} is not available. Available categories: trading, research, alerts, crypto, options.`,
      shouldLogUsage: false,
      costTier: skillMeta?.costTier || "standard",
    };
  }

  if (ctx.role !== "admin") {
    try {
      const rows = await db.get<{ category: string | null }>(
        "skill_catalog",
        `select=category&id=eq.${encodeURIComponent(ctx.skillName)}&limit=1`,
      );
      const category = rows[0]?.category ?? null;
      if (category && !ALLOWED_CATEGORIES.has(category)) {
        const displayName = skillMeta?.displayName || ctx.skillName;
        return {
          allowed: false,
          blockMessage: `🔒 ${displayName} is not available. Available categories: trading, research, alerts, crypto, options.`,
          shouldLogUsage: false,
          costTier: skillMeta?.costTier || "standard",
        };
      }
    } catch (err) {
      console.error("[openjoey] failed to fetch skill category from DB:", err);
    }
  }

  const costTier = skillMeta?.costTier ?? "standard";

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
    console.error("[openjoey] quota check failed:", err);
  }

  return {
    allowed: true,
    shouldLogUsage: true,
    costTier,
  };
}

export async function logSkillExecution(
  ctx: SkillExecutionContext,
  costTier: "free" | "standard" | "expensive",
  success: boolean,
  executionTimeMs: number,
  tokensUsed?: number,
  errorMessage?: string,
): Promise<void> {
  const db = getOpenJoeyDB();
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

    await db.incrementQuota(ctx.userId, costTier);
  } catch (err) {
    console.error("[openjoey] failed to log skill usage:", err);
  }
}
