---
name: commodity-guru
description: >
  Elite commodities analysis skill covering precious metals, energy, and agricultural
  products. Tracks gold, silver, oil, natural gas, and soft commodities with supply/demand
  analysis, seasonality patterns, and macro correlations. Uses free data from Yahoo Finance and FRED.
metadata:
  openclaw:
    emoji: "⚡"
    requires:
      bins: ["curl", "jq"]
    env: []
---

# Commodity Guru — Raw Materials Intelligence

> **Disclaimer**: Research only. Not financial advice. Commodity trading carries significant risk.

## Overview

Commodity Guru is your **commodities specialist** covering:

- Precious metals (Gold, Silver, Platinum)
- Energy (Crude Oil, Natural Gas)
- Agricultural (Corn, Wheat, Soybeans)
- Industrial metals (Copper, Aluminum)

## Supported Commodities

| Category        | Commodity        | Yahoo Ticker | FRED Series      |
| --------------- | ---------------- | ------------ | ---------------- |
| **Gold**        | Gold Futures     | GC=F         | GOLDPMGBD228NLBM |
| **Silver**      | Silver Futures   | SI=F         | SLVPRUSD         |
| **Platinum**    | Platinum Futures | PL=F         | -                |
| **Crude Oil**   | WTI Crude        | CL=F         | DCOILWTICO       |
| **Brent**       | Brent Crude      | BZ=F         | DCOILBRENTEU     |
| **Natural Gas** | Nat Gas Futures  | NG=F         | DHHNGSP          |
| **Corn**        | Corn Futures     | ZC=F         | -                |
| **Wheat**       | Wheat Futures    | ZW=F         | -                |
| **Soybeans**    | Soybean Futures  | ZS=F         | -                |
| **Copper**      | Copper Futures   | HG=F         | -                |

## When to Activate

- User asks about: gold, silver, oil, commodities, metals
- User mentions: inflation hedge, safe haven, energy prices
- User asks: "what's gold doing", "is oil going up"
- User wants: commodity analysis, metals forecast

## Data Sources (All Free)

### Price Data

```
Yahoo Finance: https://query1.finance.yahoo.com/v8/finance/chart/{ticker}?interval=1d&range=3mo
Current quote: https://query1.finance.yahoo.com/v7/finance/quote?symbols=GC=F,SI=F,CL=F,NG=F
```

### Historical & Macro

```
FRED API: https://api.stlouisfed.org/fred/series/observations?series_id={id}
  - Gold prices, oil prices, interest rates
```

### Inventory & Supply

```
web_search: "EIA crude oil inventory report"
web_search: "COMEX gold inventory"
web_search: "silver institute supply demand"
```

### COT Data

```
web_search: "CFTC COT report gold positioning"
web_search: "commitment of traders crude oil"
```

## Analysis Framework

### Precious Metals Focus

Gold/Silver specific factors:

- Real interest rates (10Y - CPI)
- Dollar strength (DXY correlation)
- Central bank buying
- ETF flows (GLD, SLV)
- Gold/Silver ratio
- Mine supply changes

### Energy Focus

Oil/Gas specific factors:

- OPEC+ policy
- US inventory levels (EIA report)
- Rig count trends
- Refinery utilization
- Seasonal demand patterns
- Geopolitical risk premium

### Agricultural Focus

Grain/Soft specific factors:

- Weather patterns
- Planting/harvest progress
- USDA reports
- Export demand
- Ethanol blend mandates
- La Niña/El Niño

## Output Format

```
⚡ COMMODITY GURU — {COMMODITY}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 PRICE: ${current} ({change}% / 24h)
📊 52W RANGE: ${low} — ${high}
📈 YTD: {+/-pct}%

════════════════════════════════
📊 TECHNICAL ANALYSIS
════════════════════════════════

Trend: {BULLISH | BEARISH | RANGING}

Key Levels:
• Major Resistance: ${r1}, ${r2}
• Major Support: ${s1}, ${s2}
• All-Time High: ${ath}
• Psychological: ${round_number}

Indicators:
• RSI (14): {value} — {condition}
• MACD: {signal}
• 50 SMA: ${value}
• 200 SMA: ${value}
• Golden/Death Cross: {if applicable}

Volume: {above/below average}

════════════════════════════════
📦 SUPPLY & DEMAND
════════════════════════════════

### Supply Side
• Global Production: {measure}
• YoY Change: {+/-pct}%
• Key Producers: {countries/companies}
• Supply Disruptions: {any current issues}

### Demand Side
• Global Consumption: {measure}
• YoY Change: {+/-pct}%
• Key Consumers: {countries/sectors}
• Demand Trends: {emerging patterns}

### Balance
• Surplus/Deficit: {estimate}
• Inventory Levels: {high/normal/low}
• Days of Supply: {estimate}

════════════════════════════════
📅 KEY REPORTS & CALENDAR
════════════════════════════════

### Upcoming Reports
| Date | Report | Expected Impact |
|------|--------|-----------------|
| {date} | {report name} | HIGH |
| {date} | {report name} | MEDIUM |

### Last Report Results
• {report}: {result}
• Market Reaction: {description}

════════════════════════════════
🌍 MACRO FACTORS
════════════════════════════════

### Dollar Relationship
• DXY Current: {level}
• Correlation: {strong/moderate/weak} {inverse/positive}
• Dollar Outlook: {bullish/bearish}
• Impact: {explanation}

### Interest Rates
• US 10Y Real Yield: {pct}%
• Trend: {rising/falling}
• Impact on {commodity}: {explanation}

### Inflation
• US CPI: {pct}%
• Trend: {rising/falling}
• {Commodity} as hedge: {effective/limited}

### Risk Sentiment
• Market Mode: {RISK-ON | RISK-OFF}
• VIX Level: {value}
• Flight to Safety: {active/inactive}

════════════════════════════════
📊 POSITIONING DATA
════════════════════════════════

CFTC Commitment of Traders:
• Managed Money Net: {long/short} {contracts}
• Change (1w): {+/-} {contracts}
• Positioning: {CROWDED LONG | CROWDED SHORT | NEUTRAL}
• Historical Percentile: {pct}%

Producer Hedging:
• Commercial Net: {long/short}
• Interpretation: {hedging activity level}

ETF Flows (if applicable):
• {ETF}: {inflow/outflow} ${amount} (1w)

════════════════════════════════
📅 SEASONALITY
════════════════════════════════

Historical Patterns:
• {month}: {typical performance} ({historical avg}%)
• Current Season: {favorable/unfavorable}
• Next Seasonal Window: {description}

```

[Seasonality Chart Description]
Best months: {list}
Worst months: {list}
Current month typical: {performance}

```

════════════════════════════════
🌐 GEOPOLITICAL FACTORS
════════════════════════════════

Current Risks:
• {risk_1}: {impact assessment}
• {risk_2}: {impact assessment}

Risk Premium Estimate: ${amount}/barrel or $/oz

════════════════════════════════
🎯 TRADE SETUP
════════════════════════════════

📈 BULLISH CASE ({probability}%)
• Entry: ${level}
• Target 1: ${t1} (+{pct}%)
• Target 2: ${t2} (+{pct}%)
• Stop Loss: ${sl} (-{pct}%)
• Catalyst: {what drives upside}

📉 BEARISH CASE ({probability}%)
• Entry: ${level}
• Target 1: ${t1} (-{pct}%)
• Stop Loss: ${sl} (+{pct}%)
• Catalyst: {what drives downside}

════════════════════════════════
🎯 SIGNAL SUMMARY
════════════════════════════════

Technical: {BULLISH | BEARISH | NEUTRAL}
Fundamental: {BULLISH | BEARISH | NEUTRAL}
Sentiment: {BULLISH | BEARISH | NEUTRAL}
Seasonality: {FAVORABLE | UNFAVORABLE | NEUTRAL}

📊 OVERALL: {STRONG BUY | BUY | HOLD | SELL | STRONG SELL}
📍 CONVICTION: {1-10}/10
⏰ TIMEFRAME: {short-term | medium-term | long-term}

Best Way to Play:
• Futures: {contract recommendation}
• ETFs: {GLD, SLV, USO, UNG, etc.}
• Stocks: {related equity plays}

---
⚡ Commodity Guru • Raw Materials Intelligence
⚠️ Not Financial Advice • High Risk
```

## Commodity-Specific Additions

### For Gold/Silver

- Gold/Silver ratio analysis
- Central bank reserve changes
- Jewelry vs investment demand
- Mining stock correlation (GDX, SIL)

### For Oil

- Contango/backwardation structure
- Crack spreads
- Strategic petroleum reserve changes
- OPEC spare capacity

### For Natural Gas

- Weather forecasts impact
- Storage levels vs 5-year average
- LNG export trends
- Winter/summer seasonality

### For Grains

- USDA WASDE report preview
- Crop condition ratings
- Export sales data
- Biofuel mandate impact

## Follow-Up Suggestions

- "Set alert for gold at ${level}?"
- "What's the gold/silver ratio?"
- "When is the next EIA report?"
- "Compare gold vs Bitcoin as inflation hedge"
- "Show oil inventory trends"
