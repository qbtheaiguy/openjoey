/**
 * OpenJoey Tier Middleware
 *
 * Checks user tier + limits before allowing an action.
 * Used by the gateway hook system to gate skill execution.
 */

import { getOpenJoeyDB, type TierAccessResult } from "./supabase-client.js";

export type TierAction =
  | "chart_analysis"
  | "create_alert"
  | "whale_watch"
  | "data_export"
  | "api_call";

export interface TierGateResult {
  allowed: boolean;
  tier: string;
  status: string;
  userId: string;
  reason?: string;
  upsellMessage?: string;
}

// FOMO / upsell messages keyed by denial reason
const UPSELL_MESSAGES: Record<string, string> = {
  daily_limit_reached:
    "🔓 That was your free chart for today. Imagine having me watch 24/7 with unlimited scans and instant alerts... Subscribe for $10/month → /subscribe",
  alerts_require_subscription:
    "⚠️ Price alerts require an active subscription. Subscribe for $10/month to get unlimited alerts with background monitoring → /subscribe",
  trial_alert_limit:
    "⚠️ You've reached the trial limit of 5 active alerts. Subscribe to get unlimited alerts → /subscribe",
  whale_tracking_requires_subscription:
    "🐋 Whale tracking requires an active subscription. Subscribe for $10/month → /subscribe",
  export_requires_subscription:
    "📤 Data export requires an active subscription. Subscribe for $10/month → /subscribe",
  api_requires_premium: "🔌 API access requires the Premium plan ($29/month). Upgrade → /upgrade",
  tier_not_eligible: "This feature is not available on your current plan. Upgrade → /subscribe",
  user_not_found:
    "Welcome to OpenJoey! Send /start to create your account and begin your 3-day free trial.",
};

/**
 * Check whether a Telegram user is allowed to perform a given action.
 */
export async function checkTierGate(
  telegramId: number,
  action: TierAction,
): Promise<TierGateResult> {
  const db = getOpenJoeyDB();
  let access: TierAccessResult;

  try {
    access = await db.checkTierAccess(telegramId, action);
  } catch (err) {
    console.error("[openjoey] tier check failed:", err);
    // Fail open for now (let the user through) — we don't want DB outages to block everyone
    return {
      allowed: true,
      tier: "unknown",
      status: "unknown",
      userId: "",
      reason: "tier_check_failed",
    };
  }

  if (access.allowed) {
    return {
      allowed: true,
      tier: access.tier,
      status: access.status,
      userId: access.user_id,
    };
  }

  return {
    allowed: false,
    tier: access.tier,
    status: access.status,
    userId: access.user_id,
    reason: access.reason,
    upsellMessage: UPSELL_MESSAGES[access.reason] ?? UPSELL_MESSAGES.tier_not_eligible,
  };
}

/**
 * Post-analysis hook: record usage + maybe show FOMO.
 * Call this AFTER a successful chart analysis.
 */
export async function postAnalysisHook(telegramId: number): Promise<string | null> {
  const db = getOpenJoeyDB();

  try {
    await db.recordChartUsage(telegramId);
    const user = await db.getUser(telegramId);
    if (!user) return null;

    // Free tier users get a FOMO message after their chart
    if (user.tier === "free") {
      return (
        "\n\n---\n🔓 That was your free chart for today. " +
        "Want me to watch 24/7 and alert you the moment it moves? " +
        "Subscribe for $10/month → /subscribe"
      );
    }

    // Trial users get a gentle nudge
    if (user.tier === "trial" && user.trial_ends_at) {
      const endsAt = new Date(user.trial_ends_at);
      const hoursLeft = Math.max(0, Math.round((endsAt.getTime() - Date.now()) / 3600000));
      if (hoursLeft <= 24) {
        return (
          `\n\n---\n⏰ Your trial ends in ${hoursLeft} hours. ` +
          "Subscribe to keep unlimited access → /subscribe"
        );
      }
    }

    return null;
  } catch (err) {
    console.error("[openjoey] postAnalysisHook error:", err);
    return null;
  }
}

/**
 * Conversion trigger messages based on user behavior.
 * Call periodically or on specific events.
 */
export function getConversionTrigger(
  tier: string,
  daysSinceTrial: number,
  chartsUsedTotal: number,
): string | null {
  if (tier !== "free") return null;

  if (daysSinceTrial >= 7) {
    return (
      "📊 You've been on the free tier for a week now. " +
      "You've missed out on real-time alerts, whale tracking, and unlimited analysis. " +
      "Ready to come back? $10/month unlocks everything → /subscribe"
    );
  }

  if (chartsUsedTotal >= 3) {
    return (
      `📈 ${chartsUsedTotal} insights so far, but 0 alerts watching for you. ` +
      "Upgrade and I'll monitor 24/7 → /subscribe"
    );
  }

  return null;
}
