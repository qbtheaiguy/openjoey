/**
 * Free API Clients for OpenJoey Data Harvester
 * Rule 4: Scraping & Free Data First - Priority on free APIs
 */

import { fetchWithSsrFGuard } from "../../infra/net/fetch-guard.js";

const DEFAULT_TIMEOUT_MS = 15000;

// Rate limit tracking per domain
const lastRequestMs: Map<string, number> = new Map();

async function rateLimitedFetch(
  domain: string,
  url: string,
  init?: RequestInit,
): Promise<Response | null> {
  const now = Date.now();
  const last = lastRequestMs.get(domain) ?? 0;
  const minInterval = domain === "api.coingecko.com" ? 1200 : 100; // CoinGecko: ~50 requests/min

  if (now - last < minInterval) {
    await new Promise((r) => setTimeout(r, minInterval - (now - last)));
  }

  try {
    const result = await fetchWithSsrFGuard({
      url,
      timeoutMs: DEFAULT_TIMEOUT_MS,
      init,
    });

    lastRequestMs.set(domain, Date.now());

    if (!result.response.ok) {
      await result.release();
      return null;
    }

    // Return response but note: caller must call result.release() after reading body
    return result.response;
  } catch {
    return null;
  }
}

// ============================================================================
// CoinGecko API (Free tier - 50 calls/min, 10K calls/month)
// ============================================================================

export type CoinGeckoPrice = {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
  last_updated: string;
};

/**
 * Fetch top cryptocurrencies from CoinGecko
 */
export async function fetchCoinGeckoPrices(
  limit: number = 100,
  currency: string = "usd",
): Promise<CoinGeckoPrice[] | null> {
  const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${currency}&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false&price_change_percentage=24h`;

  const response = await rateLimitedFetch("api.coingecko.com", url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response) return null;

  try {
    const data = (await response.json()) as CoinGeckoPrice[];
    return data;
  } catch {
    return null;
  }
}

/**
 * Fetch specific coin data by ID
 */
export async function fetchCoinGeckoCoin(coinId: string): Promise<CoinGeckoPrice | null> {
  const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coinId}`;

  const response = await rateLimitedFetch("api.coingecko.com", url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response) return null;

  try {
    const data = (await response.json()) as CoinGeckoPrice[];
    return data[0] ?? null;
  } catch {
    return null;
  }
}

// ============================================================================
// Yahoo Finance API (Free tier via RapidAPI or direct scraping alternative)
// ============================================================================

export type YahooQuote = {
  symbol: string;
  shortName: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketVolume: number;
  marketCap: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
};

/**
 * Fetch stock quote from Yahoo Finance
 * Uses their internal API endpoint (rate limited, unofficial)
 */
export async function fetchYahooFinanceQuote(symbol: string): Promise<YahooQuote | null> {
  // Yahoo Finance uses a crumb-based API that's hard to use
  // For now, return null and rely on scrapers
  // In production, use a proper Yahoo Finance API wrapper
  return null;
}

// ============================================================================
// FRED API (Federal Reserve Economic Data - Free with API key)
// ============================================================================

export type FREDSeries = {
  id: string;
  title: string;
  observation_start: string;
  observation_end: string;
  frequency: string;
  units: string;
};

export type FREDObservation = {
  date: string;
  value: number | null;
};

/**
 * Fetch FRED series data
 * Note: Requires FRED_API_KEY environment variable
 */
export async function fetchFREDData(
  seriesId: string,
  limit: number = 10,
): Promise<FREDObservation[] | null> {
  const apiKey = process.env.FRED_API_KEY;

  if (!apiKey) {
    return null;
  }

  const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&limit=${limit}&sort_order=desc&api_key=${apiKey}&file_type=json`;

  const response = await rateLimitedFetch("api.stlouisfed.org", url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response) return null;

  try {
    const data = (await response.json()) as {
      observations: Array<{ date: string; value: string }>;
    };
    return data.observations.map((obs) => ({
      date: obs.date,
      value: obs.value === "." ? null : parseFloat(obs.value),
    }));
  } catch {
    return null;
  }
}

// ============================================================================
// Generic fetch wrapper
// ============================================================================

export type FreeApiResult<T> = {
  data: T | null;
  source: string;
  fetchedAtMs: number;
  error?: string;
};

/**
 * Generic fetch from free API with error handling
 */
export async function fetchFromFreeApi<T>(
  url: string,
  domain: string,
  parser: (text: string) => T | null,
): Promise<FreeApiResult<T>> {
  const response = await rateLimitedFetch(domain, url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response) {
    return {
      data: null,
      source: url,
      fetchedAtMs: Date.now(),
      error: "Failed to fetch",
    };
  }

  try {
    const text = await response.text();
    const data = parser(text);

    return {
      data,
      source: url,
      fetchedAtMs: Date.now(),
    };
  } catch (error) {
    return {
      data: null,
      source: url,
      fetchedAtMs: Date.now(),
      error: error instanceof Error ? error.message : "Parse error",
    };
  }
}
