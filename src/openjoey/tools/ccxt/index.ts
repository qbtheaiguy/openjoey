// @ts-nocheck
// CCXT Tools for OpenJoey

import ccxt from "ccxt";

// ============================================================================
// Types
// ============================================================================

export interface TickerData {
  symbol: string;
  exchange: string;
  last: number;
  bid: number;
  ask: number;
  high: number;
  low: number;
  volume: number;
  timestamp: number;
  change24h?: number;
  changePercent24h?: number;
}

export interface OHLCVData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface PriceComparison {
  symbol: string;
  comparisons: Array<{
    exchange: string;
    price: number;
    bid: number;
    ask: number;
    spread: number;
  }>;
  bestBid: { exchange: string; price: number };
  bestAsk: { exchange: string; price: number };
  priceDiff: number; // Max difference between exchanges
  priceDiffPercent: number;
}

export interface OrderBookEntry {
  price: number;
  amount: number;
}

export interface OrderBookData {
  symbol: string;
  exchange: string;
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  timestamp: number;
}

// ============================================================================
// Exchange Manager
// ============================================================================

class ExchangeManager {
  private exchanges: Map<string, ccxt.Exchange> = new Map();

  getExchange(id: string): any {
    if (!this.exchanges.has(id)) {
      const ExchangeClass = (ccxt as any)[id];
      if (!ExchangeClass) {
        throw new Error(`Exchange ${id} not supported by CCXT`);
      }
      // Create exchange instance with rate limiting enabled
      const exchange = new ExchangeClass({
        enableRateLimit: true,
      });
      this.exchanges.set(id, exchange);
    }
    return this.exchanges.get(id)!;
  }

  async loadMarkets(exchangeId: string): Promise<void> {
    const exchange = this.getExchange(exchangeId);
    if (!exchange.markets) {
      await exchange.loadMarkets();
    }
  }
}

const exchangeManager = new ExchangeManager();

// ============================================================================
// Tools
// ============================================================================

/**
 * Fetch current ticker/price data from an exchange
 */
export async function fetchTicker(
  symbol: string,
  exchangeId: string = "binance",
): Promise<TickerData> {
  const exchange = exchangeManager.getExchange(exchangeId);
  await exchangeManager.loadMarkets(exchangeId);

  // Normalize symbol format (BTC/USDT)
  const normalizedSymbol = symbol.includes("/") ? symbol : `${symbol}/USDT`;

  const ticker = await exchange.fetchTicker(normalizedSymbol);

  return {
    symbol: normalizedSymbol,
    exchange: exchangeId,
    last: ticker.last ?? 0,
    bid: ticker.bid ?? 0,
    ask: ticker.ask ?? 0,
    high: ticker.high ?? 0,
    low: ticker.low ?? 0,
    volume: ticker.baseVolume ?? ticker.quoteVolume ?? 0,
    timestamp: ticker.timestamp ?? Date.now(),
    change24h: ticker.change,
    changePercent24h: ticker.percentage,
  };
}

/**
 * Fetch OHLCV (candlestick) data for charting
 */
export async function fetchOHLCV(
  symbol: string,
  timeframe: string = "1h",
  limit: number = 100,
  exchangeId: string = "binance",
): Promise<OHLCVData[]> {
  const exchange = exchangeManager.getExchange(exchangeId);
  await exchangeManager.loadMarkets(exchangeId);

  const normalizedSymbol = symbol.includes("/") ? symbol : `${symbol}/USDT`;

  const ohlcv = await exchange.fetchOHLCV(normalizedSymbol, timeframe, undefined, limit);

  return ohlcv.map((candle: number[]) => ({
    timestamp: candle[0],
    open: candle[1],
    high: candle[2],
    low: candle[3],
    close: candle[4],
    volume: candle[5],
  }));
}

/**
 * Compare prices across multiple exchanges
 */
export async function comparePrices(
  symbol: string,
  exchangeIds: string[] = ["binance", "kraken", "coinbase", "kucoin", "bybit"],
): Promise<PriceComparison> {
  const normalizedSymbol = symbol.includes("/") ? symbol : `${symbol}/USDT`;

  const comparisons = await Promise.all(
    exchangeIds.map(async (exchangeId) => {
      try {
        const ticker = await fetchTicker(normalizedSymbol, exchangeId);
        return {
          exchange: exchangeId,
          price: ticker.last,
          bid: ticker.bid,
          ask: ticker.ask,
          spread: ticker.ask - ticker.bid,
        };
      } catch (error) {
        // Exchange might not support this pair
        return null;
      }
    }),
  );

  const validComparisons = comparisons.filter((c): c is NonNullable<typeof c> => c !== null);

  if (validComparisons.length === 0) {
    throw new Error(`No exchanges support ${normalizedSymbol}`);
  }

  // Find best prices
  const bestBid = validComparisons.reduce((best, current) =>
    current.bid > best.bid ? current : best,
  );

  const bestAsk = validComparisons.reduce((best, current) =>
    current.ask < best.ask ? current : best,
  );

  const prices = validComparisons.map((c) => c.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  return {
    symbol: normalizedSymbol,
    comparisons: validComparisons,
    bestBid: { exchange: bestBid.exchange, price: bestBid.bid },
    bestAsk: { exchange: bestAsk.exchange, price: bestAsk.ask },
    priceDiff: maxPrice - minPrice,
    priceDiffPercent: ((maxPrice - minPrice) / minPrice) * 100,
  };
}

/**
 * Fetch order book (market depth)
 */
export async function fetchOrderBook(
  symbol: string,
  limit: number = 20,
  exchangeId: string = "binance",
): Promise<OrderBookData> {
  const exchange = exchangeManager.getExchange(exchangeId);
  await exchangeManager.loadMarkets(exchangeId);

  const normalizedSymbol = symbol.includes("/") ? symbol : `${symbol}/USDT`;

  const orderBook = await exchange.fetchOrderBook(normalizedSymbol, limit);

  return {
    symbol: normalizedSymbol,
    exchange: exchangeId,
    bids: orderBook.bids.map(([price, amount]: [number, number]) => ({ price, amount })),
    asks: orderBook.asks.map(([price, amount]: [number, number]) => ({ price, amount })),
    timestamp: orderBook.timestamp ?? Date.now(),
  };
}

/**
 * Get supported exchanges from CCXT
 */
export function getSupportedExchanges(): string[] {
  return ccxt.exchanges;
}

/**
 * Check if exchange supports a trading pair
 */
export async function isPairSupported(symbol: string, exchangeId: string): Promise<boolean> {
  try {
    const exchange = exchangeManager.getExchange(exchangeId);
    await exchangeManager.loadMarkets(exchangeId);
    const normalizedSymbol = symbol.includes("/") ? symbol : `${symbol}/USDT`;
    return normalizedSymbol in (exchange.markets || {});
  } catch {
    return false;
  }
}

// ============================================================================
// Export all tools
// ============================================================================

export const ccxtTools = {
  fetchTicker,
  fetchOHLCV,
  comparePrices,
  fetchOrderBook,
  getSupportedExchanges,
  isPairSupported,
};

export default ccxtTools;
