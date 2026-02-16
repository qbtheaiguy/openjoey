/**
 * OpenJoey Radar Service - Real Data Version
 * Calls price-service for live market data
 * Port: 3005
 */

import http from "http";

const PRICE_SERVICE_URL = "http://localhost:3009";

// In-memory storage for trending and anomalies
const trendingCache = new Map();
const anomalyCache = new Map();

// Detect trending assets using real price data
async function detectTrendingAssets() {
  const symbols = ["BTC", "ETH", "SOL", "RAY", "AVAX", "MATIC", "DOT", "LINK", "UNI", "AAVE"];
  const trending = [];

  for (const symbol of symbols) {
    try {
      const response = await fetch(`${PRICE_SERVICE_URL}/price?symbol=${symbol}`, {
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) continue;

      const result = await response.json();
      if (!result.success || !result.data) continue;

      const data = result.data;
      const priceChange = data.priceChange24h || 0;
      const volume = data.volume24h || 0;
      const liquidity = data.liquidity || 0;
      const riskScore = data.riskScore || 50;

      // Calculate real trend score based on live data
      let trendScore = 30; // Base score

      // Price momentum (positive movement = higher score)
      if (priceChange > 5) trendScore += 25;
      else if (priceChange > 2) trendScore += 15;
      else if (priceChange < -10) trendScore -= 10;

      // Volume factor (higher volume = more interest)
      if (volume > 100000000)
        trendScore += 20; // $100M+
      else if (volume > 50000000) trendScore += 10; // $50M+

      // Liquidity quality
      if (liquidity > 10000000)
        trendScore += 15; // $10M+
      else if (liquidity > 1000000) trendScore += 5; // $1M+

      // Risk adjustment (lower risk = more attractive)
      if (riskScore < 30)
        trendScore += 10; // Very safe
      else if (riskScore > 70) trendScore -= 10; // High risk

      trendScore = Math.max(0, Math.min(100, trendScore));

      trending.push({
        asset_symbol: symbol,
        trend_score: parseFloat(trendScore.toFixed(1)),
        price_change_24h: parseFloat(priceChange.toFixed(2)),
        volume_24h: volume,
        liquidity: liquidity,
        chain: data.chain,
        source: data.source,
        risk_score: riskScore,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error(`[RADAR] Error fetching ${symbol}:`, error.message);
    }
  }

  // Sort by trend score
  trending.sort((a, b) => b.trend_score - a.trend_score);

  // Store in cache
  trendingCache.set("latest", {
    data: trending.slice(0, 10),
    timestamp: Date.now(),
  });

  console.log(`[RADAR] Detected ${trending.length} trending assets`);
  return trending.slice(0, 10);
}

// Detect volume anomalies
async function detectVolumeAnomalies() {
  const symbols = ["BTC", "ETH", "SOL", "BNB", "AVAX", "MATIC"];
  const anomalies = [];

  // Get historical data from cache
  const history = anomalyCache.get("history") || {};

  for (const symbol of symbols) {
    try {
      const response = await fetch(`${PRICE_SERVICE_URL}/price?symbol=${symbol}`, {
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) continue;

      const result = await response.json();
      if (!result.success || !result.data) continue;

      const currentVolume = result.data.volume24h || 0;

      // Calculate average from history or use current as baseline
      const symbolHistory = history[symbol] || [];
      const avgVolume =
        symbolHistory.length > 0
          ? symbolHistory.reduce((a, b) => a + b, 0) / symbolHistory.length
          : currentVolume;

      const spike = avgVolume > 0 ? ((currentVolume - avgVolume) / avgVolume) * 100 : 0;

      // Only record if significant anomaly (>50% spike or >30% drop)
      if (Math.abs(spike) > 30) {
        anomalies.push({
          asset_symbol: symbol,
          volume_spike: parseFloat(spike.toFixed(2)),
          average_volume: Math.floor(avgVolume),
          current_volume: Math.floor(currentVolume),
          anomaly_type: spike > 0 ? "spike" : "drop",
          chain: result.data.chain,
          timestamp: new Date().toISOString(),
        });

        console.log(
          `[RADAR] Volume ${spike > 0 ? "spike" : "drop"} detected for ${symbol}: ${spike.toFixed(1)}%`,
        );
      }

      // Update history
      if (!history[symbol]) history[symbol] = [];
      history[symbol].push(currentVolume);
      if (history[symbol].length > 7) history[symbol].shift(); // Keep last 7 readings
    } catch (error) {
      console.error(`[RADAR] Error checking ${symbol}:`, error.message);
    }
  }

  // Save history
  anomalyCache.set("history", history);

  // Store anomalies
  anomalyCache.set("latest", {
    data: anomalies,
    timestamp: Date.now(),
  });

  return anomalies;
}

// HTTP Server
console.log("[RADAR] Radar Service starting on port 3005...");

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost:3005");
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");

  // Health check
  if (url.pathname === "/health") {
    res.end(
      JSON.stringify({
        status: "healthy",
        service: "radar_service",
        cacheSize: trendingCache.size + anomalyCache.size,
        timestamp: new Date().toISOString(),
      }),
    );
    return;
  }

  // Get trending assets
  if (url.pathname === "/trending") {
    // Check cache first (5 minute TTL)
    const cached = trendingCache.get("latest");
    if (cached && Date.now() - cached.timestamp < 300000) {
      console.log("[RADAR] Returning cached trending data");
      res.end(
        JSON.stringify({
          success: true,
          data: cached.data,
          cached: true,
        }),
      );
      return;
    }

    // Fetch fresh data
    try {
      const trending = await detectTrendingAssets();
      res.end(
        JSON.stringify({
          success: true,
          data: trending,
          cached: false,
        }),
      );
    } catch (error) {
      console.error("[RADAR] Error detecting trending:", error);
      res.statusCode = 500;
      res.end(
        JSON.stringify({
          error: "Detection failed",
          message: "Radar temporarily scanning... 🔍 Please try again!",
        }),
      );
    }
    return;
  }

  // Get volume anomalies
  if (url.pathname === "/anomalies") {
    try {
      const anomalies = await detectVolumeAnomalies();
      res.end(
        JSON.stringify({
          success: true,
          data: anomalies,
        }),
      );
    } catch (error) {
      console.error("[RADAR] Error detecting anomalies:", error);
      res.statusCode = 500;
      res.end(
        JSON.stringify({
          error: "Detection failed",
          message: "Volume scan in progress... 📊",
        }),
      );
    }
    return;
  }

  // Run full scan
  if (url.pathname === "/scan") {
    try {
      const [trending, anomalies] = await Promise.all([
        detectTrendingAssets(),
        detectVolumeAnomalies(),
      ]);

      res.end(
        JSON.stringify({
          success: true,
          trending: trending.length,
          anomalies: anomalies.length,
          message: `Radar scan complete: ${trending.length} trending, ${anomalies.length} anomalies detected`,
        }),
      );
    } catch (error) {
      console.error("[RADAR] Scan error:", error);
      res.statusCode = 500;
      res.end(
        JSON.stringify({
          error: "Scan failed",
          message: "Radar scanning the markets... 🎯",
        }),
      );
    }
    return;
  }

  // Default response
  res.end(
    JSON.stringify({
      service: "OpenJoey Radar Service",
      endpoints: ["/health", "/trending", "/anomalies", "/scan"],
      data_source: "Price Service (Live API)",
    }),
  );
});

server.listen(3005, () => {
  console.log("[RADAR] Radar Service running on port 3005");
  console.log("[RADAR] Endpoints: /health, /trending, /anomalies, /scan");
  console.log("[RADAR] Data source: Price Service (Live API)");
});
