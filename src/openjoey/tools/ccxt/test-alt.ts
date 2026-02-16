/**
 * Test CCXT with alt/meme tokens
 */

import { fetchTicker, fetchOHLCV, isPairSupported } from "./index.js";

const altTokens = ["DOGE", "SHIB", "PEPE", "FLOKI", "BONK", "WIF", "POPCAT", "MOG", "BOME", "MEW"];

async function testAltTokens() {
  console.log("🧪 Testing CCXT with Alt/Meme Tokens\n");
  console.log("Token          | Price        | 24h Change | Volume      | Supported");
  console.log("---------------|--------------|------------|-------------|----------");

  let successCount = 0;
  let failCount = 0;

  for (const token of altTokens) {
    try {
      const symbol = token + "/USDT";
      const supported = await isPairSupported(symbol, "binance");

      if (supported) {
        const ticker = await fetchTicker(symbol, "binance");
        const price =
          ticker.last < 0.0001
            ? ticker.last.toExponential(4)
            : ticker.last.toFixed(ticker.last < 1 ? 6 : 4);

        console.log(
          `${token.padEnd(14)} | $${price.padStart(12)} | ${(ticker.changePercent24h?.toFixed(2) || "N/A").padStart(8)}% | ${(ticker.volume?.toLocaleString() || "N/A").padStart(11)} | ✅`,
        );
        successCount++;
      } else {
        console.log(
          `${token.padEnd(14)} | ${"".padStart(13)} | ${"".padStart(9)} | ${"".padStart(11)} | ❌ Not on Binance`,
        );
        failCount++;
      }
    } catch (e) {
      console.log(`${token.padEnd(14)} | ERROR: ${(e as Error).message.slice(0, 30)}`);
      failCount++;
    }

    // Small delay to respect rate limits
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log("\n---");
  console.log(`✅ Success: ${successCount}/${altTokens.length}`);
  console.log(`❌ Failed/Unsupported: ${failCount}/${altTokens.length}`);

  // Test OHLCV for one alt
  console.log("\n📊 Testing OHLCV for PEPE...");
  try {
    const ohlcv = await fetchOHLCV("PEPE/USDT", "1h", 3, "binance");
    console.log(`✓ Got ${ohlcv.length} candles`);
    ohlcv.forEach((c, i) => {
      console.log(
        `  [${i + 1}] O:${c.open.toExponential(4)} H:${c.high.toExponential(4)} L:${c.low.toExponential(4)} C:${c.close.toExponential(4)}`,
      );
    });
  } catch (e) {
    console.log(`✗ Error: ${(e as Error).message}`);
  }

  console.log("\n✅ Alt token test complete!");
}

testAltTokens().catch(console.error);
