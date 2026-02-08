/**
 * Social Sensor - Scrapes social media sentiment
 * Sources: Nitter (Twitter), Reddit, Google News
 */

import * as cheerio from "cheerio";
import { SocialData, Mention } from "../types/index.js";
import { fetchWithRetry, CheerioAPI } from "../utils/scraper.js";

export class SocialSensor {
  async getSentiment(asset: string, subreddit?: string): Promise<SocialData | null> {
    // Run all sources in parallel
    const [twitterData, redditData] = await Promise.all([
      this.getTwitterSentiment(asset),
      this.getRedditSentiment(subreddit || this.getSubreddit(asset), asset),
    ]);

    // Aggregate results
    const mentions: Mention[] = [...(twitterData?.mentions || []), ...(redditData?.mentions || [])];

    // Calculate aggregate sentiment
    const totalSentiment = mentions.reduce((sum, m) => sum + m.sentiment, 0);
    const avgSentiment = mentions.length > 0 ? totalSentiment / mentions.length : 0;

    return {
      sentimentScore: avgSentiment,
      volume24h: mentions.length,
      trending: mentions.length > 50, // Arbitrary threshold
      mentions: mentions.slice(0, 20), // Top 20 mentions
      sources: {
        twitter: twitterData?.volume24h || 0,
        reddit: redditData?.volume24h || 0,
        news: 0,
      },
    };
  }

  /**
   * Get Twitter sentiment via Nitter (no auth required)
   */
  private async getTwitterSentiment(query: string): Promise<Partial<SocialData>> {
    const url = `https://nitter.net/search?q=${encodeURIComponent(query)}&f=tweets`;

    const result = await fetchWithRetry<string>(url, {
      parser: "text",
      timeout: 15000, // Nitter can be slow
    });

    if (!result.success || !result.data) {
      return { volume24h: 0, mentions: [] };
    }

    const $ = cheerio.load(result.data);
    const mentions: Mention[] = [];

    // Parse tweets
    $(".timeline-item").each((_, item) => {
      const text = $(item).find(".tweet-content").text().trim();
      const engagement = parseInt($(item).find(".icon-retweet").parent().text() || "0");
      const timeText = $(item).find(".tweet-date").text();

      if (text) {
        mentions.push({
          source: "twitter",
          text: text.substring(0, 200),
          sentiment: this.analyzeSentiment(text),
          engagement: engagement || 1,
          timestamp: this.parseTime(timeText),
        });
      }
    });

    return {
      volume24h: mentions.length,
      mentions,
    };
  }

  /**
   * Get Reddit sentiment
   */
  private async getRedditSentiment(subreddit: string, query: string): Promise<Partial<SocialData>> {
    const url = `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(query)}&limit=25`;

    const result = await fetchWithRetry<{
      data?: {
        children?: Array<{
          data?: {
            title?: string;
            selftext?: string;
            score?: number;
            num_comments?: number;
            created_utc?: number;
            url?: string;
          };
        }>;
      };
    }>(url, { parser: "json" });

    if (!result.success || !result.data?.data?.children) {
      return { volume24h: 0, mentions: [] };
    }

    const mentions: Mention[] = result.data.data.children.map((post) => {
      const text = `${post.data?.title || ""} ${post.data?.selftext || ""}`;
      return {
        source: "reddit",
        text: text.substring(0, 200),
        sentiment: this.analyzeSentiment(text),
        engagement: (post.data?.score || 0) + (post.data?.num_comments || 0),
        timestamp: new Date((post.data?.created_utc || 0) * 1000),
      };
    });

    return {
      volume24h: mentions.length,
      mentions,
    };
  }

  /**
   * Simple sentiment analysis using keyword matching
   */
  private analyzeSentiment(text: string): number {
    const lower = text.toLowerCase();

    const bullishWords = [
      "bullish",
      "pump",
      "moon",
      "buy",
      "long",
      "gain",
      "profit",
      "up",
      "rise",
      "growth",
      "rocket",
    ];
    const bearishWords = [
      "bearish",
      "dump",
      "crash",
      "sell",
      "short",
      "loss",
      "down",
      "fall",
      "drop",
      "panic",
      "rug",
    ];

    let score = 0;

    bullishWords.forEach((word) => {
      if (lower.includes(word)) score += 0.2;
    });

    bearishWords.forEach((word) => {
      if (lower.includes(word)) score -= 0.2;
    });

    // Clamp between -1 and 1
    return Math.max(-1, Math.min(1, score));
  }

  /**
   * Parse relative time from Nitter
   */
  private parseTime(timeText: string): Date {
    const now = new Date();

    if (timeText.includes("h")) {
      const hours = parseInt(timeText) || 0;
      return new Date(now.getTime() - hours * 60 * 60 * 1000);
    }
    if (timeText.includes("m")) {
      const minutes = parseInt(timeText) || 0;
      return new Date(now.getTime() - minutes * 60 * 1000);
    }

    return now;
  }

  /**
   * Map asset to appropriate subreddit
   */
  private getSubreddit(asset: string): string {
    const mappings: Record<string, string> = {
      BTC: "Bitcoin",
      ETH: "ethereum",
      SOL: "solana",
      AAPL: "wallstreetbets",
      TSLA: "wallstreetbets",
      GME: "wallstreetbets",
      AMC: "wallstreetbets",
    };

    return mappings[asset.toUpperCase()] || "cryptocurrency";
  }
}
