---
name: economic-calendar
description: >
  Tracks major economic releases (CPI, Jobs Report, GDP) and central bank meetings.
  Provides context on why these events matter and how they impact the markets.
metadata:
  openclaw:
    emoji: "🗓️"
    requires:
      bins: ["curl", "jq"]
    env: []
---

# Economic Calendar — Global Macro Events

> **Disclaimer**: Big macro events like CPI or NFP (Non-Farm Payrolls) cause extreme volatility and slippage. Trade with caution during these releases.

## Overview

Economic Calendar keeps you prepared for the events that move the "DXY" (US Dollar) and, by extension, every other asset class.

## When to Activate

- User asks: "what economic events are today", "when is the next CPI report", "what's the jobs data looking like"
- User mentions: macro calendar, GDP, NFP, CPI, PPI, Initial Claims
- User wants to avoid getting "whipsawed" by a sudden macro release

## Data Sources (All Free)

### Global Calendars

- **Investing.com**: web_search "investing.com economic calendar"
- **ForexFactory**: web_search "forex factory calendar"
- **DailyFX**: web_search "dailyfx economic calendar"

### Government Data

- **BLS (Jobs/CPI)**: web_search "BLS release schedule"
- **BEA (GDP)**: web_search "BEA release calendar"

## Analysis Framework

1. **Importance (Impact)**:
   - 🔴 High (CPI, NFP, Fed)
   - 🟠 Medium (PPI, Retail Sales)
   - 🟡 Low (Small trade balances)
2. **Consensus vs. Previous**: What does the market expect?
3. **Volatility Expectation**: How much move do we usually see on this release?
4. **Interconnectivity**: e.g., "High CPI leads to more Fed hikes, which hurts tech/stocks."

## Output Format

```
🗓️ ECONOMIC CALENDAR — {DATE/WEEK}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 UPCOMING HIGH-IMPACT EVENTS
════════════════════════════════
| Time | Event | Forecast | Previous | Impact |
|------|-------|----------|----------|--------|
| {t}  | {CPI} | {x}%     | {y}%     | 🔴 HIGH|
| {t}  | {NFP} | {x}k     | {y}k     | 🔴 HIGH|

════════════════════════════════
⚠️ VOLATILITY WARNINGS
════════════════━━━━━━━━━━━━━━━━
• {Event}: Expect high volatility in USD pairs and Indices.
• {Event}: Watch Gold (GC) for reaction to inflation data.

════════════════━━━━━━━━━━━━━━━━
🎯 MACRO OUTLOOK
════════════════━━━━━━━━━━━━━━━━
{Brief summary of how this week's events will set the tone for the coming month}

---
🗓️ Economic Calendar • Macro Intelligence
```
