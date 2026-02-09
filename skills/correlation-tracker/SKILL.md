---
name: correlation-tracker
description: >
  Analyzes price correlations between different assets (e.g., BTC vs. NASDAQ, 
  Gold vs. USD). Identifies decoupling, safety hedges, and contagion risks.
metadata:
  openclaw:
    emoji: "🔗"
    requires:
      bins: ["curl", "jq"]
    env: []
---

# Correlation Tracker — Asset Interconnectivity

> **Disclaimer**: Correlation can break down during "black swan" events. Historical correlation is NO guarantee of future results.

## Overview

Correlation Tracker helps traders understand how assets move together. If BTC and SPY are highly correlated, you might be taking double the risk without realizing it.

## When to Activate

- User asks: "does BTC move with SPY", "what's correlated with gold", "is X decoupling from Y"
- User mentions: correlation, beta, relative strength, pair trading, hedging
- User wants to diversify or find lagging indicators

## Data Sources (All Free)

### Correlation Tools

- **TradingView**: web_search "correlation matrix {asset list}"
- **Portfolio Visualizer**: web_search "asset correlation {symbols}"
- **Macrobit**: web_search "btc eth correlation chart"

### Raw Data (for AI calculation)

- **Yahoo Finance**: Fetch prices for both assets over {timeframe}

## Analysis Framework

1. **Coefficient (r)**:
   - +1.0 (Perfectly Correlated)
   - 0.0 (Uncorrelated)
   - -1.0 (Inversely Correlated)
2. **Timeframe**: Is the correlation increasing or decreasing lately?
3. **Decoupling**: Is one asset moving while the other stays flat (potential opportunity)?
4. **Narrative Driver**: WHY are they moving together? (Inflation, interest rates, risk-off?)

## Output Format

```
🔗 CORRELATION TRACKER — {ASSETS}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 CORRELATION SCORE: {r value} ({Strong/Weak/Negative})

════════════════════════════════
⛓️ ASSET PAIR: {A} ↔️ {B}
════════════════════════════════
• 30-Day: {r}
• 90-Day: {r}
• 1-Year: {r}

════════════════════════════════
🕵️ DECOUPLING ALERT
════════════════━━━━━━━━━━━━━━━━
{Note if one asset is leading or lagging significantly}

════════════════━━━━━━━━━━━━━━━━
🎯 HEDGING VERDICT
════════════════━━━━━━━━━━━━━━━━
{Brief summary of whether holding both assets provides diversification or just double risk}

---
🔗 Correlation Tracker • Interconnectivity Intelligence
```
