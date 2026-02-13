#!/usr/bin/env -S node --import tsx
/**
 * Fetch trade news from RSS (Fed, crypto, gold, markets). Output JSON for piping or agent use.
 * Usage: bun run scripts/fetch-trade-news.ts [--pretty]
 */

const pretty = process.argv.includes("--pretty");

async function main(): Promise<void> {
  const { fetchTradeNewsFromRss } = await import("../src/openjoey/trade-news-feeds.js");
  const items = await fetchTradeNewsFromRss();
  if (pretty) {
    console.log(JSON.stringify(items, null, 2));
  } else {
    console.log(JSON.stringify(items));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
