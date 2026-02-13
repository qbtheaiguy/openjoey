/**
 * Maxun Integration - Type Definitions
 * Centralized types for robot data, cache tiers, and API responses
 */

// ============================================================================
// Robot Data Types
// ============================================================================

export interface CryptoPriceData {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  marketCap?: number;
  high24h: number;
  low24h: number;
  timestamp: string;
  source: string;
}

export interface BTCTrackerData extends CryptoPriceData {
  symbol: "BTC";
  dominance: number; // BTC dominance %
  fearGreedIndex: number;
}

export interface ETHTrackerData extends CryptoPriceData {
  symbol: "ETH";
  gasPrice: number; // Gwei
  defiDominance: number;
}

export interface MemeCoinData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: number;
  socialScore: number; // 0-100 buzz level
  isTrending: boolean;
  timestamp: string;
}

export interface DeFiData {
  protocol: string;
  tvl: number; // Total value locked
  tvlChange24h: number;
  tokenPrice: number;
  tokenChange24h: number;
  yield: number; // APY %
  timestamp: string;
}

export interface WhaleMovement {
  symbol: string;
  amount: number;
  valueUsd: number;
  from: string;
  to: string;
  type: "exchange_inflow" | "exchange_outflow" | "wallet_transfer";
  exchange?: string;
  timestamp: string;
  txHash?: string;
}

export interface NewsInsight {
  headline: string;
  source: string;
  sentiment: "bullish" | "bearish" | "neutral";
  confidence: number; // 0-100
  summary: string;
  catalysts: string[];
  coinsMentioned: string[];
  pricePredictions: string[];
  urgency: "breaking" | "normal" | "old";
  url: string;
  publishedAt: string;
}

export interface SocialSentiment {
  overall: "very_positive" | "positive" | "neutral" | "negative" | "very_negative";
  score: number; // -100 to +100
  volume: number; // Mention count
  trend: "improving" | "stable" | "declining";
  topSources: string[];
  trendingTopics: string[];
  timestamp: string;
}

export interface DayTradeSetup {
  symbol: string;
  setupType: "breakout" | "scalp" | "reversal" | "momentum";
  entryPrice: number;
  stopLoss: number;
  targetPrice: number;
  riskReward: string; // "1:2.5"
  volumeChange: number; // %
  confidence: number; // 0-100
  timeframe: string; // "5m", "15m", "1h"
  timestamp: string;
}

export interface FuturesData {
  symbol: string;
  fundingRate: number; // %
  fundingRateChange: number;
  openInterest: number;
  openInterestChange: number;
  longShortRatio: number;
  liquidationLevels: {
    long: number;
    short: number;
  };
  timestamp: string;
}

export interface LPData {
  poolName: string;
  dex: string; // "Uniswap", "PancakeSwap"
  token0: string;
  token1: string;
  tvl: number;
  volume24h: number;
  apy: number;
  impermanentLossRisk: "low" | "medium" | "high";
  timestamp: string;
}

// ============================================================================
// Cache Types
// ============================================================================

export interface CacheTier {
  name: string;
  ttlSeconds: number;
  priority: number; // Lower = checked first
}

export interface CacheEntry<T> {
  data: T;
  cachedAt: number;
  expiresAt: number;
  tier: string;
  robotName: string;
}

export interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  hitRate: number;
  size: number;
  oldestEntry: number;
}

// ============================================================================
// Robot Configuration Types
// ============================================================================

export interface RobotConfig {
  name: string;
  category: RobotCategory;
  priority: "critical" | "high" | "medium" | "low";
  type: "extract" | "ai-extract" | "scrape" | "crawl" | "search";
  source: string;
  schedule: string; // Cron expression
  cacheTtl: number; // Seconds
  retries: number;
  timeout: number; // Milliseconds
  rateLimit?: {
    requestsPerMinute: number;
    delayMs: number;
  };
  backup?: {
    robotName: string;
    trigger: "on_failure" | "on_stale" | "always";
  };
  selectors?: Record<string, string>; // For extract type
  aiPrompt?: string; // For ai-extract type
}

export type RobotCategory =
  | "bluechip" // BTC, ETH
  | "defi" // AAVE, UNI, etc.
  | "meme" // DOGE, PEPE, etc.
  | "daytrade" // Scalping setups
  | "futures" // Perps, funding
  | "lp" // Liquidity pools
  | "trending" // Social trends
  | "l1l2" // Layer 1/2
  | "nft" // NFTs
  | "onchain" // Whale tracking
  | "news" // AI news
  | "airdrop" // Opportunities
  | "macro" // ETF, correlations
  | "gaming" // GameFi
  | "privacy"; // XMR, ZEC

// ============================================================================
// Health Monitoring Types
// ============================================================================

export interface RobotHealth {
  name: string;
  status: "healthy" | "degraded" | "down";
  lastRun: number;
  lastSuccess: number;
  consecutiveFailures: number;
  averageResponseTime: number;
  cacheHitRate: number;
}

export interface HealthReport {
  timestamp: number;
  robots: RobotHealth[];
  summary: {
    total: number;
    healthy: number;
    degraded: number;
    down: number;
    overallStatus: "healthy" | "degraded" | "critical";
  };
}

// ============================================================================
// API Response Types
// ============================================================================

export interface MaxunAPIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta: {
    timestamp: number;
    cached: boolean;
    cacheAge?: number;
    robotName: string;
    fallbackUsed?: boolean;
  };
}

export interface MorningBriefData {
  btc: BTCTrackerData | null;
  eth: ETHTrackerData | null;
  topMemes: MemeCoinData[];
  defi: DeFiData[];
  news: NewsInsight[];
  sentiment: SocialSentiment | null;
  whales: WhaleMovement[];
  daytrades: DayTradeSetup[];
  futures: FuturesData[];
  generatedAt: number;
  robotsUsed: string[];
  cacheHitRate: number;
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface MaxunConfig {
  baseUrl: string;
  apiKey?: string;
  timeout: number;
  retries: number;
  cache: {
    redis: {
      host: string;
      port: number;
      ttlSeconds: Record<RobotCategory, number>;
    };
    file: {
      enabled: boolean;
      ttlSeconds: Record<RobotCategory, number>;
    };
  };
  robots: RobotConfig[];
  healthCheck: {
    intervalMinutes: number;
    staleThresholdMinutes: number;
    alertOnFailure: boolean;
  };
}

// ============================================================================
// Utility Types
// ============================================================================

export type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

export type PartialWithRequired<T, K extends keyof T> = Partial<T> & Pick<T, K>;

// ============================================================================
// Constants
// ============================================================================

export const CACHE_TIERS: Record<RobotCategory, { redis: number; file: number }> = {
  bluechip: { redis: 60, file: 300 }, // 1 min / 5 min
  defi: { redis: 300, file: 900 }, // 5 min / 15 min
  meme: { redis: 180, file: 600 }, // 3 min / 10 min
  daytrade: { redis: 30, file: 120 }, // 30 sec / 2 min
  futures: { redis: 300, file: 900 }, // 5 min / 15 min
  lp: { redis: 300, file: 900 }, // 5 min / 15 min
  trending: { redis: 300, file: 600 }, // 5 min / 10 min
  l1l2: { redis: 600, file: 1800 }, // 10 min / 30 min
  nft: { redis: 900, file: 3600 }, // 15 min / 60 min
  onchain: { redis: 300, file: 600 }, // 5 min / 10 min
  news: { redis: 1800, file: 3600 }, // 30 min / 60 min
  airdrop: { redis: 3600, file: 14400 }, // 60 min / 4 hours
  macro: { redis: 900, file: 3600 }, // 15 min / 60 min
  gaming: { redis: 900, file: 3600 }, // 15 min / 60 min
  privacy: { redis: 900, file: 3600 }, // 15 min / 60 min
};

export const ROBOT_PRIORITY_WEIGHTS = {
  critical: 100,
  high: 75,
  medium: 50,
  low: 25,
};
