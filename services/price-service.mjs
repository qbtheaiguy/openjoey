/**
 * OpenJoey Multi-Chain Price Service - Standalone Version
 * Smart data aggregation across Solana, Ethereum, and BSC
 */

import http from "http";

// Simple in-memory cache
const cache = new Map();
const CACHE_TTL = {
  price: 15000, // 15 seconds
  stats: 30000, // 30 seconds
  trending: 300000, // 5 minutes
};

// Chain detection patterns
const CHAIN_PATTERNS = {
  solana: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
  ethereum: /^0x[a-fA-F0-9]{40}$/,
};

// Token mints for Solana
const SOLANA_TOKEN_MINTS = {
  SOL: "So11111111111111111111111111111111111111112",
  USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  RAY: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
  BONK: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
  JUP: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
  WIF: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
};

// API configurations
const API_CONFIGS = {
  dexscreener: {
    baseUrl: "https://api.dexscreener.com/latest/dex",
    timeout: 5000,
  },
  binance: {
    baseUrl: "https://api.binance.com/api/v3",
    timeout: 3000,
  },
};

// Detect chain from token symbol or address
function detectChain(tokenOrAddress) {
  if (CHAIN_PATTERNS.solana.test(tokenOrAddress) && !tokenOrAddress.startsWith("0x")) {
    return { chain: "solana", confidence: 95 };
  }
  if (CHAIN_PATTERNS.ethereum.test(tokenOrAddress)) {
    return { chain: "ethereum", confidence: 80 };
  }

  // Symbol-based detection
  const solanaTokens = Object.keys(SOLANA_TOKEN_MINTS);
  if (solanaTokens.includes(tokenOrAddress.toUpperCase())) {
    return { chain: "solana", confidence: 90 };
  }

  // Default to ethereum for unknown
  return { chain: "ethereum", confidence: 50 };
}

// Fetch with timeout
async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    return response;
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

// Fetch from DexScreener
async function fetchFromDexScreener(symbol) {
  const url = `${API_CONFIGS.dexscreener.baseUrl}/search?q=${symbol}`;
  const response = await fetchWithTimeout(url, API_CONFIGS.dexscreener.timeout);

  if (!response.ok) {
    throw new Error(`DexScreener error: ${response.status}`);
  }

  const data = await response.json();

  if (!data.pairs || data.pairs.length === 0) {
    return null;
  }

  const pair = data.pairs[0];
  const chain = detectChain(symbol);

  return {
    symbol: symbol.toUpperCase(),
    price: parseFloat(pair.priceUsd || "0"),
    priceChange24h: parseFloat(pair.priceChange?.h24 || "0"),
    volume24h: parseFloat(pair.volume?.h24 || "0"),
    liquidity: parseFloat(pair.liquidity?.usd || "0"),
    marketCap: parseFloat(pair.marketCap || "0"),
    chain: pair.chainId || chain.chain,
    source: "DexScreener",
    timestamp: new Date().toISOString(),
    riskScore: calculateRiskScore(pair),
  };
}

// Fetch from Binance
async function fetchFromBinance(symbol) {
  const upperSymbol = symbol.toUpperCase();
  const pair = `${upperSymbol}USDT`;

  const [tickerResponse, statsResponse] = await Promise.all([
    fetchWithTimeout(
      `${API_CONFIGS.binance.baseUrl}/ticker/price?symbol=${pair}`,
      API_CONFIGS.binance.timeout,
    ),
    fetchWithTimeout(
      `${API_CONFIGS.binance.baseUrl}/ticker/24hr?symbol=${pair}`,
      API_CONFIGS.binance.timeout,
    ),
  ]);

  if (!tickerResponse.ok || !statsResponse.ok) {
    return null;
  }

  const ticker = await tickerResponse.json();
  const stats = await statsResponse.json();

  return {
    symbol: upperSymbol,
    price: parseFloat(ticker.price || "0"),
    priceChange24h: parseFloat(stats.priceChangePercent || "0"),
    volume24h: parseFloat(stats.volume || "0") * parseFloat(ticker.price || "0"),
    liquidity: parseFloat(stats.quoteVolume || "0"),
    chain: "ethereum",
    source: "Binance",
    timestamp: new Date().toISOString(),
    riskScore: 30, // Majors have lower risk
  };
}

// Calculate risk score
function calculateRiskScore(pair) {
  let score = 50;
  const liquidity = parseFloat(pair.liquidity?.usd || "0");
  const volume24h = parseFloat(pair.volume?.h24 || "0");
  const priceChange = parseFloat(pair.priceChange?.h24 || "0");

  // Liquidity scoring
  if (liquidity > 10000000) score -= 20;
  else if (liquidity > 1000000) score -= 10;
  else if (liquidity < 100000) score += 20;

  // Volume scoring
  if (volume24h > 10000000) score -= 10;
  else if (volume24h < 100000) score += 15;

  // Volatility scoring
  if (Math.abs(priceChange) > 50) score += 20;
  else if (Math.abs(priceChange) > 20) score += 10;

  return Math.max(0, Math.min(100, score));
}

// Select data source
function selectDataSource(chain, symbol) {
  const isMajor = ["BTC", "ETH", "SOL", "BNB"].includes(symbol);

  if (chain === "solana") {
    return { primary: "dexscreener", backup: "dexscreener" };
  }
  if (chain === "ethereum" && isMajor) {
    return { primary: "binance", backup: "dexscreener" };
  }
  return { primary: "dexscreener", backup: "dexscreener" };
}

// Main fetch function
async function fetchTokenData(symbol) {
  const chain = detectChain(symbol);
  const sources = selectDataSource(chain.chain, symbol);

  console.log(`[PRICE] Fetching ${symbol} using ${sources.primary}`);

  // Try primary
  try {
    let data = null;
    if (sources.primary === "binance") {
      data = await fetchFromBinance(symbol);
    } else {
      data = await fetchFromDexScreener(symbol);
    }
    if (data) {
      cache.set(symbol.toUpperCase(), { data, timestamp: Date.now() });
      return data;
    }
  } catch (error) {
    console.error(`[PRICE] Primary failed:`, error.message);
  }

  // Try backup
  try {
    let data = await fetchFromDexScreener(symbol);
    if (data) {
      cache.set(symbol.toUpperCase(), { data, timestamp: Date.now() });
      return data;
    }
  } catch (error) {
    console.error(`[PRICE] Backup failed:`, error.message);
  }

  return null;
}

// Get trending tokens
async function getTrendingTokens() {
  const popularTokens = ["SOL", "ETH", "BNB", "RAY", "UNI", "LINK"];
  const trending = [];

  for (const symbol of popularTokens.slice(0, 5)) {
    try {
      const data = await fetchTokenData(symbol);
      if (data) {
        trending.push({
          symbol: data.symbol,
          chain: data.chain,
          trendScore: data.riskScore > 70 ? 80 : 50,
          priceChange24h: data.priceChange24h,
          liquidityHealth: data.liquidity > 1000000 ? "good" : "moderate",
          detectedAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error(`[PRICE] Trending fetch error for ${symbol}:`, error.message);
    }
  }

  return trending.sort((a, b) => b.trendScore - a.trendScore);
}

const PORT = 3009;

// HTTP Server
console.log(`[PRICE] Price Service starting on port ${PORT}...`);

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");

  // Health check
  if (url.pathname === "/health") {
    res.end(
      JSON.stringify({
        status: "healthy",
        service: "price_service",
        cacheSize: cache.size,
        timestamp: new Date().toISOString(),
      }),
    );
    return;
  }

  // Get price for symbol
  if (url.pathname === "/price") {
    const symbol = url.searchParams.get("symbol");
    if (!symbol) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: "Missing symbol parameter" }));
      return;
    }

    try {
      // Check cache first
      const cached = cache.get(symbol.toUpperCase());
      if (cached && Date.now() - cached.timestamp < CACHE_TTL.price) {
        console.log(`[PRICE] Cache hit for ${symbol}`);
        res.end(
          JSON.stringify({
            success: true,
            data: cached.data,
            cached: true,
          }),
        );
        return;
      }

      const data = await fetchTokenData(symbol);
      if (data) {
        res.end(
          JSON.stringify({
            success: true,
            data,
            cached: false,
          }),
        );
      } else {
        res.statusCode = 404;
        res.end(
          JSON.stringify({
            error: "Live data temporarily unavailable",
            message: "Joey is crunching fresh data for you... 💙 Please try again in a moment!",
          }),
        );
      }
    } catch (error) {
      console.error(`[PRICE] Error:`, error);
      res.statusCode = 500;
      res.end(
        JSON.stringify({
          error: "Service error",
          message: "The markets are moving fast! Refreshing live data for you... ⏱️",
        }),
      );
    }
    return;
  }

  // Get trending tokens
  if (url.pathname === "/trending") {
    try {
      const trending = await getTrendingTokens();
      res.end(
        JSON.stringify({
          success: true,
          data: trending,
        }),
      );
    } catch (error) {
      console.error(`[PRICE] Trending error:`, error);
      res.statusCode = 500;
      res.end(
        JSON.stringify({
          error: "Failed to fetch trending",
          message: "Trending data temporarily unavailable",
        }),
      );
    }
    return;
  }

  // Default response
  res.end(
    JSON.stringify({
      service: "OpenJoey Price Service",
      endpoints: ["/health", "/price?symbol=TOKEN", "/trending"],
    }),
  );
});

server.listen(PORT, () => {
  console.log(`[PRICE] Price Service running on port ${PORT}`);
  console.log("[PRICE] Endpoints: /health, /price?symbol=TOKEN, /trending");
});
