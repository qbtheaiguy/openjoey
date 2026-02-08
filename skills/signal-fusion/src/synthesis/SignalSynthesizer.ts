/**
 * Signal Synthesizer - Aggregates signals into trade setups
 * Combines all processor outputs into actionable intelligence
 */

import { EdgeCalculator } from "../processors/EdgeCalculator.js";
import { PatternMatch } from "../processors/PatternMatcher.js";
import {
  Signal,
  EdgeCalculation,
  TradeSetup,
  SensorData,
  SignalFusionOutput,
} from "../types/index.js";

export interface SynthesisInputs {
  asset: string;
  marketType: "crypto" | "stock" | "forex" | "commodity" | "penny";
  sensorData: SensorData;
  signals: Signal[];
  patternMatch?: PatternMatch;
}

export class SignalSynthesizer {
  private edgeCalculator: EdgeCalculator;

  constructor() {
    this.edgeCalculator = new EdgeCalculator();
  }

  /**
   * Synthesize all inputs into final trade setup
   */
  synthesize(inputs: SynthesisInputs): {
    edge: EdgeCalculation;
    tradeSetup: TradeSetup;
    summary: string;
  } {
    const { asset, marketType, sensorData, signals, patternMatch } = inputs;

    if (!sensorData.price?.price) {
      throw new Error("Price data required for synthesis");
    }

    const currentPrice = sensorData.price.price;

    // 1. Calculate edge
    const edge = this.edgeCalculator.calculateEdge({
      signals,
      patternMatch,
      currentPrice,
      marketType,
    });

    // 2. Construct trade setup
    const tradeSetup = this.edgeCalculator.constructTrade(edge, currentPrice, asset, marketType);

    // 3. Generate summary
    const summary = this.generateSummary(edge, tradeSetup, signals.length);

    return {
      edge,
      tradeSetup,
      summary,
    };
  }

  /**
   * Generate human-readable summary
   */
  private generateSummary(edge: EdgeCalculation, trade: TradeSetup, signalCount: number): string {
    const parts: string[] = [];

    // Edge summary
    parts.push(`Edge: ${edge.expectedValue > 0 ? "+" : ""}${edge.expectedValue.toFixed(2)}% EV`);
    parts.push(`Win Rate: ${(edge.winRate * 100).toFixed(0)}%`);
    parts.push(`R/R: 1:${edge.riskReward.toFixed(1)}`);

    // Trade summary
    parts.push(`${trade.direction.toUpperCase()} ${trade.asset}`);
    parts.push(`Entry: $${trade.entry.min.toFixed(2)}-$${trade.entry.max.toFixed(2)}`);
    parts.push(
      `Stop: $${trade.stopLoss.toFixed(2)} (${((1 - trade.stopLoss / trade.entry.optimal) * 100).toFixed(1)}%)`,
    );
    parts.push(`Size: ${trade.position.portfolioPercent.toFixed(1)}% portfolio`);

    // Signals
    parts.push(`Based on ${signalCount} signals`);

    // Urgency
    parts.push(`${trade.entry.urgency.toUpperCase()} execution`);

    return parts.join(" | ");
  }

  /**
   * Format output for different channels
   */
  formatForChannel(
    output: SignalFusionOutput,
    channel: "cli" | "discord" | "telegram" | "slack",
  ): string {
    switch (channel) {
      case "cli":
        return this.formatForCLI(output);
      case "discord":
        return this.formatForDiscord(output);
      case "telegram":
        return this.formatForTelegram(output);
      case "slack":
        return this.formatForSlack(output);
      default:
        return this.formatForCLI(output);
    }
  }

  private formatForCLI(output: SignalFusionOutput): string {
    const { signalSwarm, finalVerdict } = output;
    const { edge, tradeSetup } = signalSwarm;

    let text = "";
    text += "🧠 SIGNAL-FUSION ANALYSIS\n";
    text += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

    text += `Asset: ${output.query}\n`;
    text += `Time: ${output.timestamp.toISOString()}\n\n`;

    text += "📊 QUANTIFIED EDGE\n";
    text += `  Expected Value: ${edge.expectedValue > 0 ? "+" : ""}${edge.expectedValue.toFixed(2)}%\n`;
    text += `  Win Rate: ${(edge.winRate * 100).toFixed(0)}%\n`;
    text += `  Risk/Reward: 1:${edge.riskReward.toFixed(1)}\n`;
    text += `  Conviction: ${edge.convictionScore.toFixed(1)}/10\n`;
    text += `  Edge Half-Life: ${edge.halfLife}h\n\n`;

    text += "🎯 TRADE SETUP\n";
    text += `  Direction: ${tradeSetup.direction.toUpperCase()}\n`;
    text += `  Entry Zone: $${tradeSetup.entry.min.toFixed(2)} - $${tradeSetup.entry.max.toFixed(2)}\n`;
    text += `  Stop Loss: $${tradeSetup.stopLoss.toFixed(2)}\n`;
    text += `  Position Size: ${tradeSetup.position.portfolioPercent.toFixed(1)}%\n`;
    text += `  Max Hold: ${tradeSetup.maxHoldTime}h\n\n`;

    if (tradeSetup.warnings.length > 0) {
      text += "⚠️  WARNINGS\n";
      tradeSetup.warnings.forEach((w) => {
        text += `  • ${w}\n`;
      });
      text += "\n";
    }

    text += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    text += `Verdict: ${finalVerdict.recommendation.toUpperCase()} (${finalVerdict.conviction.toFixed(0)}% conviction)\n`;

    return text;
  }

  private formatForDiscord(output: SignalFusionOutput): string {
    // Discord embed format (simplified text version)
    return this.formatForCLI(output); // Will be enhanced with actual Discord embeds later
  }

  private formatForTelegram(output: SignalFusionOutput): string {
    // Compact format for mobile
    const { signalSwarm } = output;
    const { edge, tradeSetup } = signalSwarm;

    return `
🧠 <b>${output.query}</b>

📊 EV: ${edge.expectedValue > 0 ? "+" : ""}${edge.expectedValue.toFixed(2)}% | Win: ${(edge.winRate * 100).toFixed(0)}% | RR: 1:${edge.riskReward.toFixed(1)}

🎯 ${tradeSetup.direction.toUpperCase()} @ $${tradeSetup.entry.optimal.toFixed(2)}
⛔ Stop: $${tradeSetup.stopLoss.toFixed(2)}
📏 Size: ${tradeSetup.position.portfolioPercent.toFixed(1)}%
    `.trim();
  }

  private formatForSlack(output: SignalFusionOutput): string {
    // Slack mrkdwn format
    return this.formatForCLI(output); // Will be enhanced with Slack blocks later
  }
}
