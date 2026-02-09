---
name: unusual-options
description: >
  Detects "Unusual Options Activity" (UOA). Monitors large block trades, 
  high volume vs. open interest, and aggressive sweep orders for stocks and crypto.
metadata:
  openclaw:
    emoji: "🎰"
    requires:
      bins: ["curl", "jq"]
    env: []
---

# Unusual Options — Follow the Big Bets

> **Disclaimer**: Big options bets aren't always right. They could be hedges, complex spreads, or misinformed gambles. Never follow blindly.

## Overview

Unusual Options Activity (UOA) is where the "smart money" often hides. Large, aggressive bets in the options market frequently precede major price moves.

## When to Activate

- User asks: "any unusual options for X", "what's the smart money doing in options", "show me big block trades"
- User mentions: UOA, sweeps, blocks, high OI volume, whales in options
- User wants to know if someone knows something about an upcoming announcement

## Data Sources (All Free)

### Options Scanners

- **Barchart Unusual**: web_search "barchart unusual options activity"
- **MarketChameleon**: web_search "marketchameleon unusual volume"
- **Yahoo Finance**: https://query1.finance.yahoo.com/v7/finance/options/{ticker} (Look for Vol > OI)

### Crypto Options

- **Deribit**: web_search "deribit big trades"
- **Laevitas**: web_search "laevitas unusual crypto options"

## Analysis Framework

1. **Volume > Open Interest**: This suggests new positions are being opened aggressively.
2. **Aggression**: Was it a "sweep" (multiple exchanges) or a "block" (negotiated trade)?
3. **Sentiment**: Was it deep OTM (Out of The Money) calls (bullish) or puts (bearish)?
4. **Timeframe**: Short-dated expiry ("lottos") suggests immediate expectations.

## Output Format

```
🎰 UNUSUAL OPTIONS — {ASSET}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 UOA SENTIMENT: {EXTREME BULLISH | MODERATE | NEUTRAL | BEARISH}

════════════════════════════════
🔥 NOTABLE TRADES
════════════════════════════════
| Contract | Type | Vol/OI | Premium | Sentiment |
|----------|------|--------|---------|-----------|
| {Asset} {Exp} {Strike}{C/P} | {Sweep}| {ratio} | ${amt} | {Bull/Bear} |

════════════════════════════════
📈 HIGH VOLUME VS. OPEN INTEREST
════════════════════════════════
• {Strike} {C/P} — Vol: {v} | OI: {oi}
• {Strike} {C/P} — Vol: {v} | OI: {oi}

════════════════━━━━━━━━━━━━━━━━
🎯 SMART MONEY VERDICT
════════════════━━━━━━━━━━━━━━━━
{Brief summary of whether the big spenders are betting on a move}

---
🎰 Unusual Options • Big Bet Intelligence
```
