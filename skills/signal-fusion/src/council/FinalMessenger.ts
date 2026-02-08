/**
 * Final Messenger - Synthesizes Trading Council output with Signal Swarm data
 * Creates the final user-facing response
 */

import {
  SignalFusionOutput,
  CouncilOpinion,
  EdgeCalculation,
  TradeSetup,
  Signal,
} from "../types/index.js";

export interface FinalMessengerInput {
  query: string;
  asset: string;
  marketType: string;
  edge: EdgeCalculation;
  tradeSetup: TradeSetup;
  signals: Signal[];
  marketOpinion?: CouncilOpinion;
  skillOpinions: CouncilOpinion[];
  processingTime: number;
}

export class FinalMessenger {
  /**
   * Synthesize final output
   */
  synthesize(input: FinalMessengerInput): SignalFusionOutput {
    const { query, edge, tradeSetup, signals, marketOpinion, skillOpinions, processingTime } =
      input;

    // Calculate consensus
    const allOpinions = marketOpinion ? [marketOpinion, ...skillOpinions] : skillOpinions;
    const consensus = this.calculateConsensus(allOpinions);

    // Determine final recommendation
    const finalVerdict = this.determineVerdict(edge, consensus, allOpinions);

    return {
      query,
      timestamp: new Date(),
      signalSwarm: {
        edge,
        signals,
        tradeSetup,
      },
      tradingCouncil: {
        debate: [
          {
            round: 1,
            opinions: allOpinions,
            challenges: [],
            consensus: consensus.score,
          },
        ],
        consensus: consensus.score,
        majorityOpinion: consensus.majority,
        minorityOpinion: consensus.minority,
      },
      finalVerdict,
      metadata: {
        processingTime,
        dataSources: this.extractDataSources(signals),
        version: "1.0.0",
      },
    };
  }

  private calculateConsensus(opinions: CouncilOpinion[]): {
    score: number;
    majority: string;
    minority?: string;
  } {
    if (opinions.length === 0) {
      return { score: 0.5, majority: "neutral" };
    }

    let bullish = 0;
    let bearish = 0;
    let neutral = 0;
    let totalConfidence = 0;

    for (const opinion of opinions) {
      const weight = opinion.confidence;
      totalConfidence += weight;

      if (opinion.stance === "bullish") {
        bullish += weight;
      } else if (opinion.stance === "bearish") {
        bearish += weight;
      } else {
        neutral += weight;
      }
    }

    const bullishPct = bullish / totalConfidence;
    const bearishPct = bearish / totalConfidence;
    const neutralPct = neutral / totalConfidence;

    // Calculate consensus score (0-1, higher = more agreement)
    const maxPct = Math.max(bullishPct, bearishPct, neutralPct);
    const consensusScore = maxPct;

    let majority = "neutral";
    if (bullishPct > bearishPct && bullishPct > neutralPct) {
      majority = "bullish";
    } else if (bearishPct > bullishPct && bearishPct > neutralPct) {
      majority = "bearish";
    }

    let minority: string | undefined;
    if (majority === "bullish" && bearishPct > 0.2) {
      minority = "bearish";
    } else if (majority === "bearish" && bullishPct > 0.2) {
      minority = "bullish";
    }

    return { score: consensusScore, majority, minority };
  }

  private determineVerdict(
    edge: EdgeCalculation,
    consensus: { score: number; majority: string; minority?: string },
    opinions: CouncilOpinion[],
  ): SignalFusionOutput["finalVerdict"] {
    // Determine recommendation
    let recommendation: "buy" | "sell" | "hold" | "avoid" = "hold";

    if (edge.expectedValue > 2 && consensus.majority === "bullish") {
      recommendation = "buy";
    } else if (edge.expectedValue < 0 && consensus.majority === "bearish") {
      recommendation = "sell";
    } else if (edge.convictionScore < 3 || consensus.score < 0.4) {
      recommendation = "avoid";
    }

    // Calculate conviction
    const conviction = Math.min(100, (edge.convictionScore / 10) * consensus.score * 100);

    // Determine urgency
    let urgency: "immediate" | "soon" | "patient" = "patient";
    if (edge.halfLife < 6 && recommendation === "buy") {
      urgency = "immediate";
    } else if (edge.halfLife < 24 && recommendation === "buy") {
      urgency = "soon";
    }

    // Generate summary
    const summary = this.generateSummary(recommendation, edge, consensus, opinions);

    // Extract key risks and opportunities
    const keyRisks = this.extractRisks(opinions);
    const keyOpportunities = this.extractOpportunities(opinions);

    return {
      recommendation,
      conviction,
      urgency,
      summary,
      keyRisks,
      keyOpportunities,
    };
  }

  private generateSummary(
    recommendation: string,
    edge: EdgeCalculation,
    consensus: { score: number; majority: string },
    opinions: CouncilOpinion[],
  ): string {
    const parts: string[] = [];

    parts.push(`${recommendation.toUpperCase()}`);
    parts.push(`${(edge.winRate * 100).toFixed(0)}% win rate`);
    parts.push(`${edge.expectedValue > 0 ? "+" : ""}${edge.expectedValue.toFixed(2)}% EV`);

    if (consensus.score > 0.7) {
      parts.push("Strong council consensus");
    } else if (consensus.score < 0.5) {
      parts.push("Mixed council opinions");
    }

    // Add top concern if any
    const concerns = opinions.flatMap((o) => o.concerns);
    if (concerns.length > 0) {
      parts.push(`Main concern: ${concerns[0]}`);
    }

    return parts.join(". ");
  }

  private extractRisks(opinions: CouncilOpinion[]): string[] {
    const allConcerns = opinions.flatMap((o) => o.concerns);
    // Get unique concerns, limit to top 3
    const unique = [...new Set(allConcerns)];
    return unique.slice(0, 3);
  }

  private extractOpportunities(opinions: CouncilOpinion[]): string[] {
    const allPoints = opinions.flatMap((o) => o.keyPoints);
    // Get unique points, limit to top 3
    const unique = [...new Set(allPoints)];
    return unique.slice(0, 3);
  }

  private extractDataSources(signals: Signal[]): string[] {
    const sources = new Set<string>();
    for (const signal of signals) {
      sources.add(signal.metadata.source);
    }
    return Array.from(sources);
  }

  /**
   * Format output for specific channel
   */
  formatOutput(
    output: SignalFusionOutput,
    channel: "cli" | "discord" | "telegram" | "slack",
  ): string {
    switch (channel) {
      case "cli":
        return this.formatForCLI(output);
      case "telegram":
        return this.formatForTelegram(output);
      default:
        return this.formatForCLI(output);
    }
  }

  private formatForCLI(output: SignalFusionOutput): string {
    const { finalVerdict, signalSwarm, tradingCouncil } = output;
    const { edge, tradeSetup } = signalSwarm;

    let text = "";
    text += "🧠 SIGNAL-FUSION ANALYSIS\n";
    text += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

    text += `Query: ${output.query}\n`;
    text += `Time: ${output.timestamp.toLocaleString()}\n\n`;

    text += "📊 QUANTIFIED EDGE\n";
    text += `  Expected Value: ${edge.expectedValue > 0 ? "+" : ""}${edge.expectedValue.toFixed(2)}%\n`;
    text += `  Win Rate: ${(edge.winRate * 100).toFixed(0)}%\n`;
    text += `  Risk/Reward: 1:${edge.riskReward.toFixed(1)}\n`;
    text += `  Conviction: ${edge.convictionScore.toFixed(1)}/10\n`;
    text += `  Edge Half-Life: ${edge.halfLife}h\n\n`;

    text += "🎯 TRADE SETUP\n";
    text += `  Direction: ${tradeSetup.direction.toUpperCase()}\n`;
    text += `  Entry: $${tradeSetup.entry.min.toFixed(2)} - $${tradeSetup.entry.max.toFixed(2)}\n`;
    text += `  Stop: $${tradeSetup.stopLoss.toFixed(2)}\n`;
    text += `  Position: ${tradeSetup.position.portfolioPercent.toFixed(1)}%\n\n`;

    text += "🏛️  COUNCIL CONSENSUS\n";
    text += `  Agreement: ${(tradingCouncil.consensus * 100).toFixed(0)}%\n`;
    text += `  Majority: ${tradingCouncil.majorityOpinion}\n`;
    if (tradingCouncil.minorityOpinion) {
      text += `  Minority: ${tradingCouncil.minorityOpinion}\n`;
    }
    text += "\n";

    text += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    text += `📌 VERDICT: ${finalVerdict.recommendation.toUpperCase()} (${finalVerdict.conviction.toFixed(0)}% conviction)\n`;
    text += `⏰ URGENCY: ${finalVerdict.urgency.toUpperCase()}\n`;
    text += "\n";

    if (finalVerdict.keyRisks.length > 0) {
      text += "⚠️  KEY RISKS:\n";
      finalVerdict.keyRisks.forEach((risk) => {
        text += `  • ${risk}\n`;
      });
      text += "\n";
    }

    if (finalVerdict.keyOpportunities.length > 0) {
      text += "💡 KEY OPPORTUNITIES:\n";
      finalVerdict.keyOpportunities.forEach((opp) => {
        text += `  • ${opp}\n`;
      });
      text += "\n";
    }

    text += `Summary: ${finalVerdict.summary}\n`;
    text += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";

    return text;
  }

  private formatForTelegram(output: SignalFusionOutput): string {
    const { finalVerdict, signalSwarm } = output;
    const { edge, tradeSetup } = signalSwarm;

    return `
🧠 <b>${output.query}</b>

📊 EV: ${edge.expectedValue > 0 ? "+" : ""}${edge.expectedValue.toFixed(2)}% | Win: ${(edge.winRate * 100).toFixed(0)}% | RR: 1:${edge.riskReward.toFixed(1)}

🎯 ${tradeSetup.direction.toUpperCase()} @ $${tradeSetup.entry.optimal.toFixed(2)}
⛔ Stop: $${tradeSetup.stopLoss.toFixed(2)}
📏 Size: ${tradeSetup.position.portfolioPercent.toFixed(1)}%

📌 <b>${finalVerdict.recommendation.toUpperCase()}</b> (${finalVerdict.conviction.toFixed(0)}%)
⏰ ${finalVerdict.urgency.toUpperCase()}
    `.trim();
  }
}
