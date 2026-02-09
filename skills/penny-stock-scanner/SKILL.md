---
name: penny-stock-scanner
description: >
  Specialized scanner for low-priced stocks (under $5), OTC listings, 
  and small-cap breakouts. Identifies volume spikes, gap-ups, and momentum plays.
metadata:
  openclaw:
    emoji: "🚀"
    requires:
      bins: ["curl", "jq"]
    env: []
---

# Penny Stock Scanner — Micro-Cap Discovery

> **Disclaimer**: Penny stocks are extremely volatile and illiquid. Most pump-and-dumps happen here. Only play with money you can afford to lose.

## Overview

Penny Stock Scanner filters the thousands of low-cap stocks to find those with high relative volume, fresh news, or technical breakouts.

## When to Activate

- User asks: "find me penny stocks", "what's the best stock under $1", "penny stock breakouts"
- User mentions: OTC, pink sheets, reverse merger, small cap, low float
- User wants high-risk, high-reward equity plays

## Data Sources (All Free)

### Scanners

- **Finviz Penny**: https://finviz.com/screener.ashx?v=111&f=sh_price_u5,ta_perf_dayup&ft=4
- **OTC Markets**: web_search "otcmarkets.com most active"
- **StockTwits**: web_search "stocktwits trending penny stocks"

### Technicals

- **Yahoo Finance**: https://query1.finance.yahoo.com/v8/finance/chart/{ticker}
- **ChartMill**: web_search "chartmill penny stock setup {ticker}"

## Analysis Framework

1. **Float Analysis**: Is it a "low float" (>10M shares) prone to explosive moves?
2. **Volume Spike**: Is the current volume >3x the 10-day average?
3. **Catalyst**: Why is it moving? (Pharma results, earnings, merger, Twitter hype?)
4. **Liquidity**: Can you actually get out of a $1,000 position?

## Output Format

```
🚀 PENNY STOCK SCANNER — {TRENDING}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 TOP MICRO-CAP BREAKOUTS
════════════════════════════════
| Ticker | Price | Change | Vol | Catalyst |
|--------|-------|--------|-----|----------|
| {1}    | ${p}  | +{pct}%| {v} | {News}   |
| {2}    | ${p}  | +{pct}%| {v} | {Technical}|
| {3}    | ${p}  | +{pct}%| {v} | {Hype}   |

════════════════════════════════
🔍 LOW FLOAT WATCHLIST
════════════════════════════════
• {Ticker 1} — {float}M shares — RSI: {rsi}
• {Ticker 2} — {float}M shares — RSI: {rsi}

════════════════━━━━━━━━━━━━━━━━
🎯 VERDICT
════════════════━━━━━━━━━━━━━━━━
{Brief summary of the day's penny stock environment}

⚠️ WARNING: Watch for dilution and pump-and-dumps.
---
🚀 Penny Stock Scanner • High-Risk Intelligence
```
