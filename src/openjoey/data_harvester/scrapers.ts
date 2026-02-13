/**
 * Web Scrapers for OpenJoey Data Harvester
 * Scrapes crypto, stock, and financial data from public sources
 * Rule 4: Scraping & Free Data First
 */

import { fetchWithSsrFGuard } from "../../infra/net/fetch-guard.js";

export type ScraperResult = { url: string; text: string; fetchedAtMs: number };

const DEFAULT_TIMEOUT_MS = 30000;

// Anti-detection: Rotate user agents
const USER_AGENTS = [
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
];

function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

export type ScrapeOptions = {
  timeoutMs?: number;
  userAgent?: string;
};

/**
 * Generic web scraper with anti-detection
 */
export async function scrape(
  url: string,
  options: ScrapeOptions = {},
): Promise<ScraperResult | null> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const userAgent = options.userAgent ?? getRandomUserAgent();

  try {
    const result = await fetchWithSsrFGuard({
      url,
      timeoutMs,
      init: {
        headers: {
          "User-Agent": userAgent,
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Cache-Control": "no-cache",
        },
      },
    });

    if (!result.response.ok) {
      await result.release();
      return null;
    }

    const text = await result.response.text();
    await result.release();

    return {
      url: result.finalUrl,
      text,
      fetchedAtMs: Date.now(),
    };
  } catch {
    return null;
  }
}

/**
 * Scrape crypto prices
 */
export async function scrapeCryptoPrices(): Promise<ScraperResult | null> {
  return scrape("https://coinmarketcap.com/", { timeoutMs: 15000 });
}

/**
 * Scrape stock data from Yahoo Finance
 */
export async function scrapeStockData(symbol: string): Promise<ScraperResult | null> {
  return scrape(`https://finance.yahoo.com/quote/${symbol.toUpperCase()}`, { timeoutMs: 15000 });
}

/**
 * Scrape market news
 */
export async function scrapeMarketNews(): Promise<ScraperResult | null> {
  const sources = ["https://finance.yahoo.com/news/", "https://www.coindesk.com/"];

  for (const url of sources) {
    const result = await scrape(url, { timeoutMs: 10000 });
    if (result) return result;
  }

  return null;
}
