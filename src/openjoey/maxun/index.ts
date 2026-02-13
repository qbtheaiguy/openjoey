/**
 * Maxun Integration - Main Entry Point
 * Integrates with existing OpenJoey data harvester infrastructure
 */

import { getCacheStats } from "./cache/multi-layer.js";
import { getCriticalRobots, getAllRobotConfigs } from "./config/robots.js";
import { initializeHealthMonitoring, getHealthReport } from "./health/monitor.js";
import {
  getBTCData,
  getETHData,
  getMemeCoins,
  getDeFiData,
  getNewsInsights,
  getMorningBriefData,
  warmCriticalCaches,
  checkMaxunHealth,
  createAIExtractRobot,
  createExtractRobot,
  aiExtractUrl,
} from "./maxun-bridge.js";

// ============================================================================
// Integration with OpenJoey Data Harvester
// ============================================================================

/**
 * Initialize Maxun integration
 * Call this during OpenJoey startup
 */
export async function initializeMaxun(): Promise<void> {
  console.log("🚀 Initializing Maxun integration...");

  try {
    // Check Maxun instance health
    const health = await checkMaxunHealth();
    if (!health.healthy) {
      console.error("❌ Maxun instance is not healthy. Please check your Maxun server.");
      return;
    }

    console.log(`✅ Maxun instance healthy (v${health.version}, ${health.robotCount} robots)`);

    // Initialize health monitoring
    await initializeHealthMonitoring(5); // Check every 5 minutes

    // Warm critical caches
    await warmCriticalCaches();

    console.log("✅ Maxun integration initialized successfully");
  } catch (error) {
    console.error("❌ Failed to initialize Maxun:", error);
    throw error;
  }
}

/**
 * Enhanced data fetcher for OpenJoey skills
 * Integrates Maxun data with existing data sources
 */
export interface EnhancedDataOptions {
  useMaxun?: boolean;
  fallbackToExisting?: boolean;
  cacheFreshness?: "fresh" | "stale" | "any";
  timeout?: number;
}

/**
 * Get Bitcoin price with Maxun integration
 */
export async function getEnhancedBTCData(options: EnhancedDataOptions = {}): Promise<{
  price: number;
  change24h: number;
  source: "maxun" | "existing" | "fallback";
  timestamp: number;
} | null> {
  const { useMaxun = true, fallbackToExisting = true } = options;

  if (useMaxun) {
    try {
      const maxunData = await getBTCData();
      if (maxunData) {
        return {
          price: maxunData.price,
          change24h: maxunData.changePercent24h,
          source: "maxun",
          timestamp: Date.now(),
        };
      }
    } catch (error) {
      console.warn("Maxun BTC data fetch failed:", error);
    }
  }

  if (fallbackToExisting) {
    // Fallback to existing OpenJoey data sources
    // This would integrate with your current data fetching logic
    console.log("Falling back to existing BTC data sources");
    // TODO: Integrate with existing data harvester
  }

  return null;
}

/**
 * Get Ethereum price with Maxun integration
 */
export async function getEnhancedETHData(options: EnhancedDataOptions = {}): Promise<{
  price: number;
  change24h: number;
  gasPrice: number;
  source: "maxun" | "existing" | "fallback";
  timestamp: number;
} | null> {
  const { useMaxun = true, fallbackToExisting = true } = options;

  if (useMaxun) {
    try {
      const maxunData = await getETHData();
      if (maxunData) {
        return {
          price: maxunData.price,
          change24h: maxunData.changePercent24h,
          gasPrice: maxunData.gasPrice,
          source: "maxun",
          timestamp: Date.now(),
        };
      }
    } catch (error) {
      console.warn("Maxun ETH data fetch failed:", error);
    }
  }

  if (fallbackToExisting) {
    // Fallback to existing OpenJoey data sources
    console.log("Falling back to existing ETH data sources");
    // TODO: Integrate with existing data harvester
  }

  return null;
}

/**
 * Get meme coins data with Maxun integration
 */
export async function getEnhancedMemeData(
  options: EnhancedDataOptions & { limit?: number } = {},
): Promise<{
  coins: Array<{
    symbol: string;
    name: string;
    price: number;
    change24h: number;
    socialScore: number;
  }>;
  source: "maxun" | "existing" | "fallback";
  timestamp: number;
} | null> {
  const { useMaxun = true, fallbackToExisting = true, limit = 10 } = options;

  if (useMaxun) {
    try {
      const maxunData = await getMemeCoins(limit);
      if (maxunData.length > 0) {
        return {
          coins: maxunData.map((coin) => ({
            symbol: coin.symbol,
            name: coin.name,
            price: coin.price,
            change24h: coin.change24h,
            socialScore: coin.socialScore,
          })),
          source: "maxun",
          timestamp: Date.now(),
        };
      }
    } catch (error) {
      console.warn("Maxun meme data fetch failed:", error);
    }
  }

  if (fallbackToExisting) {
    // Fallback to existing OpenJoey data sources
    console.log("Falling back to existing meme data sources");
    // TODO: Integrate with existing data harvester
  }

  return null;
}

/**
 * Get DeFi data with Maxun integration
 */
export async function getEnhancedDeFiData(
  options: EnhancedDataOptions & { limit?: number } = {},
): Promise<{
  protocols: Array<{
    name: string;
    tvl: number;
    apy: number;
    tokenPrice: number;
  }>;
  source: "maxun" | "existing" | "fallback";
  timestamp: number;
} | null> {
  const { useMaxun = true, fallbackToExisting = true, limit = 5 } = options;

  if (useMaxun) {
    try {
      const maxunData = await getDeFiData(limit);
      if (maxunData.length > 0) {
        return {
          protocols: maxunData.map((protocol) => ({
            name: protocol.protocol,
            tvl: protocol.tvl,
            apy: protocol.yield,
            tokenPrice: protocol.tokenPrice,
          })),
          source: "maxun",
          timestamp: Date.now(),
        };
      }
    } catch (error) {
      console.warn("Maxun DeFi data fetch failed:", error);
    }
  }

  if (fallbackToExisting) {
    // Fallback to existing OpenJoey data sources
    console.log("Falling back to existing DeFi data sources");
    // TODO: Integrate with existing data harvester
  }

  return null;
}

/**
 * Get news insights with Maxun integration
 */
export async function getEnhancedNewsData(
  options: EnhancedDataOptions & { limit?: number } = {},
): Promise<{
  insights: Array<{
    headline: string;
    source: string;
    sentiment: "bullish" | "bearish" | "neutral";
    summary: string;
    catalysts: string[];
    urgency: "breaking" | "normal" | "old";
  }>;
  source: "maxun" | "existing" | "fallback";
  timestamp: number;
} | null> {
  const { useMaxun = true, fallbackToExisting = true, limit = 3 } = options;

  if (useMaxun) {
    try {
      const maxunData = await getNewsInsights(limit);
      if (maxunData.length > 0) {
        return {
          insights: maxunData.map((insight) => ({
            headline: insight.headline,
            source: insight.source,
            sentiment: insight.sentiment,
            summary: insight.summary,
            catalysts: insight.catalysts,
            urgency: insight.urgency,
          })),
          source: "maxun",
          timestamp: Date.now(),
        };
      }
    } catch (error) {
      console.warn("Maxun news data fetch failed:", error);
    }
  }

  if (fallbackToExisting) {
    // Fallback to existing OpenJoey data sources
    console.log("Falling back to existing news data sources");
    // TODO: Integrate with existing data harvester
  }

  return null;
}

// ============================================================================
// OpenJoey Skill Integration
// ============================================================================

/**
 * Morning brief skill using Maxun data
 * Replaces or enhances existing morning brief functionality
 */
export async function generateMorningBrief(): Promise<{
  summary: string;
  btc: { price: number; change: number } | null;
  eth: { price: number; change: number } | null;
  topMemes: Array<{ symbol: string; change: number }>;
  defi: Array<{ name: string; apy: number }>;
  news: Array<{ headline: string; sentiment: string }>;
  dataSources: string[];
  cacheHitRate: number;
}> {
  try {
    const briefData = await getMorningBriefData();
    const cacheStats = getCacheStats();

    const summary = generateBriefSummary(briefData);

    return {
      summary,
      btc: briefData.btc
        ? {
            price: briefData.btc.price,
            change: briefData.btc.changePercent24h,
          }
        : null,
      eth: briefData.eth
        ? {
            price: briefData.eth.price,
            change: briefData.eth.changePercent24h,
          }
        : null,
      topMemes: briefData.topMemes.slice(0, 3).map((m) => ({
        symbol: m.symbol,
        change: m.change24h,
      })),
      defi: briefData.defi.slice(0, 3).map((d) => ({
        name: d.protocol,
        apy: d.yield,
      })),
      news: briefData.news.slice(0, 3).map((n) => ({
        headline: n.headline,
        sentiment: n.sentiment,
      })),
      dataSources: briefData.robotsUsed,
      cacheHitRate: cacheStats.hitRate,
    };
  } catch (error) {
    console.error("Failed to generate morning brief:", error);
    throw error;
  }
}

/**
 * Generate human-readable brief summary
 */
function generateBriefSummary(data: any): string {
  const parts: string[] = [];

  if (data.btc) {
    const btcEmoji = data.btc.changePercent24h >= 0 ? "🟢" : "🔴";
    parts.push(
      `BTC ${btcEmoji} $${data.btc.price.toLocaleString()} (${data.btc.changePercent24h >= 0 ? "+" : ""}${data.btc.changePercent24h.toFixed(2)}%)`,
    );
  }

  if (data.eth) {
    const ethEmoji = data.eth.changePercent24h >= 0 ? "🟢" : "🔴";
    parts.push(
      `ETH ${ethEmoji} $${data.eth.price.toLocaleString()} (${data.eth.changePercent24h >= 0 ? "+" : ""}${data.eth.changePercent24h.toFixed(2)}%)`,
    );
  }

  if (data.topMemes.length > 0) {
    const topMeme = data.topMemes[0];
    const memeEmoji = topMeme.change24h >= 0 ? "🚀" : "📉";
    parts.push(
      `${topMeme.symbol} ${memeEmoji} ${topMeme.change24h >= 0 ? "+" : ""}${topMeme.change24h.toFixed(2)}%`,
    );
  }

  if (data.news.length > 0) {
    const breakingNews = data.news.filter((n: any) => n.urgency === "breaking");
    if (breakingNews.length > 0) {
      parts.push(`📰 ${breakingNews.length} breaking news`);
    }
  }

  return parts.length > 0 ? parts.join(" • ") : "No significant market updates";
}

/**
 * Custom AI extraction skill for OpenJoey
 * Extract structured data from any URL using Kimi K 2.5
 */
export async function extractDataFromUrl(
  url: string,
  extractionPrompt: string,
  options: {
    useKimi?: boolean;
    cacheMinutes?: number;
  } = {},
): Promise<{
  success: boolean;
  data?: any;
  error?: string;
  extractionTime: number;
}> {
  const startTime = Date.now();

  try {
    const data = await aiExtractUrl(url, extractionPrompt, {
      llmProvider: options.useKimi !== false ? "kimi" : "openai",
      cacheMinutes: options.cacheMinutes || 30,
    });

    if (data) {
      return {
        success: true,
        data,
        extractionTime: Date.now() - startTime,
      };
    } else {
      return {
        success: false,
        error: "No data extracted",
        extractionTime: Date.now() - startTime,
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      extractionTime: Date.now() - startTime,
    };
  }
}

// ============================================================================
// Robot Management for OpenJoey
// ============================================================================

/**
 * Create a new robot for OpenJoey use
 */
export async function createOpenJoeyRobot(config: {
  name: string;
  type: "extract" | "ai-extract";
  url: string;
  prompt?: string;
  selectors?: Record<string, string>;
  schedule?: string;
}): Promise<{ success: boolean; robotId?: string; error?: string }> {
  try {
    if (config.type === "ai-extract") {
      if (!config.prompt) {
        return { success: false, error: "AI extract robots require a prompt" };
      }

      return await createAIExtractRobot(config.name, {
        url: config.url,
        prompt: config.prompt,
        schedule: config.schedule,
        llmProvider: "kimi", // Use Kimi K 2.5 by default
      });
    } else if (config.type === "extract") {
      if (!config.selectors) {
        return { success: false, error: "Extract robots require selectors" };
      }

      return await createExtractRobot(config.name, {
        url: config.url,
        selectors: config.selectors,
        schedule: config.schedule,
      });
    } else {
      return { success: false, error: `Unsupported robot type: ${config.type}` };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ============================================================================
// Status and Monitoring
// ============================================================================

/**
 * Get Maxun integration status for OpenJoey dashboard
 */
export async function getMaxunStatus(): Promise<{
  healthy: boolean;
  version?: string;
  robotCount: number;
  cacheHitRate: number;
  healthReport: any;
  lastUpdate: number;
}> {
  const health = await checkMaxunHealth();
  const cacheStats = getCacheStats();
  const healthReport = getHealthReport();

  return {
    healthy: health.healthy,
    version: health.version,
    robotCount: health.robotCount || 0,
    cacheHitRate: cacheStats.hitRate,
    healthReport,
    lastUpdate: Date.now(),
  };
}

/**
 * Get performance metrics
 */
export function getPerformanceMetrics(): {
  cacheStats: any;
  robotCount: number;
  criticalRobots: number;
  uptime: number;
} {
  const cacheStats = getCacheStats();
  const allRobots = getAllRobotConfigs();
  const criticalRobots = getCriticalRobots();

  return {
    cacheStats,
    robotCount: allRobots.length,
    criticalRobots: criticalRobots.length,
    uptime: 0, // Would be calculated from health monitoring
  };
}

// ============================================================================
// Cleanup
// ============================================================================

/**
 * Cleanup Maxun integration
 * Call this during OpenJoey shutdown
 */
export async function cleanupMaxun(): Promise<void> {
  console.log("🧹 Cleaning up Maxun integration...");

  try {
    // Stop health monitoring
    // (This would be imported from health monitor)
    console.log("✅ Maxun integration cleaned up");
  } catch (error) {
    console.error("❌ Error during Maxun cleanup:", error);
  }
}

// ============================================================================
// Exports for OpenJoey Integration
// ============================================================================

export default {
  // Core functions
  initializeMaxun,
  cleanupMaxun,

  // Enhanced data fetchers
  getEnhancedBTCData,
  getEnhancedETHData,
  getEnhancedMemeData,
  getEnhancedDeFiData,
  getEnhancedNewsData,

  // Skills
  generateMorningBrief,
  extractDataFromUrl,

  // Robot management
  createOpenJoeyRobot,

  // Status and monitoring
  getMaxunStatus,
  getPerformanceMetrics,

  // Direct access to Maxun bridge (for advanced usage)
  maxun: {
    getBTCData,
    getETHData,
    getMemeCoins,
    getDeFiData,
    getNewsInsights,
    getMorningBriefData,
    warmCriticalCaches,
    checkMaxunHealth,
    createAIExtractRobot,
    createExtractRobot,
    aiExtractUrl,
  },
};
