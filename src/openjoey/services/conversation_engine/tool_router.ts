/**
 * OpenJoey Tool Router - Routes intents to backend services
 * Maps parsed intents to appropriate service calls
 */

import type { ParsedIntent } from "./intent_parser.js";
import { getPrice } from "../../price-service.js";
import { getOpenJoeyDB } from "../../supabase-client.js";
import { calculateIndicators } from "../indicator_engine/index.js";
import { generateAndStoreSignal, getLatestSignals } from "../signal_engine/index.js";

export interface AnalysisContext {
  asset: string;
  price?: number;
  price_change_24h?: number;
  trend?: string;
  rsi?: number;
  macd?: number;
  volatility?: number;
  signal?: string;
  confidence?: number;
  sentiment_score?: number;
  mention_volume?: number;
  whale_activity?: string;
  portfolio_data?: any;
  trending_assets?: any[];
  market_signals?: any;
}

/**
 * Route to appropriate backend services based on intent
 */
export async function routeToServices(
  intent: ParsedIntent,
  userId: string,
): Promise<AnalysisContext> {
  const context: AnalysisContext = {
    asset: intent.asset_symbol || "UNKNOWN",
  };

  try {
    switch (intent.intent) {
      case "asset_analysis":
        return await handleAssetAnalysis(intent, context);

      case "portfolio_question":
        return await handlePortfolioQuestion(userId, context);

      case "trending_request":
        return await handleTrendingRequest(context);

      case "market_overview":
        return await handleMarketOverview(context);

      case "alert_request":
        return await handleAlertRequest(intent, context);

      case "general_trading_question":
        return await handleGeneralQuestion(intent, context);

      default:
        return await handleGeneralQuestion(intent, context);
    }
  } catch (error) {
    console.error("Error in tool router:", error);
    context.asset = "ERROR";
    return context;
  }
}

/**
 * Handle asset analysis - call indicator and signal engines with live price
 */
async function handleAssetAnalysis(
  intent: ParsedIntent,
  context: AnalysisContext,
): Promise<AnalysisContext> {
  if (!intent.asset_symbol) {
    return context;
  }

  try {
    // Get live price data from CoinGecko
    const priceData = await getPrice(intent.asset_symbol);

    if (priceData) {
      context.price = priceData.price;
      context.price_change_24h = priceData.price_change_percentage_24h;
    }

    // Get technical indicators
    const indicators = await calculateIndicators(intent.asset_symbol);

    // Generate signal
    const signal = await generateAndStoreSignal(intent.asset_symbol);

    // Get recent signals
    const recentSignals = await getLatestSignals(intent.asset_symbol, 3);

    // Build context
    context.trend = indicators.trend || undefined;
    context.rsi = indicators.rsi || undefined;
    context.macd = indicators.macd?.macd || undefined;
    context.volatility = indicators.volatility || undefined;
    context.signal = signal?.signal_type;
    context.confidence = signal?.confidence;

    // Get sentiment data from DB
    try {
      const db = getOpenJoeyDB();
      const sentimentEvents = await db.get(
        "sentiment_events",
        `asset_symbol=eq.${intent.asset_symbol}&order=created_at.desc&limit=1`,
      );
      if (sentimentEvents && sentimentEvents.length > 0) {
        const event = sentimentEvents[0] as { sentiment_score?: number; mention_count?: number };
        context.sentiment_score = event.sentiment_score ?? 0.5;
        context.mention_volume = event.mention_count ?? 0;
      }
    } catch {
      // Sentiment data optional
      context.sentiment_score = 0.5;
      context.mention_volume = 0;
    }

    console.log(`Asset analysis complete for ${intent.asset_symbol}:`, {
      price: context.price,
      signal: context.signal,
      confidence: context.confidence,
    });

    return context;
  } catch (error) {
    console.error("Error in asset analysis:", error);
    return context;
  }
}

/**
 * Handle portfolio question - get user portfolio data
 */
async function handlePortfolioQuestion(
  userId: string,
  context: AnalysisContext,
): Promise<AnalysisContext> {
  try {
    const db = getOpenJoeyDB();

    // Get user's portfolios
    const portfolios = await db.get("portfolios", `user_id=eq.${userId}`);

    if (!portfolios || portfolios.length === 0) {
      return context;
    }

    // Get portfolio assets for first portfolio
    const portfolio = portfolios[0] as { id: string; name?: string };
    const assets = await db.get("portfolio_assets", `portfolio_id=eq.${portfolio.id}`);

    if (!assets || assets.length === 0) {
      return context;
    }

    // Calculate portfolio value (simplified)
    let totalValue = 0;
    for (const asset of assets as Array<{ amount: number; avg_entry_price: number }>) {
      totalValue += asset.amount * asset.avg_entry_price;
    }

    context.portfolio_data = {
      portfolio,
      assets,
      total_value: totalValue,
    };

    return context;
  } catch (error) {
    console.error("Error in portfolio analysis:", error);
    return context;
  }
}

/**
 * Handle trending request - get trending assets
 */
async function handleTrendingRequest(context: AnalysisContext): Promise<AnalysisContext> {
  try {
    const db = getOpenJoeyDB();

    // Get trending assets
    const trending = await db.get("trending_assets", "order=trend_score.desc&limit=10");

    context.trending_assets = trending;

    return context;
  } catch (error) {
    console.error("Error fetching trending:", error);
    return context;
  }
}

/**
 * Handle market overview - get signals and trends
 */
async function handleMarketOverview(context: AnalysisContext): Promise<AnalysisContext> {
  try {
    const db = getOpenJoeyDB();

    // Get top signals
    const buySignals = await db.get(
      "signals",
      "signal_type=eq.buy&confidence=gte.70&order=created_at.desc&limit=5",
    );
    const sellSignals = await db.get(
      "signals",
      "signal_type=eq.sell&confidence=gte.70&order=created_at.desc&limit=3",
    );

    // Get trending
    const trending = await db.get("trending_assets", "order=trend_score.desc&limit=3");

    context.market_signals = {
      buy_signals: buySignals,
      sell_signals: sellSignals,
    };
    context.trending_assets = trending;

    return context;
  } catch (error) {
    console.error("Error in market overview:", error);
    return context;
  }
}

/**
 * Handle alert request
 */
async function handleAlertRequest(
  intent: ParsedIntent,
  context: AnalysisContext,
): Promise<AnalysisContext> {
  // For now, just return the asset symbol
  // Full alert implementation would be more complex
  return context;
}

/**
 * Handle general trading question
 */
async function handleGeneralQuestion(
  intent: ParsedIntent,
  context: AnalysisContext,
): Promise<AnalysisContext> {
  return context;
}
