/**
 * Price Feed Sensor - Scrapes price data from multiple free sources
 * Supports: Crypto, Stocks, Penny Stocks, Forex, Commodities
 */

import { PriceData, MarketType } from "../types/index.js";
import {
  fetchWithFallback,
  fetchWithRetry,
  extractNumber,
  extractVolume,
  CheerioAPI,
} from "../utils/scraper.js";

export class PriceFeedSensor {
  private rateLimiter = { wait: async () => {} }; // Simple rate limiter

  async getPrice(asset: string, marketType: MarketType): Promise<PriceData | null> {
    switch (marketType) {
      case "crypto":
        return this.getCryptoPrice(asset);
      case "stock":
        return this.getStockPrice(asset);
      case "penny":
        return this.getPennyStockPrice(asset);
      case "forex":
        return this.getForexPrice(asset);
      case "commodity":
        return this.getCommodityPrice(asset);
      default:
        return null;
    }
  }

  /**
   * Get crypto price with multiple fallback sources
   */
  private async getCryptoPrice(symbol: string): Promise<PriceData | null> {
    const sources = [
      {
        name: "dexscreener",
        url: `https://api.dexscreener.com/latest/dex/search?q=${symbol}`,
        options: { parser: "json" as const },
      },
      {
        name: "coingecko",
        url: `https://api.coingecko.com/api/v3/simple/price?ids=${symbol.toLowerCase()}&vs_currencies=usd&include_24hr_vol=true&include_24hr_change=true&include_market_cap=true`,
        options: { parser: "json" as const },
      },
      {
        name: "birdeye",
        url: `https://public-api.birdeye.so/public/price?address=${symbol}`,
        options: { parser: "json" as const, headers: { "x-api-key": "public" } },
      },
    ];

    const result = await fetchWithFallback<unknown>(sources);

    if (!result.success || !result.data) {
      return null;
    }

    // Parse based on source
    switch (result.source) {
      case "dexscreener":
        return this.parseDexScreener(symbol, result.data);
      case "coingecko":
        return this.parseCoinGecko(symbol, result.data);
      case "birdeye":
        return this.parseBirdeye(symbol, result.data);
      default:
        return null;
    }
  }

  private parseDexScreener(symbol: string, data: unknown): PriceData | null {
    const d = data as {
      pairs?: Array<{
        priceUsd: string;
        volume: { h24: string };
        priceChange: { h24: string };
        liquidity?: { usd: string };
        fdv?: string;
      }>;
    };

    if (!d.pairs || d.pairs.length === 0) return null;

    const pair = d.pairs[0]; // Most liquid pair

    return {
      symbol,
      price: parseFloat(pair.priceUsd) || 0,
      volume24h: parseFloat(pair.volume?.h24) || 0,
      change24h: parseFloat(pair.priceChange?.h24) || 0,
      liquidity: pair.liquidity ? parseFloat(pair.liquidity.usd) : undefined,
      fdv: pair.fdv ? parseFloat(pair.fdv) : undefined,
      source: "dexscreener",
    };
  }

  private parseCoinGecko(symbol: string, data: unknown): PriceData | null {
    const d = data as Record<
      string,
      {
        usd: number;
        usd_market_cap?: number;
        usd_24h_vol?: number;
        usd_24h_change?: number;
      }
    >;

    const coinData = d[symbol.toLowerCase()];
    if (!coinData) return null;

    return {
      symbol,
      price: coinData.usd,
      volume24h: coinData.usd_24h_vol || 0,
      change24h: coinData.usd_24h_change || 0,
      marketCap: coinData.usd_market_cap,
      source: "coingecko",
    };
  }

  private parseBirdeye(symbol: string, data: unknown): PriceData | null {
    const d = data as { data?: { value?: number; updateUnixTime?: number } };
    if (!d.data?.value) return null;

    return {
      symbol,
      price: d.data.value,
      volume24h: 0, // Not provided in basic endpoint
      change24h: 0,
      source: "birdeye",
    };
  }

  /**
   * Get stock price from Yahoo Finance
   */
  private async getStockPrice(ticker: string): Promise<PriceData | null> {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}`;

    const result = await fetchWithRetry<{
      chart?: {
        result?: Array<{
          meta?: {
            regularMarketPrice?: number;
            regularMarketVolume?: number;
            regularMarketChangePercent?: number;
            marketCap?: number;
            trailingPE?: number;
            previousClose?: number;
          };
        }>;
        error?: { description?: string };
      };
    }>(url, { parser: "json" });

    if (!result.success || !result.data) {
      return null;
    }

    const chart = result.data.chart;
    if (chart?.error || !chart?.result?.[0]?.meta) {
      return null;
    }

    const meta = chart.result[0].meta;

    return {
      symbol: ticker,
      price: meta.regularMarketPrice || 0,
      volume24h: meta.regularMarketVolume || 0,
      change24h: meta.regularMarketChangePercent || 0,
      marketCap: meta.marketCap,
      peRatio: meta.trailingPE,
      source: "yahoo_finance",
    };
  }

  /**
   * Get penny stock price from OTC Markets
   */
  private async getPennyStockPrice(ticker: string): Promise<PriceData | null> {
    const url = `https://www.otcmarkets.com/stock/${ticker}/quote`;

    const result = await fetchWithRetry<string>(url, { parser: "text" });

    if (!result.success || !result.data) {
      return null;
    }

    // Parse OTC Markets HTML
    const html = result.data;

    // Extract price using regex (OTC Markets has dynamic content)
    const priceMatch = html.match(/last-price[^>]*>([^<]+)/i);
    const volumeMatch = html.match(/Volume[\s\S]*?<td[^>]*>([^<]+)/i);

    if (!priceMatch) return null;

    const price = extractNumber(priceMatch[1]);
    const volume = volumeMatch ? extractVolume(volumeMatch[1]) : 0;

    if (!price) return null;

    return {
      symbol: ticker,
      price,
      volume24h: volume || 0,
      change24h: 0, // Not easily extractable
      source: "otc_markets",
    };
  }

  /**
   * Get forex price
   */
  private async getForexPrice(pair: string): Promise<PriceData | null> {
    // Format: EURUSD=X for Yahoo Finance
    const formattedPair = pair.includes("=") ? pair : `${pair}=X`;

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${formattedPair}`;

    const result = await fetchWithRetry<{
      chart?: {
        result?: Array<{
          meta?: {
            regularMarketPrice?: number;
            regularMarketChangePercent?: number;
          };
        }>;
      };
    }>(url, { parser: "json" });

    if (!result.success || !result.data?.chart?.result?.[0]?.meta) {
      return null;
    }

    const meta = result.data.chart.result[0].meta;

    return {
      symbol: pair,
      price: meta.regularMarketPrice || 0,
      volume24h: 0,
      change24h: meta.regularMarketChangePercent || 0,
      source: "yahoo_finance_forex",
    };
  }

  /**
   * Get commodity price
   */
  private async getCommodityPrice(symbol: string): Promise<PriceData | null> {
    // Map common names to Yahoo symbols
    const commodityMap: Record<string, string> = {
      GOLD: "GC=F",
      SILVER: "SI=F",
      OIL: "CL=F",
      BRENT: "BZ=F",
      NATGAS: "NG=F",
      COPPER: "HG=F",
    };

    const yahooSymbol = commodityMap[symbol.toUpperCase()] || symbol;

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}`;

    const result = await fetchWithRetry<{
      chart?: {
        result?: Array<{
          meta?: {
            regularMarketPrice?: number;
            regularMarketChangePercent?: number;
          };
        }>;
      };
    }>(url, { parser: "json" });

    if (!result.success || !result.data?.chart?.result?.[0]?.meta) {
      return null;
    }

    const meta = result.data.chart.result[0].meta;

    return {
      symbol,
      price: meta.regularMarketPrice || 0,
      volume24h: 0,
      change24h: meta.regularMarketChangePercent || 0,
      source: "yahoo_finance_commodity",
    };
  }
}
