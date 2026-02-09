---
name: news-alerts
description: >
  Real-time breaking news monitoring and alerting system. Tracks world-wide
  financial news, corporate announcements, and regulatory updates (SEC, Fed, ECB).
metadata:
  openclaw:
    emoji: "📢"
    requires:
      bins: ["curl", "jq"]
    env: []
---

# News Alerts — Real-Time Market Intelligence

> **Disclaimer**: News is fast. By the time it hits the wire, bots have often already traded it. Wait for the "retrace" or the "continuation" confirmation.

## Overview

News Alerts monitors the global news cycle for events that will impact asset prices. It understands the difference between "noise" and "signal".

## When to Activate

- User asks: "what happened to X", "why is X dropping", "any big news today"
- User mentions: breaking news, headline, announcement, SEC filing, earnings report
- User wants to stay ahead of the news cycle

## Data Sources (All Free)

### News Terminals (Free Versions)

- **Financial Juice**: web_search "financialjuice breaking news"
- **Yahoo Finance News**: https://query1.finance.yahoo.com/v1/finance/news?symbols={ticker}
- **CryptoPanic**: https://cryptopanic.com/api/v1/posts/?auth_token=FREE_TIER&text={ticker}

### Regulatory Bodies

- **SEC EDGAR**: web_search "SEC latest filings"
- **Fed Press Releases**: https://www.federalreserve.gov/newsevents/pressreleases.htm

## Analysis Framework

1. **Significance**: Is this "Earth-shaking" (Fed rate cut) or "Minor" (CEO speaking at a local lunch)?
2. **Sentiment Polarity**: Is the news clearly good or bad for the asset?
3. **Priced In?**: Was the market already expecting this? (e.g., "sell the news")
4. **Follow-on Impact**: Does this news trigger other events (liquidations, cascading sells)?

## Output Format

```
📢 NEWS ALERTS — {ASSET/SECTOR}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚨 RECENT BREAKING NEWS
════════════════════════════════
| Time | Headline | Source | Impact |
|------|----------|--------|--------|
| {t}  | "{News}" | {wsj}  | {HIGH} |
| {t}  | "{News}" | {reut} | {MED}  |

════════════════════════════════
⚖️ MARKET REACTION
════════════════━━━━━━━━━━━━━━━━
• Immediate Move: {pct}%
• Volume Spike: {x}x
• Sentiment Shift: {Bullish/Bearish}

════════════════━━━━━━━━━━━━━━━━
🎯 VERDICT & OUTLOOK
════════════════━━━━━━━━━━━━━━━━
{Brief summary of how this news shapes the short-term trend for the asset}

---
📢 News Alerts • Real-Time Intelligence
```
