/**
 * Browser scraping utilities with fallback strategies
 * Handles HTTP requests, HTML parsing, and retries
 */

import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import * as cheerio from "cheerio";
import { setTimeout } from "timers/promises";

// Export cheerio types
export type { CheerioAPI } from "cheerio";

export interface ScrapingResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  source: string;
  timestamp: Date;
  retries: number;
}

export interface FetchOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
  parser?: "json" | "html" | "text";
}

const DEFAULT_OPTIONS: FetchOptions = {
  timeout: 10000,
  retries: 3,
  retryDelay: 1000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    Accept: "application/json, text/html, */*",
    "Accept-Language": "en-US,en;q=0.9",
  },
  parser: "json",
};

/**
 * Fetch data from URL with retries and error handling
 */
export async function fetchWithRetry<T>(
  url: string,
  options: FetchOptions = {},
): Promise<ScrapingResult<T>> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < (opts.retries || 1); attempt++) {
    try {
      const config: AxiosRequestConfig = {
        timeout: opts.timeout,
        headers: opts.headers,
        validateStatus: (status) => status < 500, // Don't throw on 4xx
      };

      const response: AxiosResponse = await axios.get(url, config);

      if (response.status >= 400) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      let data: T;

      switch (opts.parser) {
        case "json":
          data = typeof response.data === "string" ? JSON.parse(response.data) : response.data;
          break;
        case "html":
          data = cheerio.load(response.data) as unknown as T;
          break;
        case "text":
        default:
          data = response.data as T;
      }

      return {
        success: true,
        data,
        source: url,
        timestamp: new Date(),
        retries: attempt,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < (opts.retries || 1) - 1) {
        await setTimeout(opts.retryDelay * (attempt + 1)); // Exponential backoff
      }
    }
  }

  return {
    success: false,
    error: lastError?.message || "Unknown error",
    source: url,
    timestamp: new Date(),
    retries: opts.retries || 1,
  };
}

/**
 * Try multiple sources in parallel, return first successful result
 */
export async function fetchWithFallback<T>(
  sources: { name: string; url: string; options?: FetchOptions }[],
  options: FetchOptions = {},
): Promise<ScrapingResult<T>> {
  // Try all sources in parallel
  const promises = sources.map(async (source) => {
    const result = await fetchWithRetry<T>(source.url, { ...options, ...source.options });
    return { ...result, source: source.name };
  });

  const results = await Promise.all(promises);

  // Return first successful result
  const success = results.find((r) => r.success);
  if (success) {
    return success;
  }

  // All failed, return first error
  return {
    success: false,
    error: `All sources failed: ${results.map((r) => `${r.source}: ${r.error}`).join(", ")}`,
    source: "fallback-chain",
    timestamp: new Date(),
    retries: results.reduce((sum, r) => sum + r.retries, 0),
  };
}

/**
 * Sequential fallback - try sources one by one until success
 */
export async function fetchSequentialFallback<T>(
  sources: { name: string; url: string; options?: FetchOptions }[],
  options: FetchOptions = {},
): Promise<ScrapingResult<T>> {
  let totalRetries = 0;

  for (const source of sources) {
    const result = await fetchWithRetry<T>(source.url, { ...options, ...source.options });
    totalRetries += result.retries;

    if (result.success) {
      return { ...result, source: source.name };
    }

    // Small delay between sources
    await setTimeout(500);
  }

  return {
    success: false,
    error: `All ${sources.length} sources failed`,
    source: "sequential-fallback",
    timestamp: new Date(),
    retries: totalRetries,
  };
}

/**
 * Parse HTML table to array of objects
 */
export function parseTable($: cheerio.CheerioAPI, selector: string): Record<string, string>[] {
  const rows: Record<string, string>[] = [];
  const headers: string[] = [];

  $(selector)
    .find("tr")
    .each((i, row) => {
      if (i === 0) {
        // Header row
        $(row)
          .find("th, td")
          .each((_, cell) => {
            headers.push($(cell).text().trim().toLowerCase().replace(/\s+/g, "_"));
          });
      } else {
        // Data row
        const rowData: Record<string, string> = {};
        $(row)
          .find("td")
          .each((j, cell) => {
            if (headers[j]) {
              rowData[headers[j]] = $(cell).text().trim();
            }
          });
        if (Object.keys(rowData).length > 0) {
          rows.push(rowData);
        }
      }
    });

  return rows;
}

/**
 * Extract numbers from text (removes $, %, commas)
 */
export function extractNumber(text: string): number | null {
  const cleaned = text
    .replace(/[$,]/g, "")
    .replace(/%/g, "")
    .replace(/[KMGT]$/i, "") // Remove suffixes like K, M, B, T
    .trim();

  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/**
 * Extract volume with suffix (K=1e3, M=1e6, B=1e9, T=1e12)
 */
export function extractVolume(text: string): number | null {
  const match = text.match(/([\d,.]+)\s*([KMGT]?)/i);
  if (!match) return null;

  let num = parseFloat(match[1].replace(/,/g, ""));
  const suffix = match[2].toUpperCase();

  const multipliers: Record<string, number> = {
    K: 1e3,
    M: 1e6,
    B: 1e9,
    T: 1e12,
  };

  if (suffix && multipliers[suffix]) {
    num *= multipliers[suffix];
  }

  return num;
}

/**
 * Rate limiter for scraping
 */
export class RateLimiter {
  private lastRequest: number = 0;
  private minDelay: number;

  constructor(requestsPerSecond: number = 2) {
    this.minDelay = 1000 / requestsPerSecond;
  }

  async wait(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequest;

    if (elapsed < this.minDelay) {
      await setTimeout(this.minDelay - elapsed);
    }

    this.lastRequest = Date.now();
  }
}

/**
 * Cache for scraped data
 */
export class ScrapingCache {
  private cache: Map<string, { data: unknown; timestamp: number; ttl: number }> = new Map();

  set<T>(key: string, data: T, ttlMs: number = 60000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  clear(): void {
    this.cache.clear();
  }
}

// Global cache instance
export const globalCache = new ScrapingCache();
