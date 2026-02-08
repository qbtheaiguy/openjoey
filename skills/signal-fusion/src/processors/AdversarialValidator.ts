/**
 * Adversarial Validator - Tests signals against counter-arguments
 * KEY INNOVATION: Attack signals before recommending them
 */

import { Signal, AdversarialTest, SensorData } from "../types/index.js";

export interface AdversarialTestCase {
  id: string;
  name: string;
  description: string;
  testFn: (_signal: Signal, data: SensorData) => boolean | undefined;
  explanation: string;
  severity: "critical" | "warning" | "info";
}

// Pre-defined adversarial tests
const ADVERSARIAL_TESTS: AdversarialTestCase[] = [
  {
    id: "bull-trap",
    name: "Bull Trap Test",
    description: "Is this breakout genuine or a trap?",
    testFn: (signal, data) => {
      // Pass if volume confirms OR whale is accumulating
      if (signal.type === "price_action" && signal.direction === "bullish") {
        const volumeConfirmed = data.price?.volume24h && data.price.volume24h > 1000000;
        const whaleAccumulating = data.whale?.accumulationScore && data.whale.accumulationScore > 3;
        return !!(volumeConfirmed || whaleAccumulating);
      }
      return true;
    },
    explanation: "Breakout without volume or whale support often fails",
    severity: "critical",
  },
  {
    id: "whale-manipulation",
    name: "Whale Manipulation Test",
    description: "Are whales actually accumulating or distributing?",
    testFn: (signal, data) => {
      if (signal.type === "whale_movement") {
        // Pass if consistent over 24h, not just one transaction
        const consistentFlow = Math.abs(data.whale?.netFlow24h || 0) > 50000;
        return !!consistentFlow;
      }
      return true;
    },
    explanation: "Single whale transaction may be manipulation, sustained flow is conviction",
    severity: "warning",
  },
  {
    id: "sentiment-peak",
    name: "Sentiment Peak Test",
    description: "Is sentiment already at extreme levels?",
    testFn: (signal, data) => {
      if (signal.type === "social_sentiment") {
        const score = Math.abs(data.social?.sentimentScore || 0);
        return score < 0.8;
      }
      return true;
    },
    explanation: "Extreme sentiment often marks local tops/bottoms",
    severity: "warning",
  },
  {
    id: "liquidity-test",
    name: "Liquidity Depth Test",
    description: "Is there enough liquidity to exit the trade?",
    testFn: (_signal, data) => {
      const liquidity = data.price?.liquidity || data.price?.volume24h || 0;
      // Pass if >$500k liquidity
      return liquidity > 500000;
    },
    explanation: "Low liquidity makes exit difficult, slippage kills edges",
    severity: "critical",
  },
  {
    id: "correlation-break",
    name: "Correlation Break Test",
    description: "Is asset diverging from its usual correlations?",
    testFn: (signal, data) => {
      if (data.macro?.riskOnOff === "risk-off" && signal.direction === "bullish") {
        // In risk-off, bullish signals need extra confirmation
        return signal.strength > 7;
      }
      return true;
    },
    explanation: "Trading against macro trends requires stronger signals",
    severity: "warning",
  },
  {
    id: "late-entry",
    name: "Late Entry Test",
    description: "Has the move already happened?",
    testFn: (signal, data) => {
      if (signal.type === "pattern_match" && data.price?.change24h) {
        // If already up 20%+, might be late
        const change = Math.abs(data.price.change24h);
        return change < 20 || signal.confidence > 0.8;
      }
      return true;
    },
    explanation: "Entering after large moves reduces expected value",
    severity: "info",
  },
  {
    id: "rug-pull",
    name: "Rug Pull Safety Test",
    description: "Basic safety checks for crypto tokens",
    testFn: (_signal, data) => {
      if (data.onchain) {
        return !!(data.onchain?.holderConcentration && data.onchain.holderConcentration < 0.6);
      }
      return true;
    },
    explanation: "High concentration increases rug pull risk",
    severity: "critical",
  },
  {
    id: "news-lag",
    name: "News Lag Test",
    description: "Is the news already priced in?",
    testFn: (signal, data) => {
      if (signal.type === "news_catalyst") {
        const priceChange = Math.abs(data.price?.change24h || 0);
        return priceChange < 5;
      }
      return true;
    },
    explanation: "Markets often price in news quickly",
    severity: "info",
  },
];

export class AdversarialValidator {
  private tests: AdversarialTestCase[];

  constructor(customTests: AdversarialTestCase[] = []) {
    this.tests = [...ADVERSARIAL_TESTS, ...customTests];
  }

  /**
   * Run all adversarial tests on a signal
   */
  validateSignal(
    signal: Signal,
    data: SensorData,
  ): {
    passed: boolean;
    tests: AdversarialTest[];
    criticalFailures: number;
    warnings: number;
  } {
    const results: AdversarialTest[] = [];
    let criticalFailures = 0;
    let warnings = 0;

    for (const test of this.tests) {
      const passed = test.testFn(signal, data);

      results.push({
        test: test.name,
        result: passed ? "pass" : "fail",
        explanation: passed ? "Test passed" : test.explanation,
      });

      if (!passed) {
        if (test.severity === "critical") criticalFailures++;
        if (test.severity === "warning") warnings++;
      }
    }

    // Signal fails if any critical test fails
    const passed = criticalFailures === 0;

    return {
      passed,
      tests: results,
      criticalFailures,
      warnings,
    };
  }

  /**
   * Validate multiple signals
   */
  validateSignals(
    signals: Signal[],
    data: SensorData,
  ): {
    validSignals: Signal[];
    invalidSignals: Signal[];
    summary: string;
  } {
    const validSignals: Signal[] = [];
    const invalidSignals: Signal[] = [];

    for (const signal of signals) {
      const validation = this.validateSignal(signal, data);

      // Update signal with validation results
      signal.metadata.validated = validation.passed;
      signal.metadata.adversarialTests = validation.tests;

      if (validation.passed) {
        validSignals.push(signal);
      } else {
        invalidSignals.push(signal);
      }
    }

    const summary = `Validated ${signals.length} signals: ${validSignals.length} passed, ${invalidSignals.length} failed (${invalidSignals.filter((s) => s.metadata.adversarialTests.filter((t) => t.result === "fail").some((t) => t.explanation.includes("critical"))).length} critical)`;

    return {
      validSignals,
      invalidSignals,
      summary,
    };
  }

  /**
   * Get defense for a failed test
   */
  getDefense(signal: Signal, testId: string): string {
    const defenses: Record<string, Record<string, string>> = {
      "bull-trap": {
        whale_movement: "Whale accumulation confirms this is not a trap",
        volume_anomaly: "Volume spike validates the breakout",
        pattern_match: "Historical pattern has high win rate despite volume",
      },
      "sentiment-peak": {
        whale_movement: "Smart money is still accumulating despite public euphoria",
        on_chain: "On-chain metrics show sustainable growth",
      },
      "late-entry": {
        whale_movement: "Whales are just starting to accumulate",
        news_catalyst: "News catalyst just announced, first mover advantage",
      },
    };

    const testDefenses = defenses[testId];
    if (!testDefenses) return "No specific defense available";

    return testDefenses[signal.type] || "Signal context suggests this concern may be overstated";
  }

  /**
   * Add custom adversarial test
   */
  addTest(test: AdversarialTestCase): void {
    this.tests.push(test);
  }

  /**
   * Get validation report
   */
  generateReport(signal: Signal): string {
    const tests = signal.metadata.adversarialTests;
    const passed = tests.filter((t) => t.result === "pass").length;
    const failed = tests.filter((t) => t.result === "fail").length;

    let report = `Adversarial Validation Report\n`;
    report += `=============================\n`;
    report += `Signal: ${signal.type} (${signal.direction})\n`;
    report += `Status: ${signal.metadata.validated ? "VALIDATED" : "FAILED"}\n`;
    report += `Tests: ${passed}/${tests.length} passed\n\n`;

    if (failed > 0) {
      report += `Failed Tests:\n`;
      tests
        .filter((t) => t.result === "fail")
        .forEach((t) => {
          report += `  ❌ ${t.test}: ${t.explanation}\n`;
        });
    }

    return report;
  }
}
