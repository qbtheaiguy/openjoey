/**
 * OpenJoey Signal Engine - Trading Signal Generation
 * Combines indicators into actionable trading signals with confidence scoring
 */

import { getOpenJoeyDB } from "../../supabase-client.js";
import { calculateIndicators, type IndicatorResult } from "../indicator_engine/index.js";

export interface Signal {
  id?: string;
  asset_symbol: string;
  signal_type: "buy" | "sell" | "neutral";
  confidence: number;
  trend: string | null;
  rsi: number | null;
  macd: number | null;
  volatility: number | null;
  created_at?: string;
}

export interface SignalGenerationConfig {
  rsiOversold: number;
  rsiOverbought: number;
  macdBullishThreshold: number;
  macdBearishThreshold: number;
  volatilityThreshold: number;
  trendWeight: number;
  rsiWeight: number;
  macdWeight: number;
  volatilityWeight: number;
}

const DEFAULT_CONFIG: SignalGenerationConfig = {
  rsiOversold: 30,
  rsiOverbought: 70,
  macdBullishThreshold: 0.1,
  macdBearishThreshold: -0.1,
  volatilityThreshold: 3,
  trendWeight: 0.4,
  rsiWeight: 0.3,
  macdWeight: 0.2,
  volatilityWeight: 0.1,
};

/**
 * Generate signal based on indicators
 */
export function generateSignal(
  indicators: IndicatorResult,
  config: SignalGenerationConfig = DEFAULT_CONFIG,
): Signal {
  let score = 0;
  let maxScore = 0;
  const factors: string[] = [];

  // Trend analysis (40% weight)
  if (indicators.trend === "bullish") {
    score += config.trendWeight * 100;
    factors.push("Bullish trend");
  } else if (indicators.trend === "bearish") {
    score -= config.trendWeight * 100;
    factors.push("Bearish trend");
  }
  maxScore += config.trendWeight * 100;

  // RSI analysis (30% weight)
  if (indicators.rsi) {
    if (indicators.rsi < config.rsiOversold) {
      score += config.rsiWeight * 100;
      factors.push(`RSI oversold (${indicators.rsi.toFixed(1)})`);
    } else if (indicators.rsi > config.rsiOverbought) {
      score -= config.rsiWeight * 100;
      factors.push(`RSI overbought (${indicators.rsi.toFixed(1)})`);
    }
    maxScore += config.rsiWeight * 100;
  }

  // MACD analysis (20% weight)
  if (indicators.macd.macd && indicators.macd.signal) {
    const macdDiff = indicators.macd.macd - indicators.macd.signal;
    if (macdDiff > config.macdBullishThreshold) {
      score += config.macdWeight * 100;
      factors.push("MACD bullish crossover");
    } else if (macdDiff < config.macdBearishThreshold) {
      score -= config.macdWeight * 100;
      factors.push("MACD bearish crossover");
    }
    maxScore += config.macdWeight * 100;
  }

  // Volatility analysis (10% weight)
  if (indicators.volatility) {
    if (indicators.volatility > config.volatilityThreshold) {
      score += config.volatilityWeight * 50; // Moderate positive for high volatility
      factors.push(`High volatility (${indicators.volatility.toFixed(1)}%)`);
    }
    maxScore += config.volatilityWeight * 100;
  }

  // Normalize score to 0-100
  let confidence = maxScore > 0 ? Math.abs((score / maxScore) * 100) : 0;

  // Determine signal type
  let signalType: "buy" | "sell" | "neutral";
  if (confidence < 30) {
    signalType = "neutral";
  } else if (score > 0) {
    signalType = "buy";
  } else {
    signalType = "sell";
  }

  return {
    asset_symbol: indicators.symbol,
    signal_type: signalType,
    confidence: Math.round(confidence),
    trend: indicators.trend,
    rsi: indicators.rsi,
    macd: indicators.macd.macd,
    volatility: indicators.volatility,
  };
}

/**
 * Generate and store signal in database
 */
export async function generateAndStoreSignal(
  symbol: string,
  config?: SignalGenerationConfig,
): Promise<Signal | null> {
  try {
    const indicators = await calculateIndicators(symbol);
    const signal = generateSignal(indicators, config);

    // Store in database
    const db = getOpenJoeyDB();
    try {
      const data = await db.insert("signals", {
        asset_symbol: signal.asset_symbol,
        signal_type: signal.signal_type,
        confidence: signal.confidence,
        trend: signal.trend,
        rsi: signal.rsi,
        macd: signal.macd,
        volatility: signal.volatility,
      });

      return { ...signal, ...(data as any) };
    } catch (error) {
      console.error("Error storing signal:", error);
      return null;
    }
  } catch (error) {
    console.error("Error generating signal:", error);
    return null;
  }
}

/**
 * Get latest signals for a symbol
 */
export async function getLatestSignals(symbol: string, limit: number = 10): Promise<Signal[]> {
  try {
    const db = getOpenJoeyDB();
    const data = await db.get<Signal>(
      "signals",
      `asset_symbol=eq.${symbol}&order=created_at.desc&limit=${limit}`,
    );

    return data || [];
  } catch (error) {
    console.error("Error fetching signals:", error);
    return [];
  }
}

/**
 * Get active buy signals
 */
export async function getActiveBuySignals(limit: number = 20): Promise<Signal[]> {
  try {
    const db = getOpenJoeyDB();
    const data = await db.get<Signal>(
      "signals",
      `signal_type=eq.buy&confidence=gte.60&order=created_at.desc&limit=${limit}`,
    );

    return data || [];
  } catch (error) {
    console.error("Error fetching buy signals:", error);
    return [];
  }
}

/**
 * Batch generate signals for multiple symbols
 */
export async function batchGenerateSignals(
  symbols: string[],
  config?: SignalGenerationConfig,
): Promise<Signal[]> {
  const promises = symbols.map((symbol) => generateAndStoreSignal(symbol, config));
  const results = await Promise.all(promises);
  return results.filter((signal): signal is Signal => signal !== null);
}

/**
 * Auto-generate signals for top assets
 */
export async function autoGenerateTopSignals(): Promise<void> {
  const topSymbols = ["BTC", "ETH", "SOL", "RAY", "AVAX", "MATIC", "DOT", "LINK"];

  try {
    const signals = await batchGenerateSignals(topSymbols);
    console.log(`Generated ${signals.length} signals for top assets`);

    // Log high-confidence signals
    const highConfidenceSignals = signals.filter((s) => s.confidence >= 70);
    if (highConfidenceSignals.length > 0) {
      console.log("High confidence signals:", highConfidenceSignals);
    }
  } catch (error) {
    console.error("Error in auto signal generation:", error);
  }
}
