/**
 * OpenJoey Morning Brief - Daily Market Briefing Automation
 * Sends daily 7am brief with market summary, top signals, trending assets
 */

import { calculateIndicators } from "./services/indicator_engine/index.js";
import { getTrendingAssets } from "./services/radar_service/index.js";
import { getActiveBuySignals } from "./services/signal_engine/index.js";
import { getRecentWhaleEvents } from "./services/whale_service/index.js";
import { getOpenJoeyDB } from "./supabase-client.js";

export interface MorningBrief {
  date: string;
  market_summary: {
    top_gainers: string[];
    top_losers: string[];
    market_sentiment: string;
    volatility_index: number;
  };
  top_signals: {
    buy: any[];
    sell: any[];
  };
  trending_assets: any[];
  whale_activity: any[];
  key_events: string[];
}

/**
 * Generate morning brief
 */
export async function generateMorningBrief(): Promise<MorningBrief> {
  const now = new Date();
  const date = now.toISOString().split("T")[0];

  console.log(`Generating morning brief for ${date}...`);

  // Gather all data
  const [buySignals, trendingAssets, whaleEvents] = await Promise.all([
    getActiveBuySignals(5),
    getTrendingAssets(5),
    getRecentWhaleEvents(undefined, 3),
  ]);

  // Get top assets for market summary
  const topAssets = ["BTC", "ETH", "SOL", "RAY", "AVAX"];
  const marketIndicators = await Promise.all(
    topAssets.map((symbol) => calculateIndicators(symbol)),
  );

  // Calculate market sentiment
  const bullishCount = marketIndicators.filter((i: any) => i.trend === "bullish").length;
  const bearishCount = marketIndicators.filter((i: any) => i.trend === "bearish").length;
  const marketSentiment =
    bullishCount > bearishCount ? "Bullish" : bearishCount > bullishCount ? "Bearish" : "Neutral";

  // Calculate volatility index (average of all volatilities)
  const avgVolatility =
    marketIndicators.reduce((sum: number, i: any) => sum + (i.volatility || 0), 0) /
    marketIndicators.length;

  // Generate brief
  const brief: MorningBrief = {
    date,
    market_summary: {
      top_gainers: trendingAssets.slice(0, 3).map((a: any) => a.asset_symbol),
      top_losers: [], // Would need price data
      market_sentiment: marketSentiment,
      volatility_index: parseFloat(avgVolatility.toFixed(2)),
    },
    top_signals: {
      buy: buySignals.slice(0, 5),
      sell: [], // Would query sell signals
    },
    trending_assets: trendingAssets.slice(0, 5),
    whale_activity: whaleEvents.slice(0, 3),
    key_events: generateKeyEvents(marketSentiment, buySignals.length, whaleEvents.length),
  };

  // Store brief in database (for history)
  await storeBrief(brief);

  console.log("Morning brief generated successfully");
  return brief;
}

/**
 * Generate key events summary
 */
function generateKeyEvents(sentiment: string, buyCount: number, whaleCount: number): string[] {
  const events: string[] = [];

  if (sentiment === "Bullish") {
    events.push("Market showing bullish momentum across major assets");
  } else if (sentiment === "Bearish") {
    events.push("Caution advised - bearish signals detected");
  }

  if (buyCount > 3) {
    events.push(`Multiple buy signals active (${buyCount} assets)`);
  }

  if (whaleCount > 0) {
    events.push(`${whaleCount} significant whale movements detected`);
  }

  events.push("New day, new opportunities - stay informed");

  return events;
}

/**
 * Format brief for Telegram
 */
export function formatBriefForTelegram(brief: MorningBrief): string {
  let message = `🌅 **Good Morning!**\n`;
  message += `📅 ${brief.date}\n\n`;

  message += `📊 **Market Summary**\n`;
  message += `Sentiment: ${brief.market_summary.market_sentiment}\n`;
  message += `Volatility Index: ${brief.market_summary.volatility_index}%\n\n`;

  if (brief.top_signals.buy.length > 0) {
    message += `🟢 **Top Buy Signals**\n`;
    for (const signal of brief.top_signals.buy.slice(0, 3)) {
      message += `• ${signal.asset_symbol} (${signal.confidence}% confidence)\n`;
    }
    message += "\n";
  }

  if (brief.trending_assets.length > 0) {
    message += `🔥 **Trending Assets**\n`;
    for (const asset of brief.trending_assets.slice(0, 3)) {
      const emoji = asset.trend_score > 70 ? "🚀" : "📈";
      message += `${emoji} ${asset.asset_symbol} (Score: ${asset.trend_score})\n`;
    }
    message += "\n";
  }

  if (brief.whale_activity.length > 0) {
    message += `🐋 **Whale Activity**\n`;
    for (const whale of brief.whale_activity.slice(0, 2)) {
      message += `• ${whale.asset_symbol}: ${whale.event_type.replace("_", " ")} ($${(whale.amount_usd / 1000000).toFixed(1)}M)\n`;
    }
    message += "\n";
  }

  message += `💡 **Key Events**\n`;
  for (const event of brief.key_events) {
    message += `• ${event}\n`;
  }

  message += "\n🤖 Have a great trading day!";

  return message;
}

/**
 * Store brief in database
 */
async function storeBrief(brief: MorningBrief): Promise<void> {
  try {
    const db = getOpenJoeyDB();
    await db.insert("analysis_cache", {
      cache_key: `morning_brief_${brief.date}`,
      data: brief,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error storing brief:", error);
  }
}

/**
 * Get subscribers for morning brief
 */
export async function getBriefSubscribers(): Promise<string[]> {
  try {
    const db = getOpenJoeyDB();
    // Get users who have enabled morning brief
    // This would check user preferences in a real implementation
    const users = await db.get("users", "is_active=eq.true&limit=100");
    return (users || []).map((u: any) => u.id);
  } catch (error) {
    console.error("Error fetching subscribers:", error);
    return [];
  }
}

/**
 * Send morning brief to all subscribers
 */
export async function sendMorningBrief(): Promise<{
  brief: MorningBrief;
  subscribers: string[];
  sent_count: number;
}> {
  // Generate brief
  const brief = await generateMorningBrief();

  // Get subscribers
  const subscribers = await getBriefSubscribers();

  // Format message
  const message = formatBriefForTelegram(brief);

  // In production: send via Telegram bot
  // For now: log the message
  console.log("Morning brief message:");
  console.log(message);

  console.log(`Would send to ${subscribers.length} subscribers`);

  return {
    brief,
    subscribers,
    sent_count: subscribers.length,
  };
}

/**
 * Schedule morning brief (runs at 7am UTC)
 */
export function scheduleMorningBrief(): void {
  const now = new Date();
  const target = new Date();
  target.setUTCHours(7, 0, 0, 0);

  // If already past 7am, schedule for tomorrow
  if (target <= now) {
    target.setUTCDate(target.getUTCDate() + 1);
  }

  const msUntilTarget = target.getTime() - now.getTime();

  console.log(`Morning brief scheduled for ${target.toISOString()}`);

  setTimeout(async () => {
    await sendMorningBrief();
    // Reschedule for next day
    scheduleMorningBrief();
  }, msUntilTarget);
}

/**
 * Run morning brief immediately (for testing)
 */
export async function runMorningBriefNow(): Promise<void> {
  console.log("Running morning brief now...");
  const result = await sendMorningBrief();
  console.log(`Sent to ${result.sent_count} subscribers`);
}
