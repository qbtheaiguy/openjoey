/**
 * Anomaly Detector - Detects unusual behavior in market data
 * Volume spikes, price anomalies, whale movements
 */

import { Signal, SensorData } from "../types/index.js";

export interface AnomalyConfig {
  volumeSpikeThreshold: number;
  priceChangeThreshold: number;
  whaleThresholdUsd: number;
  sentimentSpikeThreshold: number;
}

const DEFAULT_CONFIG: AnomalyConfig = {
  volumeSpikeThreshold: 3,
  priceChangeThreshold: 10,
  whaleThresholdUsd: 100000,
  sentimentSpikeThreshold: 2,
};

export class AnomalyDetector {
  private config: AnomalyConfig;

  constructor(config: Partial<AnomalyConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  detectAnomalies(data: SensorData): Signal[] {
    const signals: Signal[] = [];

    const volumeSignal = this.detectVolumeAnomaly(data);
    if (volumeSignal) signals.push(volumeSignal);

    const priceSignal = this.detectPriceAnomaly(data);
    if (priceSignal) signals.push(priceSignal);

    const whaleSignal = this.detectWhaleAnomaly(data);
    if (whaleSignal) signals.push(whaleSignal);

    const sentimentSignal = this.detectSentimentAnomaly(data);
    if (sentimentSignal) signals.push(sentimentSignal);

    return signals;
  }

  private detectVolumeAnomaly(data: SensorData): Signal | null {
    if (!data.price?.volume24h) return null;

    const volume = data.price.volume24h;
    const isSpike = volume > 1000000;

    if (!isSpike) return null;

    return {
      id: `volume-${data.asset}-${Date.now()}`,
      asset: data.asset,
      type: "volume_anomaly",
      direction: data.price.change24h && data.price.change24h > 0 ? "bullish" : "neutral",
      confidence: 0.7,
      strength: 6,
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      data: {
        rawValue: volume,
        threshold: 1000000,
        deviation: volume / 1000000,
        context: `Volume spike detected: $${volume.toLocaleString()}`,
      },
      metadata: {
        source: "price_feed",
        sensor: "volume",
        validated: false,
        adversarialTests: [],
      },
    };
  }

  private detectPriceAnomaly(data: SensorData): Signal | null {
    if (!data.price?.change24h) return null;

    const change = Math.abs(data.price.change24h);

    if (change < this.config.priceChangeThreshold) return null;

    return {
      id: `price-${data.asset}-${Date.now()}`,
      asset: data.asset,
      type: "price_action",
      direction: data.price.change24h > 0 ? "bullish" : "bearish",
      confidence: Math.min(0.9, change / 20),
      strength: Math.min(10, change / 2),
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
      data: {
        rawValue: data.price.change24h,
        threshold: this.config.priceChangeThreshold,
        deviation: change / this.config.priceChangeThreshold,
        context: `Price ${data.price.change24h > 0 ? "up" : "down"} ${change.toFixed(2)}% in 24h`,
      },
      metadata: {
        source: "price_feed",
        sensor: "price",
        validated: false,
        adversarialTests: [],
      },
    };
  }

  private detectWhaleAnomaly(data: SensorData): Signal | null {
    if (!data.whale?.largeTransactions?.length) return null;

    const largeTxs = data.whale.largeTransactions.filter(
      (tx) => tx.valueUsd >= this.config.whaleThresholdUsd,
    );

    if (largeTxs.length === 0) return null;

    const netFlow = data.whale.netFlow24h;
    const direction = netFlow > 0 ? "bullish" : "bearish";

    return {
      id: `whale-${data.asset}-${Date.now()}`,
      asset: data.asset,
      type: "whale_movement",
      direction,
      confidence: 0.75,
      strength: Math.min(10, largeTxs.length * 2),
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000),
      data: {
        rawValue: netFlow,
        threshold: this.config.whaleThresholdUsd,
        deviation: Math.abs(netFlow) / this.config.whaleThresholdUsd,
        context: `${largeTxs.length} whale transactions, net flow $${netFlow.toLocaleString()}`,
      },
      metadata: {
        source: "on_chain",
        sensor: "whale",
        validated: false,
        adversarialTests: [],
      },
    };
  }

  private detectSentimentAnomaly(data: SensorData): Signal | null {
    if (!data.social?.sentimentScore) return null;

    const score = data.social.sentimentScore;

    if (Math.abs(score) < 0.5) return null;

    return {
      id: `sentiment-${data.asset}-${Date.now()}`,
      asset: data.asset,
      type: "social_sentiment",
      direction: score > 0 ? "bullish" : "bearish",
      confidence: Math.abs(score),
      strength: Math.min(10, Math.abs(score) * 10),
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
      data: {
        rawValue: score,
        threshold: 0.5,
        deviation: Math.abs(score) / 0.5,
        context: `Social sentiment ${score > 0 ? "positive" : "negative"} (${(score * 100).toFixed(0)}%)`,
      },
      metadata: {
        source: "social",
        sensor: "sentiment",
        validated: false,
        adversarialTests: [],
      },
    };
  }
}
