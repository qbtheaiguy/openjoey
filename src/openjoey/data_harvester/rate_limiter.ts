/**
 * Sliding-window Rate Limiter for OpenJoey Data Harvester
 * Rule 4: Rate limiting to avoid API bans and respect free tier limits
 */

type RateLimitEntry = {
  requests: number[]; // Timestamps of requests
};

const windows = new Map<string, RateLimitEntry>();

export type RateLimiterOptions = {
  maxRequests: number; // Max requests per window
  windowMs: number; // Window size in milliseconds
};

/**
 * Create a rate limiter for a specific domain
 */
export function createRateLimiter(options: RateLimiterOptions) {
  const { maxRequests, windowMs } = options;

  return {
    /**
     * Try to acquire a rate limit slot
     * Returns true if request is allowed, false if rate limited
     */
    async tryAcquire(): Promise<boolean> {
      const now = Date.now();
      const windowKey = `default`; // Could be per-domain or per-endpoint

      let entry = windows.get(windowKey);
      if (!entry) {
        entry = { requests: [] };
        windows.set(windowKey, entry);
      }

      // Remove old requests outside the window
      const cutoff = now - windowMs;
      entry.requests = entry.requests.filter((ts) => ts > cutoff);

      // Check if we can make a request
      if (entry.requests.length >= maxRequests) {
        return false;
      }

      // Record this request
      entry.requests.push(now);
      return true;
    },

    /**
     * Get current rate limit status
     */
    getStatus(): { remaining: number; resetMs: number; totalInWindow: number } {
      const now = Date.now();
      const windowKey = `default`;
      const entry = windows.get(windowKey);

      if (!entry) {
        return { remaining: maxRequests, resetMs: 0, totalInWindow: 0 };
      }

      const cutoff = now - windowMs;
      const validRequests = entry.requests.filter((ts) => ts > cutoff);
      const oldestRequest = validRequests[0];

      return {
        remaining: Math.max(0, maxRequests - validRequests.length),
        resetMs: oldestRequest ? windowMs - (now - oldestRequest) : 0,
        totalInWindow: validRequests.length,
      };
    },

    /**
     * Wait until a slot is available
     */
    async waitForSlot(): Promise<void> {
      while (!(await this.tryAcquire())) {
        const status = this.getStatus();
        const waitMs = Math.max(100, status.resetMs / (status.remaining + 1));
        await new Promise((r) => setTimeout(r, waitMs));
      }
    },
  };
}

/**
 * Domain-specific rate limiters with sensible defaults
 */
export const domainRateLimiters: Record<string, ReturnType<typeof createRateLimiter>> = {
  // CoinGecko free tier: 50 calls/min, 10K calls/month
  coingecko: createRateLimiter({ maxRequests: 50, windowMs: 60000 }),

  // Yahoo Finance (unofficial): be conservative
  yahoo: createRateLimiter({ maxRequests: 30, windowMs: 60000 }),

  // FRED API: 120 calls/min for free tier
  fred: createRateLimiter({ maxRequests: 100, windowMs: 60000 }),

  // Generic scraper rate limit
  scraper: createRateLimiter({ maxRequests: 20, windowMs: 60000 }),
};

/**
 * Get or create rate limiter for a domain
 */
export function getRateLimiter(domain: string): ReturnType<typeof createRateLimiter> {
  return domainRateLimiters[domain] ?? domainRateLimiters.scraper;
}
