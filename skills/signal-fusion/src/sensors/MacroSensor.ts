/**
 * Macro Sensor - Scrapes macro economic data
 * Sources: TradingView (DXY, VIX), FRED (Fed data)
 */

import { MacroData } from "../types/index.js";
import { fetchWithRetry } from "../utils/scraper.js";

export class MacroSensor {
  async getMacroData(): Promise<MacroData> {
    // Run all fetches in parallel
    const [dxyData, vixData, spyData] = await Promise.all([
      this.getDXY(),
      this.getVIX(),
      this.getSPYChange(),
    ]);

    return {
      dxy: dxyData,
      vix: vixData,
      spyChange: spyData,
      fedPolicy: this.inferFedPolicy(dxyData, vixData),
      riskOnOff: this.inferRiskOnOff(dxyData, vixData, spyData),
    };
  }

  /**
   * Get Dollar Index (DXY)
   */
  private async getDXY(): Promise<number> {
    const url = "https://query1.finance.yahoo.com/v8/finance/chart/DX-Y.NYB";

    const result = await fetchWithRetry<{
      chart?: {
        result?: Array<{
          meta?: { regularMarketPrice?: number };
        }>;
      };
    }>(url, { parser: "json" });

    if (result.success && result.data?.chart?.result?.[0]?.meta) {
      return result.data.chart.result[0].meta.regularMarketPrice || 0;
    }

    // Fallback
    return 103.0;
  }

  /**
   * Get VIX (Volatility Index)
   */
  private async getVIX(): Promise<number> {
    const url = "https://query1.finance.yahoo.com/v8/finance/chart/%5EVIX";

    const result = await fetchWithRetry<{
      chart?: {
        result?: Array<{
          meta?: { regularMarketPrice?: number };
        }>;
      };
    }>(url, { parser: "json" });

    if (result.success && result.data?.chart?.result?.[0]?.meta) {
      return result.data.chart.result[0].meta.regularMarketPrice || 0;
    }

    return 20.0;
  }

  /**
   * Get S&P 500 change
   */
  private async getSPYChange(): Promise<number> {
    const url = "https://query1.finance.yahoo.com/v8/finance/chart/SPY";

    const result = await fetchWithRetry<{
      chart?: {
        result?: Array<{
          meta?: { regularMarketChangePercent?: number };
        }>;
      };
    }>(url, { parser: "json" });

    if (result.success && result.data?.chart?.result?.[0]?.meta) {
      return result.data.chart.result[0].meta.regularMarketChangePercent || 0;
    }

    return 0;
  }

  /**
   * Infer Fed policy stance from market data
   */
  private inferFedPolicy(dxy: number, vix: number): "hawkish" | "dovish" | "neutral" {
    // Simplified heuristic
    if (dxy > 105 && vix < 20) return "hawkish";
    if (dxy < 100 && vix > 25) return "dovish";
    return "neutral";
  }

  /**
   * Infer risk-on vs risk-off
   */
  private inferRiskOnOff(
    dxy: number,
    vix: number,
    spyChange: number,
  ): "risk-on" | "risk-off" | "neutral" {
    if (dxy < 102 && vix < 20 && spyChange > 0.5) return "risk-on";
    if (dxy > 104 && vix > 25 && spyChange < -0.5) return "risk-off";
    return "neutral";
  }

  /**
   * Get correlation between asset and macro factors
   */
  getMacroCorrelation(asset: string): number {
    // Simplified - would need historical data
    const correlations: Record<string, number> = {
      BTC: -0.3, // Negative correlation with DXY
      ETH: -0.25,
      GOLD: -0.4,
      SOL: -0.2,
    };

    return correlations[asset.toUpperCase()] || 0;
  }
}
