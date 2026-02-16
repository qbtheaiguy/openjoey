/**
 * OpenJoey V1 Telegram Integration
 * Bridges existing Telegram bot with V1 conversation engine
 */

import { Bot, Context } from "grammy";
import { getUserAlerts, createAlert } from "./services/alert_service/index.js";
import { handleConversation } from "./services/conversation_engine/index.js";
import { getPortfolioSummary } from "./services/portfolio_service/index.js";
import { getTrendingAssets } from "./services/radar_service/index.js";
import { getRecentWhaleEvents } from "./services/whale_service/index.js";
import { getOpenJoeyDB } from "./supabase-client.js";

// Trading query detection patterns
const TRADING_PATTERNS = [
  /should i (buy|sell|trade)/i,
  /what about (btc|eth|sol|ray|bitcoin|ethereum|solana)/i,
  /analyze (btc|eth|sol|ray)/i,
  /price of (btc|eth|sol)/i,
  /signal for/i,
  /portfolio/i,
  /trending/i,
  /alert/i,
  /market (analysis|summary)/i,
  /whale/i,
  /sentiment/i,
  /rsi|macd|ema|bollinger/i,
];

/**
 * Check if message is a V1 trading query
 */
export function isV1TradingQuery(text: string): boolean {
  return TRADING_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Handle V1 conversation via conversation engine
 */
export async function handleV1Conversation(
  userId: string,
  text: string,
): Promise<{ message: string; suggestions?: any[] }> {
  try {
    const response = await handleConversation(userId, text);
    return {
      message: response.message,
      suggestions: response.suggestions,
    };
  } catch (error) {
    console.error("V1 conversation engine error:", error);
    return {
      message: "🤖 I'm having trouble analyzing that right now. Try again in a moment!",
    };
  }
}

/**
 * Get or create OpenJoey user from Telegram ID
 */
export async function getOrCreateV1User(telegramId: number): Promise<string | null> {
  try {
    const db = getOpenJoeyDB();
    const user = await db.getUser(telegramId);

    if (user) {
      return user.id;
    }

    // Try to create user using insert
    try {
      const newUser = await db.insert("users", {
        telegram_id: telegramId,
        created_at: new Date().toISOString(),
      });
      return (newUser as { id?: string })?.id || null;
    } catch {
      return null;
    }
  } catch (error) {
    console.error("Error getting/creating V1 user:", error);
    return null;
  }
}

/**
 * Format V1 response for Telegram with proper Markdown
 */
export function formatV1Response(response: any): string {
  if (!response || !response.message) {
    return "🤖 I couldn't generate a response. Please try again!";
  }

  let message = response.message;

  // Ensure proper Telegram Markdown formatting
  message = message
    .replace(/\*\*\*/g, "*") // Fix triple asterisks
    .replace(/___/g, "_") // Fix triple underscores
    .trim();

  return message;
}

/**
 * Build inline keyboard from suggestions
 */
export function buildV1Keyboard(suggestions?: any[]): any {
  if (!suggestions || suggestions.length === 0) {
    return undefined;
  }

  const keyboard = suggestions.map((suggestion) => ({
    text: suggestion.text,
    callback_data: suggestion.action || `v1:${suggestion.text}`,
  }));

  // Return as inline keyboard rows
  return {
    inline_keyboard: [keyboard],
  };
}

/**
 * V1 Command Handlers
 */
export function registerV1Commands(bot: Bot) {
  // Portfolio command
  bot.command("portfolio", async (ctx) => {
    const telegramId = ctx.from?.id;
    if (!telegramId) {
      await ctx.reply("❌ Could not identify user.");
      return;
    }

    try {
      const userId = await getOrCreateV1User(telegramId);
      if (!userId) {
        await ctx.reply("❌ User not found. Please start a conversation first.");
        return;
      }

      const summary = await getPortfolioSummary(userId);
      await ctx.reply(summary, { parse_mode: "Markdown" });
    } catch (error) {
      console.error("Portfolio command error:", error);
      await ctx.reply("🤖 Error fetching portfolio. Try again!");
    }
  });

  // Alerts command
  bot.command("alerts", async (ctx) => {
    const telegramId = ctx.from?.id;
    if (!telegramId) {
      await ctx.reply("❌ Could not identify user.");
      return;
    }

    try {
      const userId = await getOrCreateV1User(telegramId);
      if (!userId) {
        await ctx.reply("❌ User not found.");
        return;
      }

      const alerts = await getUserAlerts(userId);

      if (alerts.length === 0) {
        await ctx.reply("🔔 No active alerts. Set one with /alert <symbol> <condition> <value>");
        return;
      }

      let message = "🔔 **Your Alerts**\n\n";
      alerts.forEach((alert, index) => {
        message += `${index + 1}. ${alert.asset_symbol} - ${alert.alert_type} ${alert.condition} $${alert.threshold}\n`;
      });

      await ctx.reply(message, { parse_mode: "Markdown" });
    } catch (error) {
      console.error("Alerts command error:", error);
      await ctx.reply("🤖 Error fetching alerts. Try again!");
    }
  });

  // Trending command
  bot.command("trending", async (ctx) => {
    try {
      const trending = await getTrendingAssets(5);

      if (trending.length === 0) {
        await ctx.reply("📊 No trending assets found right now.");
        return;
      }

      let message = "🔥 **Trending Assets**\n\n";
      trending.forEach((asset, index) => {
        const emoji = asset.trend_score > 70 ? "🚀" : "📈";
        const change = asset.price_change_24h > 0 ? "+" : "";
        message += `${index + 1}. ${emoji} **${asset.asset_symbol}**\n`;
        message += `   Trend Score: ${asset.trend_score}/100\n`;
        message += `   24h: ${change}${asset.price_change_24h}%\n\n`;
      });

      await ctx.reply(message, { parse_mode: "Markdown" });
    } catch (error) {
      console.error("Trending command error:", error);
      await ctx.reply("🤖 Error fetching trending assets. Try again!");
    }
  });

  // Whale command
  bot.command("whale", async (ctx) => {
    try {
      const events = await getRecentWhaleEvents(undefined, 5);

      if (events.length === 0) {
        await ctx.reply("🐋 No whale activity detected recently.");
        return;
      }

      let message = "🐋 **Recent Whale Activity**\n\n";
      events.forEach((event, index) => {
        const emoji = event.event_type === "exchange_outflow" ? "🟢" : "🔴";
        const amount = (event.amount_usd / 1000000).toFixed(2);
        message += `${index + 1}. ${emoji} **${event.asset_symbol}**\n`;
        message += `   ${event.event_type.replace("_", " ")}: $${amount}M\n`;
        message += `   Confidence: ${event.confidence}%\n\n`;
      });

      await ctx.reply(message, { parse_mode: "Markdown" });
    } catch (error) {
      console.error("Whale command error:", error);
      await ctx.reply("🤖 Error fetching whale data. Try again!");
    }
  });

  // Alert command (create alert)
  bot.command("alert", async (ctx) => {
    const telegramId = ctx.from?.id;
    if (!telegramId) {
      await ctx.reply("❌ Could not identify user.");
      return;
    }

    const args = ctx.message?.text?.split(" ").slice(1);
    if (!args || args.length < 3) {
      await ctx.reply(
        "🔔 Usage: /alert <symbol> <above|below> <price>\nExample: /alert BTC above 50000",
      );
      return;
    }

    const [symbol, condition, price] = args;
    const priceNum = parseFloat(price);

    if (!symbol || !["above", "below"].includes(condition) || isNaN(priceNum)) {
      await ctx.reply("❌ Invalid arguments. Use: /alert <symbol> <above|below> <price>");
      return;
    }

    try {
      const userId = await getOrCreateV1User(telegramId);
      if (!userId) {
        await ctx.reply("❌ User not found.");
        return;
      }

      const { createAlert } = await import("./services/alert_service/index.js");
      const alert = await createAlert(
        userId,
        "price",
        symbol.toUpperCase(),
        condition as "above" | "below",
        priceNum,
      );

      if (alert) {
        await ctx.reply(
          `🔔 Alert set! I'll notify you when ${symbol.toUpperCase()} goes ${condition} $${priceNum.toLocaleString()}`,
        );
      } else {
        await ctx.reply("❌ Failed to create alert. Try again!");
      }
    } catch (error) {
      console.error("Alert creation error:", error);
      await ctx.reply("🤖 Error creating alert. Try again!");
    }
  });

  console.log("✅ V1 commands registered");
}

/**
 * Process V1 message (non-command trading queries)
 */
export async function processV1Message(ctx: Context, text: string): Promise<boolean> {
  // Check if it's a V1 trading query
  if (!isV1TradingQuery(text)) {
    return false; // Not a V1 query, let default handler process it
  }

  const telegramId = ctx.from?.id;
  if (!telegramId) {
    return false;
  }

  try {
    // Get or create user
    const userId = await getOrCreateV1User(telegramId);
    if (!userId) {
      await ctx.reply("🤖 Please start a conversation with me first!");
      return true;
    }

    // Process through V1 conversation engine
    const response = await handleV1Conversation(userId, text);
    const formattedMessage = formatV1Response(response);
    const keyboard = buildV1Keyboard(response.suggestions);

    // Send V1 response
    await ctx.reply(formattedMessage, {
      parse_mode: "Markdown",
      reply_markup: keyboard,
    });

    return true; // V1 handled this message
  } catch (error) {
    console.error("V1 message processing error:", error);
    await ctx.reply("🤖 I'm having trouble with that analysis. Try again!");
    return true;
  }
}
