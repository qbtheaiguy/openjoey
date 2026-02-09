---
name: forex-guru
description: >
  Elite forex analysis skill for currency pair trading. Covers major, minor, and exotic
  pairs with technical analysis, central bank policy, economic calendar, and correlation
  analysis. Uses free data from ExchangeRate-API, Yahoo Finance, and economic databases.
metadata:
  openclaw:
    emoji: "💱"
    requires:
      bins: ["curl", "jq"]
    env: []
---

# Forex Guru — Currency Intelligence

> **Disclaimer**: Research only. Not financial advice. Forex trading carries significant risk.

## Overview

Forex Guru is your **currency specialist** for forex trading. It provides:

- Major, minor, and exotic pair analysis
- Central bank policy tracking
- Economic calendar integration
- Correlation analysis
- Interest rate differentials
- Technical forex patterns

## Supported Pairs

| Category      | Examples                           | Analysis Depth          |
| ------------- | ---------------------------------- | ----------------------- |
| **Majors**    | EUR/USD, GBP/USD, USD/JPY, USD/CHF | Full analysis           |
| **Commodity** | AUD/USD, USD/CAD, NZD/USD          | + Commodity correlation |
| **Crosses**   | EUR/GBP, EUR/JPY, GBP/JPY          | Full analysis           |
| **Exotics**   | USD/MXN, USD/ZAR, EUR/TRY          | + EM risk factors       |

## When to Activate

- User asks about any forex pair
- User mentions: forex, currency, FX, EUR, USD, JPY, GBP
- User asks about: central banks, interest rates, economic calendar
- User says: "what's happening with the dollar", "euro forecast"

## Data Sources (All Free)

### Exchange Rates

```
ExchangeRate-API: https://api.exchangerate-api.com/v4/latest/{base}
Yahoo Finance: {PAIR}=X tickers (e.g., EURUSD=X)
```

### Central Bank Data

```
FRED: https://api.stlouisfed.org/fred/series/observations?series_id={rate_id}
  - FEDFUNDS (Fed Funds Rate)
  - ECBDFR (ECB Deposit Rate)
  - others available
```

### Economic Calendar

```
web_search: "forex factory economic calendar {currency}"
web_search: "investing.com economic calendar this week"
```

### Sentiment & COT

```
web_search: "CFTC COT report {currency} positioning"
web_search: "forex sentiment {pair}"
```

## Analysis Workflow

### Step 1: Fetch Current Data

```
Current rate: Yahoo Finance {PAIR}=X
24h change, 52-week range
Recent price action
```

### Step 2: Technical Analysis

Forex-specific technicals:

- Pivot points (daily, weekly)
- Fibonacci retracements
- Moving averages (50, 100, 200)
- RSI, MACD, Stochastic
- Key round number levels

### Step 3: Fundamental Factors

| Factor            | Base Currency   | Quote Currency |
| ----------------- | --------------- | -------------- |
| Interest Rate     | {rate}%         | {rate}%        |
| Rate Differential | {diff}% (carry) |
| GDP Growth        | {pct}%          | {pct}%         |
| Inflation         | {pct}%          | {pct}%         |
| Employment        | {status}        | {status}       |

### Step 4: Central Bank Analysis

- Current policy stance (hawkish/dovish/neutral)
- Recent statement keywords
- Next meeting date
- Market expectations for next move
- Dot plot / forward guidance

### Step 5: Economic Calendar

Upcoming high-impact events for both currencies:

- NFP, CPI, GDP releases
- Central bank meetings
- Employment data
- PMI releases

### Step 6: Correlation Analysis

How this pair correlates with:

- Other major pairs
- Commodities (gold, oil)
- Risk sentiment (VIX, stocks)

## Output Format

```
💱 FOREX GURU — {BASE}/{QUOTE}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 RATE: {rate} ({change}% / 24h)
📊 RANGE: {52w_low} — {52w_high}
📈 TREND: {BULLISH/BEARISH/RANGING}

════════════════════════════════
📊 TECHNICAL ANALYSIS
════════════════════════════════

Pivot Points (Daily):
• R3: {r3}
• R2: {r2}
• R1: {r1}
• Pivot: {pivot}
• S1: {s1}
• S2: {s2}
• S3: {s3}

Key Levels:
• Major Resistance: {level} (round number/historical)
• Major Support: {level} (round number/historical)
• Current Position: {above/below pivot}

Indicators:
• RSI (14): {value} — {condition}
• MACD: {signal}
• Stochastic: {value} — {condition}
• 50 SMA: {value} ({above/below})
• 200 SMA: {value} ({above/below})

Pattern: {if any — double top, H&S, channel, etc.}

════════════════════════════════
🏦 CENTRAL BANK ANALYSIS
════════════════════════════════

### {BASE} — {Central Bank Name}
• Current Rate: {rate}%
• Policy Stance: {HAWKISH | NEUTRAL | DOVISH} 🦅/🐦/🕊️
• Next Meeting: {date}
• Market Expects: {rate hike/cut/hold}
• Recent Quote: "{key statement}"

### {QUOTE} — {Central Bank Name}
• Current Rate: {rate}%
• Policy Stance: {HAWKISH | NEUTRAL | DOVISH} 🦅/🐦/🕊️
• Next Meeting: {date}
• Market Expects: {rate hike/cut/hold}
• Recent Quote: "{key statement}"

Rate Differential: {diff}%
Carry Trade: {favorable for buying/selling pair}

════════════════════════════════
📋 ECONOMIC FUNDAMENTALS
════════════════════════════════

| Metric | {BASE} | {QUOTE} | Advantage |
|--------|--------|---------|-----------|
| GDP Growth | {pct}% | {pct}% | {which} |
| Inflation | {pct}% | {pct}% | {which} |
| Unemployment | {pct}% | {pct}% | {which} |
| Trade Balance | ${bn}B | ${bn}B | {which} |

Economic Health: {BASE} vs {QUOTE} advantage

════════════════════════════════
📅 ECONOMIC CALENDAR
════════════════════════════════

### High Impact Events This Week

| Date | Time | Currency | Event | Forecast | Previous |
|------|------|----------|-------|----------|----------|
| {date} | {time} | {cur} | {event} | {forecast} | {prev} |
| {date} | {time} | {cur} | {event} | {forecast} | {prev} |
| {date} | {time} | {cur} | {event} | {forecast} | {prev} |

⚠️ Key Risk: {most important upcoming event}

════════════════════════════════
🔗 CORRELATIONS
════════════════════════════════

| Instrument | Correlation | Meaning |
|------------|-------------|---------|
| DXY (Dollar Index) | {corr} | {interpretation} |
| Gold (XAU/USD) | {corr} | {interpretation} |
| S&P 500 | {corr} | {interpretation} |
| {related_pair} | {corr} | {interpretation} |

Risk Sentiment: {RISK-ON | RISK-OFF | MIXED}
Impact on this pair: {explanation}

════════════════════════════════
📊 COT POSITIONING
════════════════════════════════

{CURRENCY} Futures (latest CFTC data):
• Commercial: {net long/short} {contracts}
• Non-Commercial: {net long/short} {contracts}
• Change (1w): {increase/decrease}

Positioning: {CROWDED LONG | CROWDED SHORT | NEUTRAL}
Contrarian Signal: {if any}

════════════════════════════════
🎯 TRADE SETUP
════════════════════════════════

📈 BULLISH CASE ({probability}%)
• Entry: {level}
• Target 1: {t1} (+{pips} pips)
• Target 2: {t2} (+{pips} pips)
• Stop Loss: {sl} (-{pips} pips)
• R:R: {ratio}:1
• Catalyst: {what drives this}

📉 BEARISH CASE ({probability}%)
• Entry: {level}
• Target 1: {t1} (-{pips} pips)
• Target 2: {t2} (-{pips} pips)
• Stop Loss: {sl} (+{pips} pips)
• R:R: {ratio}:1
• Catalyst: {what drives this}

════════════════════════════════
🎯 SIGNAL SUMMARY
════════════════════════════════

Technical Bias: {BULLISH | BEARISH | NEUTRAL}
Fundamental Bias: {BULLISH | BEARISH | NEUTRAL}
Sentiment: {with crowd | against crowd}

📊 OVERALL: {STRONG BUY | BUY | NEUTRAL | SELL | STRONG SELL}
📍 CONVICTION: {1-10}/10
⏰ TIMEFRAME: {intraday | swing | positional}

Best Entry Window: {timing based on calendar}
Key Risk: {main event to watch}

---
💱 Forex Guru • Currency Intelligence
⚠️ Not Financial Advice • High Risk
```

## Special Considerations

### For Exotic Pairs

- Add emerging market risk factors
- Political stability assessment
- Capital controls risk
- Wider spreads warning
- Lower liquidity caveat

### Pre-Event Analysis

- Historical reaction patterns
- IV surge timing
- Straddle considerations
- Position sizing reduction

### Carry Trade Setup

- Calculate daily carry
- Roll costs
- Optimal entry timing
- Risk events to avoid

## Follow-Up Suggestions

- "Set alert for {pair} at {level}?"
- "When is the next Fed/ECB/BOJ meeting?"
- "Show me correlations with other pairs"
- "What's the economic calendar for {currency}?"
- "Compare EUR/USD vs GBP/USD"
