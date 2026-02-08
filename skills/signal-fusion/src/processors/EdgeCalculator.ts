/**
 * Edge Calculator - Calculates quantified edge using Bayesian inference
 * Computes win rate, risk/reward, expected value
 */

import {
  Signal,
  EdgeCalculation,
  TradeSetup,
  EntryZone,
  Target,
  PositionSizing,
  Scenarios,
} from "../types/index.js";
import { PatternMatch } from "./PatternMatcher.js";

export interface EdgeInputs {
  signals: Signal[];
  patternMatch?: PatternMatch;
  currentPrice: number;
  atr?: number; // Average True Range for volatility
  marketType: "crypto" | "stock" | "forex" | "commodity" | "penny";
}

export class EdgeCalculator {
  /**
   * Calculate complete edge analysis
   */
  calculateEdge(inputs: EdgeInputs): EdgeCalculation {
    const { signals, patternMatch, currentPrice, atr, marketType } = inputs;

    // 1. Calculate base win rate from signals
    const baseWinRate = this.calculateBaseWinRate(signals);

    // 2. Apply Bayesian update from pattern match
    const posteriorWinRate = patternMatch
      ? this.bayesianUpdate(baseWinRate, patternMatch)
      : baseWinRate;

    // 3. Calculate risk/reward
    const riskReward = this.calculateRiskReward(signals, currentPrice, atr, marketType);

    // 4. Calculate expected value
    const lossRate = 1 - posteriorWinRate;
    const expectedValue =
      posteriorWinRate * riskReward.avgWin - lossRate * Math.abs(riskReward.avgLoss);

    // 5. Calculate conviction score
    const convictionScore = this.calculateConviction(signals, patternMatch, expectedValue);

    // 6. Estimate edge half-life
    const halfLife = this.calculateHalfLife(signals, marketType);

    return {
      winRate: posteriorWinRate,
      avgWin: riskReward.avgWin,
      avgLoss: riskReward.avgLoss,
      riskReward: riskReward.ratio,
      expectedValue,
      edgeExists: expectedValue > 0,
      convictionScore,
      halfLife,
    };
  }

  /**
   * Calculate base win rate from signal aggregation
   */
  private calculateBaseWinRate(signals: Signal[]): number {
    if (signals.length === 0) return 0.5; // Neutral

    // Weight signals by confidence and strength
    let totalWeight = 0;
    let weightedBullish = 0;

    for (const signal of signals) {
      const weight = signal.confidence * signal.strength;
      totalWeight += weight;

      if (signal.direction === "bullish") {
        weightedBullish += weight;
      } else if (signal.direction === "bearish") {
        weightedBullish -= weight;
      }
    }

    // Convert to probability (0-1)
    const rawScore = weightedBullish / totalWeight; // -1 to 1
    return 0.5 + rawScore * 0.3; // Scale to 0.2-0.8 range
  }

  /**
   * Bayesian update: P(Win|Pattern) = P(Pattern|Win) * P(Win) / P(Pattern)
   */
  private bayesianUpdate(priorWinRate: number, patternMatch: PatternMatch): number {
    const pattern = patternMatch.pattern;

    // Prior probability of win
    const pWin = priorWinRate;
    const pLoss = 1 - pWin;

    // Likelihood: P(Pattern|Win) based on historical data
    const pPatternGivenWin =
      pattern.historicalWins / (pattern.historicalWins + pattern.historicalLosses);
    const pPatternGivenLoss = 1 - pPatternGivenWin;

    // Total probability of pattern
    const pPattern = pPatternGivenWin * pWin + pPatternGivenLoss * pLoss;

    // Posterior
    const pWinGivenPattern = (pPatternGivenWin * pWin) / pPattern;

    // Blend with match score (higher match = more weight on pattern)
    const blendFactor = patternMatch.matchScore;
    return priorWinRate * (1 - blendFactor) + pWinGivenPattern * blendFactor;
  }

  /**
   * Calculate risk/reward metrics
   */
  private calculateRiskReward(
    signals: Signal[],
    currentPrice: number,
    atr: number = currentPrice * 0.05,
    marketType: string,
  ): { avgWin: number; avgLoss: number; ratio: number } {
    // Base win/loss percentages by market type
    const marketMultipliers: Record<string, { win: number; loss: number }> = {
      crypto: { win: 0.25, loss: 0.08 },
      stock: { win: 0.15, loss: 0.05 },
      forex: { win: 0.02, loss: 0.01 },
      commodity: { win: 0.1, loss: 0.04 },
      penny: { win: 0.5, loss: 0.2 },
    };

    const multipliers = marketMultipliers[marketType] || marketMultipliers["stock"];

    // Adjust based on signal strength
    const avgSignalStrength =
      signals.length > 0 ? signals.reduce((sum, s) => sum + s.strength, 0) / signals.length : 5;

    const strengthFactor = avgSignalStrength / 5;

    const avgWin = multipliers.win * strengthFactor * 100;
    const avgLoss = multipliers.loss * strengthFactor * 100;
    const ratio = avgWin / avgLoss;

    return { avgWin, avgLoss, ratio };
  }

  /**
   * Calculate conviction score (0-10)
   */
  private calculateConviction(
    signals: Signal[],
    patternMatch: PatternMatch | undefined,
    expectedValue: number,
  ): number {
    let score = 5; // Base

    // Signal diversity bonus
    const uniqueTypes = new Set(signals.map((s) => s.type)).size;
    score += uniqueTypes * 0.5;

    // Pattern match bonus
    if (patternMatch) {
      score += patternMatch.matchScore * 2;
    }

    // Expected value contribution
    score += expectedValue * 0.5;

    return Math.min(10, Math.max(0, score));
  }

  /**
   * Estimate edge half-life in hours
   */
  private calculateHalfLife(signals: Signal[], marketType: string): number {
    const baseHalfLives: Record<string, number> = {
      crypto: 24,
      stock: 72,
      forex: 12,
      commodity: 48,
      penny: 168,
    };

    let halfLife = baseHalfLives[marketType] || 48;

    // Adjust based on signal types
    const hasSocial = signals.some((s) => s.type === "social_sentiment");
    const hasWhale = signals.some((s) => s.type === "whale_movement");
    const hasNews = signals.some((s) => s.type === "news_catalyst");

    if (hasSocial) halfLife *= 0.7; // Social signals decay fast
    if (hasWhale) halfLife *= 1.2; // Whale signals last longer
    if (hasNews) halfLife *= 0.8; // News-driven moves fade

    return Math.round(halfLife);
  }

  /**
   * Construct trade setup from edge calculation
   */
  constructTrade(
    edge: EdgeCalculation,
    currentPrice: number,
    asset: string,
    marketType: string,
  ): TradeSetup {
    const direction = edge.expectedValue > 0 ? "long" : "short";

    // Calculate entry zone
    const entry = this.calculateEntryZone(currentPrice, edge.convictionScore);

    // Calculate stop loss
    const stopLoss = this.calculateStopLoss(currentPrice, edge, marketType);

    // Calculate targets
    const targets = this.calculateTargets(currentPrice, stopLoss, edge);

    // Position sizing
    const position = this.calculatePositionSizing(edge);

    // Scenarios
    const scenarios = this.buildScenarios(currentPrice, targets, edge);

    return {
      asset,
      direction,
      entry,
      stopLoss,
      targets,
      position,
      scenarios,
      maxHoldTime: edge.halfLife * 2, // Hold until edge decays
      warnings: this.generateWarnings(edge, marketType),
    };
  }

  private calculateEntryZone(currentPrice: number, conviction: number): EntryZone {
    const spread = 0.02; // 2% entry zone

    return {
      min: currentPrice * (1 - spread),
      max: currentPrice * (1 + spread * 0.5),
      optimal: currentPrice,
      urgency: conviction > 7 ? "immediate" : conviction > 4 ? "soon" : "patient",
    };
  }

  private calculateStopLoss(
    currentPrice: number,
    edge: EdgeCalculation,
    marketType: string,
  ): number {
    // Stop based on average loss expectation
    const stopPercent = edge.avgLoss / 100;
    return currentPrice * (1 - stopPercent);
  }

  private calculateTargets(
    currentPrice: number,
    stopLoss: number,
    edge: EdgeCalculation,
  ): Target[] {
    const targets: Target[] = [];
    const risk = currentPrice - stopLoss;

    // Target 1: 2:1 reward/risk
    targets.push({
      price: currentPrice + risk * 2,
      percentage: 50,
      probability: edge.winRate * 0.9,
      action: "take_profit",
    });

    // Target 2: 4:1 reward/risk
    targets.push({
      price: currentPrice + risk * 4,
      percentage: 30,
      probability: edge.winRate * 0.6,
      action: "take_profit",
    });

    // Target 3: 6:1 reward/risk (moonshot)
    targets.push({
      price: currentPrice + risk * 6,
      percentage: 20,
      probability: edge.winRate * 0.3,
      action: "hold",
    });

    return targets;
  }

  private calculatePositionSizing(edge: EdgeCalculation): PositionSizing {
    // Kelly Criterion: f* = (bp - q) / b
    // where b = odds, p = win rate, q = loss rate
    const b = edge.riskReward;
    const p = edge.winRate;
    const q = 1 - p;

    const kelly = (b * p - q) / b;
    const kellyFraction = Math.max(0, Math.min(0.25, kelly * 0.5)); // Half Kelly, max 25%

    return {
      portfolioPercent: kellyFraction * 100,
      maxRiskPercent: 2, // Max 2% risk per trade
      kellyFraction,
      confidence: edge.convictionScore / 10,
    };
  }

  private buildScenarios(
    currentPrice: number,
    targets: Target[],
    edge: EdgeCalculation,
  ): Scenarios {
    return {
      bull: {
        probability: edge.winRate * 0.4,
        priceTarget: targets[targets.length - 1]?.price || currentPrice * 1.2,
        timeline: `${Math.round(edge.halfLife)}h`,
        catalysts: ["Momentum continues", "Volume sustains", "Breakout confirmed"],
      },
      base: {
        probability: edge.winRate,
        priceTarget: targets[0]?.price || currentPrice * 1.1,
        timeline: `${Math.round(edge.halfLife * 0.7)}h`,
        catalysts: ["Normal price action", "Expected scenario"],
      },
      bear: {
        probability: 1 - edge.winRate,
        priceTarget: currentPrice * 0.9,
        timeline: `${Math.round(edge.halfLife * 0.5)}h`,
        catalysts: ["Failed breakout", "Support lost", "Reversal"],
      },
    };
  }

  private generateWarnings(edge: EdgeCalculation, marketType: string): string[] {
    const warnings: string[] = [];

    if (edge.winRate < 0.5) {
      warnings.push("Win rate below 50% - coin flip odds");
    }

    if (edge.expectedValue < 2) {
      warnings.push("Low expected value - small edge");
    }

    if (marketType === "penny" || marketType === "crypto") {
      warnings.push("High volatility asset - use tight stops");
    }

    if (edge.halfLife < 12) {
      warnings.push("Fast edge decay - requires quick execution");
    }

    return warnings;
  }
}
