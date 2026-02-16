/**
 * Test CCXT tools integration
 *
 * Run with: pnpm tsx src/openjoey/tools/ccxt/test.ts
 */

import {
  fetchTicker,
  fetchOHLCV,
  comparePrices,
  fetchOrderBook,
  getSupportedExchanges,
  isPairSupported,
} from "./index.js";

async function testCCXTTools() {
  console.log("🧪 Testing CCXT Tools for OpenJoey\n");

  // Test 1: List some supported exchanges
  console.log("1. Supported Exchanges (first 10):");
  const exchanges = getSupportedExchanges();
  console.log("   ", exchanges.slice(0, 10).join(", "));
  console.log("   Total:", exchanges.length, "exchanges\n");

  // Test 2: Fetch BTC price from Binance
  console.log("2. Fetching BTC/USDT ticker from Binance...");
  try {
    const btcTicker = await fetchTicker("BTC/USDT", "binance");
    console.log("   ✓ BTC Price:", btcTicker.last);
    console.log("   ✓ 24h Change:", btcTicker.changePercent24h?.toFixed(2) + "%");
    console.log("   ✓ Volume:", btcTicker.volume?.toLocaleString());
  } catch (error) {
    console.log("   ✗ Error:", (error as Error).message);
  }
  console.log();

  // Test 3: Fetch ETH OHLCV
  console.log("3. Fetching ETH/USDT 1h candles (last 5)...");
  try {
    const ethOHLCV = await fetchOHLCV("ETH/USDT", "1h", 5, "binance");
    console.log("   ✓ Got", ethOHLCV.length, "candles");
    ethOHLCV.forEach((candle, i) => {
      console.log(
        `      [${i + 1}] O:${candle.open.toFixed(2)} H:${candle.high.toFixed(2)} L:${candle.low.toFixed(2)} C:${candle.close.toFixed(2)}`,
      );
    });
  } catch (error) {
    console.log("   ✗ Error:", (error as Error).message);
  }
  console.log();

  // Test 4: Compare BTC prices across exchanges
  console.log("4. Comparing BTC/USDT prices...");
  try {
    const comparison = await comparePrices("BTC/USDT", ["binance", "kraken", "coinbase"]);
    console.log("   ✓ Symbol:", comparison.symbol);
    console.log("   ✓ Best Bid:", comparison.bestBid.exchange, "@", comparison.bestBid.price);
    console.log("   ✓ Best Ask:", comparison.bestAsk.exchange, "@", comparison.bestAsk.price);
    console.log("   ✓ Price Diff:", comparison.priceDiffPercent.toFixed(4) + "%");
  } catch (error) {
    console.log("   ✗ Error:", (error as Error).message);
  }
  console.log();

  // Test 5: Check pair support
  console.log("5. Checking pair support...");
  try {
    const btcSupported = await isPairSupported("BTC/USDT", "binance");
    const randomSupported = await isPairSupported("RANDOM/PAIR", "binance");
    console.log("   ✓ BTC/USDT on Binance:", btcSupported);
    console.log("   ✓ RANDOM/PAIR on Binance:", randomSupported);
  } catch (error) {
    console.log("   ✗ Error:", (error as Error).message);
  }
  console.log();

  // Test 6: Fetch order book (top 5)
  console.log("6. Fetching BTC/USDT order book (top 5)...");
  try {
    const orderBook = await fetchOrderBook("BTC/USDT", 5, "binance");
    console.log("   ✓ Bids:", orderBook.bids.length, "levels");
    console.log("   ✓ Asks:", orderBook.asks.length, "levels");
    console.log("   Top bid:", orderBook.bids[0]?.price, "x", orderBook.bids[0]?.amount);
    console.log("   Top ask:", orderBook.asks[0]?.price, "x", orderBook.asks[0]?.amount);
  } catch (error) {
    console.log("   ✗ Error:", (error as Error).message);
  }
  console.log();

  console.log("✅ CCXT Tools test complete!");
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testCCXTTools().catch(console.error);
}

export { testCCXTTools };
