/**
 * OpenJoey Multi-Chain Price Service
 * Smart data aggregation across Solana, Ethereum, and BSC
 * Prioritizes free APIs with intelligent fallback logic
 */

import { getOpenJoeyDB } from "../../supabase-client.js";

// Chain detection patterns
export interface ChainInfo {
  chain: "solana" | "ethereum" | "bsc" | "unknown";
  confidence: number; // 0-100
  detectedBy: "address" | "symbol" | "pair" | "fallback";
}

export interface TokenData {
  symbol: string;
  price: number;
  priceChange24h: number;
  volume24h: number;
  liquidity: number;
  marketCap?: number;
  fdv?: number;
  chain: string;
  source: string;
  timestamp: string;
  riskScore: number; // 0-100, chain-adjusted
}

export interface TrendingToken {
  symbol: string;
  chain: string;
  trendScore: number;
  volumeSpike: boolean;
  liquidityHealth: "excellent" | "good" | "moderate" | "poor";
  priceChange24h: number;
  detectedAt: string;
}

// Free API configurations
const API_CONFIGS = {
  dexscreener: {
    baseUrl: "https://api.dexscreener.com/latest/dex",
    rateLimit: { requests: 100, window: 60 },
    timeout: 5000,
  },
  binance: {
    baseUrl: "https://api.binance.com/api/v3",
    rateLimit: { requests: 1200, window: 60 },
    timeout: 3000,
  },
  geckoterminal: {
    baseUrl: "https://api.geckoterminal.com/api/v2",
    rateLimit: { requests: 50, window: 60 },
    timeout: 5000,
  },
  jupiter: {
    baseUrl: "https://quote-api.jup.ag/v6",
    rateLimit: { requests: 100, window: 60 },
    timeout: 5000,
  },
};

// Chain-specific risk weights
const CHAIN_RISK_WEIGHTS = {
  solana: {
    volatility: 1.3, // Higher volatility weight
    liquidity: 1.2, // More emphasis on liquidity
    novelty: 1.4, // New token weight
    scamRisk: 1.5, // Higher scam risk
  },
  ethereum: {
    volatility: 1.0,
    liquidity: 1.3, // Stronger emphasis on liquidity
    marketCap: 1.2, // Market cap matters more
    correlation: 1.1, // ETH correlation factor
  },
  bsc: {
    volatility: 1.2,
    liquidity: 1.4, // Very high liquidity emphasis
    scamRisk: 1.8, // Highest scam risk weight
    novelty: 1.3,
  },
};

/**
 * Detect blockchain from token address or symbol
 */
export function detectChain(tokenOrAddress: string): ChainInfo {
  // Solana address pattern (Base58, 32-44 chars, no 0x)
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(tokenOrAddress) && !tokenOrAddress.startsWith("0x")) {
    return { chain: "solana", confidence: 95, detectedBy: "address" };
  }

  // Ethereum/BSC address pattern (0x + 40 chars)
  if (/^0x[a-fA-F0-9]{40}$/.test(tokenOrAddress)) {
    return { chain: "ethereum", confidence: 80, detectedBy: "address" };
  }

  // Symbol-based detection (fallback)
  const upperSymbol = tokenOrAddress.toUpperCase();

  // Solana-specific symbols
  const solanaTokens = ["SOL", "RAY", "BONK", "WIF", "PEPE", "JUP", "DRIFT", "MANGO"];
  if (solanaTokens.includes(upperSymbol)) {
    return { chain: "solana", confidence: 85, detectedBy: "symbol" };
  }

  // Ethereum-specific symbols
  const ethTokens = ["ETH", "UNI", "AAVE", "LINK", "MATIC", "SHIB", "ARB"];
  if (ethTokens.includes(upperSymbol)) {
    return { chain: "ethereum", confidence: 85, detectedBy: "symbol" };
  }

  // BSC-specific symbols
  const bscTokens = ["BNB", "CAKE", "SAFE", "LUNC", "FLOKI", "BABYDOGE"];
  if (bscTokens.includes(upperSymbol)) {
    return { chain: "bsc", confidence: 85, detectedBy: "symbol" };
  }

  return { chain: "unknown", confidence: 0, detectedBy: "fallback" };
}

/**
 * Select optimal data source based on chain and token
 */
export function selectDataSource(
  chain: string,
  symbol: string,
): { primary: string; backup: string } {
  const isMajor = ["BTC", "ETH", "SOL", "BNB"].includes(symbol);

  switch (chain) {
    case "solana":
      // Only DexScreener works reliably
      return {
        primary: "dexscreener",
        backup: "dexscreener",
      };

    case "ethereum":
      if (isMajor) {
        return {
          primary: "binance",
          backup: "dexscreener",
        };
      }
      return {
        primary: "dexscreener",
        backup: "dexscreener",
      };

    case "bsc":
      return {
        primary: "dexscreener",
        backup: "dexscreener",
      };

    default:
      return {
        primary: "dexscreener",
        backup: "dexscreener",
      };
  }
}

/**
 * Calculate chain-adjusted risk score
 */
export function calculateChainRiskScore(
  chain: string,
  liquidity: number,
  volume: number,
  marketCap?: number,
): number {
  const weights = CHAIN_RISK_WEIGHTS[chain as keyof typeof CHAIN_RISK_WEIGHTS];
  if (!weights) return 50; // Default medium risk

  let riskScore = 50; // Base score

  // Liquidity risk (inverse - lower liquidity = higher risk)
  const liquidityScore = Math.max(0, Math.min(100, 100 - (liquidity / 10000) * 100));
  riskScore += liquidityScore * weights.liquidity * 0.3;

  // Volume consistency risk
  const volumeScore = volume > 100000 ? 20 : volume > 10000 ? 40 : 60;
  riskScore += volumeScore * 0.2;

  // Chain-specific factors
  if (chain === "solana") {
    const solanaWeights = weights as {
      volatility: number;
      liquidity: number;
      novelty: number;
      scamRisk: number;
    };
    riskScore += 10 * solanaWeights.volatility; // Higher base volatility
  }

  if (chain === "bsc") {
    const bscWeights = weights as {
      volatility: number;
      liquidity: number;
      novelty: number;
      scamRisk: number;
    };
    riskScore += 15 * bscWeights.scamRisk; // Higher scam risk
  }

  if (chain === "ethereum" && marketCap) {
    const ethWeights = weights as {
      volatility: number;
      liquidity: number;
      marketCap: number;
      correlation: number;
    };
    const marketCapScore = marketCap > 100000000 ? 20 : 40;
    riskScore += marketCapScore * ethWeights.marketCap * 0.3;
  }

  return Math.min(100, Math.max(0, Math.round(riskScore)));
}

/**
 * Fetch with timeout protection (3 second limit for Telegram speed)
 */
async function fetchWithTimeout(url: string, timeoutMs: number = 3000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Fetch from GeckoTerminal (backup source)
 */
async function fetchFromGeckoTerminal(symbol: string): Promise<TokenData | null> {
  try {
    const response = await fetchWithTimeout(
      `${API_CONFIGS.geckoterminal.baseUrl}/search?query=${symbol}`,
      API_CONFIGS.geckoterminal.timeout,
    );
    const data = await response.json();

    if (data.data && data.data.length > 0) {
      const token = data.data[0];
      const chain = detectChain(token.attributes.network || "unknown");

      return {
        symbol: token.attributes.symbol,
        price: parseFloat(token.attributes.price_usd || "0"),
        priceChange24h: parseFloat(token.attributes.price_change_percentage_24h || "0"),
        volume24h: parseFloat(token.attributes.volume_usd_24h || "0"),
        liquidity: parseFloat(token.attributes.liquidity_usd || "0"),
        marketCap: parseFloat(token.attributes.market_cap_usd || "0"),
        fdv: parseFloat(token.attributes.fdv_usd || "0"),
        chain: chain.chain,
        source: "geckoterminal",
        timestamp: new Date().toISOString(),
        riskScore: calculateChainRiskScore(
          chain.chain,
          parseFloat(token.attributes.liquidity_usd || "0"),
          parseFloat(token.attributes.volume_usd_24h || "0"),
        ),
      };
    }

    return null;
  } catch (error) {
    console.error("GeckoTerminal fetch error:", error);
    return null;
  }
}

/**
 * Fetch from DexScreener (primary for most tokens)
 */
async function fetchFromDexScreener(symbol: string): Promise<TokenData | null> {
  try {
    const response = await fetchWithTimeout(
      `${API_CONFIGS.dexscreener.baseUrl}/search?q=${symbol}`,
      API_CONFIGS.dexscreener.timeout,
    );
    const data = await response.json();

    if (data.pairs && data.pairs.length > 0) {
      const pair = data.pairs[0];
      const chain = detectChain(pair.chainId || "unknown");

      return {
        symbol: pair.baseToken.symbol,
        price: parseFloat(pair.priceUsd),
        priceChange24h: parseFloat(pair.priceChange24h || "0"),
        volume24h: parseFloat(pair.volume?.h24 || "0"),
        liquidity: parseFloat(pair.liquidity?.usd || "0"),
        marketCap: parseFloat(pair.fdv || pair.marketCap || "0"),
        fdv: parseFloat(pair.fdv || "0"),
        chain: chain.chain,
        source: "dexscreener",
        timestamp: new Date().toISOString(),
        riskScore: calculateChainRiskScore(
          chain.chain,
          parseFloat(pair.liquidity?.usd || "0"),
          parseFloat(pair.volume?.h24 || "0"),
        ),
      };
    }

    return null;
  } catch (error) {
    console.error("DexScreener fetch error:", error);
    return null;
  }
}

/**
 * Fetch from Binance (for majors)
 */
async function fetchFromBinance(symbol: string): Promise<TokenData | null> {
  try {
    const response = await fetchWithTimeout(
      `${API_CONFIGS.binance.baseUrl}/ticker/24hr?symbol=${symbol}USDT`,
      API_CONFIGS.binance.timeout,
    );
    const data = await response.json();

    if (data && data.lastPrice) {
      const chain = detectChain(symbol);

      return {
        symbol: symbol,
        price: parseFloat(data.lastPrice),
        priceChange24h: parseFloat(data.priceChangePercent),
        volume24h: parseFloat(data.volume),
        liquidity: parseFloat(data.quoteVolume) * 0.1, // Estimate liquidity as 10% of quote volume
        marketCap: 0, // Would need separate endpoint
        chain: chain.chain,
        source: "binance",
        timestamp: new Date().toISOString(),
        riskScore: calculateChainRiskScore(
          chain.chain,
          parseFloat(data.quoteVolume) * 0.1,
          parseFloat(data.volume),
        ),
      };
    }

    return null;
  } catch (error) {
    console.error("Binance fetch error:", error);
    return null;
  }
}

// Solana token mint addresses mapping
const SOLANA_TOKEN_MINTS: Record<string, string> = {
  SOL: "So11111111111111111111111111111111111111112",
  USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  RAY: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
  BONK: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
  JUP: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
  WIF: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
  PEPE: "2ATD6KpNZ8o9hMV4R2aMtxCRzfyJxH7Yq4XzLypEYyEY",
  DRIFT: "DriFtupJYLTosbwoN8NCbJvtTecvWH9m15aR9rzRDsZE",
  MANGO: "MangoCzJ36AjZyKwVj6VKxQYZpWVQWbTTyeNZ8yYVQjE",
};

/**
 * Fetch from Jupiter (Solana-specific)
 */
async function fetchFromJupiter(symbol: string): Promise<TokenData | null> {
  try {
    // Get token mint address
    const inputMint = SOLANA_TOKEN_MINTS[symbol.toUpperCase()];
    if (!inputMint) {
      console.log(`No Jupiter mint address for ${symbol}`);
      return null;
    }

    const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

    const response = await fetchWithTimeout(
      `${API_CONFIGS.jupiter.baseUrl}/quote?inputMint=${inputMint}&outputMint=${USDC_MINT}&amount=1000000000&slippageBps=50`,
      API_CONFIGS.jupiter.timeout,
    );
    const data = await response.json();

    if (data && data.outAmount) {
      // Calculate price: outAmount / inputAmount (in USDC)
      const price = parseFloat(data.outAmount) / 1000000000;

      return {
        symbol: symbol,
        price: price,
        priceChange24h: 0, // Jupiter doesn't provide 24h change
        volume24h: 0, // Would need additional endpoint
        liquidity: parseFloat(data.otherAmountThreshold || "0"), // Available liquidity
        chain: "solana",
        source: "jupiter",
        timestamp: new Date().toISOString(),
        riskScore: calculateChainRiskScore(
          "solana",
          parseFloat(data.otherAmountThreshold || "0"),
          0,
        ),
      };
    }

    return null;
  } catch (error) {
    console.error("Jupiter fetch error:", error);
    return null;
  }
}

/**
 * Smart multi-source fetch with fallback
 */
export async function fetchTokenData(symbol: string): Promise<TokenData | null> {
  const chain = detectChain(symbol);
  const sources = selectDataSource(chain.chain, symbol);

  console.log(`Fetching ${symbol} for ${chain.chain} using ${sources.primary}`);

  // Try primary source
  try {
    let data = null;

    switch (sources.primary) {
      case "binance":
        data = await fetchFromBinance(symbol);
        break;
      case "dexscreener":
        data = await fetchFromDexScreener(symbol);
        break;
    }

    if (data) {
      // Cache the result
      await cacheTokenData(data);
      return data;
    }
  } catch (error) {
    console.error(`Primary source ${sources.primary} failed:`, error);
  }

  // Try backup source
  try {
    let backupData = null;

    switch (sources.backup) {
      case "dexscreener":
        backupData = await fetchFromDexScreener(symbol);
        break;
      case "binance":
        backupData = await fetchFromBinance(symbol);
        break;
    }

    if (backupData) {
      await cacheTokenData(backupData);
      return backupData;
    }
  } catch (error) {
    console.error(`Backup source ${sources.backup} failed:`, error);
  }

  return null;
}

/**
 * Cache token data in Supabase
 */
async function cacheTokenData(data: TokenData): Promise<void> {
  try {
    const db = getOpenJoeyDB();
    await db.insert("token_cache", {
      symbol: data.symbol,
      chain: data.chain,
      price: data.price,
      price_change_24h: data.priceChange24h,
      volume_24h: data.volume24h,
      liquidity: data.liquidity,
      market_cap: data.marketCap,
      fdv: data.fdv,
      source: data.source,
      risk_score: data.riskScore,
      cached_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30000).toISOString(), // 30 seconds
    });
  } catch (error) {
    console.error("Cache error:", error);
  }
}

/**
 * Get cached token data
 */
export async function getCachedTokenData(symbol: string): Promise<TokenData | null> {
  try {
    const db = getOpenJoeyDB();
    const cached = await db.get("token_cache", `symbol=eq.${symbol}&order=cached_at.desc&limit=1`);

    if (cached && cached.length > 0) {
      const cache = cached[0] as any;
      const expiresAt = new Date(cache.expires_at);

      if (expiresAt > new Date()) {
        return {
          symbol: cache.symbol,
          price: cache.price,
          priceChange24h: cache.price_change_24h,
          volume24h: cache.volume_24h,
          liquidity: cache.liquidity,
          marketCap: cache.market_cap,
          fdv: cache.fdv,
          chain: cache.chain,
          source: cache.source,
          timestamp: cache.cached_at,
          riskScore: cache.risk_score,
        };
      }
    }

    return null;
  } catch (error) {
    console.error("Cache fetch error:", error);
    return null;
  }
}

/**
 * Main token data fetch with caching
 */
export async function getTokenData(symbol: string): Promise<TokenData | null> {
  // Check cache first
  const cached = await getCachedTokenData(symbol);
  if (cached) {
    console.log(`Cache hit for ${symbol}`);
    return cached;
  }

  // Fetch fresh data
  console.log(`Cache miss for ${symbol}, fetching fresh data`);
  return await fetchTokenData(symbol);
}

/**
 * Get trending tokens by chain - REAL DATA from DexScreener
 */
export async function getTrendingByChain(
  chain: "solana" | "ethereum" | "bsc" | "all",
): Promise<TrendingToken[]> {
  try {
    // Use DexScreener search with popular tokens to get trending data
    // The pairs/{chain} endpoint is blocked, so we search for popular tokens
    const popularTokens: Record<string, string[]> = {
      solana: ["SOL", "RAY", "BONK", "JUP", "WIF"],
      ethereum: ["ETH", "UNI", "AAVE", "LINK", "SHIB"],
      bsc: ["BNB", "CAKE", "FLOKI", "BABYDOGE"],
      all: ["SOL", "ETH", "BNB", "RAY", "UNI"],
    };

    const tokensToCheck = popularTokens[chain] || popularTokens["all"];
    const trending: TrendingToken[] = [];

    for (const symbol of tokensToCheck) {
      try {
        const response = await fetchWithTimeout(
          `${API_CONFIGS.dexscreener.baseUrl}/search?q=${symbol}`,
          API_CONFIGS.dexscreener.timeout,
        );
        const data = await response.json();

        if (data.pairs && data.pairs.length > 0) {
          // Find the pair for the correct chain
          const pair =
            chain === "all"
              ? data.pairs[0]
              : data.pairs.find((p: any) => p.chainId === chain) || data.pairs[0];

          if (pair) {
            const volume24h = parseFloat(pair.volume?.h24 || "0");
            const volume1h = parseFloat(pair.volume?.h1 || "0");
            const liquidity = parseFloat(pair.liquidity?.usd || "0");
            const priceChange1h = parseFloat(pair.priceChange?.h1 || "0");
            const priceChange24h = parseFloat(pair.priceChange?.h24 || "0");

            // Calculate trend score (0-100)
            let trendScore = 50; // Base score

            // Volume spike detection (3x average is significant)
            const hourlyAvgVolume = volume24h / 24;
            const volumeSpike = hourlyAvgVolume > 0 && volume1h > hourlyAvgVolume * 3;

            if (volumeSpike) trendScore += 20;
            if (priceChange1h > 5) trendScore += 15;
            if (priceChange24h > 10) trendScore += 10;
            if (liquidity > 1000000) trendScore += 5;

            // Determine liquidity health
            let liquidityHealth: "excellent" | "good" | "moderate" | "poor";
            if (liquidity > 5000000) liquidityHealth = "excellent";
            else if (liquidity > 1000000) liquidityHealth = "good";
            else if (liquidity > 100000) liquidityHealth = "moderate";
            else liquidityHealth = "poor";

            trending.push({
              symbol: pair.baseToken.symbol,
              chain: pair.chainId || chain,
              trendScore: Math.min(100, trendScore),
              volumeSpike,
              liquidityHealth,
              priceChange24h,
              detectedAt: new Date().toISOString(),
            });
          }
        }
      } catch (error) {
        console.error(`Error fetching ${symbol}:`, error);
      }
    }

    // Sort by trend score
    return trending.sort((a, b) => b.trendScore - a.trendScore).slice(0, 10);
  } catch (error) {
    console.error("Trending fetch error:", error);
    return [];
  }
}

/**
 * Format multi-chain response for Telegram
 */
export function formatMultiChainResponse(data: TokenData | TrendingToken[]): string {
  if (Array.isArray(data)) {
    // Trending list response
    let response = "🔥 **Trending by Chain**\n\n";

    const byChain = data.reduce(
      (acc, token) => {
        if (!acc[token.chain]) acc[token.chain] = [];
        acc[token.chain].push(token);
        return acc;
      },
      {} as Record<string, TrendingToken[]>,
    );

    Object.entries(byChain).forEach(([chain, tokens]) => {
      const chainEmoji = chain === "solana" ? "🟣" : chain === "ethereum" ? "🟡" : "🟢";
      response += `${chainEmoji} **${chain.toUpperCase()}**\n`;

      tokens.slice(0, 3).forEach((token) => {
        const spikeEmoji = token.volumeSpike ? "📈" : "📊";
        const liquidityEmoji =
          token.liquidityHealth === "excellent"
            ? "💧"
            : token.liquidityHealth === "good"
              ? "💧"
              : "💧";

        response += `  ${spikeEmoji} ${token.symbol} ${token.priceChange24h > 0 ? "+" : ""}${token.priceChange24h}% ${liquidityEmoji}\n`;
      });

      response += "\n";
    });

    return response;
  } else {
    // Single token response
    const token = data as TokenData;
    const chainEmoji = token.chain === "solana" ? "🟣" : token.chain === "ethereum" ? "🟡" : "🟢";

    const riskEmoji = token.riskScore > 70 ? "⚠️" : token.riskScore > 40 ? "⚡" : "✅";

    let response = `${chainEmoji} **${token.symbol}** (${token.chain.toUpperCase()})\n\n`;
    response += `💰 Price: $${token.price.toLocaleString()}\n`;
    response += `📈 24h: ${token.priceChange24h > 0 ? "+" : ""}${token.priceChange24h}%\n`;
    response += `💧 Liquidity: $${(token.liquidity / 1000000).toFixed(1)}M\n`;
    response += `📊 Volume: $${(token.volume24h / 1000000).toFixed(1)}M\n`;
    response += `${riskEmoji} Risk Score: ${token.riskScore}/100\n`;
    response += `📊 Source: ${token.source}\n`;

    // Chain-specific insights
    if (token.chain === "solana") {
      response += `\n🟣 **Solana Analysis**: High volatility environment. Strong momentum but elevated risk.`;
    } else if (token.chain === "ethereum") {
      response += `\n🟡 **Ethereum Analysis**: Strong liquidity. Structurally healthier than small-cap tokens.`;
    } else if (token.chain === "bsc") {
      response += `\n🟢 **BSC Analysis**: Liquidity is relatively low and volatility is high. Risk level is elevated.`;
    }

    return response;
  }
}
