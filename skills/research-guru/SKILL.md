---
name: research-guru
description: >
  Deep research and due diligence system for multi-asset analysis. Use when users want
  comprehensive research, ecosystem analysis, narrative plays, or institutional-grade
  market overview. Combines whale tracking, news catalysts, on-chain data, and market structure.
metadata:
  openclaw:
    emoji: "🔬"
    requires:
      bins: ["curl", "jq"]
    env: []
---

# Research Guru — Institutional-Grade Deep Research

> **Disclaimer**: Research for educational purposes only. Not financial advice. Always DYOR.

## Overview

Research Guru is your **deep dive skill** for comprehensive analysis. While Signal Guru provides quick actionable signals, Research Guru delivers the **full thesis** with supporting evidence.

## When to Activate

- User says: "deep dive on X", "research X", "due diligence on X"
- User asks: "what's the full story on X", "tell me everything about X"
- User wants: ecosystem analysis, narrative plays, multi-token comparison
- User requests: institutional-grade research, alpha hunting

## Data Sources

Research Guru aggregates data from institutional-grade free sources across multiple dimensions:

### Phase 1: Data Aggregation (Parallel Queries)

Execute these in parallel for comprehensive data:

#### Market Data

```
DexScreener: https://api.dexscreener.com/latest/dex/search?q={query}
CoinGecko: Price, market cap, volume, historical
Yahoo Finance: Fundamentals, financials, analyst ratings
```

#### On-Chain Intelligence (Crypto)

```
Helius/Solscan: Top holders, transaction history
DeFiLlama: TVL, protocol metrics
Token Terminal: Revenue, users, development activity
```

#### News & Catalysts

```
web_search: "{asset} news last 7 days"
web_search: "{asset} upcoming events catalyst"
web_search: "{asset} partnership announcement"
```

#### Social Intelligence

```
web_search: "twitter {asset} trending"
web_search: "reddit {asset} sentiment"
web_search: "{asset} telegram community growth"
```

#### Whale Tracking

```
web_search: "{asset} whale movements"
web_search: "{asset} smart money buying"
```

### Phase 2: Synthesis Framework

#### 2.1 Narrative Mapping

Identify which narratives the asset plays into:

| Narrative   | Hot Now?    | Asset Fit     |
| ----------- | ----------- | ------------- |
| AI / ML     | ✅ Yes      | {how it fits} |
| DeFi 2.0    | ⚠️ Warming  | {how it fits} |
| RWA         | 🔥 Very Hot | {how it fits} |
| Gaming      | ❄️ Cold     | {N/A}         |
| Meme Season | ✅ Yes      | {how it fits} |

#### 2.2 Catalyst Timeline

```
[PAST WEEK]
• {date}: {event that happened}
• {date}: {price reaction}

[NEXT 7 DAYS]
• {date}: {upcoming event}
• Impact: {expected effect}

[NEXT 30 DAYS]
• {date}: {scheduled catalysts}
• Earnings/unlock/launch dates
```

#### 2.3 Competitive Analysis

```
| Metric | {Asset} | Competitor 1 | Competitor 2 |
|--------|---------|--------------|--------------|
| Market Cap | $X | $Y | $Z |
| TVL | $X | $Y | $Z |
| Daily Active | X | Y | Z |
| Growth Rate | X% | Y% | Z% |
```

#### 2.4 Risk Matrix

```
| Risk Factor | Level | Details |
|-------------|-------|---------|
| Smart Contract | {LOW/MED/HIGH} | {audit status} |
| Liquidity | {LOW/MED/HIGH} | {slippage at $10k} |
| Concentration | {LOW/MED/HIGH} | {top 10 hold X%} |
| Regulatory | {LOW/MED/HIGH} | {jurisdiction issues} |
| Team | {LOW/MED/HIGH} | {doxxed? track record?} |
| Narrative | {LOW/MED/HIGH} | {how durable?} |
```

## Output Format

The Research Guru report is structured for depth, clarity, and actionability:

```
🔬 RESEARCH GURU — DEEP DIVE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 SUBJECT: {ASSET NAME}
📅 DATE: {timestamp}
🎯 TLDR: {one sentence thesis}

═══════════════════════════════════════
📊 EXECUTIVE SUMMARY
═══════════════════════════════════════

{2-3 paragraphs explaining the opportunity, key thesis,
 and why this matters right now}

═══════════════════════════════════════
🔍 FUNDAMENTAL ANALYSIS
═══════════════════════════════════════

### What It Is
{clear explanation of the project/asset}

### Value Proposition
• {unique value 1}
• {unique value 2}
• {competitive moat}

### Business Model
{how it generates value/revenue}

### Team & Backers
• Team: {info}
• Investors: {VCs, angels}
• Advisors: {notable names}

═══════════════════════════════════════
📈 MARKET STRUCTURE
═══════════════════════════════════════

### Current State
• Price: ${current} ({change}% / 24h)
• Market Cap: ${mcap} (Rank #{rank})
• Volume: ${vol_24h}
• FDV: ${fdv}

### Technical Levels
• Major Resistance: ${r1}, ${r2}, ${r3}
• Major Support: ${s1}, ${s2}, ${s3}
• Trend: {description}

### Liquidity Analysis
• DEX Liquidity: ${liq}
• CEX Listings: {exchanges}
• Slippage at $10k: {pct}%

═══════════════════════════════════════
🗓️ CATALYST CALENDAR
═══════════════════════════════════════

### Upcoming (Next 30 Days)
| Date | Event | Expected Impact |
|------|-------|-----------------|
| {date} | {event} | {HIGH/MED/LOW} |
| {date} | {event} | {HIGH/MED/LOW} |

### Recent (Past 7 Days)
• {date}: {what happened}
• {date}: {price reaction}

═══════════════════════════════════════
🐋 WHALE INTELLIGENCE
═══════════════════════════════════════

### Top Holder Distribution
| Wallet | Balance | % Supply | Activity |
|--------|---------|----------|----------|
| {short_addr} | {bal} | {pct}% | {buying/selling/holding} |

### Smart Money Flows
• Net Flow (24h): {inflow/outflow} ${amount}
• Known Funds: {names if any}
• Accumulation Phase: {yes/no}

═══════════════════════════════════════
📰 SENTIMENT ANALYSIS
═══════════════════════════════════════

### Social Metrics
• Twitter Mentions: {count} ({trend})
• Reddit Activity: {level}
• Discord/Telegram: {member count, activity}

### News Sentiment
• Overall: {BULLISH/BEARISH/NEUTRAL}
• Key Headlines:
  1. "{headline_1}"
  2. "{headline_2}"

═══════════════════════════════════════
⚠️ RISK ASSESSMENT
═══════════════════════════════════════

### Risk Matrix
{use risk matrix from Phase 2}

### Bear Case Scenario
{what could go wrong, worst case price, probability}

### Key Risks to Monitor
1. {risk_1}
2. {risk_2}
3. {risk_3}

═══════════════════════════════════════
🎯 INVESTMENT THESIS
═══════════════════════════════════════

### Bull Case ({probability}%)
• Entry: ${entry}
• Target 1: ${t1} ({pct}%)
• Target 2: ${t2} ({pct}%)
• Target 3: ${t3} ({pct}%)
• Timeframe: {weeks/months}
• Thesis: {why this works}

### Bear Case ({probability}%)
• Invalidation: ${level}
• Downside Risk: ${worst}
• Thesis: {what goes wrong}

### Recommended Approach
{conservative/moderate/aggressive strategy}
{position sizing suggestion}
{risk management rules}

═══════════════════════════════════════
📊 FINAL VERDICT
═══════════════════════════════════════

🎯 CONVICTION: {1-10}/10
📈 SIGNAL: {STRONG BUY | BUY | HOLD | SELL | AVOID}
⏰ HORIZON: {short/medium/long term}
💡 BEST FOR: {type of investor/trader}

---
🔬 Research Guru • Institutional-Grade Analysis
⚠️ Not Financial Advice • DYOR
📅 Generated: {timestamp}
```

## Follow-Up Suggestions

After research delivery:

- "Want me to set alerts for the catalyst dates?"
- "Should I track the whale wallets I found?"
- "Compare this to {competitor}?"
- "Want the quick signal version?" (→ Signal Guru)
- "Monitor this daily for changes?"

## Quality Standards

1. **Primary sources**: Link to original data when possible
2. **Recency**: Note how fresh each data point is
3. **Confidence levels**: Express uncertainty where it exists
4. **Balanced view**: Always present bull AND bear cases
5. **Actionable**: End with clear recommendations
6. **DYOR**: Prominent disclaimer
