/**
 * OpenJoey Price Service
 * Real-time cryptocurrency price data from CoinGecko API
 */

export interface PriceData {
  symbol: string;
  price: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  volume_24h: number;
  market_cap: number;
  last_updated: string;
}

export interface PriceCache {
  [symbol: string]: {
    data: PriceData;
    timestamp: number;
  };
}

// CoinGecko API base URL
const COINGECKO_API = "https://api.coingecko.com/api/v3";

// Cache duration: 30 seconds for price data
const CACHE_DURATION = 30 * 1000;

// In-memory price cache
const priceCache: PriceCache = {};

// Symbol to CoinGecko ID mapping
const SYMBOL_TO_ID: { [key: string]: string } = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  RAY: "raydium",
  AVAX: "avalanche-2",
  MATIC: "matic-network",
  DOT: "polkadot",
  LINK: "chainlink",
  UNI: "uniswap",
  AAVE: "aave",
  DOGE: "dogecoin",
  XRP: "ripple",
  ADA: "cardano",
  SHIB: "shiba-inu",
  LTC: "litecoin",
  BCH: "bitcoin-cash",
  XLM: "stellar",
  TRX: "tron",
  ETC: "ethereum-classic",
  XMR: "monero",
};

/**
 * Get current price for a cryptocurrency
 */
export async function getPrice(symbol: string): Promise<PriceData | null> {
  const normalizedSymbol = symbol.toUpperCase();
  const now = Date.now();

  // Check cache first
  const cached = priceCache[normalizedSymbol];
  if (cached && now - cached.timestamp < CACHE_DURATION) {
    console.log(`Using cached price for ${normalizedSymbol}`);
    return cached.data;
  }

  try {
    const coinId = SYMBOL_TO_ID[normalizedSymbol];
    if (!coinId) {
      console.warn(`Unknown symbol: ${normalizedSymbol}`);
      return null;
    }

    const response = await fetch(
      `${COINGECKO_API}/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`,
      {
        headers: {
          Accept: "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();
    const coinData = data[coinId];

    if (!coinData) {
      return null;
    }

    const priceData: PriceData = {
      symbol: normalizedSymbol,
      price: coinData.usd,
      price_change_24h: coinData.usd_24h_change || 0,
      price_change_percentage_24h: coinData.usd_24h_change || 0,
      volume_24h: coinData.usd_24h_vol || 0,
      market_cap: coinData.usd_market_cap || 0,
      last_updated: new Date().toISOString(),
    };

    // Update cache
    priceCache[normalizedSymbol] = {
      data: priceData,
      timestamp: now,
    };

    console.log(`Fetched live price for ${normalizedSymbol}: $${priceData.price}`);
    return priceData;
  } catch (error) {
    console.error(`Error fetching price for ${normalizedSymbol}:`, error);

    // Return cached data even if stale, as fallback
    if (cached) {
      console.log(`Returning stale cached price for ${normalizedSymbol}`);
      return cached.data;
    }

    return null;
  }
}

/**
 * Get prices for multiple cryptocurrencies
 */
export async function getMultiplePrices(symbols: string[]): Promise<PriceData[]> {
  const results: PriceData[] = [];

  // Filter valid symbols
  const validSymbols = symbols.filter((s) => SYMBOL_TO_ID[s.toUpperCase()]);

  if (validSymbols.length === 0) {
    return results;
  }

  try {
    const coinIds = validSymbols.map((s) => SYMBOL_TO_ID[s.toUpperCase()]).join(",");

    const response = await fetch(
      `${COINGECKO_API}/simple/price?ids=${coinIds}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`,
      {
        headers: {
          Accept: "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();
    const now = Date.now();

    for (const symbol of validSymbols) {
      const coinId = SYMBOL_TO_ID[symbol.toUpperCase()];
      const coinData = data[coinId];

      if (coinData) {
        const priceData: PriceData = {
          symbol: symbol.toUpperCase(),
          price: coinData.usd,
          price_change_24h: coinData.usd_24h_change || 0,
          price_change_percentage_24h: coinData.usd_24h_change || 0,
          volume_24h: coinData.usd_24h_vol || 0,
          market_cap: coinData.usd_market_cap || 0,
          last_updated: new Date().toISOString(),
        };

        // Update cache
        priceCache[symbol.toUpperCase()] = {
          data: priceData,
          timestamp: now,
        };

        results.push(priceData);
      }
    }

    console.log(`Fetched live prices for ${results.length} assets`);
    return results;
  } catch (error) {
    console.error("Error fetching multiple prices:", error);

    // Return cached data as fallback
    for (const symbol of symbols) {
      const cached = priceCache[symbol.toUpperCase()];
      if (cached) {
        results.push(cached.data);
      }
    }

    return results;
  }
}

/**
 * Get trending coins from CoinGecko
 */
export async function getTrendingCoins(): Promise<
  Array<{ symbol: string; name: string; price: number; change_24h: number }>
> {
  try {
    const response = await fetch(`${COINGECKO_API}/search/trending`, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();

    return data.coins.slice(0, 10).map((coin: any) => ({
      symbol: coin.item.symbol.toUpperCase(),
      name: coin.item.name,
      price: coin.item.data?.price || 0,
      change_24h: coin.item.data?.price_change_percentage_24h?.usd || 0,
    }));
  } catch (error) {
    console.error("Error fetching trending coins:", error);
    return [];
  }
}

/**
 * Clear price cache (useful for testing or manual refresh)
 */
export function clearPriceCache(): void {
  Object.keys(priceCache).forEach((key) => delete priceCache[key]);
  console.log("Price cache cleared");
}

/**
 * Get supported symbols
 */
export function getSupportedSymbols(): string[] {
  return Object.keys(SYMBOL_TO_ID);
}
