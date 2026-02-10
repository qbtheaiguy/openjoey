/**
 * OpenJoey Token Extraction
 *
 * Extracts a token/stock symbol from a user's message for the
 * "Add to watchlist?" prompt (post-reply trigger).
 *
 * Matches common patterns:
 *   - Bare ticker: "SOL", "BONK", "AAPL"
 *   - "Check SOL", "check bonk"
 *   - "What's up with SOL", "how is AAPL doing"
 *   - "Analyze NVDA", "deep dive BTC"
 *
 * Returns the uppercase symbol or null if no token-like pattern found.
 */

// Common patterns where a symbol appears
const CHECK_PATTERNS = [
  /^(?:check|analyze|analyse|lookup|look up|search)\s+([A-Za-z]{1,10})$/i,
  /^(?:what'?s?\s+(?:up\s+with|happening\s+with|going\s+on\s+with))\s+([A-Za-z]{1,10})$/i,
  /^(?:how\s+is)\s+([A-Za-z]{1,10})\s+(?:doing|looking|performing)?$/i,
  /^(?:deep\s+dive|dd)\s+([A-Za-z]{1,10})$/i,
  /^(?:price\s+(?:of|for))\s+([A-Za-z]{1,10})$/i,
];

// Bare ticker: 1–6 uppercase letters (or mixed case), standing alone
const BARE_TICKER = /^([A-Za-z]{1,6})$/;

// Words that look like tickers but aren't (common English words, bot commands)
const STOP_WORDS = new Set([
  "hi",
  "hey",
  "hello",
  "thanks",
  "thank",
  "ok",
  "okay",
  "yes",
  "no",
  "help",
  "start",
  "stop",
  "cancel",
  "menu",
  "back",
  "more",
  "the",
  "what",
  "how",
  "why",
  "when",
  "where",
  "who",
  "please",
  "can",
  "will",
  "just",
  "get",
  "set",
  "alert",
  "show",
  "list",
  "add",
  "use",
  "run",
  "find",
  "tell",
  "give",
  "make",
  "market",
  "overview",
]);

/**
 * Try to extract a single token symbol from a user message.
 * Returns uppercase symbol or null.
 */
export function extractTokenSymbol(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length > 60) return null;

  // Try structured patterns first
  for (const pattern of CHECK_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match?.[1]) {
      const symbol = match[1].toUpperCase();
      if (!STOP_WORDS.has(symbol.toLowerCase())) {
        return symbol;
      }
    }
  }

  // Try bare ticker (single word, 1–6 letters)
  const bareMatch = trimmed.match(BARE_TICKER);
  if (bareMatch?.[1]) {
    const symbol = bareMatch[1].toUpperCase();
    if (!STOP_WORDS.has(symbol.toLowerCase()) && symbol.length >= 2) {
      return symbol;
    }
  }

  return null;
}
