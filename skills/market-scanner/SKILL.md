---
name: market-scanner
description: >
  Global multi-asset scanner. Finds assets meeting specific criteria like 
  "most volatile", "highest volume spike", "RSI oversold", or "fresh momentum" 
  across stocks, crypto, and forex.
metadata:
  openclaw:
    emoji: "🛰️"
    requires:
      bins: ["curl", "jq"]
    env: []
---

# Market Scanner — Global Opportunity Finder

> **Disclaimer**: Scanners find candidates, not guarantees. Every result needs individual deep-dive analysis.

## Overview

Market Scanner is the "satellite" that watches all markets to find outliers. It helps you find what's moving before it hits the mainstream news.

## When to Activate

- User asks: "what's the most volatile stock today", "find crypto with RSI < 30", "who had a volume spike in forex"
- User mentions: scanner, screener, top gainers, bottom losers, oversold, overbought
- User wants a list of candidates to analyze further

## Data Sources (All Free)

### Global Scanners

- **TradingView**: https://www.tradingview.com/screener/
- **Finviz**: https://finviz.com/screener.ashx
- **DexScreener**: https://api.dexscreener.com/latest/dex/search?q={filter}

### Specific Criteria

- **Volume Spikes**: web_search "unusual volume scanner today"
- **Technical Setups**: web_search "bullish crossover scanner stocks"

## Analysis Framework

1. **Filtering**: Apply the user's criteria strictly.
2. **Quality Check**: Filter out "trash" (no liquidity, broken tickers).
3. **Context**: Is the move part of a sector-wide trend or an isolated event?
4. **Rank**: Present results in order of strongest signal first.

## Output Format

```
🛰️ MARKET SCANNER — {CRITERIA}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 TOP RESULTS FOR: "{User Criteria}"

════════════════════════════════
📊 TOP CANDIDATES
════════════════════════════════
| Asset | Price | Vol/Avg | Signal | Verdict |
|-------|-------|---------|--------|---------|
| {1}   | ${p}  | {x}     | {rsi}  | {HOT}   |
| {2}   | ${p}  | {x}     | {rsi}  | {WATCH} |
| {3}   | ${p}  | {x}     | {rsi}  | {CONSIDER}|

════════════════════════════════
⚡ SECTOR MOVEMENT
════════════════━━━━━━━━━━━━━━━━
{Identify if multiple results are in the same sector, e.g., "Solar stocks are pumping"}

════════════════━━━━━━━━━━━━━━━━
🎯 SCANNER VERDICT
════════════════━━━━━━━━━━━━━━━━
{Brief summary of the scan results and which one looks most promising}

---
🛰️ Market Scanner • Global Intelligence
```
