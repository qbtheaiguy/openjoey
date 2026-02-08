/**
 * Pattern Matcher - Matches current conditions to historical patterns
 * Tracks win rates and calculates pattern-based probabilities
 */

import { SensorData, Signal } from "../types/index.js";

export interface Pattern {
  id: string;
  name: string;
  description: string;
  conditions: PatternCondition[];
  historicalWins: number;
  historicalLosses: number;
  avgReturn: number;
  maxDrawdown: number;
  avgHoldTime: number; // Hours
}

export interface PatternCondition {
  field: string;
  operator: "gt" | "lt" | "eq" | "gte" | "lte" | "contains";
  value: number | string | boolean;
  weight: number;
}

export interface PatternMatch {
  pattern: Pattern;
  matchScore: number; // 0-1
  matchedConditions: number;
  totalConditions: number;
}

// Built-in patterns for common setups
const BUILT_IN_PATTERNS: Pattern[] = [
  {
    id: "breakout-volume",
    name: "Breakout with Volume",
    description: "Price breaking resistance with 3x+ volume spike",
    conditions: [
      { field: "price.change24h", operator: "gt", value: 5, weight: 0.3 },
      { field: "price.volume24h", operator: "gt", value: 1000000, weight: 0.3 },
      { field: "social.sentimentScore", operator: "gt", value: 0.2, weight: 0.2 },
      { field: "whale.netFlow24h", operator: "gt", value: 50000, weight: 0.2 },
    ],
    historicalWins: 68,
    historicalLosses: 32,
    avgReturn: 23.5,
    maxDrawdown: -8.2,
    avgHoldTime: 72,
  },
  {
    id: "accumulation-whale",
    name: "Whale Accumulation",
    description: "Large holders accumulating over 7 days",
    conditions: [
      { field: "whale.accumulationScore", operator: "gt", value: 5, weight: 0.4 },
      { field: "price.change24h", operator: "lt", value: 3, weight: 0.2 },
      { field: "onchain.holderConcentration", operator: "lt", value: 0.7, weight: 0.2 },
      { field: "social.sentimentScore", operator: "lt", value: 0.5, weight: 0.2 },
    ],
    historicalWins: 72,
    historicalLosses: 28,
    avgReturn: 31.2,
    maxDrawdown: -12.5,
    avgHoldTime: 168,
  },
  {
    id: "sentiment-reversal",
    name: "Sentiment Reversal",
    description: "Extreme negative sentiment flipping positive",
    conditions: [
      { field: "social.sentimentScore", operator: "gt", value: 0.5, weight: 0.4 },
      { field: "price.change24h", operator: "gt", value: -5, weight: 0.2 },
      { field: "news.breakingNews", operator: "eq", value: true, weight: 0.2 },
      { field: "volume.spike", operator: "gt", value: 2, weight: 0.2 },
    ],
    historicalWins: 58,
    historicalLosses: 42,
    avgReturn: 18.7,
    maxDrawdown: -15.3,
    avgHoldTime: 48,
  },
  {
    id: "macro-correlation",
    name: "Macro Correlation Play",
    description: "Asset benefiting from macro tailwinds",
    conditions: [
      { field: "macro.riskOnOff", operator: "eq", value: "risk-on", weight: 0.3 },
      { field: "macro.fedPolicy", operator: "eq", value: "dovish", weight: 0.3 },
      { field: "price.change24h", operator: "gt", value: 2, weight: 0.2 },
      { field: "social.sentimentScore", operator: "gt", value: 0, weight: 0.2 },
    ],
    historicalWins: 64,
    historicalLosses: 36,
    avgReturn: 15.3,
    maxDrawdown: -6.8,
    avgHoldTime: 120,
  },
  {
    id: "penny-catalyst",
    name: "Penny Stock Catalyst",
    description: "Low float + upcoming catalyst",
    conditions: [
      { field: "price.price", operator: "lt", value: 5, weight: 0.3 },
      { field: "price.volume24h", operator: "gt", value: 100000, weight: 0.3 },
      { field: "news.catalystDetected", operator: "contains", value: "earnings", weight: 0.2 },
      { field: "social.sentimentScore", operator: "gt", value: 0.3, weight: 0.2 },
    ],
    historicalWins: 45,
    historicalLosses: 55,
    avgReturn: 45.2,
    maxDrawdown: -35.0,
    avgHoldTime: 336,
  },
];

export class PatternMatcher {
  private patterns: Pattern[];

  constructor(customPatterns: Pattern[] = []) {
    this.patterns = [...BUILT_IN_PATTERNS, ...customPatterns];
  }

  /**
   * Match sensor data against all patterns
   */
  matchPatterns(data: SensorData): PatternMatch[] {
    const matches: PatternMatch[] = [];

    for (const pattern of this.patterns) {
      const match = this.evaluatePattern(data, pattern);
      if (match.matchScore > 0.3) {
        // Minimum 30% match
        matches.push(match);
      }
    }

    // Sort by match score descending
    return matches.sort((a, b) => b.matchScore - a.matchScore);
  }

  /**
   * Evaluate single pattern against data
   */
  private evaluatePattern(data: SensorData, pattern: Pattern): PatternMatch {
    let totalWeight = 0;
    let matchedWeight = 0;
    let matchedConditions = 0;

    for (const condition of pattern.conditions) {
      totalWeight += condition.weight;

      const value = this.getFieldValue(data, condition.field);

      if (this.evaluateCondition(value, condition)) {
        matchedWeight += condition.weight;
        matchedConditions++;
      }
    }

    const matchScore = totalWeight > 0 ? matchedWeight / totalWeight : 0;

    return {
      pattern,
      matchScore,
      matchedConditions,
      totalConditions: pattern.conditions.length,
    };
  }

  /**
   * Get nested field value from SensorData
   */
  private getFieldValue(data: SensorData, field: string): unknown {
    const parts = field.split(".");
    let value: unknown = data;

    for (const part of parts) {
      if (value && typeof value === "object") {
        value = (value as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * Evaluate single condition
   */
  private evaluateCondition(value: unknown, condition: PatternCondition): boolean {
    if (value === undefined || value === null) return false;

    switch (condition.operator) {
      case "gt":
        return typeof value === "number" && value > (condition.value as number);
      case "lt":
        return typeof value === "number" && value < (condition.value as number);
      case "gte":
        return typeof value === "number" && value >= (condition.value as number);
      case "lte":
        return typeof value === "number" && value <= (condition.value as number);
      case "eq":
        return value === condition.value;
      case "contains":
        return (
          typeof value === "string" &&
          value.toLowerCase().includes(String(condition.value).toLowerCase())
        );
      default:
        return false;
    }
  }

  /**
   * Convert top pattern match to Signal
   */
  patternToSignal(match: PatternMatch, asset: string): Signal {
    const winRate =
      match.pattern.historicalWins /
      (match.pattern.historicalWins + match.pattern.historicalLosses);

    return {
      id: `pattern-${match.pattern.id}-${Date.now()}`,
      asset,
      type: "pattern_match",
      direction: winRate > 0.5 ? "bullish" : "bearish",
      confidence: match.matchScore * winRate,
      strength: match.matchScore * 10,
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + match.pattern.avgHoldTime * 60 * 60 * 1000),
      data: {
        rawValue: match.matchScore,
        threshold: 0.3,
        deviation: match.matchScore,
        context: `${match.pattern.name}: ${match.matchedConditions}/${match.totalConditions} conditions matched`,
      },
      metadata: {
        source: "pattern_matcher",
        sensor: "pattern",
        validated: false,
        adversarialTests: [],
      },
    };
  }

  /**
   * Add custom pattern
   */
  addPattern(pattern: Pattern): void {
    this.patterns.push(pattern);
  }

  /**
   * Get pattern statistics
   */
  getPatternStats(patternId: string): Pattern | undefined {
    return this.patterns.find((p) => p.id === patternId);
  }

  /**
   * Update pattern with actual result (learning)
   */
  updatePatternResult(patternId: string, won: boolean, return_: number): void {
    const pattern = this.patterns.find((p) => p.id === patternId);
    if (!pattern) return;

    if (won) {
      pattern.historicalWins++;
    } else {
      pattern.historicalLosses++;
    }

    // Update average return using exponential moving average
    pattern.avgReturn = pattern.avgReturn * 0.9 + return_ * 0.1;
  }
}
