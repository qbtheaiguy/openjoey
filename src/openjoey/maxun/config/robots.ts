/**
 * Robot Configuration Manager
 * Centralized configuration for all Maxun robots with categories and schedules
 */

import type { RobotConfig, RobotCategory } from "../types/index.js";

// ============================================================================
// Robot Configurations (Based on actual Maxun robot types)
// ============================================================================

/**
 * Blue-Chip Crypto Robots (Critical Priority)
 * BTC and ETH trackers with backup robots
 */
export const bluechipRobots: RobotConfig[] = [
  {
    name: "btc-tracker",
    category: "bluechip",
    priority: "critical",
    type: "extract",
    source: "https://coinmarketcap.com/currencies/bitcoin/",
    schedule: "*/1 * * * *", // Every minute
    cacheTtl: 60, // 1 minute
    retries: 3,
    timeout: 5000,
    rateLimit: {
      requestsPerMinute: 60,
      delayMs: 1000,
    },
    backup: {
      robotName: "btc-tracker-backup",
      trigger: "on_failure",
    },
    selectors: {
      price: ".priceValue",
      change24h: ".priceChange",
      volume24h: ".volumeValue",
      marketCap: ".marketCapValue",
      dominance: ".marketCap dominance",
    },
  },
  {
    name: "btc-tracker-backup",
    category: "bluechip",
    priority: "critical",
    type: "extract",
    source: "https://www.coingecko.com/en/coins/bitcoin",
    schedule: "*/2 * * * *", // Every 2 minutes
    cacheTtl: 120,
    retries: 3,
    timeout: 5000,
    selectors: {
      price: ".twm-1lh",
      change24h: ".twm-1l3",
      volume24h: ".twm-1l7",
      marketCap: ".twm-1l9",
    },
  },
  {
    name: "eth-tracker",
    category: "bluechip",
    priority: "critical",
    type: "extract",
    source: "https://coinmarketcap.com/currencies/ethereum/",
    schedule: "*/1 * * * *", // Every minute
    cacheTtl: 60,
    retries: 3,
    timeout: 5000,
    rateLimit: {
      requestsPerMinute: 60,
      delayMs: 1000,
    },
    backup: {
      robotName: "eth-tracker-backup",
      trigger: "on_failure",
    },
    selectors: {
      price: ".priceValue",
      change24h: ".priceChange",
      volume24h: ".volumeValue",
      marketCap: ".marketCapValue",
      gasPrice: ".gasPrice",
    },
  },
  {
    name: "eth-tracker-backup",
    category: "bluechip",
    priority: "critical",
    type: "extract",
    source: "https://www.coingecko.com/en/coins/ethereum",
    schedule: "*/2 * * * *",
    cacheTtl: 120,
    retries: 3,
    timeout: 5000,
    selectors: {
      price: ".twm-1lh",
      change24h: ".twm-1l3",
      volume24h: ".twm-1l7",
      gasPrice: ".gas-price",
    },
  },
];

/**
 * Meme Coin Robots (High Priority)
 * Trending, new listings, and whale movements
 */
export const memeRobots: RobotConfig[] = [
  {
    name: "meme-trending",
    category: "meme",
    priority: "high",
    type: "ai-extract",
    source: "https://coinmarketcap.com/gainers-losers/",
    schedule: "*/3 * * * *", // Every 3 minutes
    cacheTtl: 180,
    retries: 3,
    timeout: 8000,
    aiPrompt:
      "Extract trending meme coins with symbol, price, 24h change, volume, and social buzz score. Focus on DOGE, SHIB, PEPE, WIF, BONK, and similar coins.",
  },
  {
    name: "meme-new-listings",
    category: "meme",
    priority: "medium",
    type: "ai-extract",
    source: "https://coinmarketcap.com/new/",
    schedule: "*/15 * * * *", // Every 15 minutes
    cacheTtl: 900,
    retries: 2,
    timeout: 10000,
    aiPrompt:
      "Extract newly listed meme coins with symbol, launch price, current price, volume, and initial market cap. Identify coins with meme-like names or themes.",
  },
  {
    name: "meme-whale-moves",
    category: "meme",
    priority: "medium",
    type: "ai-extract",
    source: "https://www.whalealert.io/",
    schedule: "*/5 * * * *", // Every 5 minutes
    cacheTtl: 300,
    retries: 2,
    timeout: 8000,
    aiPrompt:
      "Extract large transactions (> $1M) involving meme coins like DOGE, SHIB, PEPE. Include transaction value, from/to addresses, and exchange involvement.",
  },
];

/**
 * DeFi Robots (High Priority)
 * Protocol prices, TVL, yields, and governance
 */
export const defiRobots: RobotConfig[] = [
  {
    name: "defi-prices",
    category: "defi",
    priority: "high",
    type: "extract",
    source: "https://defillama.com/protocols",
    schedule: "*/5 * * * *", // Every 5 minutes
    cacheTtl: 300,
    retries: 3,
    timeout: 7000,
    selectors: {
      protocol: ".protocol-name",
      tvl: ".tvl-value",
      tokenPrice: ".token-price",
      tokenChange24h: ".price-change",
    },
  },
  {
    name: "defi-tvl",
    category: "defi",
    priority: "high",
    type: "extract",
    source: "https://defillama.com/",
    schedule: "*/10 * * * *", // Every 10 minutes
    cacheTtl: 600,
    retries: 2,
    timeout: 7000,
    selectors: {
      totalTvl: ".total-tvl",
      change24h: ".tvl-change",
      topProtocols: ".protocol-list",
    },
  },
  {
    name: "defi-yields",
    category: "defi",
    priority: "high",
    type: "ai-extract",
    source: "https://defillama.com/yields",
    schedule: "*/15 * * * *", // Every 15 minutes
    cacheTtl: 900,
    retries: 2,
    timeout: 10000,
    aiPrompt:
      "Extract top DeFi yield opportunities with protocol name, pool type, APY, TVL, and risk level. Focus on stablecoin yields and popular pools.",
  },
  {
    name: "defi-governance",
    category: "defi",
    priority: "medium",
    type: "ai-extract",
    source: "https://www.tally.xyz/",
    schedule: "0 */2 * * *", // Every 2 hours
    cacheTtl: 7200,
    retries: 2,
    timeout: 10000,
    aiPrompt:
      "Extract active governance proposals for major DeFi protocols with proposal title, voting deadline, and current vote counts.",
  },
];

/**
 * Day Trading Robots (High Priority)
 * Breakouts, scalping setups, liquidations
 */
export const daytradeRobots: RobotConfig[] = [
  {
    name: "daytrade-breakouts",
    category: "daytrade",
    priority: "high",
    type: "ai-extract",
    source: "https://www.tradingview.com/crypto-screener/",
    schedule: "*/2 * * * *", // Every 2 minutes
    cacheTtl: 120,
    retries: 3,
    timeout: 8000,
    aiPrompt:
      "Identify cryptocurrency breakout setups with entry price, stop loss, target price, volume increase, and technical pattern. Focus on 5-15 minute timeframes.",
  },
  {
    name: "daytrade-scalping",
    category: "daytrade",
    priority: "high",
    type: "ai-extract",
    source: "https://www.coinglass.com/",
    schedule: "*/1 * * * *", // Every minute
    cacheTtl: 60,
    retries: 3,
    timeout: 6000,
    aiPrompt:
      "Extract short-term scalping opportunities from liquidation data and funding rates. Include symbol, liquidation price, and short/long ratio.",
  },
  {
    name: "daytrade-liquidations",
    category: "daytrade",
    priority: "medium",
    type: "extract",
    source: "https://www.coinglass.com/pro/LiquidationData",
    schedule: "*/3 * * * *", // Every 3 minutes
    cacheTtl: 180,
    retries: 2,
    timeout: 7000,
    selectors: {
      symbol: ".symbol",
      liquidationPrice: ".liq-price",
      liquidationAmount: ".liq-amount",
      side: ".side",
    },
  },
];

/**
 * Futures Robots (High Priority)
 * Funding rates, open interest, premium
 */
export const futuresRobots: RobotConfig[] = [
  {
    name: "funding-rates",
    category: "futures",
    priority: "high",
    type: "extract",
    source: "https://www.coinglass.com/fundingrate",
    schedule: "*/5 * * * *", // Every 5 minutes
    cacheTtl: 300,
    retries: 3,
    timeout: 7000,
    selectors: {
      symbol: ".symbol",
      fundingRate: ".funding-rate",
      nextFunding: ".next-funding",
      predictedRate: ".predicted-rate",
    },
  },
  {
    name: "futures-premium",
    category: "futures",
    priority: "medium",
    type: "extract",
    source: "https://www.coinglass.com/premiumindex",
    schedule: "*/10 * * * *", // Every 10 minutes
    cacheTtl: 600,
    retries: 2,
    timeout: 7000,
    selectors: {
      symbol: ".symbol",
      premium: ".premium",
      basis: ".basis",
      annualized: ".annualized",
    },
  },
  {
    name: "open-interest",
    category: "futures",
    priority: "medium",
    type: "extract",
    source: "https://www.coinglass.com/openinterest",
    schedule: "*/15 * * * *", // Every 15 minutes
    cacheTtl: 900,
    retries: 2,
    timeout: 8000,
    selectors: {
      symbol: ".symbol",
      openInterest: ".oi-value",
      change24h: ".oi-change",
      volume24h: ".volume-24h",
    },
  },
];

/**
 * Liquidity Pool Robots (Medium Priority)
 * Uniswap, PancakeSwap, impermanent loss
 */
export const lpRobots: RobotConfig[] = [
  {
    name: "lp-uniswap-v3",
    category: "lp",
    priority: "medium",
    type: "ai-extract",
    source: "https://info.uniswap.org/#/pools",
    schedule: "*/10 * * * *", // Every 10 minutes
    cacheTtl: 600,
    retries: 2,
    timeout: 10000,
    aiPrompt:
      "Extract top Uniswap V3 pools with token pair, TVL, 24h volume, APY, and fee tier. Focus on high-volume pools.",
  },
  {
    name: "lp-pancakeswap",
    category: "lp",
    priority: "medium",
    type: "ai-extract",
    source: "https://pancakeswap.finance/pools",
    schedule: "*/15 * * * *", // Every 15 minutes
    cacheTtl: 900,
    retries: 2,
    timeout: 10000,
    aiPrompt:
      "Extract top PancakeSwap pools with token pair, TVL, volume, and APR. Include farm pools if available.",
  },
  {
    name: "lp-impermanent-loss",
    category: "lp",
    priority: "low",
    type: "ai-extract",
    source: "https://il-calculator.uniswap.info/",
    schedule: "0 */6 * * *", // Every 6 hours
    cacheTtl: 21600,
    retries: 1,
    timeout: 8000,
    aiPrompt:
      "Extract impermanent loss scenarios for common pairs (ETH/USDC, BTC/ETH) with different volatility ranges.",
  },
];

/**
 * Trending Robots (Medium Priority)
 * Twitter, Reddit, Google Trends
 */
export const trendingRobots: RobotConfig[] = [
  {
    name: "trending-twitter",
    category: "trending",
    priority: "medium",
    type: "ai-extract",
    source: "https://twitter.com/search?q=cryptocurrency",
    schedule: "*/5 * * * *", // Every 5 minutes
    cacheTtl: 300,
    retries: 2,
    timeout: 8000,
    aiPrompt:
      "Extract trending cryptocurrency discussions from Twitter with coin mentions, sentiment, and engagement metrics.",
  },
  {
    name: "trending-reddit",
    category: "trending",
    priority: "medium",
    type: "ai-extract",
    source: "https://www.reddit.com/r/cryptocurrency/",
    schedule: "*/10 * * * *", // Every 10 minutes
    cacheTtl: 600,
    retries: 2,
    timeout: 8000,
    aiPrompt:
      "Extract trending posts from r/cryptocurrency with coin mentions, sentiment analysis, and discussion themes.",
  },
  {
    name: "trending-search",
    category: "trending",
    priority: "low",
    type: "search",
    source: "google",
    schedule: "0 */2 * * *", // Every 2 hours
    cacheTtl: 7200,
    retries: 1,
    timeout: 10000,
    aiPrompt:
      "Search for trending cryptocurrency terms and extract search volume trends and related queries.",
  },
];

/**
 * Layer 1/2 Robots (Medium Priority)
    chain performance, gas fees, activity
 */
export const l1l2Robots: RobotConfig[] = [
  {
    name: "l1-performance",
    category: "l1l2",
    priority: "medium",
    type: "extract",
    source: "https://l2beat.com/",
    schedule: "*/15 * * * *", // Every 15 minutes
    cacheTtl: 900,
    retries: 2,
    timeout: 8000,
    selectors: {
      chain: ".chain-name",
      tps: ".tps-value",
      gasPrice: ".gas-price",
      activeAddresses: ".active-addresses",
    },
  },
  {
    name: "l2-activity",
    category: "l1l2",
    priority: "medium",
    type: "extract",
    source: "https://dune.com/queries/1234567", // Example Dune dashboard
    schedule: "*/10 * * * *", // Every 10 minutes
    cacheTtl: 600,
    retries: 2,
    timeout: 7000,
    selectors: {
      protocol: ".protocol-name",
      volume24h: ".volume-24h",
      transactions24h: ".tx-24h",
      users24h: ".users-24h",
    },
  },
  {
    name: "gas-tracker",
    category: "l1l2",
    priority: "medium",
    type: "extract",
    source: "https://etherscan.io/gastracker",
    schedule: "*/2 * * * *", // Every 2 minutes
    cacheTtl: 120,
    retries: 3,
    timeout: 5000,
    selectors: {
      gasPrice: ".gas-price",
      baseFee: ".base-fee",
      priorityFee: ".priority-fee",
      safeGasPrice: ".safe-gas-price",
    },
  },
];

/**
 * NFT Robots (Low Priority)
 * Floor prices, volume, whale activity
 */
export const nftRobots: RobotConfig[] = [
  {
    name: "nft-floor-prices",
    category: "nft",
    priority: "low",
    type: "extract",
    source: "https://opensea.io/rankings",
    schedule: "*/30 * * * *", // Every 30 minutes
    cacheTtl: 1800,
    retries: 1,
    timeout: 10000,
    selectors: {
      collection: ".collection-name",
      floorPrice: ".floor-price",
      volume24h: ".volume-24h",
      change24h: ".change-24h",
    },
  },
  {
    name: "nft-volume",
    category: "nft",
    priority: "low",
    type: "extract",
    source: "https://cryptoslam.io/",
    schedule: "0 */2 * * *", // Every 2 hours
    cacheTtl: 7200,
    retries: 1,
    timeout: 10000,
    selectors: {
      collection: ".collection-name",
      volume24h: ".volume-24h",
      volume7d: ".volume-7d",
      sales24h: ".sales-24h",
    },
  },
  {
    name: "nft-whales",
    category: "nft",
    priority: "low",
    type: "ai-extract",
    source: "https://opensea.io/activity",
    schedule: "0 */4 * * *", // Every 4 hours
    cacheTtl: 14400,
    retries: 1,
    timeout: 12000,
    aiPrompt:
      "Extract large NFT transactions (> 10 ETH) with collection, price, and buyer/seller information.",
  },
];

/**
 * On-Chain Robots (High Priority)
 * Whale movements, exchange flows, smart money
 */
export const onchainRobots: RobotConfig[] = [
  {
    name: "whale-exchanges",
    category: "onchain",
    priority: "high",
    type: "ai-extract",
    source: "https://www.whalealert.io/",
    schedule: "*/2 * * * *", // Every 2 minutes
    cacheTtl: 120,
    retries: 3,
    timeout: 7000,
    aiPrompt:
      "Extract large cryptocurrency transactions to/from exchanges with amount, value, exchange name, and transaction type.",
  },
  {
    name: "whale-wallets",
    category: "onchain",
    priority: "medium",
    type: "ai-extract",
    source: "https://www.bitinfocharts.com/top-100-richest-bitcoin-addresses.html",
    schedule: "0 */6 * * *", // Every 6 hours
    cacheTtl: 21600,
    retries: 1,
    timeout: 10000,
    aiPrompt:
      "Extract top whale wallet balances and recent large transactions from known whale addresses.",
  },
  {
    name: "exchange-reserves",
    category: "onchain",
    priority: "medium",
    type: "extract",
    source: "https://cryptoquant.com/",
    schedule: "*/15 * * * *", // Every 15 minutes
    cacheTtl: 900,
    retries: 2,
    timeout: 8000,
    selectors: {
      exchange: ".exchange-name",
      btcReserves: ".btc-reserves",
      ethReserves: ".eth-reserves",
      stablecoinReserves: ".stablecoin-reserves",
    },
  },
];

/**
 * News Robots (High Priority)
 * AI-extracted insights from crypto news
 */
export const newsRobots: RobotConfig[] = [
  {
    name: "news-ai-coindesk",
    category: "news",
    priority: "high",
    type: "ai-extract",
    source: "https://www.coindesk.com/",
    schedule: "*/10 * * * *", // Every 10 minutes
    cacheTtl: 600,
    retries: 2,
    timeout: 10000,
    aiPrompt:
      "Extract crypto news with sentiment analysis, key catalysts, mentioned coins, price predictions, and urgency level. Use Kimi K 2.5 for analysis.",
  },
  {
    name: "news-ai-twitter",
    category: "news",
    priority: "medium",
    type: "ai-extract",
    source: "https://twitter.com/search?q=cryptocurrency%20news",
    schedule: "*/15 * * * *", // Every 15 minutes
    cacheTtl: 900,
    retries: 2,
    timeout: 8000,
    aiPrompt:
      "Extract breaking crypto news from Twitter with sentiment, credibility score, and potential market impact.",
  },
];

/**
 * Airdrop Robots (Low Priority)
 * New opportunities, testnet participation
 */
export const airdropRobots: RobotConfig[] = [
  {
    name: "airdrop-tracker",
    category: "airdrop",
    priority: "low",
    type: "ai-extract",
    source: "https://airdrops.io/",
    schedule: "0 */4 * * *", // Every 4 hours
    cacheTtl: 14400,
    retries: 1,
    timeout: 10000,
    aiPrompt:
      "Extract new cryptocurrency airdrop opportunities with project name, requirements, estimated value, and participation deadline.",
  },
  {
    name: "testnet-opps",
    category: "airdrop",
    priority: "low",
    type: "ai-extract",
    source: "https://www.layer3.xyz/",
    schedule: "0 */6 * * *", // Every 6 hours
    cacheTtl: 21600,
    retries: 1,
    timeout: 10000,
    aiPrompt:
      "Extract testnet opportunities with potential airdrop rewards, including tasks required and project details.",
  },
];

/**
 * Macro Robots (Medium Priority)
 * ETF flows, correlations, traditional finance
 */
export const macroRobots: RobotConfig[] = [
  {
    name: "macro-btc-dxy",
    category: "macro",
    priority: "medium",
    type: "extract",
    source: "https://www.tradingview.com/symbols/BTCUSD/",
    schedule: "*/10 * * * *", // Every 10 minutes
    cacheTtl: 600,
    retries: 2,
    timeout: 7000,
    selectors: {
      btcPrice: ".price-value",
      dxyIndex: ".dxy-value",
      correlation: ".correlation-value",
    },
  },
  {
    name: "macro-etf-flows",
    category: "macro",
    priority: "medium",
    type: "extract",
    source: "https://www.farside.co.uk/",
    schedule: "0 */2 * * *", // Every 2 hours
    cacheTtl: 7200,
    retries: 1,
    timeout: 8000,
    aiPrompt:
      "Extract daily ETF flows for Bitcoin and Ethereum with fund names, inflow/outflow amounts, and cumulative totals.",
  },
];

/**
 * Gaming Robots (Low Priority)
 * GameFi tokens, active users, NFT games
 */
export const gamingRobots: RobotConfig[] = [
  {
    name: "gaming-tokens",
    category: "gaming",
    priority: "low",
    type: "extract",
    source: "https://coinmarketcap.com/gaming/",
    schedule: "*/30 * * * *", // Every 30 minutes
    cacheTtl: 1800,
    retries: 1,
    timeout: 8000,
    selectors: {
      token: ".token-name",
      price: ".price-value",
      change24h: ".change-24h",
      volume24h: ".volume-24h",
    },
  },
  {
    name: "gaming-active-users",
    category: "gaming",
    priority: "low",
    type: "ai-extract",
    source: "https://dappradar.com/",
    schedule: "0 */4 * * *", // Every 4 hours
    cacheTtl: 14400,
    retries: 1,
    timeout: 10000,
    aiPrompt: "Extract top blockchain games with active user counts, volume, and growth metrics.",
  },
];

/**
 * Privacy Robots (Low Priority)
 * Monero, Zcash, privacy coin data
 */
export const privacyRobots: RobotConfig[] = [
  {
    name: "privacy-prices",
    category: "privacy",
    priority: "low",
    type: "extract",
    source: "https://coinmarketcap.com/privacy/",
    schedule: "*/30 * * * *", // Every 30 minutes
    cacheTtl: 1800,
    retries: 1,
    timeout: 7000,
    selectors: {
      token: ".token-name",
      price: ".price-value",
      change24h: ".change-24h",
      volume24h: ".volume-24h",
    },
  },
];

// ============================================================================
// Robot Registry
// ============================================================================

/**
 * All robot configurations by category
 */
export const robotConfigs: Record<RobotCategory, RobotConfig[]> = {
  bluechip: bluechipRobots,
  defi: defiRobots,
  meme: memeRobots,
  daytrade: daytradeRobots,
  futures: futuresRobots,
  lp: lpRobots,
  trending: trendingRobots,
  l1l2: l1l2Robots,
  nft: nftRobots,
  onchain: onchainRobots,
  news: newsRobots,
  airdrop: airdropRobots,
  macro: macroRobots,
  gaming: gamingRobots,
  privacy: privacyRobots,
};

/**
 * Get all robot configurations
 */
export function getAllRobotConfigs(): RobotConfig[] {
  return Object.values(robotConfigs).flat();
}

/**
 * Get robots by category
 */
export function getRobotsByCategory(category: RobotCategory): RobotConfig[] {
  return robotConfigs[category] || [];
}

/**
 * Get robots by priority
 */
export function getRobotsByPriority(
  priority: "critical" | "high" | "medium" | "low",
): RobotConfig[] {
  return getAllRobotConfigs().filter((robot) => robot.priority === priority);
}

/**
 * Get critical robots (highest priority)
 */
export function getCriticalRobots(): RobotConfig[] {
  return getRobotsByPriority("critical");
}

/**
 * Get robot configuration by name
 */
export function getRobotConfig(name: string): RobotConfig | null {
  return getAllRobotConfigs().find((robot) => robot.name === name) || null;
}

/**
 * Get backup robot pairs
 */
export function getBackupPairs(): Array<{ primary: string; backup: string }> {
  const pairs: Array<{ primary: string; backup: string }> = [];

  for (const robot of getAllRobotConfigs()) {
    if (robot.backup) {
      pairs.push({
        primary: robot.name,
        backup: robot.backup.robotName,
      });
    }
  }

  return pairs;
}

/**
 * Get robots that need to run at startup (critical + high priority)
 */
export function getStartupRobots(): RobotConfig[] {
  return getAllRobotConfigs().filter(
    (robot) => robot.priority === "critical" || robot.priority === "high",
  );
}

/**
 * Validate robot configuration
 */
export function validateRobotConfig(config: RobotConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.name) errors.push("Robot name is required");
  if (!config.category) errors.push("Robot category is required");
  if (!config.type) errors.push("Robot type is required");
  if (!config.source) errors.push("Robot source is required");
  if (!config.schedule) errors.push("Robot schedule is required");
  if (config.cacheTtl <= 0) errors.push("Cache TTL must be positive");
  if (config.retries <= 0) errors.push("Retries must be positive");
  if (config.timeout <= 0) errors.push("Timeout must be positive");

  if (config.type === "extract" && !config.selectors) {
    errors.push("Extract robots require selectors");
  }

  if (config.type === "ai-extract" && !config.aiPrompt) {
    errors.push("AI extract robots require prompt");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
