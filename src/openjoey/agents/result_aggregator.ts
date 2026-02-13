/**
 * Result Aggregator for OpenJoey Multi-Agent System
 * Rule 3: Merges results from multiple specialized agents
 */

import type { BusJobResult } from "../internal_bus/types.js";

export type AggregatedResult = {
  success: boolean;
  data: Record<string, unknown>;
  sources: string[];
  confidence: number;
  timestamp: string;
  errors: string[];
};

/**
 * Aggregate results from multiple agents
 * Merges data and calculates confidence score
 */
export function aggregateResults(results: BusJobResult[]): AggregatedResult {
  const errors: string[] = [];
  const data: Record<string, unknown> = {};
  const sources: string[] = [];
  let successCount = 0;

  for (const result of results) {
    // Track source
    if (result.output && typeof result.output === "object" && "source" in result.output) {
      sources.push(String(result.output.source));
    }

    if (result.status === "ok" && result.output) {
      successCount++;

      // Merge output data
      if (typeof result.output === "object" && result.output !== null) {
        Object.assign(data, result.output);
      }
    } else if (result.status === "error" && result.error) {
      errors.push(result.error);
    }
  }

  // Calculate confidence based on success rate
  const totalResults = results.length;
  const confidence = totalResults > 0 ? successCount / totalResults : 0;

  return {
    success: confidence > 0.5, // Success if >50% of agents succeeded
    data,
    sources: [...new Set(sources)], // Deduplicate sources
    confidence,
    timestamp: new Date().toISOString(),
    errors,
  };
}

/**
 * Merge crypto data from multiple sources
 */
export function mergeCryptoData(
  results: Array<{
    source: string;
    prices: Array<{ symbol: string; price: number; change24h?: number }>;
  }>,
): Map<string, { price: number; change24h?: number; sources: string[] }> {
  const merged = new Map<string, { price: number; change24h?: number; sources: string[] }>();

  for (const result of results) {
    for (const priceData of result.prices) {
      const existing = merged.get(priceData.symbol);

      if (!existing) {
        merged.set(priceData.symbol, {
          price: priceData.price,
          change24h: priceData.change24h,
          sources: [result.source],
        });
      } else {
        // Average the price
        existing.price = (existing.price + priceData.price) / 2;
        if (priceData.change24h !== undefined && existing.change24h !== undefined) {
          existing.change24h = (existing.change24h + priceData.change24h) / 2;
        }
        existing.sources.push(result.source);
      }
    }
  }

  return merged;
}

/**
 * Merge news/sentiment data
 */
export function mergeSentimentData(
  results: Array<{ source: string; sentiment: "positive" | "negative" | "neutral"; score: number }>,
): { overall: "positive" | "negative" | "neutral"; averageScore: number; sources: string[] } {
  if (results.length === 0) {
    return { overall: "neutral", averageScore: 0, sources: [] };
  }

  const totalScore = results.reduce((sum, r) => sum + r.score, 0);
  const averageScore = totalScore / results.length;

  // Determine overall sentiment
  let overall: "positive" | "negative" | "neutral";
  if (averageScore > 0.2) overall = "positive";
  else if (averageScore < -0.2) overall = "negative";
  else overall = "neutral";

  return {
    overall,
    averageScore,
    sources: results.map((r) => r.source),
  };
}

/**
 * Create formatted output for delivery
 */
export function formatForDelivery(result: AggregatedResult): string {
  if (!result.success) {
    return `❌ Analysis failed. Errors: ${result.errors.join("; ") || "Unknown error"}`;
  }

  const sections: string[] = [];

  // Add data sections
  for (const [key, value] of Object.entries(result.data)) {
    if (key === "prices" && Array.isArray(value)) {
      sections.push(
        `📊 Prices:\n${value.map((p: unknown) => `  • ${(p as { symbol: string; price: number }).symbol}: $${(p as { price: number }).price.toFixed(2)}`).join("\n")}`,
      );
    } else if (key === "sentiment") {
      sections.push(`💭 Sentiment: ${String(value)}`);
    } else if (key === "trending") {
      sections.push(`🔥 Trending: ${String(value)}`);
    } else {
      sections.push(`${key}: ${JSON.stringify(value)}`);
    }
  }

  // Add metadata
  sections.push(`\n📈 Confidence: ${(result.confidence * 100).toFixed(0)}%`);
  sections.push(`🕐 ${new Date(result.timestamp).toLocaleString()}`);

  return sections.join("\n\n");
}
