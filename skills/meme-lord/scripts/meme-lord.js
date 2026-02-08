#!/usr/bin/env node
/**
 * Meme Lord Token Scanner v2.0
 * Multi-platform meme coin hunter with cross-verification
 * Platforms: DexScreener, GeckoTerminal, DEXTools, GMGN.ai
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

// Configuration
const CONFIG = {
  MIN_LIQUIDITY_USD: 50000,
  MIN_VOLUME_24H: 100000,
  MAX_AGE_DAYS: 7,
  TARGET_CHAIN: process.argv[3] || "solana",
  TIMEOUT: 15000,
};

// Platform API endpoints
const APIS = {
  dexscreener: {
    base: "https://api.dexscreener.com",
    trending: "/token-boosts/top/v1",
    token: "/latest/dex/tokens/",
    pairs: "/latest/dex/pairs/",
  },
  geckoterminal: {
    base: "https://api.geckoterminal.com/api/v2",
    networks: "/networks",
    trending: "/networks/{network}/pools?page=1",
    token: "/networks/{network}/tokens/{tokenAddress}",
    pools: "/networks/{network}/tokens/{tokenAddress}/pools",
  },
  dextools: {
    base: "https://public-api.dextools.io/trial/v2",
    // Note: DEXTools requires API key for most endpoints
    // Free tier available: https://public-api.dextools.io/
  },
};

// Network mapping for GeckoTerminal
const NETWORK_MAP = {
  solana: "solana",
  ethereum: "eth",
  bsc: "bsc",
  base: "base",
  arbitrum: "arbitrum",
  optimism: "optimism",
  polygon: "polygon_pos",
};

// Colors for terminal output
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
};

// HTTP request helper with retries
async function httpRequest(url, options = {}, retries = 2) {
  return new Promise((resolve, reject) => {
    const makeRequest = (attempt) => {
      const req = https.get(
        url,
        {
          timeout: CONFIG.TIMEOUT,
          headers: {
            "User-Agent": "MemeLord/2.0",
            Accept: "application/json",
            ...options.headers,
          },
        },
        (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => {
            try {
              resolve(JSON.parse(data));
            } catch {
              resolve(data);
            }
          });
        },
      );

      req.on("error", (err) => {
        if (attempt < retries) {
          setTimeout(() => makeRequest(attempt + 1), 1000);
        } else {
          reject(err);
        }
      });

      req.on("timeout", () => {
        req.destroy();
        if (attempt < retries) {
          setTimeout(() => makeRequest(attempt + 1), 1000);
        } else {
          reject(new Error("Request timeout"));
        }
      });
    };

    makeRequest(0);
  });
}

// ==================== PLATFORM FETCHERS ====================

// Fetch from DexScreener
async function fetchDexScreenerData(chain) {
  try {
    console.log(`${colors.cyan}🔍 Scanning DexScreener...${colors.reset}`);

    // Get trending/boosted tokens
    const trending = await httpRequest(`${APIS.dexscreener.base}${APIS.dexscreener.trending}`);

    // Get latest pairs for the chain
    const pairs = await httpRequest(`${APIS.dexscreener.base}${APIS.dexscreener.pairs}${chain}`);

    let tokens = [];

    // Process trending
    if (Array.isArray(trending)) {
      tokens = trending.filter(
        (t) => t.chainId === chain && parseFloat(t.liquidityUsd || 0) >= CONFIG.MIN_LIQUIDITY_USD,
      );
    }

    // Process pairs
    if (pairs && Array.isArray(pairs.pairs)) {
      const pairTokens = pairs.pairs
        .filter((p) => parseFloat(p.liquidity?.usd || 0) >= CONFIG.MIN_LIQUIDITY_USD)
        .map((p) => ({
          ...p,
          source: "dexscreener",
        }));
      tokens = [...tokens, ...pairTokens];
    }

    return tokens.slice(0, 15);
  } catch (error) {
    console.error(`${colors.red}❌ DexScreener error: ${error.message}${colors.reset}`);
    return [];
  }
}

// Fetch from GeckoTerminal
async function fetchGeckoTerminalData(chain) {
  try {
    console.log(`${colors.cyan}🔍 Scanning GeckoTerminal...${colors.reset}`);

    const network = NETWORK_MAP[chain] || chain;
    const url = `${APIS.geckoterminal.base}/networks/${network}/pools?page=1&sort=-24h_volume`;

    const response = await httpRequest(url);

    if (!response || !Array.isArray(response.data)) {
      return [];
    }

    return response.data
      .filter((pool) => {
        const liquidity = parseFloat(pool.attributes?.reserve_in_usd || 0);
        const volume = parseFloat(pool.attributes?.volume_usd?.h24 || 0);
        return liquidity >= CONFIG.MIN_LIQUIDITY_USD && volume >= CONFIG.MIN_VOLUME_24H;
      })
      .map((pool) => ({
        tokenAddress: pool.relationships?.base_token?.data?.id?.split("_")[1],
        chainId: chain,
        liquidityUsd: parseFloat(pool.attributes?.reserve_in_usd || 0),
        volume24hUsd: parseFloat(pool.attributes?.volume_usd?.h24 || 0),
        priceUsd: parseFloat(pool.attributes?.base_token_price_usd || 0),
        priceChange24h: parseFloat(pool.attributes?.price_change_percentage?.h24 || 0),
        source: "geckoterminal",
      }))
      .slice(0, 10);
  } catch (error) {
    console.error(`${colors.red}❌ GeckoTerminal error: ${error.message}${colors.reset}`);
    return [];
  }
}

// Fetch detailed token data from GeckoTerminal
async function fetchGeckoTerminalTokenDetails(tokenAddress, chain) {
  try {
    const network = NETWORK_MAP[chain] || chain;
    const url = `${APIS.geckoterminal.base}/networks/${network}/tokens/${tokenAddress}`;

    const response = await httpRequest(url);

    if (!response || !response.data) return null;

    const attrs = response.data.attributes;
    return {
      tokenAddress: tokenAddress,
      chainId: chain,
      name: attrs.name,
      symbol: attrs.symbol,
      priceUsd: parseFloat(attrs.price_usd || 0),
      marketCap: parseFloat(attrs.market_cap_usd || 0),
      fdv: parseFloat(attrs.fdv_usd || 0),
      liquidityUsd: parseFloat(attrs.total_reserve_in_usd || 0),
      volume24hUsd: parseFloat(attrs.volume_usd_24h || 0),
      priceChange24h: parseFloat(attrs.price_change_percentage_24h || 0),
      source: "geckoterminal",
    };
  } catch (error) {
    console.error(`${colors.gray}⚠️  GeckoTerminal details error: ${error.message}${colors.reset}`);
    return null;
  }
}

// Fetch from DEXTools (if API key available)
async function fetchDEXToolsData(chain) {
  // DEXTools requires API key
  // Free tier: 1M credits/month
  // Skip for now unless user has API key
  console.log(`${colors.gray}⚠️  DEXTools skipped (requires API key)${colors.reset}`);
  return [];
}

// Aggregate data from all platforms
async function aggregateTokenData(chain) {
  console.log(`${colors.magenta}\n🐸 Hunting across multiple platforms...${colors.reset}\n`);

  const [dexScreenerData, geckoData] = await Promise.all([
    fetchDexScreenerData(chain),
    fetchGeckoTerminalData(chain),
  ]);

  // Merge and deduplicate by token address
  const tokenMap = new Map();

  // Process DexScreener data
  dexScreenerData.forEach((token) => {
    const addr = token.baseToken?.address || token.tokenAddress;
    if (addr) {
      tokenMap.set(addr.toLowerCase(), {
        ...token,
        sources: ["dexscreener"],
      });
    }
  });

  // Process GeckoTerminal data
  geckoData.forEach((token) => {
    const addr = token.tokenAddress;
    if (addr) {
      const existing = tokenMap.get(addr.toLowerCase());
      if (existing) {
        // Merge data
        existing.sources = [...existing.sources, "geckoterminal"];
        existing.liquidityUsd = Math.max(existing.liquidityUsd || 0, token.liquidityUsd || 0);
        existing.volume24hUsd = Math.max(existing.volume24hUsd || 0, token.volume24hUsd || 0);
      } else {
        tokenMap.set(addr.toLowerCase(), {
          ...token,
          sources: ["geckoterminal"],
        });
      }
    }
  });

  return Array.from(tokenMap.values());
}

// ==================== ANALYSIS FUNCTIONS ====================

// Comprehensive token analysis
async function analyzeToken(token) {
  console.log(
    `${colors.cyan}🔬 Analyzing ${token.symbol || token.baseToken?.symbol}...${colors.reset}`,
  );

  // Fetch additional details if needed
  let enrichedData = token;
  const chain = token.chainId || "solana";
  const address = token.baseToken?.address || token.tokenAddress;

  if (!token.name || !token.marketCap) {
    // Try to get more data from GeckoTerminal
    const geckoDetails = await fetchGeckoTerminalTokenDetails(address, chain);
    if (geckoDetails) {
      enrichedData = { ...token, ...geckoDetails };
    }

    // Try DexScreener as backup
    if (!enrichedData.name) {
      try {
        const dsData = await httpRequest(
          `${APIS.dexscreener.base}${APIS.dexscreener.token}${address}`,
        );
        if (dsData && dsData.pairs && dsData.pairs[0]) {
          const pair = dsData.pairs[0];
          enrichedData = {
            ...enrichedData,
            name: pair.baseToken?.name || enrichedData.name,
            symbol: pair.baseToken?.symbol || enrichedData.symbol,
            priceUsd: parseFloat(pair.priceUsd || enrichedData.priceUsd || 0),
            marketCap: parseFloat(pair.fdv || pair.marketCap || enrichedData.marketCap || 0),
            liquidityUsd: parseFloat(pair.liquidity?.usd || enrichedData.liquidityUsd || 0),
            volume24hUsd: parseFloat(pair.volume?.h24 || enrichedData.volume24hUsd || 0),
            priceChange24h: parseFloat(pair.priceChange?.h24 || enrichedData.priceChange24h || 0),
            txns: pair.txns,
          };
        }
      } catch (e) {
        // Ignore
      }
    }
  }

  const safety = await analyzeTokenSafety(enrichedData);
  const targets = calculateTargets(enrichedData);

  return { token: enrichedData, safety, targets };
}

// Analyze token safety
async function analyzeTokenSafety(token) {
  const safety = {
    score: 0,
    flags: [],
    warnings: [],
    positives: [],
    multiSourceVerified: false,
  };

  // Check if verified by multiple sources
  if (token.sources && token.sources.length > 1) {
    safety.positives.push(`Verified on ${token.sources.join(" + ")}`);
    safety.multiSourceVerified = true;
    safety.score += 2;
  }

  // Check liquidity
  const liquidity = parseFloat(token.liquidity?.usd || token.liquidityUsd || 0);
  const marketCap = parseFloat(token.fdv || token.marketCap || 0);

  if (liquidity < CONFIG.MIN_LIQUIDITY_USD) {
    safety.flags.push("Low liquidity (<$50K)");
  } else if (liquidity < marketCap * 0.3) {
    safety.warnings.push("Liquidity <30% of market cap");
  } else {
    safety.positives.push(`Healthy liquidity: $${formatNumber(liquidity)}`);
    safety.score += 2;
  }

  // Check volume
  const volume24h = parseFloat(token.volume24hUsd || token.volume?.h24 || 0);
  if (volume24h < CONFIG.MIN_VOLUME_24H) {
    safety.warnings.push("Low 24h volume");
  } else {
    safety.positives.push(`Good volume: $${formatNumber(volume24h)}/24h`);
    safety.score += 1;
  }

  // Check price change
  const priceChange24h = parseFloat(token.priceChange?.h24 || token.priceChange24h || 0);
  if (priceChange24h > 500) {
    safety.warnings.push("Extreme pump (+500% in 24h) - risk of dump");
  } else if (priceChange24h > 100) {
    safety.positives.push(`Strong momentum: +${priceChange24h.toFixed(1)}% (24h)`);
    safety.score += 1;
  } else if (priceChange24h < -50) {
    safety.warnings.push("Heavy dump (-50% in 24h) - potential bottom?");
  }

  // Check buy/sell ratio
  const buys = parseInt(token.txns?.h24?.buys || 0);
  const sells = parseInt(token.txns?.h24?.sells || 0);
  if (buys > 0 && sells > 0) {
    const ratio = buys / sells;
    if (ratio > 1.5) {
      safety.positives.push(`Bullish flow: ${ratio.toFixed(1)}:1 buy/sell ratio`);
      safety.score += 2;
    } else if (ratio < 0.7) {
      safety.warnings.push(`Bearish flow: ${ratio.toFixed(1)}:1 buy/sell ratio`);
    }
  }

  // Check volume/liquidity ratio (turnover)
  if (liquidity > 0 && volume24h > 0) {
    const turnover = volume24h / liquidity;
    if (turnover > 1) {
      safety.positives.push(`High turnover: ${turnover.toFixed(1)}x (active trading)`);
      safety.score += 1;
    }
  }

  // Calculate final score (max 10)
  safety.score = Math.min(10, Math.max(1, safety.score + 2));

  return safety;
}

// Calculate entry and targets
function calculateTargets(token) {
  const price = parseFloat(token.priceUsd || token.priceNative || 0);
  if (!price || price === 0) return null;

  const volatility = Math.abs(parseFloat(token.priceChange?.h24 || token.priceChange24h || 0));
  const stopDistance = volatility > 100 ? 0.3 : 0.2; // 30% stop for volatile, 20% for stable

  const entryLow = price * 0.98;
  const entryHigh = price * 1.02;
  const stopLoss = price * (1 - stopDistance);
  const target1 = price * 1.5;
  const target2 = price * 2.0;
  const target3 = price * 3.0;

  return {
    current: price.toFixed(12).replace(/\.?0+$/, ""),
    entryLow: entryLow.toFixed(12).replace(/\.?0+$/, ""),
    entryHigh: entryHigh.toFixed(12).replace(/\.?0+$/, ""),
    stopLoss: stopLoss.toFixed(12).replace(/\.?0+$/, ""),
    target1: target1.toFixed(12).replace(/\.?0+$/, ""),
    target2: target2.toFixed(12).replace(/\.?0+$/, ""),
    target3: target3.toFixed(12).replace(/\.?0+$/, ""),
  };
}

// ==================== DISPLAY FUNCTIONS ====================

// Format number helper
function formatNumber(num) {
  if (!num || isNaN(num)) return "0";
  if (num >= 1e9) return (num / 1e9).toFixed(2) + "B";
  if (num >= 1e6) return (num / 1e6).toFixed(2) + "M";
  if (num >= 1e3) return (num / 1e3).toFixed(2) + "K";
  return num.toString();
}

// Display token analysis
function displayTokenAnalysis(token, safety, targets) {
  const name = token.name || token.baseToken?.name || "Unknown";
  const symbol = token.symbol || token.baseToken?.symbol || "???";
  const address = token.tokenAddress || token.baseToken?.address || "N/A";
  const chain = token.chainId || "unknown";

  console.log(
    `\n${colors.magenta}═══════════════════════════════════════════════════${colors.reset}`,
  );
  console.log(`${colors.magenta}🐸 MEME LORD SIGNAL${colors.reset}`);
  console.log(
    `${colors.magenta}═══════════════════════════════════════════════════${colors.reset}\n`,
  );

  console.log(`${colors.cyan}$${symbol} - ${name}${colors.reset}`);
  console.log(`${colors.gray}Chain: ${chain.toUpperCase()}${colors.reset}`);
  console.log(`${colors.gray}Contract: ${address}${colors.reset}`);
  if (token.sources) {
    console.log(`${colors.gray}Sources: ${token.sources.join(", ")}${colors.reset}`);
  }
  console.log();

  // Price info
  const price = parseFloat(token.priceUsd || 0);
  const marketCap = parseFloat(token.fdv || token.marketCap || 0);
  const liquidity = parseFloat(token.liquidity?.usd || token.liquidityUsd || 0);
  const volume24h = parseFloat(token.volume24hUsd || token.volume?.h24 || 0);
  const priceChange = parseFloat(token.priceChange?.h24 || token.priceChange24h || 0);

  console.log(`${colors.blue}📊 MARKET DATA${colors.reset}`);
  console.log(`  Price: $${price.toFixed(12).replace(/\.?0+$/, "")}`);
  console.log(`  Market Cap: $${formatNumber(marketCap)}`);
  console.log(`  Liquidity: $${formatNumber(liquidity)}`);
  console.log(`  24h Volume: $${formatNumber(volume24h)}`);
  console.log(
    `  24h Change: ${priceChange >= 0 ? colors.green : colors.red}${priceChange.toFixed(2)}%${colors.reset}`,
  );

  // Turnover
  if (liquidity > 0 && volume24h > 0) {
    const turnover = volume24h / liquidity;
    console.log(`  Turnover: ${turnover.toFixed(2)}x (volume/liquidity)`);
  }
  console.log();

  // Safety score
  const scoreColor =
    safety.score >= 7 ? colors.green : safety.score >= 4 ? colors.yellow : colors.red;
  console.log(`${colors.blue}🛡️ SAFETY SCORE: ${scoreColor}${safety.score}/10${colors.reset}`);

  if (safety.positives.length > 0) {
    console.log(`${colors.green}  ✅ ${safety.positives.join("\n  ✅ ")}${colors.reset}`);
  }
  if (safety.warnings.length > 0) {
    console.log(`${colors.yellow}  ⚠️  ${safety.warnings.join("\n  ⚠️  ")}${colors.reset}`);
  }
  if (safety.flags.length > 0) {
    console.log(`${colors.red}  🚨 ${safety.flags.join("\n  🚨 ")}${colors.reset}`);
  }
  console.log();

  // Trading plan
  if (targets && safety.score >= 4 && safety.flags.length === 0) {
    console.log(`${colors.blue}📈 TRADING PLAN${colors.reset}`);
    console.log(`  Entry Zone: $${targets.entryLow} - $${targets.entryHigh}`);
    console.log(`  Stop Loss:  $${targets.stopLoss}`);
    console.log(`  Target 1:   $${targets.target1} (+50%)`);
    console.log(`  Target 2:   $${targets.target2} (+100%)`);
    console.log(`  Target 3:   $${targets.target3} (+200%)\n`);

    const riskLevel = safety.score >= 7 ? "MEDIUM" : safety.score >= 4 ? "HIGH" : "EXTREME";
    const positionSize = safety.score >= 7 ? "1-2%" : safety.score >= 4 ? "0.5-1%" : "0.1-0.5%";

    console.log(`${colors.blue}🎯 VERDICT: ${colors.green}BUY${colors.reset}`);
    console.log(`  Risk Level: ${riskLevel}`);
    console.log(`  Position Size: ${positionSize} of portfolio\n`);
  } else if (safety.flags.length > 0) {
    console.log(`${colors.red}🎯 VERDICT: AVOID${colors.reset}`);
    console.log(`  Reason: Critical red flags detected\n`);
  } else {
    console.log(`${colors.yellow}🎯 VERDICT: WAIT${colors.reset}`);
    console.log(`  Reason: Safety score too low or no clear setup\n`);
  }

  console.log(`${colors.gray}Links:${colors.reset}`);
  console.log(`  DexScreener: https://dexscreener.com/${chain}/${address}`);
  if (chain === "solana") {
    console.log(`  GMGN.ai: https://gmgn.ai/sol/token/${address}`);
    console.log(`  Solscan: https://solscan.io/token/${address}`);
  } else if (chain === "ethereum") {
    console.log(`  Etherscan: https://etherscan.io/token/${address}`);
  }
  console.log();
}

// ==================== MAIN FUNCTIONS ====================

// Main hunt function
async function hunt() {
  console.log(`\n${colors.magenta}🐸 MEME LORD HUNTER v2.0${colors.reset}`);
  console.log(`${colors.gray}Cross-platform alpha hunter${colors.reset}\n`);

  const tokens = await aggregateTokenData(CONFIG.TARGET_CHAIN);

  if (tokens.length === 0) {
    console.log(`${colors.yellow}No tokens matching criteria found.${colors.reset}`);
    return;
  }

  console.log(
    `${colors.green}Found ${tokens.length} unique tokens across platforms. Analyzing...${colors.reset}\n`,
  );

  let opportunities = [];

  for (const token of tokens) {
    try {
      const analysis = await analyzeToken(token);

      // Show viable opportunities
      if (analysis.safety.score >= 4 && analysis.safety.flags.length === 0) {
        displayTokenAnalysis(analysis.token, analysis.safety, analysis.targets);
        opportunities.push(analysis);
      }
    } catch (error) {
      console.error(`${colors.gray}⚠️  Error analyzing token: ${error.message}${colors.reset}`);
    }
  }

  console.log(
    `${colors.magenta}═══════════════════════════════════════════════════${colors.reset}\n`,
  );

  if (opportunities.length === 0) {
    console.log(`${colors.yellow}No viable opportunities found right now.${colors.reset}`);
    console.log(
      `${colors.gray}Try again later or check specific tokens with: meme-lord analyze <address>${colors.reset}`,
    );
  } else {
    console.log(`${colors.green}✅ Found ${opportunities.length} potential setups!${colors.reset}`);
    console.log(
      `${colors.gray}Remember: This is gambling with better data. Manage risk.${colors.reset}`,
    );
  }

  console.log();
}

// Analyze specific token across platforms
async function analyze(tokenAddress) {
  console.log(`\n${colors.magenta}🔬 Cross-Platform Deep Dive${colors.reset}`);
  console.log(`${colors.gray}Token: ${tokenAddress}${colors.reset}\n`);

  // Fetch from multiple sources
  const [dsData, geckoData] = await Promise.all([
    httpRequest(`${APIS.dexscreener.base}${APIS.dexscreener.token}${tokenAddress}`).catch(
      () => null,
    ),
    fetchGeckoTerminalTokenDetails(tokenAddress, CONFIG.TARGET_CHAIN).catch(() => null),
  ]);

  // Merge data
  let mergedToken = {
    tokenAddress,
    chainId: CONFIG.TARGET_CHAIN,
    sources: [],
  };

  if (dsData && dsData.pairs && dsData.pairs[0]) {
    const pair = dsData.pairs[0];
    mergedToken = {
      ...mergedToken,
      ...pair,
      sources: [...mergedToken.sources, "dexscreener"],
    };
  }

  if (geckoData) {
    mergedToken = {
      ...mergedToken,
      ...geckoData,
      sources: [...mergedToken.sources, "geckoterminal"],
    };
  }

  if (mergedToken.sources.length === 0) {
    console.log(`${colors.red}❌ Could not fetch token data from any platform${colors.reset}`);
    return;
  }

  const safety = await analyzeTokenSafety(mergedToken);
  const targets = calculateTargets(mergedToken);

  displayTokenAnalysis(mergedToken, safety, targets);
}

// Watchlist management
function watchlist(command, tokenAddress) {
  const watchlistPath = path.join(
    process.env.HOME || process.env.USERPROFILE,
    ".meme-lord-watchlist.json",
  );

  let watchlist = [];
  if (fs.existsSync(watchlistPath)) {
    watchlist = JSON.parse(fs.readFileSync(watchlistPath, "utf8"));
  }

  switch (command) {
    case "add":
      if (!watchlist.find((t) => t.address === tokenAddress)) {
        watchlist.push({
          address: tokenAddress,
          chain: CONFIG.TARGET_CHAIN,
          addedAt: new Date().toISOString(),
        });
        fs.writeFileSync(watchlistPath, JSON.stringify(watchlist, null, 2));
        console.log(`${colors.green}✅ Added ${tokenAddress} to watchlist${colors.reset}`);
      } else {
        console.log(`${colors.yellow}⚠️  Token already in watchlist${colors.reset}`);
      }
      break;

    case "remove":
      watchlist = watchlist.filter((t) => t.address !== tokenAddress);
      fs.writeFileSync(watchlistPath, JSON.stringify(watchlist, null, 2));
      console.log(`${colors.green}✅ Removed ${tokenAddress} from watchlist${colors.reset}`);
      break;

    case "list":
      if (watchlist.length === 0) {
        console.log(`${colors.gray}Watchlist is empty${colors.reset}`);
      } else {
        console.log(`${colors.cyan}📋 Your Watchlist:${colors.reset}`);
        watchlist.forEach((t, i) => {
          console.log(`  ${i + 1}. ${t.address} (${t.chain})`);
        });
      }
      break;

    default:
      console.log(
        `${colors.red}Usage: meme-lord watchlist [add|remove|list] <token-address>${colors.reset}`,
      );
  }
}

// Main
async function main() {
  const command = process.argv[2];

  switch (command) {
    case "hunt":
      await hunt();
      break;

    case "analyze":
      const tokenAddress = process.argv[3];
      if (!tokenAddress) {
        console.log(`${colors.red}Usage: meme-lord analyze <token-address>${colors.reset}`);
        process.exit(1);
      }
      await analyze(tokenAddress);
      break;

    case "watchlist":
      const wlCommand = process.argv[3];
      const wlAddress = process.argv[4];
      watchlist(wlCommand, wlAddress);
      break;

    default:
      console.log(
        `\n${colors.magenta}🐸 Meme Lord v2.0 - Multi-Platform Meme Coin Hunter${colors.reset}\n`,
      );
      console.log("Commands:");
      console.log("  meme-lord hunt [--chain solana|ethereum|bsc]   Hunt for new opportunities");
      console.log("  meme-lord analyze <token-address>              Deep dive on specific token");
      console.log("  meme-lord watchlist [add|remove|list] [addr]   Manage watchlist");
      console.log("");
      console.log("Platforms: DexScreener, GeckoTerminal (+ DEXTools with API key)");
      console.log("");
  }
}

main().catch(console.error);
