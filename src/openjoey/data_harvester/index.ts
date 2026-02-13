/**
 * OpenJoey Data Harvester — data collection for new flows only.
 * Used by event-engine jobs and new agents; daily-brief and trade-news-feeds stay unchanged.
 * Submodules: scrapers, free_api_clients, data_normalizer, cache_layer, rate_limiter.
 */

export const DATA_HARVESTER_VERSION = 1;
export { scrape, scrapeCryptoPrices, scrapeStockData } from "./scrapers.js";
export type { ScraperResult } from "./scrapers.js";
export { fetchFromFreeApi, fetchCoinGeckoPrices, fetchCoinGeckoCoin } from "./free_api_clients.js";
export {
  normalize,
  normalizeCoinGeckoData,
  normalizeStockData,
  aggregateBySymbol,
  getLatestBySymbol,
} from "./data_normalizer.js";
export type { NormalizedRow } from "./data_normalizer.js";
export { getCached, setCached, getOrCompute } from "./cache_layer.js";
export { createRateLimiter, getRateLimiter, domainRateLimiters } from "./rate_limiter.js";
