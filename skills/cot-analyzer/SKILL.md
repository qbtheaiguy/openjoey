---
name: cot-analyzer
description: >
  Commitments of Traders (COT) report analysis system. Tracks positioning of 
  Commercials (Hedgers) vs. Non-Commercials (Speculators) across commodities, 
  currencies, and indices.
metadata:
  openclaw:
    emoji: "📜"
    requires:
      bins: ["curl", "jq"]
    env: []
---

# COT Analyzer — Follow the Institutions

> **Disclaimer**: COT data is released weekly (usually Friday for Tuesday's data) and is a lagging indicator of long-term positioning.

## Overview

COT Analyzer helps you see where the "big boys" (commercial producers/industrial users) and "large specs" (hedge funds) are positioned.

## When to Activate

- User asks: "what's the COT data for gold", "are commercials long or short cocoa", "show me speculator positioning for EUR"
- User mentions: COT report, hedgers, speculators, net long, net short
- User wants to see the "long-term whale" conviction in a market

## Data Sources (All Free)

### Official Reports

- **CFTC**: https://www.cftc.gov/MarketReports/CommitmentsofTraders/index.htm
- **Investing.com COT**: web_search "investing.com COT report {asset}"

### Analysis Tools

- **FreeCOT**: web_search "{asset} COT historical chart"
- **Barchart COT**: web_search "barchart commitment of traders {symbol}"

## Analysis Framework

1. **Commercial Net Position**: The "Smart Money" (producers). When they are extremely long, it often signals a bottom.
2. **Speculator Net Position**: The "Dumb Money" (trend followers). When they are extremely long, it often signals a top (overcrowded trade).
3. **Sentiment Extremes**: Is the net position at a 3-year high or low?
4. **Change from Previous**: Are they adding to their bets or reducing them?

## Output Format

```
📜 COT ANALYZER — {ASSET}
━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 LONG-TERM BIAS: {INSTITUTIONAL ACCUMULATION | SPECULATIVE HYPER-GROWTH | EXHAUSTION}

════════════════════════════════
📋 POSITIONING BREAKDOWN
════════════════════════════════
| Group | Net Position | Change (wk) | Sentiment |
|-------|--------------|-------------|-----------|
| Commercials | {Net} | {change}    | {Bull/Bear}|
| Large Specs | {Net} | {change}    | {Crowded?} |

════════════════════════════════
⚖️ SENTIMENT EXTREMES
════════════════━━━━━━━━━━━━━━━━
• Commercials: {percentile}% (3-yr range)
• Large Specs: {percentile}% (3-yr range)

════════════════━━━━━━━━━━━━━━━━
🎯 COT VERDICT
════════════════━━━━━━━━━━━━━━━━
{Brief summary of whether the large institutions are betting on a major trend shift}

---
📜 COT Analyzer • Follow the Institutions
```
