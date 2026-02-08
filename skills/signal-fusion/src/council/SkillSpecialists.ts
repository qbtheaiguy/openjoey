/**
 * Trading Council - Skill Specialists
 * Technical experts that serve ALL market specialists
 */

import {
  CouncilMember,
  CouncilOpinion,
  SensorData,
  EdgeCalculation,
  TradeSetup,
  SKILL_SPECIALISTS,
} from "../types/index.js";

export class SkillSpecialistsCouncil {
  private specialists: CouncilMember[];

  constructor() {
    this.specialists = SKILL_SPECIALISTS;
  }

  /**
   * Get all skill specialists
   */
  getSpecialists(): CouncilMember[] {
    return this.specialists;
  }

  /**
   * Generate opinions from all relevant skill specialists
   */
  generateOpinions(
    sensorData: SensorData,
    edge: EdgeCalculation,
    trade: TradeSetup,
  ): CouncilOpinion[] {
    const opinions: CouncilOpinion[] = [];

    // Chart Whisperer - always relevant
    opinions.push(this.analyzeChartWhisperer(sensorData, edge, trade));

    // Sentiment Sleuth - if social data exists
    if (sensorData.social) {
      opinions.push(this.analyzeSentimentSleuth(sensorData, edge, trade));
    }

    // Whale Tracker - if whale data exists
    if (sensorData.whale) {
      opinions.push(this.analyzeWhaleTracker(sensorData, edge, trade));
    }

    // News Hound - if news data exists
    if (sensorData.news) {
      opinions.push(this.analyzeNewsHound(sensorData, edge, trade));
    }

    // Risk Advisor - always relevant
    opinions.push(this.analyzeRiskAdvisor(sensorData, edge, trade));

    // Safety Inspector - for crypto assets
    if (sensorData.onchain) {
      opinions.push(this.analyzeSafetyInspector(sensorData, edge, trade));
    }

    // Volume Analyst - always relevant
    opinions.push(this.analyzeVolumeAnalyst(sensorData, edge, trade));

    // Macro Monitor - if macro data exists
    if (sensorData.macro) {
      opinions.push(this.analyzeMacroMonitor(sensorData, edge, trade));
    }

    return opinions;
  }

  private getSpecialist(id: string): CouncilMember {
    return this.specialists.find((s) => s.id === id) || this.specialists[0];
  }

  private analyzeChartWhisperer(
    data: SensorData,
    edge: EdgeCalculation,
    trade: TradeSetup,
  ): CouncilOpinion {
    const member = this.getSpecialist("chart-whisperer");
    const keyPoints: string[] = [];
    const concerns: string[] = [];

    if (data.price?.change24h && Math.abs(data.price.change24h) > 5) {
      keyPoints.push(`Significant price move: ${data.price.change24h.toFixed(1)}%`);
    }

    if (trade.targets.length > 0) {
      keyPoints.push(`Clear target levels defined`);
    }

    if (edge.riskReward < 2) {
      concerns.push("Risk/reward below 2:1 threshold");
    }

    const stance: "bullish" | "bearish" | "neutral" =
      edge.expectedValue > 1 ? "bullish" : edge.expectedValue < 0 ? "bearish" : "neutral";

    return {
      member,
      stance,
      confidence: edge.convictionScore / 10,
      reasoning: `Chart-Whisperer: Technical setup ${edge.riskReward >= 2 ? "favorable" : "marginal"}`,
      keyPoints,
      concerns,
    };
  }

  private analyzeSentimentSleuth(
    data: SensorData,
    _edge: EdgeCalculation,
    _trade: TradeSetup,
  ): CouncilOpinion {
    const member = this.getSpecialist("sentiment-sleuth");
    const keyPoints: string[] = [];
    const concerns: string[] = [];

    const sentiment = data.social?.sentimentScore || 0;

    if (sentiment > 0.3) {
      keyPoints.push(`Positive sentiment: ${(sentiment * 100).toFixed(0)}%`);
    } else if (sentiment < -0.3) {
      concerns.push(`Negative sentiment: ${(sentiment * 100).toFixed(0)}%`);
    }

    if (data.social?.trending) {
      keyPoints.push("Asset is trending");
    }

    if (Math.abs(sentiment) > 0.8) {
      concerns.push("Sentiment at extreme - potential reversal");
    }

    const stance: "bullish" | "bearish" | "neutral" =
      sentiment > 0.2 ? "bullish" : sentiment < -0.2 ? "bearish" : "neutral";

    return {
      member,
      stance,
      confidence: Math.abs(sentiment),
      reasoning: `Sentiment-Sleuth: Social mood ${sentiment > 0 ? "positive" : sentiment < 0 ? "negative" : "neutral"}`,
      keyPoints,
      concerns,
    };
  }

  private analyzeWhaleTracker(
    data: SensorData,
    _edge: EdgeCalculation,
    _trade: TradeSetup,
  ): CouncilOpinion {
    const member = this.getSpecialist("whale-tracker");
    const keyPoints: string[] = [];
    const concerns: string[] = [];

    const netFlow = data.whale?.netFlow24h || 0;

    if (netFlow > 100000) {
      keyPoints.push(`Strong inflow: $${(netFlow / 1000).toFixed(0)}k`);
    } else if (netFlow < -100000) {
      concerns.push(`Outflow detected: $${(Math.abs(netFlow) / 1000).toFixed(0)}k`);
    }

    const largeTxs = data.whale?.largeTransactions?.length || 0;
    if (largeTxs > 5) {
      keyPoints.push(`${largeTxs} large transactions`);
    }

    const stance: "bullish" | "bearish" | "neutral" =
      netFlow > 0 ? "bullish" : netFlow < 0 ? "bearish" : "neutral";

    return {
      member,
      stance,
      confidence: Math.min(0.9, Math.abs(netFlow) / 500000),
      reasoning: `Whale-Tracker: Smart money ${netFlow > 0 ? "accumulating" : netFlow < 0 ? "distributing" : "neutral"}`,
      keyPoints,
      concerns,
    };
  }

  private analyzeNewsHound(
    data: SensorData,
    _edge: EdgeCalculation,
    _trade: TradeSetup,
  ): CouncilOpinion {
    const member = this.getSpecialist("news-hound");
    const keyPoints: string[] = [];
    const concerns: string[] = [];

    if (data.news?.catalystDetected) {
      keyPoints.push(`Catalyst: ${data.news.catalystDetected}`);
    }

    if (data.news?.breakingNews) {
      keyPoints.push("Breaking news detected");
    }

    const articleCount = data.news?.articles?.length || 0;
    if (articleCount > 10) {
      keyPoints.push(`High news volume: ${articleCount} articles`);
    }

    // Check for negative sentiment in news
    const articles = data.news?.articles || [];
    const avgNewsSentiment =
      articles.length > 0 ? articles.reduce((sum, a) => sum + a.sentiment, 0) / articles.length : 0;
    if (avgNewsSentiment < -0.3) {
      concerns.push("Negative news sentiment");
    }

    const stance: "bullish" | "bearish" | "neutral" =
      avgNewsSentiment > 0.2 ? "bullish" : avgNewsSentiment < -0.2 ? "bearish" : "neutral";

    return {
      member,
      stance,
      confidence: Math.min(0.8, articleCount / 20),
      reasoning: `News-Hound: ${data.news?.catalystDetected ? "Catalyst-driven" : "No major catalysts"}`,
      keyPoints,
      concerns,
    };
  }

  private analyzeRiskAdvisor(
    _data: SensorData,
    edge: EdgeCalculation,
    trade: TradeSetup,
  ): CouncilOpinion {
    const member = this.getSpecialist("risk-advisor");
    const keyPoints: string[] = [];
    const concerns: string[] = [];

    keyPoints.push(`Position size: ${trade.position.portfolioPercent.toFixed(1)}%`);
    keyPoints.push(`Max risk: ${trade.position.maxRiskPercent}%`);

    if (trade.position.kellyFraction < 0.1) {
      concerns.push("Kelly fraction suggests minimal edge");
    }

    if (edge.convictionScore < 5) {
      concerns.push("Low conviction - consider smaller size");
    }

    // Check stop distance
    const stopDistance = Math.abs(1 - trade.stopLoss / trade.entry.optimal);
    if (stopDistance > 0.1) {
      concerns.push(`Wide stop at ${(stopDistance * 100).toFixed(1)}%`);
    }

    const stance: "bullish" | "bearish" | "neutral" =
      edge.convictionScore > 6 ? "bullish" : edge.convictionScore < 3 ? "bearish" : "neutral";

    return {
      member,
      stance,
      confidence: edge.convictionScore / 10,
      reasoning: `Risk-Advisor: ${edge.convictionScore > 6 ? "Favorable" : "Moderate"} risk/reward profile`,
      keyPoints,
      concerns,
    };
  }

  private analyzeSafetyInspector(
    data: SensorData,
    _edge: EdgeCalculation,
    _trade: TradeSetup,
  ): CouncilOpinion {
    const member = this.getSpecialist("safety-inspector");
    const keyPoints: string[] = [];
    const concerns: string[] = [];

    if (data.onchain?.contractVerified) {
      keyPoints.push("Contract verified");
    }

    const concentration = data.onchain?.holderConcentration || 0;
    if (concentration < 0.5) {
      keyPoints.push("Good holder distribution");
    } else if (concentration > 0.6) {
      concerns.push(`High concentration: ${(concentration * 100).toFixed(0)}%`);
    }

    if (data.onchain?.liquidityLocked) {
      keyPoints.push("Liquidity locked");
    } else {
      concerns.push("Liquidity not locked - rug risk");
    }

    const holderCount = data.onchain?.holderCount || 0;
    if (holderCount < 100) {
      concerns.push("Low holder count - liquidity risk");
    }

    const stance: "bullish" | "bearish" | "neutral" =
      concerns.length === 0 ? "bullish" : concerns.length > 2 ? "bearish" : "neutral";

    return {
      member,
      stance,
      confidence: concerns.length === 0 ? 0.9 : concerns.length > 2 ? 0.3 : 0.6,
      reasoning: `Safety-Inspector: ${concerns.length === 0 ? "No red flags" : `${concerns.length} concerns identified`}`,
      keyPoints,
      concerns,
    };
  }

  private analyzeVolumeAnalyst(
    data: SensorData,
    _edge: EdgeCalculation,
    _trade: TradeSetup,
  ): CouncilOpinion {
    const member = this.getSpecialist("volume-analyst");
    const keyPoints: string[] = [];
    const concerns: string[] = [];

    const volume = data.price?.volume24h || 0;
    const liquidity = data.price?.liquidity || volume;

    if (volume > 1000000) {
      keyPoints.push(`Healthy volume: $${(volume / 1e6).toFixed(2)}M`);
    } else if (volume < 100000) {
      concerns.push("Low volume - liquidity risk");
    }

    if (liquidity > 500000) {
      keyPoints.push("Good liquidity depth");
    } else {
      concerns.push("Shallow liquidity - slippage risk");
    }

    const stance: "bullish" | "bearish" | "neutral" =
      volume > 500000 ? "bullish" : volume < 100000 ? "bearish" : "neutral";

    return {
      member,
      stance,
      confidence: Math.min(0.9, volume / 1e6),
      reasoning: `Volume-Analyst: ${volume > 500000 ? "Sufficient" : "Limited"} liquidity`,
      keyPoints,
      concerns,
    };
  }

  private analyzeMacroMonitor(
    data: SensorData,
    _edge: EdgeCalculation,
    _trade: TradeSetup,
  ): CouncilOpinion {
    const member = this.getSpecialist("macro-monitor");
    const keyPoints: string[] = [];
    const concerns: string[] = [];

    if (data.macro?.fedPolicy === "dovish") {
      keyPoints.push("Dovish Fed environment");
    } else if (data.macro?.fedPolicy === "hawkish") {
      concerns.push("Hawkish Fed environment");
    }

    if (data.macro?.riskOnOff === "risk-on") {
      keyPoints.push("Risk-on market");
    } else if (data.macro?.riskOnOff === "risk-off") {
      concerns.push("Risk-off market");
    }

    if (data.macro?.vix && data.macro.vix > 25) {
      concerns.push(`Elevated VIX: ${data.macro.vix.toFixed(1)}`);
    }

    const stance: "bullish" | "bearish" | "neutral" =
      data.macro?.riskOnOff === "risk-on"
        ? "bullish"
        : data.macro?.riskOnOff === "risk-off"
          ? "bearish"
          : "neutral";

    return {
      member,
      stance,
      confidence: 0.7,
      reasoning: `Macro-Monitor: ${data.macro?.riskOnOff === "risk-on" ? "Favorable" : data.macro?.riskOnOff === "risk-off" ? "Challenging" : "Neutral"} macro backdrop`,
      keyPoints,
      concerns,
    };
  }
}
