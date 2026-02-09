---
name: sentiment-tracker
description: >
  Elite social sentiment and news awareness system. Tracks Twitter, Reddit, 
  news headlines, and influencer activity to gauge market mood for any asset.
  Detects FUD, FOMO, and narrative shifts in real-time.
metadata:
  openclaw:
    emoji: "🎭"
    requires:
      bins: ["curl", "jq"]
    env: []
---

# Sentiment Tracker — Market Mood & News Awareness

> **Disclaimer**: Sentiment is a lagging indicator and often contrarian. Use this data as one piece of the puzzle. Not financial advice.

## Overview

Sentiment Tracker gauges the collective mood of the market for any asset (stocks, crypto, forex, etc.). It helps you identify when a narrative is heating up or when fear is peak-exhaustion.

## When to Activate

- User asks: "what's the sentiment on X", "is there FUD about X", "what are people saying about X"
- User mentions: FOMO, FUD, viral, bull post, bear post, sentiment
- User asks about recent news or headlines for an asset

## Data Sources (All Free)

### Social Media

- **Twitter/X**: web_search "twitter {asset} sentiment", "site:twitter.com {ticker}"
- **Reddit**: web_search "reddit {asset} discussion", "site:reddit.com/r/cryptocurrency {ticker}"

### News & Headlines

- **Crypto News**: https://cryptopanic.com/api/v1/posts/?auth_token=FREE_TIER&text={ticker}
- **Stock News**: https://api.marketaux.com/v1/news/all?symbols={ticker}&filter_entities=true&language=en&api_token=DEMO
- **General**: web_search "{asset} breaking news", "{asset} latest headlines"

### Mood Indicators

- **Crypto Fear & Greed**: https://api.alternative.me/fng/
- **Bull/Bear Ratio**: web_search "{asset} bull bear ratio"

## Analysis Framework

1. **Social Velocity**: How fast are mentions growing?
2. **Polarity**: Is the talk mostly positive (FOMO) or negative (FUD)?
3. **Influencer Mapping**: Are key accounts shilling or slamming?
4. **Headline Impact**: How big is the news? Is it priced in?
5. **Narrative Type**: Is it a tech narrative, macro, or just meme hype?

## Output Format

```
🎭 SENTIMENT TRACKER — {ASSET}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 OVERALL MOOD: {BULLISH FOMO | CAUTIOUS | NEUTRAL | PEAK FUD}

🔥 MOMENTUM: {Exploding | Stable | Declining}
📈 SOCIAL SCORE: {1-10}/10

════════════════════════════════
🐦 SOCIAL VIBES (Twitter/Reddit)
════════════════════════════════
• Mentions (24h): ~{count} ({trend}%)
• Narrative: "{primary narrative}"
• Sentiment: {Positive/Negative}
• Top Topic: "{top topic of discussion}"

════════════════════════════════
📰 NEWS & HEADLINES
════════════════════════════════
• Recent: "{Headline 1}" ({Source})
• Impact: {High/Medium/Low}
• Sentiment: {Bullish/Bearish}

• Recent: "{Headline 2}" ({Source})
• Impact: {High/Medium/Low}

════════════════════════════════
🚦 SENTIMENT SIGNALS
════════════════════════════════
| Signal | Value | Note |
|--------|-------|------|
| Fear & Greed | {value} | {status} |
| Put/Call Ratio | {ratio} | {bullish/bearish} |
| Funding Rate | {rate}% | {overleveraged/neutral} |

════════════════━━━━━━━━━━━━━━━━
🎯 VERDICT
════════════════━━━━━━━━━━━━━━━━
{Brief summary of sentiment impact on price action}

⚠️ CONTRARIAN WARNING: {if sentiment is extreme, suggest caution}

---
🎭 Sentiment Tracker • Market Mood Intelligence
```
