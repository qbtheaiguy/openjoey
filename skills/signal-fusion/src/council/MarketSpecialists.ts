/**
 * Trading Council - Market Specialists
 * Domain experts that interpret Signal Swarm data for their markets
 */

import {
  CouncilMember,
  CouncilOpinion,
  SensorData,
  EdgeCalculation,
  TradeSetup,
  MARKET_SPECIALISTS,
} from "../types/index.js";

export interface SpecialistInput {
  member: CouncilMember;
  sensorData: SensorData;
  edge: EdgeCalculation;
  tradeSetup: TradeSetup;
}

export class MarketSpecialistsCouncil {
  private specialists: CouncilMember[];

  constructor() {
    this.specialists = MARKET_SPECIALISTS;
  }

  /**
   * Get all market specialists
   */
  getSpecialists(): CouncilMember[] {
    return this.specialists;
  }

  /**
   * Get specialist by domain
   */
  getSpecialistForMarket(marketType: string): CouncilMember | undefined {
    const mappings: Record<string, string> = {
      crypto: "crypto-sage",
      solana: "solana-scout",
      meme: "meme-maestro",
      stock: "stock-sentinel",
      penny: "penny-prospector",
      commodity: "commodity-chief",
      forex: "forex-falcon",
    };

    const specialistId = mappings[marketType.toLowerCase()];
    return this.specialists.find((s) => s.id === specialistId);
  }

  /**
   * Generate opinion from relevant market specialist
   */
  generateOpinion(input: SpecialistInput): CouncilOpinion {
    const { member, sensorData, edge, tradeSetup } = input;

    // Domain-specific analysis
    const analysis = this.analyzeForDomain(member, sensorData, edge, tradeSetup);

    return {
      member,
      stance: analysis.stance,
      confidence: analysis.confidence,
      reasoning: analysis.reasoning,
      keyPoints: analysis.keyPoints,
      concerns: analysis.concerns,
    };
  }

  private analyzeForDomain(
    member: CouncilMember,
    data: SensorData,
    edge: EdgeCalculation,
    trade: TradeSetup,
  ): {
    stance: "bullish" | "bearish" | "neutral";
    confidence: number;
    reasoning: string;
    keyPoints: string[];
    concerns: string[];
  } {
    switch (member.id) {
      case "crypto-sage":
        return this.analyzeCryptoSage(data, edge, trade);

      case "solana-scout":
        return this.analyzeSolanaScout(data, edge, trade);

      case "meme-maestro":
        return this.analyzeMemeMaestro(data, edge, trade);

      case "stock-sentinel":
        return this.analyzeStockSentinel(data, edge, trade);

      case "penny-prospector":
        return this.analyzePennyProspector(data, edge, trade);

      case "commodity-chief":
        return this.analyzeCommodityChief(data, edge, trade);

      case "forex-falcon":
        return this.analyzeForexFalcon(data, edge, trade);

      default:
        return {
          stance: "neutral",
          confidence: 0.5,
          reasoning: "No domain expertise available",
          keyPoints: ["Insufficient data"],
          concerns: ["Cannot form opinion"],
        };
    }
  }

  private analyzeCryptoSage(data: SensorData, edge: EdgeCalculation, _trade: TradeSetup) {
    const keyPoints: string[] = [];
    const concerns: string[] = [];

    // Check macro conditions
    if (data.macro?.riskOnOff === "risk-on") {
      keyPoints.push("Risk-on environment favors crypto");
    } else if (data.macro?.riskOnOff === "risk-off") {
      concerns.push("Risk-off environment may pressure crypto");
    }

    // Check DXY correlation
    if (data.macro?.dxy && data.macro.dxy > 105) {
      concerns.push("Strong dollar typically pressures crypto");
    }

    // Check on-chain
    if (data.onchain?.holderConcentration && data.onchain.holderConcentration < 0.5) {
      keyPoints.push("Good holder distribution");
    }

    const stance: "bullish" | "bearish" | "neutral" =
      edge.expectedValue > 2 ? "bullish" : edge.expectedValue < 0 ? "bearish" : "neutral";

    return {
      stance,
      confidence: edge.convictionScore / 10,
      reasoning: `Crypto-Sage: ${edge.expectedValue > 0 ? "Positive" : "Negative"} expected value with ${keyPoints.length} supporting factors`,
      keyPoints,
      concerns,
    };
  }

  private analyzeSolanaScout(data: SensorData, edge: EdgeCalculation, _trade: TradeSetup) {
    const keyPoints: string[] = [];
    const concerns: string[] = [];

    if (data.onchain?.recentTransactions && data.onchain.recentTransactions.length > 10) {
      keyPoints.push("High on-chain activity");
    }

    if (data.whale?.accumulationScore && data.whale.accumulationScore > 5) {
      keyPoints.push("Smart money accumulating");
    }

    const stance: "bullish" | "bearish" | "neutral" =
      edge.expectedValue > 1.5 ? "bullish" : edge.expectedValue < 0 ? "bearish" : "neutral";

    return {
      stance,
      confidence: edge.convictionScore / 10,
      reasoning: `Solana-Scout: Ecosystem momentum ${edge.expectedValue > 0 ? "positive" : "negative"}`,
      keyPoints,
      concerns,
    };
  }

  private analyzeMemeMaestro(data: SensorData, edge: EdgeCalculation, _trade: TradeSetup) {
    const keyPoints: string[] = [];
    const concerns: string[] = [];

    if (data.social?.sentimentScore && data.social.sentimentScore > 0.5) {
      keyPoints.push("Strong social momentum");
    }

    if (data.social?.trending) {
      keyPoints.push("Trending on social media");
    }

    // Meme coins need extra safety checks
    if (data.onchain?.holderConcentration && data.onchain.holderConcentration > 0.6) {
      concerns.push("High concentration - rug risk");
    }

    const stance: "bullish" | "bearish" | "neutral" =
      edge.expectedValue > 3 && data.social?.sentimentScore && data.social.sentimentScore > 0.3
        ? "bullish"
        : "neutral";

    return {
      stance,
      confidence: Math.min(0.7, edge.convictionScore / 10),
      reasoning: `Meme-Maestro: Social momentum ${data.social?.sentimentScore && data.social.sentimentScore > 0 ? "positive" : "neutral"}`,
      keyPoints,
      concerns,
    };
  }

  private analyzeStockSentinel(data: SensorData, edge: EdgeCalculation, _trade: TradeSetup) {
    const keyPoints: string[] = [];
    const concerns: string[] = [];

    if (data.macro?.fedPolicy === "dovish") {
      keyPoints.push("Dovish Fed supports equities");
    } else if (data.macro?.fedPolicy === "hawkish") {
      concerns.push("Hawkish Fed pressures equities");
    }

    if (data.news?.catalystDetected) {
      keyPoints.push(`Catalyst: ${data.news.catalystDetected}`);
    }

    const stance: "bullish" | "bearish" | "neutral" =
      edge.expectedValue > 1 ? "bullish" : edge.expectedValue < 0 ? "bearish" : "neutral";

    return {
      stance,
      confidence: edge.convictionScore / 10,
      reasoning: `Stock-Sentinel: ${data.macro?.fedPolicy === "dovish" ? "Favorable" : "Mixed"} macro environment`,
      keyPoints,
      concerns,
    };
  }

  private analyzePennyProspector(data: SensorData, edge: EdgeCalculation, _trade: TradeSetup) {
    const keyPoints: string[] = [];
    const concerns: string[] = [];

    if (data.news?.catalystDetected) {
      keyPoints.push(`Binary catalyst identified: ${data.news.catalystDetected}`);
    }

    if (data.price?.volume24h && data.price.volume24h > 500000) {
      keyPoints.push("Unusual volume for penny stock");
    }

    concerns.push("High volatility asset");
    concerns.push("Limited liquidity");

    const stance: "bullish" | "bearish" | "neutral" =
      edge.expectedValue > 5 ? "bullish" : "neutral";

    return {
      stance,
      confidence: Math.min(0.6, edge.convictionScore / 10),
      reasoning: `Penny-Prospector: Catalyst-driven setup with high risk/reward`,
      keyPoints,
      concerns,
    };
  }

  private analyzeCommodityChief(data: SensorData, edge: EdgeCalculation, _trade: TradeSetup) {
    const keyPoints: string[] = [];
    const concerns: string[] = [];

    if (data.macro?.fedPolicy === "dovish") {
      keyPoints.push("Dovish Fed typically bullish for gold/silver");
    }

    if (data.macro?.dxy && data.macro.dxy > 104) {
      concerns.push("Strong dollar pressures commodities");
    }

    const stance: "bullish" | "bearish" | "neutral" =
      edge.expectedValue > 1 ? "bullish" : edge.expectedValue < 0 ? "bearish" : "neutral";

    return {
      stance,
      confidence: edge.convictionScore / 10,
      reasoning: `Commodity-Chief: Macro factors ${edge.expectedValue > 0 ? "supportive" : "mixed"}`,
      keyPoints,
      concerns,
    };
  }

  private analyzeForexFalcon(data: SensorData, edge: EdgeCalculation, _trade: TradeSetup) {
    const keyPoints: string[] = [];
    const concerns: string[] = [];

    if (data.macro?.fedPolicy) {
      keyPoints.push(`Fed policy: ${data.macro.fedPolicy}`);
    }

    if (data.macro?.dxy) {
      keyPoints.push(`DXY at ${data.macro.dxy.toFixed(2)}`);
    }

    const stance: "bullish" | "bearish" | "neutral" =
      edge.expectedValue > 0.5 ? "bullish" : edge.expectedValue < 0 ? "bearish" : "neutral";

    return {
      stance,
      confidence: edge.convictionScore / 10,
      reasoning: `Forex-Falcon: Rate differential analysis`,
      keyPoints,
      concerns,
    };
  }
}
