/**
 * OpenJoey Indicator Engine - Technical Analysis Calculations
 * Calculates RSI, MACD, EMA, Bollinger Bands, Volatility, Trend Direction
 */

import { getOrCompute } from "../../data_harvester/index.js";
import { fetchOHLCV } from "../../tools/ccxt/index.js";

export interface IndicatorResult {
  symbol: string;
  rsi: number | null;
  macd: {
    macd: number | null;
    signal: number | null;
    histogram: number | null;
  };
  ema: {
    ema20: number | null;
    ema50: number | null;
    ema200: number | null;
  };
  bollinger: {
    upper: number | null;
    middle: number | null;
    lower: number | null;
  };
  volatility: number | null;
  trend: "bullish" | "bearish" | "sideways" | null;
  timestamp: number;
}

/**
 * Calculate RSI (Relative Strength Index)
 */
export function calculateRSI(prices: number[], period: number = 14): number | null {
  if (prices.length < period + 1) return null;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    if (change >= 0) {
      gains += change;
    } else {
      losses -= change;
    }
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;

  if (avgLoss === 0) return 100;
  if (avgGain === 0) return 0;

  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

/**
 * Calculate EMA (Exponential Moving Average)
 */
export function calculateEMA(prices: number[], period: number): number | null {
  if (prices.length < period) return null;

  const multiplier = 2 / (period + 1);
  let ema = prices[0];

  for (let i = 1; i < prices.length; i++) {
    ema = prices[i] * multiplier + ema * (1 - multiplier);
  }

  return ema;
}

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 */
export function calculateMACD(
  prices: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9,
) {
  if (prices.length < slowPeriod + signalPeriod) {
    return { macd: null, signal: null, histogram: null };
  }

  const fastEMA = calculateEMA(prices, fastPeriod);
  const slowEMA = calculateEMA(prices, slowPeriod);

  if (!fastEMA || !slowEMA) {
    return { macd: null, signal: null, histogram: null };
  }

  const macdLine = fastEMA - slowEMA;

  // For signal line, we'd need historical MACD values
  // Simplified version for now
  const signalLine = macdLine * 0.9; // Simplified
  const histogram = macdLine - signalLine;

  return { macd: macdLine, signal: signalLine, histogram };
}

/**
 * Calculate Bollinger Bands
 */
export function calculateBollingerBands(prices: number[], period: number = 20, stdDev: number = 2) {
  if (prices.length < period) {
    return { upper: null, middle: null, lower: null };
  }

  const recentPrices = prices.slice(-period);
  const middle = recentPrices.reduce((sum, price) => sum + price, 0) / period;

  const variance =
    recentPrices.reduce((sum, price) => {
      return sum + Math.pow(price - middle, 2);
    }, 0) / period;

  const standardDeviation = Math.sqrt(variance);

  return {
    upper: middle + standardDeviation * stdDev,
    middle,
    lower: middle - standardDeviation * stdDev,
  };
}

/**
 * Calculate Volatility (Standard Deviation of Returns)
 */
export function calculateVolatility(prices: number[], period: number = 20): number | null {
  if (prices.length < period + 1) return null;

  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  }

  const recentReturns = returns.slice(-period);
  const avgReturn = recentReturns.reduce((sum, ret) => sum + ret, 0) / period;

  const variance =
    recentReturns.reduce((sum, ret) => {
      return sum + Math.pow(ret - avgReturn, 2);
    }, 0) / period;

  return Math.sqrt(variance) * 100; // Return as percentage
}

/**
 * Determine Trend Direction
 */
export function determineTrend(
  prices: number[],
  period: number = 50,
): "bullish" | "bearish" | "sideways" | null {
  if (prices.length < period) return null;

  const recentPrices = prices.slice(-period);
  const firstPrice = recentPrices[0];
  const lastPrice = recentPrices[recentPrices.length - 1];

  const priceChange = ((lastPrice - firstPrice) / firstPrice) * 100;

  // Use small threshold to avoid noise
  const threshold = 2; // 2%

  if (priceChange > threshold) return "bullish";
  if (priceChange < -threshold) return "bearish";
  return "sideways";
}

/**
 * Calculate all indicators for a symbol
 */
export async function calculateIndicators(
  symbol: string,
  timeframe: string = "1h",
  limit: number = 200,
): Promise<IndicatorResult> {
  // Use cache for 5 minutes
  const cacheKey = `indicators_${symbol}_${timeframe}`;

  return await getOrCompute(
    cacheKey,
    async () => {
      const ohlcv = await fetchOHLCV(symbol, timeframe, limit);

      if (ohlcv.length === 0) {
        return {
          symbol,
          rsi: null,
          macd: { macd: null, signal: null, histogram: null },
          ema: { ema20: null, ema50: null, ema200: null },
          bollinger: { upper: null, middle: null, lower: null },
          volatility: null,
          trend: null,
          timestamp: Date.now(),
        };
      }

      const closingPrices = ohlcv.map((candle) => candle.close);

      const rsi = calculateRSI(closingPrices);
      const macd = calculateMACD(closingPrices);
      const ema20 = calculateEMA(closingPrices, 20);
      const ema50 = calculateEMA(closingPrices, 50);
      const ema200 = calculateEMA(closingPrices, 200);
      const bollinger = calculateBollingerBands(closingPrices);
      const volatility = calculateVolatility(closingPrices);
      const trend = determineTrend(closingPrices);

      return {
        symbol,
        rsi,
        macd,
        ema: {
          ema20,
          ema50,
          ema200,
        },
        bollinger,
        volatility,
        trend,
        timestamp: Date.now(),
      };
    },
    5, // 5 minutes cache
  );
}

/**
 * Batch calculate indicators for multiple symbols
 */
export async function batchCalculateIndicators(
  symbols: string[],
  timeframe: string = "1h",
): Promise<IndicatorResult[]> {
  const promises = symbols.map((symbol) => calculateIndicators(symbol, timeframe));
  return Promise.all(promises);
}
