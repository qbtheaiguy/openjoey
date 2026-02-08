/**
 * News Sensor - Scrapes news and detects catalysts
 * Sources: Google News, CryptoPanic
 */

import { NewsData, NewsArticle } from "../types/index.js";
import { fetchWithRetry } from "../utils/scraper.js";

export class NewsSensor {
  async getNews(asset: string): Promise<NewsData> {
    const [googleNews, cryptoNews] = await Promise.all([
      this.getGoogleNews(asset),
      this.getCryptoNews(asset),
    ]);

    // Merge and deduplicate
    const allArticles = [...googleNews, ...cryptoNews];
    const uniqueArticles = this.deduplicateArticles(allArticles);

    // Detect catalysts
    const catalyst = this.detectCatalyst(uniqueArticles);
    const breakingNews = uniqueArticles.some(
      (a) => a.title.toLowerCase().includes("breaking") || a.title.toLowerCase().includes("urgent"),
    );

    return {
      articles: uniqueArticles.slice(0, 10),
      breakingNews,
      catalystDetected: catalyst,
    };
  }

  /**
   * Get news from Google News
   */
  private async getGoogleNews(query: string): Promise<NewsArticle[]> {
    const url = `https://news.google.com/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;

    const result = await fetchWithRetry<string>(url, { parser: "text" });

    if (!result.success || !result.data) {
      return [];
    }

    // Parse Google News RSS-like structure
    const articles: NewsArticle[] = [];

    // Extract article titles and links using regex
    const titleMatches = result.data.matchAll(/<a[^>]*aria-label="([^"]+)"[^>]*href="([^"]+)"/g);

    for (const match of titleMatches) {
      const title = match[1];
      const link = match[2];

      if (title && link && this.isRelevant(title, query)) {
        articles.push({
          title: title.substring(0, 200),
          source: "Google News",
          url: link.startsWith("http") ? link : `https://news.google.com${link}`,
          sentiment: this.analyzeNewsSentiment(title),
          timestamp: new Date(),
        });
      }
    }

    return articles.slice(0, 5);
  }

  /**
   * Get crypto-specific news
   */
  private async getCryptoNews(crypto: string): Promise<NewsArticle[]> {
    const url = `https://cryptopanic.com/news/${crypto.toLowerCase()}/`;

    const result = await fetchWithRetry<string>(url, { parser: "text" });

    if (!result.success || !result.data) {
      return [];
    }

    const articles: NewsArticle[] = [];

    // Parse CryptoPanic news items
    const newsMatches = result.data.matchAll(
      /<div[^>]*news-item[^>]*>.*?<a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/g,
    );

    for (const match of newsMatches) {
      const url = match[1];
      const title = match[2];

      if (title && url) {
        articles.push({
          title: title.trim().substring(0, 200),
          source: "CryptoPanic",
          url: url.startsWith("http") ? url : `https://cryptopanic.com${url}`,
          sentiment: this.analyzeNewsSentiment(title),
          timestamp: new Date(),
        });
      }
    }

    return articles.slice(0, 5);
  }

  /**
   * Check if article is relevant to asset
   */
  private isRelevant(title: string, asset: string): boolean {
    const lowerTitle = title.toLowerCase();
    const lowerAsset = asset.toLowerCase();

    return (
      lowerTitle.includes(lowerAsset) ||
      lowerTitle.includes(asset.toUpperCase()) ||
      lowerTitle.includes(this.getAssetName(asset).toLowerCase())
    );
  }

  /**
   * Get full name for common assets
   */
  private getAssetName(asset: string): string {
    const names: Record<string, string> = {
      BTC: "bitcoin",
      ETH: "ethereum",
      SOL: "solana",
      AAPL: "apple",
      TSLA: "tesla",
    };
    return names[asset.toUpperCase()] || asset;
  }

  /**
   * Analyze sentiment of news title
   */
  private analyzeNewsSentiment(title: string): number {
    const lower = title.toLowerCase();

    const positive = [
      "surge",
      "rally",
      "gain",
      "rise",
      "bullish",
      "breakthrough",
      "partnership",
      "adoption",
    ];
    const negative = [
      "crash",
      "plunge",
      "fall",
      "decline",
      "bearish",
      "hack",
      "lawsuit",
      "ban",
      "regulatory",
    ];

    let score = 0;
    positive.forEach((w) => {
      if (lower.includes(w)) score += 0.3;
    });
    negative.forEach((w) => {
      if (lower.includes(w)) score -= 0.3;
    });

    return Math.max(-1, Math.min(1, score));
  }

  /**
   * Detect catalyst from news
   */
  private detectCatalyst(articles: NewsArticle[]): string | undefined {
    const catalystKeywords = [
      "earnings",
      "fda",
      "approval",
      "partnership",
      "listing",
      "upgrade",
      "merger",
      "acquisition",
      "mainnet",
      "launch",
      "etf",
    ];

    for (const article of articles) {
      const lower = article.title.toLowerCase();
      for (const keyword of catalystKeywords) {
        if (lower.includes(keyword)) {
          return `${keyword}: ${article.title.substring(0, 50)}...`;
        }
      }
    }

    return undefined;
  }

  /**
   * Deduplicate articles by title similarity
   */
  private deduplicateArticles(articles: NewsArticle[]): NewsArticle[] {
    const seen = new Set<string>();
    return articles.filter((article) => {
      const key = article.title.toLowerCase().substring(0, 50);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Detect upcoming earnings for stocks
   */
  async detectEarningsCatalyst(ticker: string): Promise<Date | undefined> {
    // Would need to scrape earnings calendar
    // Placeholder for now
    return undefined;
  }
}
