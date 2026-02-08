/**
 * SensorHub - Coordinates all sensors with parallel execution
 * Target: 3-5 seconds total for all data collection
 */

import { SensorData, MarketType } from "../types/index.js";
import { MacroSensor } from "./MacroSensor.js";
import { NewsSensor } from "./NewsSensor.js";
import { OnChainSensor } from "./OnChainSensor.js";
import { PriceFeedSensor } from "./PriceFeedSensor.js";
import { SocialSensor } from "./SocialSensor.js";

export class SensorHub {
  private priceSensor: PriceFeedSensor;
  private onChainSensor: OnChainSensor;
  private socialSensor: SocialSensor;
  private macroSensor: MacroSensor;
  private newsSensor: NewsSensor;

  constructor() {
    this.priceSensor = new PriceFeedSensor();
    this.onChainSensor = new OnChainSensor();
    this.socialSensor = new SocialSensor();
    this.macroSensor = new MacroSensor();
    this.newsSensor = new NewsSensor();
  }

  /**
   * Gather all data for an asset in parallel
   * Target: 3-5 seconds total
   */
  async gatherAllData(asset: string, marketType: MarketType): Promise<SensorData> {
    const startTime = Date.now();

    // Build task list based on market type
    const tasks: Promise<unknown>[] = [];
    const taskNames: string[] = [];

    // Price data - always needed
    tasks.push(this.priceSensor.getPrice(asset, marketType));
    taskNames.push("price");

    // Market-specific sensors
    if (marketType === "crypto") {
      tasks.push(
        this.onChainSensor.getOnChainData(asset, "solana"),
        this.onChainSensor.getWhaleActivity(asset, "solana"),
      );
      taskNames.push("onchain", "whale");
    }

    // Social and news - relevant for all
    tasks.push(this.socialSensor.getSentiment(asset), this.newsSensor.getNews(asset));
    taskNames.push("social", "news");

    // Macro - fetch once (not asset-specific)
    if (marketType !== "crypto") {
      tasks.push(this.macroSensor.getMacroData());
      taskNames.push("macro");
    }

    // Execute ALL tasks in parallel
    const results = await Promise.allSettled(tasks);

    // Aggregate results
    const data: SensorData = {
      asset,
      marketType,
      timestamp: new Date(),
    };

    results.forEach((result, index) => {
      const name = taskNames[index];

      if (result.status === "fulfilled" && result.value) {
        switch (name) {
          case "price":
            data.price = result.value as SensorData["price"];
            break;
          case "onchain":
            data.onchain = result.value as SensorData["onchain"];
            break;
          case "whale":
            data.whale = result.value as SensorData["whale"];
            break;
          case "social":
            data.social = result.value as SensorData["social"];
            break;
          case "news":
            data.news = result.value as SensorData["news"];
            break;
          case "macro":
            data.macro = result.value as SensorData["macro"];
            break;
        }
      }
    });

    const duration = Date.now() - startTime;
    console.log(`[SensorHub] Gathered data for ${asset} in ${duration}ms`);

    return data;
  }

  /**
   * Quick price check only
   */
  async getPriceOnly(asset: string, marketType: MarketType) {
    return this.priceSensor.getPrice(asset, marketType);
  }

  /**
   * Get whale data for crypto assets
   */
  async getWhaleData(asset: string, chain: "solana" | "ethereum" = "solana") {
    return this.onChainSensor.getWhaleActivity(asset, chain);
  }

  /**
   * Get social sentiment
   */
  async getSocialSentiment(asset: string, subreddit?: string) {
    return this.socialSensor.getSentiment(asset, subreddit);
  }

  /**
   * Get macro data
   */
  async getMacroData() {
    return this.macroSensor.getMacroData();
  }
}
