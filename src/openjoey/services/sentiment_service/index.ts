/**
 * OpenJoey Sentiment Service - Social & News Sentiment Analysis
 * Collects social mentions, news sentiment, community sentiment
 * Outputs: sentiment score, sentiment_events records
 */

import { getOpenJoeyDB } from "../../supabase-client.js";

export interface SentimentData {
  asset_symbol: string;
  sentiment_score: number; // -1.0 to 1.0 (negative to positive)
  mention_volume: number;
  news_sentiment: number;
  social_sentiment: number;
  community_sentiment: number;
  timestamp: string;
}

/**
 * Calculate overall sentiment for an asset
 */
export async function calculateSentiment(symbol: string): Promise<SentimentData> {
  const now = new Date().toISOString();

  // Fetch data from multiple sources
  const [newsSentiment, socialSentiment, communitySentiment] = await Promise.all([
    fetchNewsSentiment(symbol),
    fetchSocialSentiment(symbol),
    fetchCommunitySentiment(symbol),
  ]);

  // Weighted average
  const weights = {
    news: 0.3,
    social: 0.4,
    community: 0.3,
  };

  const sentimentScore =
    newsSentiment.score * weights.news +
    socialSentiment.score * weights.social +
    communitySentiment.score * weights.community;

  const mentionVolume =
    newsSentiment.mentions + socialSentiment.mentions + communitySentiment.mentions;

  const sentimentData: SentimentData = {
    asset_symbol: symbol,
    sentiment_score: parseFloat(sentimentScore.toFixed(2)),
    mention_volume: mentionVolume,
    news_sentiment: parseFloat(newsSentiment.score.toFixed(2)),
    social_sentiment: parseFloat(socialSentiment.score.toFixed(2)),
    community_sentiment: parseFloat(communitySentiment.score.toFixed(2)),
    timestamp: now,
  };

  // Store in database
  await storeSentimentEvent(sentimentData);

  return sentimentData;
}

/**
 * Fetch news sentiment (mock implementation)
 */
async function fetchNewsSentiment(symbol: string): Promise<{ score: number; mentions: number }> {
  // In production: integrate with news APIs (CryptoPanic, NewsAPI, etc.)
  // For now: simulate with random data
  const baseScore = Math.random() * 0.6 - 0.3; // -0.3 to 0.3
  const volatility = Math.random() * 0.4;
  const score = Math.max(
    -1,
    Math.min(1, baseScore + (Math.random() > 0.5 ? volatility : -volatility)),
  );

  return {
    score: parseFloat(score.toFixed(2)),
    mentions: Math.floor(Math.random() * 50) + 10,
  };
}

/**
 * Fetch social media sentiment (mock implementation)
 */
async function fetchSocialSentiment(symbol: string): Promise<{ score: number; mentions: number }> {
  // In production: integrate with Twitter/X API, Reddit, etc.
  // For now: simulate with random data
  const baseScore = Math.random() * 0.7 - 0.35;
  const score = Math.max(-1, Math.min(1, baseScore));

  return {
    score: parseFloat(score.toFixed(2)),
    mentions: Math.floor(Math.random() * 2000) + 500,
  };
}

/**
 * Fetch community sentiment (mock implementation)
 */
async function fetchCommunitySentiment(
  symbol: string,
): Promise<{ score: number; mentions: number }> {
  // In production: integrate with Discord, Telegram groups, forums
  // For now: simulate with random data
  const baseScore = Math.random() * 0.5 - 0.25;
  const score = Math.max(-1, Math.min(1, baseScore));

  return {
    score: parseFloat(score.toFixed(2)),
    mentions: Math.floor(Math.random() * 300) + 50,
  };
}

/**
 * Store sentiment event in database
 */
async function storeSentimentEvent(data: SentimentData): Promise<void> {
  try {
    const db = getOpenJoeyDB();
    await db.insert("sentiment_events", {
      asset_symbol: data.asset_symbol,
      sentiment_score: data.sentiment_score,
      mention_volume: data.mention_volume,
      news_sentiment: data.news_sentiment,
      social_sentiment: data.social_sentiment,
      community_sentiment: data.community_sentiment,
      created_at: data.timestamp,
    });
  } catch (error) {
    console.error("Error storing sentiment event:", error);
  }
}

/**
 * Get latest sentiment for an asset
 */
export async function getLatestSentiment(symbol: string): Promise<SentimentData | null> {
  try {
    const db = getOpenJoeyDB();
    const data = await db.get(
      "sentiment_events",
      `asset_symbol=eq.${symbol}&order=created_at.desc&limit=1`,
    );

    if (data && data.length > 0) {
      const item = data[0] as {
        asset_symbol: string;
        sentiment_score: number;
        mention_volume: number;
        news_sentiment: number;
        social_sentiment: number;
        community_sentiment: number;
        created_at: string;
      };
      return {
        asset_symbol: item.asset_symbol,
        sentiment_score: item.sentiment_score,
        mention_volume: item.mention_volume,
        news_sentiment: item.news_sentiment,
        social_sentiment: item.social_sentiment,
        community_sentiment: item.community_sentiment,
        timestamp: item.created_at,
      };
    }

    return null;
  } catch (error) {
    console.error("Error fetching sentiment:", error);
    return null;
  }
}

/**
 * Batch calculate sentiment for multiple symbols
 */
export async function batchCalculateSentiment(symbols: string[]): Promise<SentimentData[]> {
  const results: SentimentData[] = [];

  for (const symbol of symbols) {
    try {
      const sentiment = await calculateSentiment(symbol);
      results.push(sentiment);

      // Add delay to avoid rate limits
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Error calculating sentiment for ${symbol}:`, error);
    }
  }

  return results;
}

/**
 * Auto-update sentiment for top assets
 */
export async function autoUpdateTopSentiment(): Promise<void> {
  const topSymbols = ["BTC", "ETH", "SOL", "RAY", "AVAX", "MATIC", "DOT", "LINK"];

  console.log(`Updating sentiment for ${topSymbols.length} assets...`);
  const results = await batchCalculateSentiment(topSymbols);
  console.log(`Sentiment updated for ${results.length} assets`);
}
