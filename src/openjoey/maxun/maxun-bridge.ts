/**
 * Maxun Integration - Core Bridge Module
 * Built using actual Maxun open-source architecture
 * Using Kimi K 2.5 for AI extraction (NOT GPT)
 */

import type {
  BTCTrackerData,
  ETHTrackerData,
  MemeCoinData,
  DeFiData,
  WhaleMovement,
  NewsInsight,
  SocialSentiment,
  DayTradeSetup,
  FuturesData,
  LPData,
  RobotCategory,
  MaxunAPIResponse,
  MorningBriefData,
} from "./types/index.js";
import {
  getCachedData,
  setCachedData,
  warmCache,
  getStaleOrFresh,
  recordCacheHit,
  recordCacheMiss,
  generateCacheKey,
} from "./cache/multi-layer.js";
import { CACHE_TIERS } from "./types/index.js";

// ============================================================================
// Maxun Configuration (Based on actual GitHub repo)
// ============================================================================

const MAXUN_BASE_URL = process.env.MAXUN_URL || "http://localhost:3000";
const MAXUN_API_KEY = process.env.MAXUN_API_KEY;
const DEFAULT_TIMEOUT = 10000;
const DEFAULT_RETRIES = 3;

// Maxun supports 4 robot types:
// 1. Extract - Recorder Mode & AI Mode
// 2. Scrape - Full pages to Markdown/HTML
// 3. Crawl - Entire websites
// 4. Search - Automated web searches

// ============================================================================
// Core Maxun Client (Based on actual API structure)
// ============================================================================

interface MaxunRobotConfig {
  type: "extract" | "scrape" | "crawl" | "search";
  mode?: "recorder" | "ai"; // For extract type
  url?: string;
  selectors?: Record<string, string>; // For recorder mode
  aiPrompt?: string; // For AI mode
  schedule?: string; // Cron expression
}

interface FetchOptions {
  method?: "GET" | "POST";
  body?: unknown;
  timeout?: number;
  retries?: number;
}

async function maxunFetch<T>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<MaxunAPIResponse<T>> {
  const { method = "GET", body, timeout = DEFAULT_TIMEOUT, retries = DEFAULT_RETRIES } = options;

  const url = `${MAXUN_BASE_URL}/api${endpoint}`;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(MAXUN_API_KEY && { Authorization: `Bearer ${MAXUN_API_KEY}` }),
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Maxun API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      return {
        success: true,
        data: data as T,
        meta: {
          timestamp: Date.now(),
          cached: false,
          robotName: endpoint,
        },
      };
    } catch (error) {
      if (attempt === retries - 1) {
        return {
          success: false,
          error: {
            code: "FETCH_ERROR",
            message: error instanceof Error ? error.message : "Unknown error",
          },
          meta: {
            timestamp: Date.now(),
            cached: false,
            robotName: endpoint,
          },
        };
      }

      // Exponential backoff
      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }

  throw new Error("Unreachable");
}

// ============================================================================
// Robot Management (Based on actual Maxun robot types)
// ============================================================================

/**
 * Create an Extract robot (Recorder Mode)
 * Point and click interface for structured data extraction
 */
export async function createExtractRobot(
  name: string,
  config: {
    url: string;
    selectors: Record<string, string>;
    schedule?: string;
  },
): Promise<{ success: boolean; robotId?: string; error?: string }> {
  const response = await maxunFetch<{ robotId: string }>("/robots/extract", {
    method: "POST",
    body: {
      name,
      type: "extract",
      mode: "recorder",
      url: config.url,
      selectors: config.selectors,
      schedule: config.schedule,
    },
  });

  if (response.success && response.data) {
    return { success: true, robotId: response.data.robotId };
  }

  return { success: false, error: response.error?.message };
}

/**
 * Create an AI Extract robot
 * Use LLM to extract structured data from natural language description
 */
export async function createAIExtractRobot(
  name: string,
  config: {
    url: string;
    prompt: string;
    schedule?: string;
    llmProvider?: "kimi" | "openai" | "anthropic"; // Default: kimi
  },
): Promise<{ success: boolean; robotId?: string; error?: string }> {
  const response = await maxunFetch<{ robotId: string }>("/robots/extract", {
    method: "POST",
    body: {
      name,
      type: "extract",
      mode: "ai",
      url: config.url,
      aiPrompt: config.prompt,
      schedule: config.schedule,
      llmProvider: config.llmProvider || "kimi", // Using Kimi K 2.5 by default
    },
  });

  if (response.success && response.data) {
    return { success: true, robotId: response.data.robotId };
  }

  return { success: false, error: response.error?.message };
}

/**
 * Create a Scrape robot
 * Convert full webpages to clean Markdown/HTML
 */
export async function createScrapeRobot(
  name: string,
  config: {
    url: string;
    format?: "markdown" | "html" | "text";
    includeScreenshots?: boolean;
    schedule?: string;
  },
): Promise<{ success: boolean; robotId?: string; error?: string }> {
  const response = await maxunFetch<{ robotId: string }>("/robots/scrape", {
    method: "POST",
    body: {
      name,
      type: "scrape",
      url: config.url,
      format: config.format || "markdown",
      includeScreenshots: config.includeScreenshots || false,
      schedule: config.schedule,
    },
  });

  if (response.success && response.data) {
    return { success: true, robotId: response.data.robotId };
  }

  return { success: false, error: response.error?.message };
}

/**
 * Create a Crawl robot
 * Crawl entire websites with controlled scope
 */
export async function createCrawlRobot(
  name: string,
  config: {
    startUrl: string;
    maxPages?: number;
    includePatterns?: string[];
    excludePatterns?: string[];
    schedule?: string;
  },
): Promise<{ success: boolean; robotId?: string; error?: string }> {
  const response = await maxunFetch<{ robotId: string }>("/robots/crawl", {
    method: "POST",
    body: {
      name,
      type: "crawl",
      startUrl: config.startUrl,
      maxPages: config.maxPages || 100,
      includePatterns: config.includePatterns || [],
      excludePatterns: config.excludePatterns || [],
      schedule: config.schedule,
    },
  });

  if (response.success && response.data) {
    return { success: true, robotId: response.data.robotId };
  }

  return { success: false, error: response.error?.message };
}

/**
 * Create a Search robot
 * Automated web searches with time filters
 */
export async function createSearchRobot(
  name: string,
  config: {
    query: string;
    timeFilter?: "any" | "day" | "week" | "month" | "year";
    maxResults?: number;
    schedule?: string;
  },
): Promise<{ success: boolean; robotId?: string; error?: string }> {
  const response = await maxunFetch<{ robotId: string }>("/robots/search", {
    method: "POST",
    body: {
      name,
      type: "search",
      query: config.query,
      timeFilter: config.timeFilter || "week",
      maxResults: config.maxResults || 50,
      schedule: config.schedule,
    },
  });

  if (response.success && response.data) {
    return { success: true, robotId: response.data.robotId };
  }

  return { success: false, error: response.error?.message };
}

// ============================================================================
// Robot Execution & Data Fetching
// ============================================================================

/**
 * Run a robot and get results with caching
 */
async function runRobot<T>(
  robotId: string,
  category: RobotCategory,
  forceFresh: boolean = false,
): Promise<T | null> {
  const cacheKey = generateCacheKey(robotId);

  // Try cache first (unless force fresh)
  if (!forceFresh) {
    const cached = await getCachedData<T>(cacheKey, robotId, category);
    if (cached.data) {
      recordCacheHit(cached.source as "memory" | "redis" | "file");
      return cached.data;
    }
    recordCacheMiss();
  }

  // Run robot via Maxun API
  const response = await maxunFetch<T>(`/robots/${robotId}/run`);

  if (!response.success || !response.data) {
    console.error(`Robot ${robotId} failed:`, response.error);
    return null;
  }

  // Cache the result
  await setCachedData(cacheKey, response.data, robotId, category);

  return response.data;
}

/**
 * Run robot with backup failover
 */
async function runRobotWithBackup<T>(
  primaryRobotId: string,
  backupRobotId: string,
  category: RobotCategory,
): Promise<T | null> {
  // Try primary
  const primary = await runRobot<T>(primaryRobotId, category);
  if (primary) return primary;

  console.log(`Primary robot ${primaryRobotId} failed, trying backup ${backupRobotId}...`);

  // Try backup
  const backup = await runRobot<T>(backupRobotId, category);
  if (backup) return backup;

  console.log(`Backup ${backupRobotId} also failed, checking for stale cache...`);

  // Fallback to stale cache (up to 60 minutes old)
  const cacheKey = generateCacheKey(primaryRobotId);
  const stale = await getCachedData<T>(cacheKey, primaryRobotId, category, {
    allowStale: true,
    staleThresholdMinutes: 60,
  });

  if (stale.data) {
    console.log(
      `Using stale cache for ${primaryRobotId} (age: ${Math.round(stale.age / 1000 / 60)} min)`,
    );
    return stale.data;
  }

  return null;
}

// ============================================================================
// Financial Data Fetchers (Using actual Maxun robot patterns)
// ============================================================================

/**
 * BTC Price Tracker (Extract robot with selectors)
 */
export async function getBTCData(forceFresh: boolean = false): Promise<BTCTrackerData | null> {
  return runRobotWithBackup<BTCTrackerData>("btc-tracker", "btc-tracker-backup", "bluechip");
}

/**
 * ETH Price Tracker (Extract robot with selectors)
 */
export async function getETHData(forceFresh: boolean = false): Promise<ETHTrackerData | null> {
  return runRobotWithBackup<ETHTrackerData>("eth-tracker", "eth-tracker-backup", "bluechip");
}

/**
 * Meme Coins Trending (AI Extract robot with Kimi K 2.5)
 */
export async function getMemeCoins(limit: number = 10): Promise<MemeCoinData[]> {
  const data = await runRobot<MemeCoinData[]>("meme-trending", "meme");
  return data?.slice(0, limit) || [];
}

/**
 * DeFi Protocol Data (Extract robot)
 */
export async function getDeFiData(limit: number = 5): Promise<DeFiData[]> {
  const data = await runRobot<DeFiData[]>("defi-prices", "defi");
  return data?.slice(0, limit) || [];
}

/**
 * DeFi Yield Opportunities (AI Extract with Kimi K 2.5)
 */
export async function getDeFiYields(limit: number = 5): Promise<DeFiData[]> {
  const data = await runRobot<DeFiData[]>("defi-yields", "defi");
  return data?.slice(0, limit) || [];
}

/**
 * Whale Movements (AI Extract with Kimi K 2.5)
 */
export async function getWhaleMovements(minValueUsd: number = 1000000): Promise<WhaleMovement[]> {
  const data = await runRobot<WhaleMovement[]>("whale-exchanges", "onchain");
  return data?.filter((w) => w.valueUsd >= minValueUsd) || [];
}

/**
 * News Insights (AI Extract robot using Kimi K 2.5)
 * Extracts sentiment, catalysts, and predictions from financial news
 */
export async function getNewsInsights(limit: number = 3): Promise<NewsInsight[]> {
  const data = await runRobot<NewsInsight[]>("news-ai-coindesk", "news");
  return data?.slice(0, limit) || [];
}

/**
 * Social Sentiment (Search robot + AI Extract)
 */
export async function getSocialSentiment(): Promise<SocialSentiment | null> {
  return runRobot<SocialSentiment>("trending-reddit", "trending");
}

/**
 * Day Trading Setups (AI Extract with Kimi K 2.5)
 */
export async function getDayTradeSetups(limit: number = 3): Promise<DayTradeSetup[]> {
  const data = await runRobot<DayTradeSetup[]>("daytrade-breakouts", "daytrade");
  return data?.slice(0, limit) || [];
}

/**
 * Futures Data (Extract robot)
 */
export async function getFuturesData(): Promise<FuturesData[]> {
  const result = await runRobot<FuturesData[]>("funding-rates", "futures");
  return result || [];
}

/**
 * LP Opportunities (Extract robot)
 */
export async function getLPOpportunities(limit: number = 5): Promise<LPData[]> {
  const data = await runRobot<LPData[]>("lp-uniswap-v3", "lp");
  return data?.slice(0, limit) || [];
}

// ============================================================================
// AI-Powered Extraction (Using Kimi K 2.5)
// ============================================================================

/**
 * Extract structured data from any URL using AI
 * Uses Kimi K 2.5 by default (configurable to other providers)
 */
export async function aiExtractUrl<T>(
  url: string,
  prompt: string,
  options: {
    cacheMinutes?: number;
    llmProvider?: "kimi" | "openai" | "anthropic";
  } = {},
): Promise<T | null> {
  const { cacheMinutes = 30, llmProvider = "kimi" } = options;

  const cacheKey = generateCacheKey("ai-extract", {
    url: url.substring(0, 50),
    prompt: prompt.substring(0, 50),
    provider: llmProvider,
  });
  const category: RobotCategory = "news";

  // Check cache
  const cached = await getCachedData<T>(cacheKey, "ai-extract", category, {
    ttlOverride: cacheMinutes * 60,
  });
  if (cached.data) {
    recordCacheHit(cached.source as "memory" | "redis" | "file");
    return cached.data;
  }

  recordCacheMiss();

  // Call Maxun AI extraction with specified provider
  const response = await maxunFetch<T>("/robots/ai-extract/run", {
    method: "POST",
    body: {
      url,
      prompt,
      llmProvider, // Using Kimi K 2.5 by default
    },
  });

  if (!response.success || !response.data) {
    return null;
  }

  // Cache result
  await setCachedData(cacheKey, response.data, "ai-extract", category);

  return response.data;
}

// ============================================================================
// Batch Operations & Morning Brief
// ============================================================================

/**
 * Fetch all data needed for morning brief in parallel
 */
export async function getMorningBriefData(): Promise<MorningBriefData> {
  const startTime = Date.now();

  const [btc, eth, topMemes, defi, news, sentiment, whales, daytrades, futures] =
    await Promise.allSettled([
      getBTCData(),
      getETHData(),
      getMemeCoins(5),
      getDeFiData(3),
      getNewsInsights(3),
      getSocialSentiment(),
      getWhaleMovements(5000000), // $5M+
      getDayTradeSetups(3),
      getFuturesData(),
    ]);

  const robotsUsed: string[] = [];
  if (btc.status === "fulfilled" && btc.value) robotsUsed.push("btc-tracker");
  if (eth.status === "fulfilled" && eth.value) robotsUsed.push("eth-tracker");
  if (topMemes.status === "fulfilled") robotsUsed.push("meme-trending");
  if (defi.status === "fulfilled") robotsUsed.push("defi-prices");
  if (news.status === "fulfilled") robotsUsed.push("news-ai-coindesk");
  if (sentiment.status === "fulfilled") robotsUsed.push("trending-reddit");
  if (whales.status === "fulfilled") robotsUsed.push("whale-exchanges");
  if (daytrades.status === "fulfilled") robotsUsed.push("daytrade-breakouts");
  if (futures.status === "fulfilled") robotsUsed.push("funding-rates");

  return {
    btc: btc.status === "fulfilled" ? btc.value : null,
    eth: eth.status === "fulfilled" ? eth.value : null,
    topMemes: topMemes.status === "fulfilled" ? topMemes.value : [],
    defi: defi.status === "fulfilled" ? defi.value : [],
    news: news.status === "fulfilled" ? news.value : [],
    sentiment: sentiment.status === "fulfilled" ? sentiment.value : null,
    whales: whales.status === "fulfilled" ? whales.value : [],
    daytrades: daytrades.status === "fulfilled" ? daytrades.value : [],
    futures: futures.status === "fulfilled" ? futures.value : [],
    generatedAt: Date.now(),
    robotsUsed,
    cacheHitRate: 0, // Calculated by calling code
  };
}

// ============================================================================
// Robot Management & Health
// ============================================================================

/**
 * List all robots in Maxun instance
 */
export async function listRobots(): Promise<
  Array<{
    id: string;
    name: string;
    type: "extract" | "scrape" | "crawl" | "search";
    status: string;
    lastRun?: string;
  }>
> {
  const response = await maxunFetch<
    Array<{
      id: string;
      name: string;
      type: string;
      status: string;
      lastRun?: string;
    }>
  >("/robots");

  if (!response.success || !response.data) {
    return [];
  }

  // Type assertion to ensure robot types are valid
  return response.data.filter((robot) =>
    ["extract", "scrape", "crawl", "search"].includes(robot.type),
  ) as Array<{
    id: string;
    name: string;
    type: "extract" | "scrape" | "crawl" | "search";
    status: string;
    lastRun?: string;
  }>;
}

/**
 * Get robot execution history
 */
export async function getRobotHistory(
  robotId: string,
  limit: number = 10,
): Promise<
  Array<{
    runId: string;
    timestamp: string;
    status: "success" | "failed";
    duration: number;
    resultCount?: number;
  }>
> {
  const response = await maxunFetch<
    Array<{
      runId: string;
      timestamp: string;
      status: string;
      duration: number;
      resultCount?: number;
    }>
  >(`/robots/${robotId}/history?limit=${limit}`);

  if (!response.success || !response.data) {
    return [];
  }

  // Filter for valid status values
  return response.data.filter((run) => ["success", "failed"].includes(run.status)) as Array<{
    runId: string;
    timestamp: string;
    status: "success" | "failed";
    duration: number;
    resultCount?: number;
  }>;
}

/**
 * Check Maxun instance health
 */
export async function checkMaxunHealth(): Promise<{
  healthy: boolean;
  responseTime: number;
  version?: string;
  robotCount?: number;
}> {
  const start = Date.now();

  try {
    const response = await fetch(`${MAXUN_BASE_URL}/api/health`, {
      signal: AbortSignal.timeout(5000),
    });

    const responseTime = Date.now() - start;

    if (response.ok) {
      const data = await response.json();
      return {
        healthy: true,
        responseTime,
        version: data.version,
        robotCount: data.robotCount,
      };
    }

    return { healthy: false, responseTime };
  } catch {
    return { healthy: false, responseTime: Date.now() - start };
  }
}

/**
 * Warm cache for critical robots
 */
export async function warmCriticalCaches(): Promise<void> {
  console.log("Warming critical robot caches...");

  await Promise.allSettled([
    warmCache("btc-tracker", "bluechip", () => getBTCData(true)),
    warmCache("eth-tracker", "bluechip", () => getETHData(true)),
    warmCache("meme-trending", "meme", () => getMemeCoins(10)),
    warmCache("defi-prices", "defi", () => getDeFiData(5)),
  ]);

  console.log("Cache warming complete");
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Format price change with emoji
 */
export function formatPriceChange(change: number): string {
  const emoji = change >= 0 ? "🟢" : "🔴";
  const sign = change >= 0 ? "+" : "";
  return `${emoji} ${sign}${change.toFixed(2)}%`;
}

/**
 * Format large numbers (1,000,000 → 1M)
 */
export function formatCompactNumber(number: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(number);
}

/**
 * Format currency
 */
export function formatCurrency(value: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: value > 1000 ? 0 : 2,
  }).format(value);
}
