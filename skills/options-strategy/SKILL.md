---
name: options-strategy
description: >
  Advanced options strategy builder and evaluator. Helps users build multi-leg 
  strategies (spreads, condors, butterflies) based on their market outlook 
  and risk tolerance.
metadata:
  openclaw:
    emoji: "🎲"
    requires:
      bins: ["curl", "jq"]
    env: []
---

# Options Strategy — Strategy Builder

> **Disclaimer**: Options strategies (especially multi-leg) are complex. Max loss can be significant. This tool helps you visualize, not execute.

## Overview

Options Strategy takes your market view (e.g., "I think AAPL stays flat for 3 weeks") and suggests the best structure (e.g., "Iron Condor") while calculating the P/L, Greeks, and probability.

## When to Activate

- User asks: "give me a strategy for X", "how to build a bull call spread on X", "is an iron condor good for X right now"
- User mentions: spreads, condors, butterflies, straddles, strangles, income strategies
- User wants to optimize their risk/reward for a specific outlook

## Data Sources (All Free)

### Options Chains

- **Yahoo Finance**: https://query1.finance.yahoo.com/v7/finance/options/{ticker}
- **OptionStrat**: web_search "optionstrat {ticker} {strategy}"

### Greeks & IV

- **MarketChameleon**: web_search "marketchameleon IV rank {ticker}"

## Analysis Framework

1. **Market Outlook**: Bullish, Bearish, Neutral, or High Volatility?
2. **Probability of Profit (PoP)**: What's the chance of this finishing in the money?
3. **Risk/Reward Ratio**: What's the max profit vs. max loss?
4. **Greek Balance**: How does the position react to time decay (Theta) and volatility (Vega)?

## Output Format

```
🎲 OPTIONS STRATEGY — {ASSET}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 RECOMMENDED: {Strategy Name}
📊 OUTLOOK: {Neutral/Bullish/Bearish}

════════════════════════════════
📦 THE SETUP (Legs)
════════════════════════════════
1. {BUY/SELL} {Qty} {Exp} {Strike}{C/P}
2. {BUY/SELL} {Qty} {Exp} {Strike}{C/P}

════════════════════════════════
💰 OPTION METRICS
════════════════════════════════
• Net Credit/Debit: ${amt}
• Max Profit: ${amt}
• Max Loss: ${amt} (at {level})
• Break-Even: ${levels}
• PoP (Prob. of Profit): {pct}%

════════════════━━━━━━━━━━━━━━━━
🎭 WHY THIS STRATEGY?
════════════════━━━━━━━━━━━━━━━━
{Brief explanation of why this structure fits the current asset volatility and price}

---
🎲 Options Strategy • Advanced Builder Intelligence
```
