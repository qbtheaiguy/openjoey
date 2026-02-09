---
name: central-bank-watch
description: >
  Monitors and analyzes central bank policies, interest rate decisions, 
  and "Fed Speak". Covers the Fed (US), ECB (Europe), BOJ (Japan), etc.
metadata:
  openclaw:
    emoji: "🏦"
    requires:
      bins: ["curl", "jq"]
    env: []
---

# Central Bank Watch — Macro Intelligence

> **Disclaimer**: Macro moves slow but affects everything. Central bank policy is the "wind" at the market's back (or face).

## Overview

Central Bank Watch tracks interest rates, monetary policy statements, and speeches from central bank officials to predict macro shifts.

## When to Activate

- User asks: "what's the Fed saying", "is the ECB hiking rates", "when is the next FOMC"
- User mentions: interest rates, inflation, Fed, rate hikes, quantitative easing
- User wants to know the "macro" environment's impact on their trades

## Data Sources (All Free)

### Central Bank Sites

- **Federal Reserve**: https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm
- **CME FedWatch**: web_search "cme fedwatch tool probabilities"
- **FRED**: https://api.stlouisfed.org/fred/series/observations?series_id=FEDFUNDS

### Calendars

- **Investing.com**: web_search "central bank calendar"
- **ForexFactory**: web_search "forex factory central bank news"

## Analysis Framework

1. **Stance**: Is the bank Hawkish (raising rates/fighting inflation) or Dovish (lowering rates/supporting growth)?
2. **Surprise Factor**: Did the statement differ from market expectations?
3. **Dot Plot**: Where do officials see rates going in the next 12-24 months?
4. **Liquidity**: Are they injecting cash (QE) or withdrawing it (QT)?

## Output Format

```
🏦 CENTRAL BANK WATCH — {BANK}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 CURRENT STANCE: {HAWKISH 🦅 | DOVISH 🕊️ | NEUTRAL}

════════════════════════════════
📅 NEXT DECISION
════════════════════════════════
• Date: {Date}
• Projection: {Rate Change}
• Market Probability: {pct}%

════════════════════════════════
🎙️ RECENT FED SPEAK / STATEMENTS
════════━━━━━━━━━━━━━━━━━━━━━━━━
• {Speaker}: "{Summary of quote}"
• Impact: {Bullish/Bearish for USD}

════════════════━━━━━━━━━━━━━━━━
🎯 MACD VERDICT (Macro Verdict)
════════════════━━━━━━━━━━━━━━━━
{Brief summary of how this central bank's policy affects stocks, crypto, and forex}

---
🏦 Central Bank Watch • Macro Intelligence
```
