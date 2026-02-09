---
name: insider-tracker
description: >
  Tracks "insider" buying and selling activity for stocks and crypto. 
  Monitors SEC filings (Form 4) for stocks and whale/founder wallets for crypto.
metadata:
  openclaw:
    emoji: "🕵️"
    requires:
      bins: ["curl", "jq"]
    env: []
---

# Insider Tracker — Follow the Smart Money

> **Disclaimer**: Insider activity is one signal among many. "Insiders" sell for many reasons (taxes, diversification), but they usually only buy for one: they think the price is going up.

## Overview

Insider Tracker monitors what executives, board members, and major token holders (whales/founders) are doing with their holdings.

## When to Activate

- User asks: "are insiders buying X", "what is the CEO of X doing", "track dev wallets for token X"
- User mentions: SEC filings, Form 4, insider selling, whale moves, founder locks
- User wants to know if the "team" is dumping or accumulating

## Data Sources (All Free)

### Stocks (SEC Filings)

- **OpenInsider**: web_search "openinsider {ticker}"
- **EDGAR**: web_search "SEC Form 4 {ticker}"
- **Finviz**: https://finviz.com/quote.ashx?t={ticker} (Insider Trading table)

### Crypto (Wallet Tracking)

- **Solscan/Etherscan**: web_search "{ticker} top holders", "{ticker} creator wallet"
- **Bubblemaps**: web_search "bubblemaps {token_address}"

## Analysis Framework

1. **Volume Profile**: Is it a "cluster" buy (multiple insiders) or a lone actor?
2. **Relative Size**: Is this a significant % of their total holdings?
3. **Price Context**: Are they buying at the bottom or selling at the top?
4. **Reliability**: Does this insider have a history of good timing?

## Output Format

```
🕵️ INSIDER TRACKER — {ASSET}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 INSIDER SENTIMENT: {BULLISH CLUSTER | MODERATE BUYING | NEUTRAL | HEAVY SELLING}

════════════════════════════════
📋 RECENT TRANSACTIONS (Last 90d)
════════════════════════════════
| Name | Title | Action | Amount | Price | Date |
|------|-------|--------|--------|-------|------|
| {1}  | {CEO} | {BUY}  | ${qty} | ${p} | {d}  |
| {2}  | {Dir} | {SELL} | ${qty} | ${p} | {d}  |

════════════════════════════════
🐋 CRYPTO WHALE/DEV WATCH
════════════════════════════════
• Creator Wallet: {Holding/Selling/Empty}
• Top 10 Holders: {Accumulating/Distributing}
• Notable Moves: "{Whale X moved ${amount} to exchange}"

════════════════━━━━━━━━━━━━━━━━
🎯 INSIDER VERDICT
════════════════━━━━━━━━━━━━━━━━
{Brief summary of whether the "pros" are betting on or against the asset}

---
🕵️ Insider Tracker • Smart Money Intelligence
```
