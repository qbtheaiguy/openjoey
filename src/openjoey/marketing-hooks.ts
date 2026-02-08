/**
 * OpenJoey Marketing Hooks
 *
 * FOMO messages, conversion triggers, and upsell logic
 * that get appended to agent responses for free-tier users.
 */

/**
 * After a free user's daily chart, pick a random FOMO message.
 */
const POST_CHART_FOMO = [
  "🔓 That was your free chart for today. Imagine what I can do with full access — unlimited scans, real-time alerts, whale tracking... Subscribe for $10/month → /subscribe",
  "🔓 Want me to watch this token 24/7 and alert you the moment it moves? Subscribe and I'll never let you miss a trade → /subscribe",
  "🔓 3 days ago you had unlimited access. Ready to come back? $10/month unlocks everything → /subscribe",
  "📊 Great analysis, right? Now imagine getting this on demand, plus real-time alerts and whale tracking. $10/month → /subscribe",
  "⚡ Free users found out about the last pump 6 hours late. Subscribers got alerted instantly. Just saying... → /subscribe",
];

/**
 * When a free user tries something they can't do.
 */
const BLOCKED_ACTION_MESSAGES: Record<string, string[]> = {
  create_alert: [
    "⚠️ Price alerts are a subscriber feature. $10/month gets you unlimited alerts with background monitoring every 4 hours → /subscribe",
    "🔔 Want me to ping you when this token hits your target? Subscribe for $10/month → /subscribe",
  ],
  whale_watch: [
    "🐋 Whale tracking is exclusive to subscribers. See what smart money is doing for $10/month → /subscribe",
    "🐋 The whales are moving — subscribe to track them in real-time → /subscribe",
  ],
  data_export: [
    "📤 Data export is a subscriber feature. Get your analysis in CSV/JSON for $10/month → /subscribe",
  ],
};

/**
 * Time-based conversion triggers.
 */
const TIMED_TRIGGERS: { daysOnFree: number; message: string }[] = [
  {
    daysOnFree: 3,
    message:
      "It's been 3 days since your trial ended. Miss the unlimited access? Come back for $10/month → /subscribe",
  },
  {
    daysOnFree: 7,
    message:
      "📊 You've been on the free tier for a week. That's ~6 opportunities you might have missed. Subscribe and don't miss the next one → /subscribe",
  },
  {
    daysOnFree: 14,
    message:
      "Two weeks on the free tier. Your fellow traders are getting real-time alerts while you check once a day. Time to level up? → /subscribe",
  },
  {
    daysOnFree: 30,
    message:
      "A whole month on the free tier! You're dedicated. Reward yourself with full access — $10/month, cancel anytime → /subscribe",
  },
];

/**
 * Market event triggers (used when we detect volatility).
 */
const VOLATILITY_TRIGGERS = [
  "🚨 Big moves happening in the market right now and you're on the free tier. Subscribe to catch the next wave → /subscribe",
  "⚡ Market volatility detected! Subscribers are getting real-time alerts. Don't miss out → /subscribe",
  "📈 Something's brewing in the Solana ecosystem. Free users hear about it hours later. Subscribe for real-time intel → /subscribe",
];

// ──────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────

function pickRandom(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Get a FOMO message to append after a free user's chart analysis.
 */
export function getPostChartFomo(): string {
  return `\n\n---\n${pickRandom(POST_CHART_FOMO)}`;
}

/**
 * Get a message when a free user tries a blocked action.
 */
export function getBlockedActionMessage(action: string): string {
  const messages = BLOCKED_ACTION_MESSAGES[action];
  if (messages) return pickRandom(messages);
  return "This feature requires a subscription. Upgrade for $10/month → /subscribe";
}

/**
 * Check if we should send a time-based conversion trigger.
 * Returns a message if it's time, null otherwise.
 */
export function getTimedTrigger(daysOnFreeTier: number): string | null {
  // Find the most recent applicable trigger
  const applicable = TIMED_TRIGGERS.filter((t) => t.daysOnFree <= daysOnFreeTier);
  if (applicable.length === 0) return null;

  // Only fire each trigger once: on the exact day
  const exact = TIMED_TRIGGERS.find((t) => t.daysOnFree === daysOnFreeTier);
  return exact?.message ?? null;
}

/**
 * Get a volatility-based conversion trigger.
 */
export function getVolatilityTrigger(): string {
  return pickRandom(VOLATILITY_TRIGGERS);
}

/**
 * Get the trial expiry warning message.
 */
export function getTrialExpiryWarning(hoursLeft: number): string {
  if (hoursLeft <= 2) {
    return (
      `🚨 Your 3-day trial ends in ${hoursLeft} hours!\n\n` +
      `To keep your alerts running and get unlimited access:\n` +
      `→ Subscribe for $10/month → /subscribe\n\n` +
      `After trial: 1 free chart/day, no alerts, no whale tracking.`
    );
  }
  if (hoursLeft <= 12) {
    return (
      `⏰ Your trial ends in ${hoursLeft} hours.\n\n` +
      `Don't lose your unlimited access — subscribe for $10/month → /subscribe`
    );
  }
  if (hoursLeft <= 24) {
    return (
      `📢 Last day of your trial!\n\n` + `Lock in unlimited access before it expires → /subscribe`
    );
  }
  return "";
}

/**
 * Generate the referral share message for upsell contexts.
 */
export function getReferralUpsell(referralCode: string): string {
  return (
    `\n\n💡 Know a fellow trader? Share your link and you both save:\n` +
    `→ openjoey.com/start?ref=${referralCode}\n` +
    `You get $1.80, they get $1.20 off!`
  );
}
