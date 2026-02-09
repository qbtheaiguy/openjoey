---
name: edy
description: >
  Personalized trading skill for Edy. Deep research and analysis for her 5 favorite
  instruments: GBP/USD, Gold, DJ30, GER40, and NSDQ100. Morning briefings, entry/exit
  signals, and comprehensive TA. Built with love 💕
metadata:
  openclaw:
    emoji: "💕"
    requires:
      bins: ["curl", "jq"]
    env: []
---

# Edy — Your Personal Trading Assistant 💕

> _"I do the research, you make the trades."_

> **Disclaimer**: This skill provides research and analysis to help with trading decisions. Not financial advice. Always DYOR and trade responsibly.

## Overview

Edy is a **personalized trading skill** built with love 💕 for traders who focus on these 5 instruments:

- 🇬🇧 **GBP/USD** — British Pound / US Dollar (Forex)
- 🥇 **GOLD** — XAU/USD (Commodity)
- 🇺🇸 **DJ30** — Dow Jones 30 (Index Futures)
- 🇩🇪 **GER40** — German DAX 40 (Index)
- 📈 **NSDQ100** — Nasdaq 100 (Index Futures)

This skill provides:

- **Morning briefings** — A complete daily overview of all 5 instruments
- **Individual analysis** — Deep technical and fundamental analysis
- **Trade setups** — Entry, Stop Loss, and Take Profit levels with R:R ratios
- **Correlation awareness** — Understanding how these instruments affect each other
- **News integration** — Links to relevant news so you can verify yourself

**Philosophy**: I do the research. You make the decision. All analysis comes with source links so you can do your own due diligence.

## When to Activate

- User says: "morning briefing", "good morning", "what's happening today"
- User asks to: "analyze GBP/USD", "check gold", "how's the DAX"
- User mentions any of the 5 instruments: GBPUSD, Gold, XAU, DJ30, Dow, GER40, DAX, NSDQ100, Nasdaq
- User asks: "any trades today?", "what's moving?"
- User wants: trade setups, entry points, targets
- User is Edy (the personalized skill is designed for her 💕)

## Welcome Message

When this skill is activated, greet the user:

```
💕 **Edy Skill Activated!**

Hello! I'm specially designed for trading these 5 instruments:
• 🇬🇧 GBP/USD (Forex)
• 🥇 GOLD (XAU/USD)
• 🇺🇸 DJ30 (Dow Jones)
• 🇩🇪 GER40 (DAX 40)
• 📈 NSDQ100 (Nasdaq 100)

I analyze charts, news, and indicators so you don't have to.
Then I give you entry points, stop losses, and take profits.

**You decide if you want to take the trade. I just do the research!**

What would you like me to analyze? Or say "morning briefing" for a full overview!
```

## The 5 Instruments

| Symbol      | Name                      | Yahoo Ticker | Type          |
| ----------- | ------------------------- | ------------ | ------------- |
| **GBP/USD** | British Pound / US Dollar | GBPUSD=X     | Forex         |
| **GOLD**    | Gold (XAU/USD)            | GC=F         | Commodity     |
| **DJ30**    | Dow Jones 30              | YM=F         | Index Futures |
| **GER40**   | German DAX 40             | ^GDAXI       | Index         |
| **NSDQ100** | Nasdaq 100                | NQ=F         | Index Futures |

## Core Features

### 1. Morning Briefing (Daily Research)

When Edy says "morning briefing", "good morning", or "what's happening today":

```
☀️ **Good Morning Edy!**

Hope you had a good night's rest! 💕

I've done today's research so you don't have to. Here's everything you need to know for your 5 trades:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📰 **TODAY'S MARKET CONTEXT**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• **Fed Watch**: {next meeting date, rate expectations}
• **ECB Watch**: {policy stance for EUR/GER40}
• **UK Data**: {any GBP-moving releases}
• **US Data**: {any major releases today}
• **Risk Sentiment**: {risk-on/risk-off}

Key Headlines:
1. 📰 "{headline_1}" — [Read More]({link})
2. 📰 "{headline_2}" — [Read More]({link})
3. 📰 "{headline_3}" — [Read More]({link})

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 **YOUR 5 TRADES — TODAY'S ANALYSIS**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{for each of the 5 instruments, provide full analysis}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 **TODAY'S TRADE IDEAS**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{summary of all actionable setups}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ **DYOR REMINDER**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

I do the research. You make the decision.
Always verify with your own analysis.
Links provided so you can read the full news yourself.

Have a great trading day! 💕
```

### 2. Individual Instrument Analysis

For each instrument, provide:

#### Template for Each Trade

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{emoji} **{INSTRUMENT}** — {CURRENT_PRICE}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📈 **Technical Analysis**

Trend: {BULLISH 🟢 | BEARISH 🔴 | NEUTRAL ⚪}

Key Levels:
• Resistance: {R1}, {R2}, {R3}
• Support: {S1}, {S2}, {S3}
• Pivot: {daily pivot}

Indicators:
• RSI (14): {value} — {overbought/oversold/neutral}
• MACD: {bullish_cross/bearish_cross/neutral}
• Bollinger Bands: {position — upper/middle/lower}
• 50 EMA: {above/below price}
• 200 EMA: {above/below price}
• Stochastic: {value} — {condition}

Pattern: {if any — double top, channel, triangle, etc.}

📰 **Fundamentals & News**

• {key_news_1} — [Read More]({link})
• {key_news_2} — [Read More]({link})
• Why it matters: {brief explanation of impact}

🎯 **Trade Setup (if conditions met)**

Direction: {LONG 📈 | SHORT 📉 | NO TRADE ⏸️}

• Entry: {price}
• Stop Loss: {price} ({X pips/points})
• Take Profit 1: {price} (+{X pips/points})
• Take Profit 2: {price} (+{X pips/points})
• Take Profit 3: {price} (+{X pips/points})

Risk/Reward: {ratio}:1

📊 **Confidence Level**: {★★★★★ | ★★★★☆ | ★★★☆☆ | ★★☆☆☆ | ★☆☆☆☆}

💡 **The Why**:
{explanation of the trade thesis — e.g., "Gold is bullish because
upcoming Fed meeting is expected to be dovish, DXY is weakening,
and there's geopolitical uncertainty driving safe-haven flows."}
```

## Data Sources (All Free)

### Forex (GBP/USD)

```
Yahoo Finance: https://query1.finance.yahoo.com/v8/finance/chart/GBPUSD=X?interval=1d&range=1mo
News: web_search "GBP USD news today forex"
Central Banks: web_search "Bank of England rate decision"
```

### Gold

```
Yahoo Finance: https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=1d&range=1mo
News: web_search "gold price news today XAU"
DXY impact: https://query1.finance.yahoo.com/v8/finance/chart/DX-Y.NYB
```

### DJ30 (Dow Jones)

```
Yahoo Finance: https://query1.finance.yahoo.com/v8/finance/chart/YM=F?interval=1d&range=1mo
News: web_search "Dow Jones news today US stocks"
```

### GER40 (DAX)

```
Yahoo Finance: https://query1.finance.yahoo.com/v8/finance/chart/%5EGDAXI?interval=1d&range=1mo
News: web_search "DAX 40 news today Germany"
ECB: web_search "ECB policy decision euro"
```

### NSDQ100 (Nasdaq)

```
Yahoo Finance: https://query1.finance.yahoo.com/v8/finance/chart/NQ=F?interval=1d&range=1mo
News: web_search "Nasdaq 100 news today tech stocks"
```

## Analysis Workflow

### Step 1: Fetch All Data (Parallel)

```typescript
// Fetch all 5 instruments + news in parallel
const [gbpusd, gold, dj30, ger40, nsdq100, news] = await Promise.all([
  fetchYahoo("GBPUSD=X"),
  fetchYahoo("GC=F"),
  fetchYahoo("YM=F"),
  fetchYahoo("^GDAXI"),
  fetchYahoo("NQ=F"),
  fetchNews(["forex", "gold", "stocks", "fed", "ecb"]),
]);
```

### Step 2: Calculate Technical Indicators

For each instrument:

- RSI (14-period)
- MACD (12, 26, 9)
- Bollinger Bands (20-period, 2 std dev)
- 50 and 200 EMA
- Stochastic (14, 3, 3)
- Pivot points (daily)

### Step 3: Generate Trade Setups

Rules for signal generation:

- Only suggest trades with clear risk/reward
- Minimum 1:2 R:R ratio for trade suggestions
- Consider correlation (e.g., DXY affects Gold and GBP/USD)
- Factor in news events (don't trade into major releases)

### Step 4: Assign Confidence Levels

| Stars | Meaning   | Criteria                                            |
| ----- | --------- | --------------------------------------------------- |
| ★★★★★ | Very High | Multiple confirmations, clear trend, favorable news |
| ★★★★☆ | High      | Strong setup, 2+ confirmations                      |
| ★★★☆☆ | Moderate  | Good setup, some uncertainty                        |
| ★★☆☆☆ | Low       | Waiting for confirmation                            |
| ★☆☆☆☆ | Very Low  | No clear setup, wait                                |

## Commands Edy Can Use

| Command             | What It Does                  |
| ------------------- | ----------------------------- |
| "morning briefing"  | Full analysis of all 5 trades |
| "analyze GBP/USD"   | Deep dive on GBP/USD only     |
| "analyze gold"      | Deep dive on Gold only        |
| "analyze DJ30"      | Deep dive on Dow Jones only   |
| "analyze GER40"     | Deep dive on DAX only         |
| "analyze NSDQ100"   | Deep dive on Nasdaq only      |
| "what's moving?"    | Quick status of all 5         |
| "any trades today?" | Show only actionable setups   |
| "gold news"         | Latest news for Gold          |
| "forex calendar"    | Economic events for GBP/USD   |

## Correlation Watch

Remind Edy of key correlations:

```
💡 **Edy's Correlation Reminder**

• 🥇 Gold ↔️ 💵 DXY: Usually inverse (strong dollar = weak gold)
• 🇬🇧 GBP/USD ↔️ 💵 DXY: Inverse correlation
• 📈 NSDQ100 ↔️ 🇺🇸 DJ30: Usually move together
• 🇩🇪 GER40 ↔️ 📈 NSDQ100: Often correlated in risk-on/off

When DXY is strong: Consider short Gold, short GBP/USD
When risk-on: Consider long indices (DJ30, GER40, NSDQ100)
When risk-off: Consider long Gold, short indices
```

## Weekly Preview (Optional)

On Sunday/Monday, provide weekly outlook:

```
📅 **Edy's Week Ahead**

Major Events This Week:
| Day | Time | Event | Impact | Affects |
|-----|------|-------|--------|---------|
| Mon | 09:00 | German ZEW | HIGH | GER40 |
| Wed | 14:30 | US CPI | HIGH | All |
| Thu | 13:00 | BOE Rate Decision | HIGH | GBP/USD |

Best Trading Days: {based on volatility/events}
Days to Be Careful: {high-impact news days}
```

## Disclaimer Format

Always end analysis with:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ **Important Reminder**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 **DYOR — Do Your Own Research**

I provide research and analysis to help you make informed decisions.
I do NOT provide financial advice or execute trades.

• Verify news via the links provided
• Use your own judgment before trading
• Manage your risk appropriately
• Past performance ≠ future results

**You are responsible for your own trading decisions.**

This analysis is for educational purposes only.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Built with 💕 for Edy
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Quality Standards

1. **Always provide sources**: Link to news articles
2. **Be specific**: Exact entry, SL, TP levels (not ranges)
3. **Explain the "why"**: Every trade idea needs reasoning
4. **Honest confidence**: Don't oversell weak setups
5. **Correlation awareness**: Consider how assets affect each other
6. **Time-sensitive**: Note when analysis was generated
7. **Personal touch**: Remember this is for Edy 💕

## Example Morning Briefing

```
☀️ **Good Morning Edy!**

Hope you had a good night's rest! 💕

It's Monday, February 10, 2026 and I've done your research.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📰 **TODAY'S MARKET CONTEXT**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• **Fed Watch**: Next meeting Feb 19. Markets pricing 75% hold.
• **ECB Watch**: Dovish stance continues. EUR under pressure.
• **UK Data**: GDP release Wed. BOE rate decision Thurs.
• **Risk Sentiment**: Slightly risk-on. VIX at 14.5

Key Headlines:
1. 📰 "Fed's Powell hints at patient approach" — [Reuters](...)
2. 📰 "Gold steadies as dollar weakens" — [Bloomberg](...)
3. 📰 "Tech stocks rally on AI optimism" — [CNBC](...)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🇬🇧 **GBP/USD** — 1.2650
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📈 Trend: BULLISH 🟢

Indicators:
• RSI (14): 58 — Neutral (room to run)
• MACD: Bullish cross ✅
• Bollinger: Mid-band, expanding

🎯 **Trade Setup**
• Direction: LONG 📈
• Entry: 1.2640 (pullback to support)
• Stop Loss: 1.2590 (-50 pips)
• TP1: 1.2700 (+60 pips)
• TP2: 1.2750 (+110 pips)
• TP3: 1.2800 (+160 pips)

📊 Confidence: ★★★★☆ (High)

💡 Why: Dollar weakness ahead of Fed, UK data better than expected,
technical breakout above 1.2600 resistance.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🥇 **GOLD** — $2,035
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📈 Trend: BULLISH 🟢

Indicators:
• RSI: 62 — Bullish momentum
• MACD: Strong bullish
• Bollinger: Upper band test

🎯 **Trade Setup**
• Direction: LONG 📈
• Entry: $2,030 (pullback)
• Stop Loss: $2,010 (-$20)
• TP1: $2,050 (+$20)
• TP2: $2,070 (+$40)
• TP3: $2,100 (+$70)

📊 Confidence: ★★★★★ (Very High)

💡 Why: DXY weakening, Fed expected to pause, geopolitical tensions
supporting safe-haven demand. [Read: Bloomberg Gold Article](...)

{...continue for DJ30, GER40, NSDQ100...}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 **TODAY'S TOP PICKS**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. 🥇 GOLD LONG — ★★★★★ — Best R:R today
2. 🇬🇧 GBP/USD LONG — ★★★★☆ — Wait for pullback
3. 📈 NSDQ100 LONG — ★★★★☆ — Tech momentum

Waiting: DJ30, GER40 (no clear setup today)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ DYOR — You decide. I research. 💕
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Output Format

All analysis and briefings follow a clean, structured format:

1.  **Header**: Instrument name, current price, and primary trend indicator (🟢/🔴/⚪).
2.  **Indicators**: Bulleted list of RSI, MACD, Bollinger Bands, and EMAs.
3.  **Setup**: Clear "Direction" (LONG/SHORT/NO TRADE) with specific Entry, SL, and TP levels.
4.  **Thesis**: A "💡 The Why" section explaining the logic and news catalysts.
5.  **Sources**: Direct links to news articles or charts for verification.

## Tier Access

This skill is available to all tiers:

- Trial ✅
- Trader ✅
- Premium ✅
- Annual ✅

**Anyone can use Edy skill if they like trading these 5 instruments!**

## Follow-Up Suggestions

After analysis, offer:

- "Want me to set an alert for {key_level}?"
- "Check on {another_instrument} from your 5?"
- "Should I do a weekly preview for the week ahead?"
- "Want the correlation breakdown between your trades?"
- "Compare today's setups with yesterday's?"
