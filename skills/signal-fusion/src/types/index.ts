/**
 * Core types and interfaces for Signal-Fusion
 * Following the Signal-Fusion architecture document
 */

// ============================================================================
// SENSOR TYPES
// ============================================================================

export interface SensorData {
  asset: string;
  marketType: MarketType;
  timestamp: Date;
  price?: PriceData;
  onchain?: OnChainData;
  whale?: WhaleData;
  orderbook?: OrderbookData;
  social?: SocialData;
  news?: NewsData;
  macro?: MacroData;
}

export interface PriceData {
  symbol: string;
  price: number;
  volume24h: number;
  change24h: number;
  marketCap?: number;
  liquidity?: number;
  fdv?: number;
  peRatio?: number;
  high52w?: number;
  low52w?: number;
  source: string;
}

export interface OnChainData {
  tokenAddress: string;
  holderCount: number;
  topHolders: Holder[];
  holderConcentration: number; // 0-1, higher = more concentrated
  recentTransactions: Transaction[];
  liquidityLocked?: boolean;
  contractVerified?: boolean;
}

export interface Holder {
  address: string;
  balance: number;
  percentage: number;
}

export interface Transaction {
  hash: string;
  from: string;
  to: string;
  amount: number;
  valueUsd: number;
  timestamp: Date;
  type: "buy" | "sell" | "transfer";
}

export interface WhaleData {
  recentMovements: WhaleMovement[];
  netFlow24h: number; // Positive = inflow, Negative = outflow
  accumulationScore: number; // -10 to +10
  largeTransactions: Transaction[];
}

export interface WhaleMovement {
  address: string;
  amount: number;
  direction: "in" | "out";
  timestamp: Date;
}

export interface OrderbookData {
  bidDepth: number;
  askDepth: number;
  spread: number;
  buyPressure: number; // 0-1
  sellPressure: number; // 0-1
  liquidityScore: number; // 0-10
}

export interface SocialData {
  sentimentScore: number; // -1 to +1
  volume24h: number;
  trending: boolean;
  mentions: Mention[];
  sources: {
    twitter: number;
    reddit: number;
    news: number;
  };
}

export interface Mention {
  source: string;
  text: string;
  sentiment: number;
  engagement: number;
  timestamp: Date;
}

export interface NewsData {
  articles: NewsArticle[];
  breakingNews: boolean;
  catalystDetected?: string;
  earningsDate?: Date;
}

export interface NewsArticle {
  title: string;
  source: string;
  url: string;
  sentiment: number;
  timestamp: Date;
}

export interface MacroData {
  dxy: number;
  vix: number;
  spyChange: number;
  fedPolicy: "hawkish" | "dovish" | "neutral";
  riskOnOff: "risk-on" | "risk-off" | "neutral";
}

// ============================================================================
// SIGNAL TYPES
// ============================================================================

export interface Signal {
  id: string;
  asset: string;
  type: SignalType;
  direction: "bullish" | "bearish" | "neutral";
  confidence: number; // 0-1
  strength: number; // 0-10
  timestamp: Date;
  expiresAt: Date;
  data: SignalData;
  metadata: SignalMetadata;
}

export type SignalType =
  | "price_action"
  | "volume_anomaly"
  | "whale_movement"
  | "social_sentiment"
  | "pattern_match"
  | "news_catalyst"
  | "macro_correlation"
  | "on_chain";

export interface SignalData {
  rawValue: number;
  threshold: number;
  deviation: number; // How many std devs from normal
  context: string;
}

export interface SignalMetadata {
  source: string;
  sensor: string;
  validated: boolean;
  adversarialTests: AdversarialTest[];
}

export interface AdversarialTest {
  test: string;
  result: "pass" | "fail";
  explanation: string;
}

// ============================================================================
// EDGE & TRADE TYPES
// ============================================================================

export interface EdgeCalculation {
  winRate: number; // 0-1
  avgWin: number; // Percentage
  avgLoss: number; // Percentage
  riskReward: number; // Ratio
  expectedValue: number; // Percentage
  edgeExists: boolean;
  convictionScore: number; // 0-10
  halfLife: number; // Hours
}

export interface TradeSetup {
  asset: string;
  direction: "long" | "short";
  entry: EntryZone;
  stopLoss: number;
  targets: Target[];
  position: PositionSizing;
  scenarios: Scenarios;
  maxHoldTime: number; // Hours
  catalyst?: string;
  warnings: string[];
}

export interface EntryZone {
  min: number;
  max: number;
  optimal: number;
  urgency: "immediate" | "soon" | "patient";
}

export interface Target {
  price: number;
  percentage: number;
  probability: number;
  action: "take_profit" | "move_stop" | "hold";
}

export interface PositionSizing {
  portfolioPercent: number;
  maxRiskPercent: number;
  kellyFraction: number;
  confidence: number;
}

export interface Scenarios {
  bull: Scenario;
  base: Scenario;
  bear: Scenario;
}

export interface Scenario {
  probability: number;
  priceTarget: number;
  timeline: string;
  catalysts: string[];
}

// ============================================================================
// COUNCIL TYPES
// ============================================================================

export interface CouncilMember {
  id: string;
  name: string;
  emoji: string;
  domain: string;
  personality: string;
  expertise: string[];
}

export interface CouncilOpinion {
  member: CouncilMember;
  stance: "bullish" | "bearish" | "neutral";
  confidence: number;
  reasoning: string;
  keyPoints: string[];
  concerns: string[];
}

export interface CouncilDebate {
  round: number;
  opinions: CouncilOpinion[];
  challenges: Challenge[];
  consensus: number; // 0-1
}

export interface Challenge {
  from: string;
  to: string;
  challenge: string;
  response: string;
  resolution: "agreed" | "disagreed" | "deferred";
}

// ============================================================================
// FINAL OUTPUT TYPES
// ============================================================================

export interface SignalFusionOutput {
  query: string;
  timestamp: Date;
  signalSwarm: {
    edge: EdgeCalculation;
    signals: Signal[];
    tradeSetup: TradeSetup;
  };
  tradingCouncil: {
    debate: CouncilDebate[];
    consensus: number;
    majorityOpinion: string;
    minorityOpinion?: string;
  };
  finalVerdict: {
    recommendation: "buy" | "sell" | "hold" | "avoid";
    conviction: number;
    urgency: "immediate" | "soon" | "patient";
    summary: string;
    keyRisks: string[];
    keyOpportunities: string[];
  };
  metadata: {
    processingTime: number;
    dataSources: string[];
    version: string;
  };
}

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

export type MarketType = "crypto" | "stock" | "forex" | "commodity" | "penny";

export const MARKET_SPECIALISTS: CouncilMember[] = [
  {
    id: "crypto-sage",
    name: "Crypto Sage",
    emoji: "🧙‍♂️",
    domain: "BTC, ETH, major alts",
    personality: "Veteran, cautious, fundamental",
    expertise: ["market_cycles", "adoption_metrics", "macro_trends"],
  },
  {
    id: "solana-scout",
    name: "Solana Scout",
    emoji: "⚡",
    domain: "Solana ecosystem, SPL tokens",
    personality: "Fast-paced, degen-friendly",
    expertise: ["dex_activity", "ecosystem_growth", "nft_volume"],
  },
  {
    id: "meme-maestro",
    name: "Meme Maestro",
    emoji: "🎭",
    domain: "Meme coins, viral tokens",
    personality: "High-energy, social-savvy",
    expertise: ["narratives", "social_momentum", "viral_trends"],
  },
  {
    id: "stock-sentinel",
    name: "Stock Sentinel",
    emoji: "📈",
    domain: "Stocks, ETFs, indices",
    personality: "Traditional, data-driven",
    expertise: ["earnings", "fundamentals", "sector_analysis"],
  },
  {
    id: "penny-prospector",
    name: "Penny Prospector",
    emoji: "💎",
    domain: "Penny stocks, micro-caps",
    personality: "Risk-aware, catalyst hunter",
    expertise: ["volume_spikes", "catalysts", "promotions"],
  },
  {
    id: "commodity-chief",
    name: "Commodity Chief",
    emoji: "🏆",
    domain: "Gold, silver, oil, commodities",
    personality: "Macro-focused, geopolitical",
    expertise: ["inflation", "fed_policy", "supply_demand"],
  },
  {
    id: "forex-falcon",
    name: "Forex Falcon",
    emoji: "🦅",
    domain: "Currency pairs",
    personality: "Global perspective",
    expertise: ["central_banks", "rates", "capital_flows"],
  },
];

export const SKILL_SPECIALISTS: CouncilMember[] = [
  {
    id: "chart-whisperer",
    name: "Chart Whisperer",
    emoji: "📊",
    domain: "Technical Analysis",
    personality: "Pattern-focused, precise",
    expertise: ["support_resistance", "indicators", "patterns"],
  },
  {
    id: "sentiment-sleuth",
    name: "Sentiment Sleuth",
    emoji: "🧠",
    domain: "Social Sentiment",
    personality: "Psychology-aware, contrarian",
    expertise: ["social_media", "news_sentiment", "crowd_psychology"],
  },
  {
    id: "whale-tracker",
    name: "Whale Tracker",
    emoji: "🐋",
    domain: "Large Transactions",
    personality: "Data-heavy, accumulation-focused",
    expertise: ["wallet_tracking", "smart_money", "flow_analysis"],
  },
  {
    id: "news-hound",
    name: "News Hound",
    emoji: "📰",
    domain: "Breaking News",
    personality: "Fast, catalyst-focused",
    expertise: ["news_scanning", "catalyst_detection", "impact_analysis"],
  },
  {
    id: "risk-advisor",
    name: "Risk Advisor",
    emoji: "🛡️",
    domain: "Risk Management",
    personality: "Conservative, protective",
    expertise: ["position_sizing", "portfolio_risk", "kelly_criterion"],
  },
  {
    id: "safety-inspector",
    name: "Safety Inspector",
    emoji: "🔍",
    domain: "Safety Audits",
    personality: "Skeptical, thorough",
    expertise: ["contract_audits", "rug_detection", "liquidity_checks"],
  },
  {
    id: "volume-analyst",
    name: "Volume Analyst",
    emoji: "📊",
    domain: "Trading Volume",
    personality: "Flow-focused, institutional-aware",
    expertise: ["liquidity_analysis", "order_flow", "volume_patterns"],
  },
  {
    id: "macro-monitor",
    name: "Macro Monitor",
    emoji: "🌍",
    domain: "Macro Trends",
    personality: "Big-picture, policy-aware",
    expertise: ["fed_policy", "inflation", "global_trends"],
  },
];
