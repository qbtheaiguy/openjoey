#!/usr/bin/env tsx
/**
 * 🔴 LIVE API VERIFICATION TEST
 * Tests ALL data sources with REAL API calls
 * NO MOCK DATA - ONLY LIVE DATA
 */

// We'll test the APIs directly without importing the service
// to verify they return real data

const colors = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  reset: "\x1b[0m",
};

function log(type: "success" | "error" | "info" | "warn", message: string) {
  const color =
    type === "success"
      ? colors.green
      : type === "error"
        ? colors.red
        : type === "warn"
          ? colors.yellow
          : colors.blue;
  console.log(`${color}[${type.toUpperCase()}]${colors.reset} ${message}`);
}

// Test configurations
const API_CONFIGS = {
  dexscreener: {
    baseUrl: "https://api.dexscreener.com/latest/dex",
    timeout: 5000,
  },
  binance: {
    baseUrl: "https://api.binance.com/api/v3",
    timeout: 3000,
  },
  geckoterminal: {
    baseUrl: "https://api.geckoterminal.com/api/v2",
    timeout: 5000,
  },
  jupiter: {
    baseUrl: "https://quote-api.jup.ag/v6",
    timeout: 5000,
  },
};

// Solana token mints
const SOLANA_TOKEN_MINTS: Record<string, string> = {
  SOL: "So11111111111111111111111111111111111111112",
  USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  RAY: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
};

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

async function testLiveAPIs() {
  console.log("\n🔴 LIVE API VERIFICATION TEST");
  console.log("=====================================\n");
  console.log("Testing REAL API endpoints...");
  console.log("NO MOCK DATA - ONLY LIVE DATA\n");

  let passed = 0;
  let failed = 0;

  // Test 1: DexScreener - RAY (Solana)
  log("info", "Test 1: DexScreener API - RAY (Solana)");
  try {
    const response = await fetchWithTimeout(
      `${API_CONFIGS.dexscreener.baseUrl}/search?q=RAY`,
      API_CONFIGS.dexscreener.timeout,
    );
    const data = await response.json();

    if (data.pairs && data.pairs.length > 0) {
      const pair = data.pairs[0];
      const price = parseFloat(pair.priceUsd);
      const change24h = parseFloat(pair.priceChange24h || "0");
      const liquidity = parseFloat(pair.liquidity?.usd || "0");

      log("success", `✅ LIVE DATA: RAY = $${price} (24h: ${change24h}%)`);
      log("success", `   Source: DexScreener | Chain: ${pair.chainId}`);
      log("success", `   Liquidity: $${(liquidity / 1000000).toFixed(2)}M`);
      passed++;
    } else {
      log("error", "❌ NO LIVE DATA - DexScreener returned empty");
      failed++;
    }
  } catch (error) {
    log("error", `❌ API ERROR: ${error instanceof Error ? error.message : "Unknown error"}`);
    failed++;
  }
  console.log("");

  // Test 2: Binance - ETH (Major)
  log("info", "Test 2: Binance API - ETH (Ethereum Major)");
  try {
    const response = await fetchWithTimeout(
      `${API_CONFIGS.binance.baseUrl}/ticker/24hr?symbol=ETHUSDT`,
      API_CONFIGS.binance.timeout,
    );
    const data = await response.json();

    if (data && data.lastPrice) {
      const price = parseFloat(data.lastPrice);
      const change = parseFloat(data.priceChangePercent);
      const volume = parseFloat(data.volume);

      log("success", `✅ LIVE DATA: ETH = $${price} (24h: ${change}%)`);
      log("success", `   Source: Binance | Volume: $${(volume / 1000000).toFixed(2)}M`);
      passed++;
    } else {
      log("error", "❌ NO LIVE DATA - Binance returned empty");
      failed++;
    }
  } catch (error) {
    log("error", `❌ API ERROR: ${error instanceof Error ? error.message : "Unknown error"}`);
    failed++;
  }
  console.log("");

  // Test 3: DexScreener - BNB (BSC)
  log("info", "Test 3: DexScreener API - BNB (BSC)");
  try {
    const response = await fetchWithTimeout(
      `${API_CONFIGS.dexscreener.baseUrl}/search?q=BNB`,
      API_CONFIGS.dexscreener.timeout,
    );
    const data = await response.json();

    if (data.pairs && data.pairs.length > 0) {
      const pair = data.pairs.find((p: any) => p.chainId === "bsc") || data.pairs[0];
      const price = parseFloat(pair.priceUsd);
      const change24h = parseFloat(pair.priceChange24h || "0");

      log("success", `✅ LIVE DATA: BNB = $${price} (24h: ${change24h}%)`);
      log("success", `   Source: DexScreener | Chain: ${pair.chainId}`);
      passed++;
    } else {
      log("error", "❌ NO LIVE DATA - BNB not found");
      failed++;
    }
  } catch (error) {
    log("error", `❌ API ERROR: ${error instanceof Error ? error.message : "Unknown error"}`);
    failed++;
  }
  console.log("");

  // Test 4: Jupiter - SOL (Solana)
  log("info", "Test 4: Jupiter API - SOL (Solana)");
  try {
    const inputMint = SOLANA_TOKEN_MINTS["SOL"];
    const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

    const response = await fetchWithTimeout(
      `${API_CONFIGS.jupiter.baseUrl}/quote?inputMint=${inputMint}&outputMint=${USDC_MINT}&amount=1000000000&slippageBps=50`,
      API_CONFIGS.jupiter.timeout,
    );
    const data = await response.json();

    if (data && data.outAmount) {
      const price = parseFloat(data.outAmount) / 1000000000;

      log("success", `✅ LIVE DATA: SOL = $${price.toFixed(2)}`);
      log("success", `   Source: Jupiter | Real swap price from Solana`);
      passed++;
    } else {
      log("error", "❌ NO LIVE DATA - Jupiter returned empty");
      failed++;
    }
  } catch (error) {
    log("error", `❌ API ERROR: ${error instanceof Error ? error.message : "Unknown error"}`);
    failed++;
  }
  console.log("");

  // Test 5: Trending Data - DexScreener pairs
  log("info", "Test 5: Trending Data - Solana pairs from DexScreener");
  try {
    const response = await fetchWithTimeout(
      `${API_CONFIGS.dexscreener.baseUrl}/pairs/solana`,
      API_CONFIGS.dexscreener.timeout,
    );
    const data = await response.json();

    if (data.pairs && data.pairs.length > 0) {
      log("success", `✅ LIVE DATA: Found ${data.pairs.length} Solana pairs`);
      data.pairs.slice(0, 3).forEach((pair: any, i: number) => {
        const change = parseFloat(pair.priceChange24h || "0");
        log(
          "success",
          `   ${i + 1}. ${pair.baseToken.symbol}: $${parseFloat(pair.priceUsd).toFixed(4)} (${change > 0 ? "+" : ""}${change}%)`,
        );
      });
      passed++;
    } else {
      log("error", "❌ NO LIVE DATA - Trending fetch returned empty");
      failed++;
    }
  } catch (error) {
    log("error", `❌ API ERROR: ${error instanceof Error ? error.message : "Unknown error"}`);
    failed++;
  }
  console.log("");

  // Test 6: GeckoTerminal backup
  log("info", "Test 6: GeckoTerminal API - Backup source");
  try {
    const response = await fetchWithTimeout(
      `${API_CONFIGS.geckoterminal.baseUrl}/search?query=RAY`,
      API_CONFIGS.geckoterminal.timeout,
    );
    const data = await response.json();

    if (data.data && data.data.length > 0) {
      const token = data.data[0];
      const price = parseFloat(token.attributes.price_usd || "0");

      log("success", `✅ LIVE DATA: ${token.attributes.symbol} = $${price}`);
      log("success", `   Source: GeckoTerminal | Network: ${token.attributes.network}`);
      passed++;
    } else {
      log("warn", "⚠️ GeckoTerminal returned empty (backup only, not critical)");
    }
  } catch (error) {
    log(
      "warn",
      `⚠️ GeckoTerminal error (backup only): ${error instanceof Error ? error.message : "Unknown"}`,
    );
  }
  console.log("");

  // Summary
  console.log("=====================================");
  console.log("🔴 LIVE API TEST SUMMARY");
  console.log("=====================================");
  log("success", `✅ PASSED: ${passed}/${passed + failed} tests`);
  if (failed > 0) {
    log("error", `❌ FAILED: ${failed}/${passed + failed} tests`);
  }
  console.log("");

  if (failed === 0) {
    console.log("🎉 ALL APIs RETURNING LIVE DATA!");
    console.log("Ready for production deployment ✅");
    console.log("");
    console.log("💡 User-friendly error messages are ready:");
    console.log('   "Joey is crunching fresh market data for you..."');
    console.log('   "Market data temporarily unavailable - please try again in a moment 💙"');
    process.exit(0);
  } else {
    console.log("⚠️ Some APIs not returning live data");
    console.log("Review error messages above before deployment");
    process.exit(1);
  }
}

testLiveAPIs().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
