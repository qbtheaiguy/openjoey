---
name: stock-guru
description: >
  Elite stock market analysis skill covering US equities, ETFs, penny stocks, and international
  ADRs. Combines technical analysis, fundamentals, earnings intel, insider tracking, and
  analyst sentiment. Uses free data from Yahoo Finance, Finviz, SEC Edgar.
metadata:
  openclaw:
    emoji: "📈"
    requires:
      bins: ["curl", "jq"]
    env: []
---

# Stock Guru — Elite Equity Analysis

> **Disclaimer**: Research only. Not financial advice. Always DYOR.

## Overview

Stock Guru is your **equity specialist** for stocks, ETFs, and penny stocks. It provides comprehensive analysis combining:

- Technical chart analysis
- Fundamental metrics
- Earnings intelligence
- Insider trading activity
- Analyst consensus
- Sector context

## Supported Markets

| Market               | Examples                | Coverage            |
| -------------------- | ----------------------- | ------------------- |
| **US Large Cap**     | AAPL, MSFT, GOOGL, AMZN | Full analysis       |
| **US Mid/Small Cap** | PLTR, RIVN, SOFI        | Full analysis       |
| **ETFs**             | SPY, QQQ, IWM, ARKK     | Technical + flows   |
| **Penny Stocks**     | OTC, Pink Sheets        | Volume + risk focus |
| **ADRs**             | BABA, TSM, NIO          | Full + ADR premium  |

## When to Activate

- User asks about any stock ticker
- User says: "analyze AAPL", "how's Tesla doing", "should I buy NVDA"
- User asks about: earnings, insider buying, analyst ratings
- User mentions: stocks, equities, shares, market

## Data Sources (All Free)

### Price & Technical

```
Yahoo Finance Chart: https://query1.finance.yahoo.com/v8/finance/chart/{ticker}?interval=1d&range=3mo
Yahoo Quote: https://query1.finance.yahoo.com/v7/finance/quote?symbols={ticker}
```

### Fundamentals

```
Yahoo Quote Summary: https://query1.finance.yahoo.com/v10/finance/quoteSummary/{ticker}?modules=defaultKeyStatistics,financialData,summaryDetail,majorHoldersBreakdown
```

### Earnings

```
Yahoo Earnings: https://query1.finance.yahoo.com/v10/finance/quoteSummary/{ticker}?modules=earnings,earningsHistory,earningsTrend
```

### Insider Trading

```
SEC Edgar Form 4: web_search "SEC Edgar Form 4 {ticker} recent filings"
Finviz Insider: web_search "finviz {ticker} insider trading"
```

### Analyst Ratings

```
Yahoo Recommendations: ?modules=recommendationTrend,upgradeDowngradeHistory
Finviz Analysts: web_search "finviz {ticker} analyst ratings target price"
```

### News

```
web_search: "{ticker} stock news today"
```

## Analysis Workflow

### Step 1: Fetch Core Data

Parallel fetch:

- Current price, volume, market cap
- 52-week high/low
- Key fundamentals (P/E, EPS, revenue)
- Recent price action

### Step 2: Technical Analysis

Calculate:

- Trend direction (50/200 SMA relationship)
- RSI, MACD status
- Support/resistance levels
- Volume trend
- Chart patterns if any

### Step 3: Fundamental Snapshot

Gather:

- Valuation ratios (P/E, P/S, P/B, PEG)
- Growth metrics (revenue, earnings growth)
- Profitability (margins, ROE)
- Balance sheet health (debt ratios)
- Compare to sector averages

### Step 4: Earnings Intel

Find:

- Next earnings date
- Earnings history (beats/misses)
- EPS estimates
- Revenue estimates
- Whisper numbers if available

### Step 5: Insider Activity

Check:

- Recent Form 4 filings
- Net insider buying/selling
- Notable transactions
- Insider ownership %

### Step 6: Analyst Sentiment

Aggregate:

- Buy/Hold/Sell distribution
- Average price target
- Recent upgrades/downgrades
- Notable analyst comments

## Output Format

```
📈 STOCK GURU — {TICKER}
━━━━━━━━━━━━━━━━━━━━━━━━
{Company Name} • {Sector} • {Industry}

💰 PRICE: ${current} ({change}% today)
📊 MARKET CAP: ${mcap} | P/E: {pe}

════════════════════════════════
📊 TECHNICAL ANALYSIS
════════════════════════════════

🎯 TREND: {BULLISH | BEARISH | NEUTRAL}

Key Levels:
• Resistance: ${r1}, ${r2}
• Support: ${s1}, ${s2}
• 52W Range: ${low} — ${high}

Indicators:
• RSI (14): {value} — {overbought/oversold/neutral}
• MACD: {bullish/bearish cross or neutral}
• 50 SMA: ${value} {above/below price}
• 200 SMA: ${value} {above/below price}
• Volume: {above/below average}

Pattern: {if any significant pattern}

════════════════════════════════
📋 FUNDAMENTALS
════════════════════════════════

Valuation:
• P/E (TTM): {pe} (Sector: {sector_pe})
• Forward P/E: {fwd_pe}
• PEG Ratio: {peg}
• P/S: {ps}
• P/B: {pb}

Growth:
• Rev Growth (YoY): {rev_growth}%
• EPS Growth (YoY): {eps_growth}%
• Est. EPS Growth: {est_growth}%

Profitability:
• Gross Margin: {gross}%
• Operating Margin: {op}%
• Net Margin: {net}%
• ROE: {roe}%

Balance Sheet:
• Debt/Equity: {de}
• Current Ratio: {current}
• Free Cash Flow: ${fcf}

Dividend:
• Yield: {yield}%
• Payout Ratio: {payout}%

════════════════════════════════
📅 EARNINGS INTEL
════════════════════════════════

Next Earnings: {date} ({before/after market})
EPS Estimate: ${eps_est}
Revenue Est: ${rev_est}

Last 4 Quarters:
| Quarter | EPS Est | EPS Actual | Surprise |
|---------|---------|------------|----------|
| {q1} | ${est} | ${actual} | {+/-}% |
| {q2} | ${est} | ${actual} | {+/-}% |
| {q3} | ${est} | ${actual} | {+/-}% |
| {q4} | ${est} | ${actual} | {+/-}% |

Track Record: {X} beats, {Y} misses last 8 quarters

════════════════════════════════
🕵️ INSIDER ACTIVITY
════════════════════════════════

Last 3 Months:
• Insider Buys: {count} (${total})
• Insider Sells: {count} (${total})
• Net: {BUYING | SELLING | NEUTRAL}

Notable Transactions:
• {name} ({title}): {bought/sold} ${amount} on {date}
• {name} ({title}): {bought/sold} ${amount} on {date}

Insider Ownership: {pct}%

════════════════════════════════
🎯 ANALYST RATINGS
════════════════════════════════

Consensus: {STRONG BUY | BUY | HOLD | SELL}

Distribution:
🟢 Buy: {count}
🟡 Hold: {count}
🔴 Sell: {count}

Price Targets:
• High: ${high}
• Average: ${avg}
• Low: ${low}
• Upside to Avg: {pct}%

Recent Actions:
• {date}: {analyst} — {upgrade/downgrade} to {rating}, PT ${price}
• {date}: {analyst} — {upgrade/downgrade} to {rating}, PT ${price}

════════════════════════════════
📰 NEWS & SENTIMENT
════════════════════════════════

Recent Headlines:
1. "{headline_1}" — {source}
2. "{headline_2}" — {source}
3. "{headline_3}" — {source}

Sentiment: {BULLISH | BEARISH | MIXED}

════════════════════════════════
🎯 SIGNAL SUMMARY
════════════════════════════════

Technical:  {BULLISH | BEARISH | NEUTRAL} ⬆️/⬇️/➡️
Fundamental: {UNDERVALUED | FAIR | OVERVALUED}
Sentiment:  {POSITIVE | NEGATIVE | MIXED}
Momentum:   {STRONG | WEAK | NEUTRAL}

📊 OVERALL: {STRONG BUY | BUY | HOLD | SELL | AVOID}
📍 CONVICTION: {1-10}/10

Entry Zone: ${low} — ${high}
Target 1: ${t1} ({pct}%)
Target 2: ${t2} ({pct}%)
Stop Loss: ${sl} ({pct}%)

---
📈 Stock Guru • Equity Intelligence
⚠️ Not Financial Advice • DYOR
```

## Special Cases

### For ETFs

- Show holdings breakdown
- Expense ratio
- NAV vs price premium/discount
- Sector allocation
- Fund flows

### For Penny Stocks

- Extra risk warnings
- Liquidity concerns
- Dilution risk
- Float analysis
- Promotion/dump history

### For Pre-Earnings

- Historical earnings move %
- Options IV if relevant
- Estimate revision trend
- Play suggestions

## Follow-Up Suggestions

- "Want me to monitor this stock?"
- "Set an alert for ${key_level}?"
- "Compare to {competitor}?"
- "Check the options chain?" (→ Options Guru)
- "Full research report?" (→ Research Guru)
