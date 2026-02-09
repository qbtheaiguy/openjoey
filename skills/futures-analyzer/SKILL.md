---
name: futures-analyzer
description: >
  Deep futures market analysis system. Monitors Open Interest (OI), 
  funding rates, liquidations, and curve structure (contango/backwardation) 
  for crypto, indices, and commodity futures.
metadata:
  openclaw:
    emoji: "⏳"
    requires:
      bins: ["curl", "jq"]
    env: []
---

# Futures Analyzer — Derivatives Intelligence

> **Disclaimer**: Futures use leverage, which can wipe you out in seconds. This skill provides research on market structure, not trade execution.

## Overview

Futures Analyzer helps you see "behind" the price action by looking at the positioning of traders in the derivatives market.

## When to Activate

- User asks: "what's the funding rate for X", "is there a short squeeze coming", "check futures OI for X"
- User mentions: liquidations, open interest, funding, contango, backwardation, perpetuals
- User wants to know if the market is "overleveraged"

## Data Sources (All Free)

### Crypto Futures

- **Coinglass**: web_search "coinglass {ticker} open interest", "coinglass funding rates"
- **Deribit/Binance**: web_search "binance futures data {ticker}"

### Commodity/Index Futures

- **CME Group**: web_search "CME {symbol} volume and open interest"
- **Yahoo Finance**: https://query1.finance.yahoo.com/v8/finance/chart/{symbol}=F

## Analysis Framework

1. **Leverage Heat**: Are funding rates extremely positive (overbought) or negative (oversold)?
2. **Liquidation Map**: Where are the big "pools" of liquidations that could trigger a squeeze?
3. **OI Trend**: Is Open Interest rising with price (healthy trend) or falling (exhaustion)?
4. **Term Structure**: Is the future price higher than spot (contango) or lower (backwardation)?

## Output Format

```
⏳ FUTURES ANALYZER — {ASSET}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 MARKET STRUCTURE: {OVERLEVERAGED (LONG) | NEUTRAL | SHORT SQUEEZE RISK}

════════════════════════════════
⛓️ DERIVATIVES SNAPSHOT
════════════════════════════════
• Open Interest: {value} ({trend})
• Funding Rate: {rate}%
• 24h Liquidations: ${amt} ({longs}/{shorts})

════════════════════════════════
🎯 SQUEEZE POTENTIAL
════════════════━━━━━━━━━━━━━━━━
| Side | Target | Level |
|------|--------|-------|
| Shorts| ${Price}| {High/Low} Squeeze Risk |
| Longs | ${Price}| {High/Low} Liquidation Risk|

════════════════━━━━━━━━━━━━━━━━
🎯 FUTURES VERDICT
════════════════━━━━━━━━━━━━━━━━
{Brief summary of whether the derivatives data suggests a reversal or continuation}

---
⏳ Futures Analyzer • Derivatives Intelligence
```
