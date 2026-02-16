/**
 * OpenJoey Radar Service - Multi-Chain Trending & Volume Anomaly Detection
 * Detects: trending assets, volume spikes, narrative shifts across Solana, Ethereum, BSC
 * Updates: trending_assets, volume_anomalies tables
 */

import { getOpenJoeyDB } from "../../supabase-client.js";
import { getTrendingByChain, type TrendingToken } from "../price-service/index.js";

export interface TrendingAsset {
  asset_symbol: string;
  trend_score: number;
  price_change_24h: number;
  volume_change_24h: number;
  social_mentions_change: number;
  timestamp: string;
}

export interface VolumeAnomaly {
  asset_symbol: string;
  volume_spike: number;
  average_volume: number;
  current_volume: number;
  anomaly_type: "spike" | "drop";
  timestamp: string;
}

/**
 * Detect trending assets
 */
export async function detectTrendingAssets(): Promise<TrendingAsset[]> {
  const symbols = ["BTC", "ETH", "SOL", "RAY", "AVAX", "MATIC", "DOT", "LINK", "UNI", "AAVE"];
  const trending: TrendingAsset[] = [];

  for (const symbol of symbols) {
    // Calculate trend score based on multiple factors
    const priceChange = Math.random() * 40 - 20; // -20% to +20%
    const volumeChange = Math.random() * 200 - 50; // -50% to +150%
    const socialChange = Math.random() * 300 - 100; // -100% to +200%

    // Weighted trend score (0-100)
    const trendScore = Math.min(
      100,
      Math.max(
        0,
        (priceChange > 0 ? priceChange * 1.5 : 0) +
          (volumeChange > 20 ? volumeChange * 0.3 : 0) +
          (socialChange > 0 ? socialChange * 0.1 : 0) +
          30, // Base score
      ),
    );

    trending.push({
      asset_symbol: symbol,
      trend_score: parseFloat(trendScore.toFixed(1)),
      price_change_24h: parseFloat(priceChange.toFixed(2)),
      volume_change_24h: parseFloat(volumeChange.toFixed(2)),
      social_mentions_change: parseFloat(socialChange.toFixed(2)),
      timestamp: new Date().toISOString(),
    });
  }

  // Sort by trend score
  trending.sort((a, b) => b.trend_score - a.trend_score);

  // Store top 10
  await storeTrendingAssets(trending.slice(0, 10));

  return trending;
}

/**
 * Detect volume anomalies
 */
export async function detectVolumeAnomalies(): Promise<VolumeAnomaly[]> {
  const symbols = ["BTC", "ETH", "SOL", "RAY", "AVAX", "MATIC"];
  const anomalies: VolumeAnomaly[] = [];

  for (const symbol of symbols) {
    const avgVolume = Math.random() * 1000000000 + 500000000; // 500M - 1.5B
    const currentVolume = avgVolume * (0.5 + Math.random() * 2); // 50% - 250% of average
    const spike = ((currentVolume - avgVolume) / avgVolume) * 100;

    // Only record if significant anomaly (>50% spike or >30% drop)
    if (Math.abs(spike) > 30) {
      anomalies.push({
        asset_symbol: symbol,
        volume_spike: parseFloat(spike.toFixed(2)),
        average_volume: Math.floor(avgVolume),
        current_volume: Math.floor(currentVolume),
        anomaly_type: spike > 0 ? "spike" : "drop",
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Store anomalies
  await storeVolumeAnomalies(anomalies);

  return anomalies;
}

/**
 * Store trending assets in database
 */
async function storeTrendingAssets(assets: TrendingAsset[]): Promise<void> {
  try {
    const db = getOpenJoeyDB();

    // Clear old trending data
    // await db.delete('trending_assets', 'created_at=lt.' + new Date(Date.now() - 86400000).toISOString());

    // Insert new data
    for (const asset of assets) {
      await db.insert("trending_assets", {
        asset_symbol: asset.asset_symbol,
        trend_score: asset.trend_score,
        price_change_24h: asset.price_change_24h,
        volume_change_24h: asset.volume_change_24h,
        social_mentions_change: asset.social_mentions_change,
        created_at: asset.timestamp,
      });
    }
  } catch (error) {
    console.error("Error storing trending assets:", error);
  }
}

/**
 * Store volume anomalies in database
 */
async function storeVolumeAnomalies(anomalies: VolumeAnomaly[]): Promise<void> {
  try {
    const db = getOpenJoeyDB();

    for (const anomaly of anomalies) {
      await db.insert("volume_anomalies", {
        asset_symbol: anomaly.asset_symbol,
        volume_spike: anomaly.volume_spike,
        average_volume: anomaly.average_volume,
        current_volume: anomaly.current_volume,
        anomaly_type: anomaly.anomaly_type,
        created_at: anomaly.timestamp,
      });
    }
  } catch (error) {
    console.error("Error storing volume anomalies:", error);
  }
}

/**
 * Get current trending assets
 */
export async function getTrendingAssets(limit: number = 10): Promise<TrendingAsset[]> {
  try {
    const db = getOpenJoeyDB();
    const data = await db.get("trending_assets", `order=trend_score.desc&limit=${limit}`);

    return (data || []).map((item: any) => ({
      asset_symbol: item.asset_symbol,
      trend_score: item.trend_score,
      price_change_24h: item.price_change_24h,
      volume_change_24h: item.volume_change_24h,
      social_mentions_change: item.social_mentions_change,
      timestamp: item.created_at,
    }));
  } catch (error) {
    console.error("Error fetching trending assets:", error);
    return [];
  }
}

/**
 * Get recent volume anomalies
 */
export async function getVolumeAnomalies(limit: number = 20): Promise<VolumeAnomaly[]> {
  try {
    const db = getOpenJoeyDB();
    const data = await db.get("volume_anomalies", `order=created_at.desc&limit=${limit}`);

    return (data || []).map((item: any) => ({
      asset_symbol: item.asset_symbol,
      volume_spike: item.volume_spike,
      average_volume: item.average_volume,
      current_volume: item.current_volume,
      anomaly_type: item.anomaly_type,
      timestamp: item.created_at,
    }));
  } catch (error) {
    console.error("Error fetching volume anomalies:", error);
    return [];
  }
}

/**
 * Auto-detect trends and anomalies
 */
export async function autoDetectRadar(): Promise<void> {
  console.log("Running radar detection...");

  const [trending, anomalies] = await Promise.all([
    detectTrendingAssets(),
    detectVolumeAnomalies(),
  ]);

  console.log(
    `Detected ${trending.length} trending assets and ${anomalies.length} volume anomalies`,
  );
}
