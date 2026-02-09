---
name: options-guru
description: >
  Elite options analysis skill for options traders. Analyzes options chains, Greeks,
  implied volatility, unusual activity, and strategy recommendations. Premium feature
  requiring trader/premium/annual subscription. Uses free data from Yahoo Finance.
metadata:
  openclaw:
    emoji: "🎲"
    requires:
      bins: ["curl", "jq"]
    env: []
---

# Options Guru — Derivatives Intelligence

> **Disclaimer**: Options trading involves significant risk. Not financial advice. DYOR.

## Overview

Options Guru is your **derivatives specialist** for options trading. It provides:

- Options chain analysis
- Greeks breakdown (Delta, Gamma, Theta, Vega)
- Implied volatility analysis
- Unusual options activity detection
- Strategy recommendations
- Risk/reward calculations

## Tier Requirement

⚠️ **Premium Feature**: Options Guru requires `trader`, `premium`, or `annual` subscription.

```typescript
allowedTiers: ["trader", "premium", "annual"];
blockedTiers: ["free", "trial"];
```

## When to Activate

- User asks about: options, calls, puts, strikes, expiration
- User says: "AAPL options chain", "what are the Greeks on..."
- User wants: covered calls, iron condors, straddles
- User asks: "unusual options activity", "IV rank"

## Data Sources (All Free)

### Options Chain

```
Yahoo Finance Options:
https://query2.finance.yahoo.com/v7/finance/options/{ticker}
https://query2.finance.yahoo.com/v7/finance/options/{ticker}?date={expiry_timestamp}
```

### Historical IV

```
web_search: "yahoo finance {ticker} implied volatility historical"
web_search: "{ticker} IV rank IV percentile"
```

### Unusual Activity

```
web_search: "unusual options activity {ticker} today"
web_search: "large options trades {ticker}"
```

## Analysis Workflow

### Step 1: Stock Context

First, get the underlying stock data:

- Current price
- Recent trend
- Next earnings date
- Major support/resistance

### Step 2: Fetch Options Chain

```
Expirations available: [list of dates]
For each relevant expiry:
  - Calls: strike, bid, ask, volume, OI, IV, delta, gamma, theta, vega
  - Puts: strike, bid, ask, volume, OI, IV, delta, gamma, theta, vega
```

### Step 3: IV Analysis

Calculate:

- Current IV
- IV Rank (where IV is vs 52-week range)
- IV Percentile (% of days IV was lower)
- Historical volatility comparison
- IV term structure (near vs far)

### Step 4: Unusual Activity

Look for:

- Volume > 3x average
- Volume > Open Interest
- Large block trades
- Sweeps vs regular trades

### Step 5: Strategy Suggestions

Based on outlook and IV:

- High IV → Premium selling strategies
- Low IV → Premium buying strategies
- Directional → Verticals, diagonals
- Neutral → Iron condors, butterflies

## Output Format

```
🎲 OPTIONS GURU — {TICKER}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 STOCK: ${price} ({change}%)
📅 EARNINGS: {date} ({days} days)
📊 30D IV RANK: {rank}% | IV: {iv}%

════════════════════════════════
📊 VOLATILITY ANALYSIS
════════════════════════════════

Current IV: {iv}%
Historical Vol (30D): {hv}%
IV Premium: {iv - hv}% ({high/normal/low})

IV Metrics:
• IV Rank: {rank}% (vs 52-week range)
• IV Percentile: {percentile}% (of days)
• IV Status: {ELEVATED | NORMAL | DEPRESSED}

Term Structure:
• Near-term (1m): {iv}%
• Mid-term (2-3m): {iv}%
• Far-term (6m): {iv}%
• Shape: {CONTANGO | BACKWARDATION | FLAT}

Interpretation: {what this means for strategies}

════════════════════════════════
📋 OPTIONS CHAIN — {expiry_date}
════════════════════════════════

### CALLS
| Strike | Bid | Ask | Last | Vol | OI | IV | Δ | θ |
|--------|-----|-----|------|-----|----|----|---|---|
| ${atm-2} | {bid} | {ask} | {last} | {vol} | {oi} | {iv}% | {delta} | {theta} |
| ${atm-1} | {bid} | {ask} | {last} | {vol} | {oi} | {iv}% | {delta} | {theta} |
| **${atm}** | **{bid}** | **{ask}** | **{last}** | **{vol}** | **{oi}** | **{iv}%** | **{delta}** | **{theta}** |
| ${atm+1} | {bid} | {ask} | {last} | {vol} | {oi} | {iv}% | {delta} | {theta} |
| ${atm+2} | {bid} | {ask} | {last} | {vol} | {oi} | {iv}% | {delta} | {theta} |

### PUTS
| Strike | Bid | Ask | Last | Vol | OI | IV | Δ | θ |
|--------|-----|-----|------|-----|----|----|---|---|
| ${atm-2} | {bid} | {ask} | {last} | {vol} | {oi} | {iv}% | {delta} | {theta} |
| ${atm-1} | {bid} | {ask} | {last} | {vol} | {oi} | {iv}% | {delta} | {theta} |
| **${atm}** | **{bid}** | **{ask}** | **{last}** | **{vol}** | **{oi}** | **{iv}%** | **{delta}** | **{theta}** |
| ${atm+1} | {bid} | {ask} | {last} | {vol} | {oi} | {iv}% | {delta} | {theta} |
| ${atm+2} | {bid} | {ask} | {last} | {vol} | {oi} | {iv}% | {delta} | {theta} |

Put/Call Ratio: {ratio} ({bullish/bearish/neutral})

════════════════════════════════
🔍 GREEKS EXPLAINED (ATM {expiry})
════════════════════════════════

### {strike} Call
• Delta (Δ): {value} — Stock moves $1, option moves ${delta}
• Gamma (Γ): {value} — Delta change per $1 stock move
• Theta (θ): -${value}/day — Daily time decay cost
• Vega (ν): ${value} — Option change per 1% IV move
• Rho (ρ): {value} — Rate sensitivity

### Interpretation
- Directional Exposure: {low/medium/high}
- Time Decay: ${daily_decay}/day
- Volatility Sensitivity: {low/medium/high}

════════════════════════════════
⚡ UNUSUAL ACTIVITY
════════════════════════════════

### Today's Notable Trades
| Strike | Exp | Type | Vol | OI | V/OI | Side |
|--------|-----|------|-----|-------|------|------|
| ${strike} | {exp} | CALL | {vol} | {oi} | {ratio}x | {buy/sell} |
| ${strike} | {exp} | PUT | {vol} | {oi} | {ratio}x | {buy/sell} |

### Interpretation
{explain what the unusual activity might signal}

Large Block Alert: {if any massive single trades}

════════════════════════════════
🎯 STRATEGY RECOMMENDATIONS
════════════════════════════════

Based on: {IV level} IV + {outlook} outlook

### If BULLISH on {ticker}:
**{Strategy Name}** — {one-liner}
• Buy: {leg_1}
• Sell: {leg_2} (if applicable)
• Max Profit: ${amount} ({pct}%)
• Max Loss: ${amount}
• Break-even: ${level}
• P.O.P.: {probability}%

### If BEARISH on {ticker}:
**{Strategy Name}** — {one-liner}
• Buy: {leg_1}
• Sell: {leg_2} (if applicable)
• Max Profit: ${amount}
• Max Loss: ${amount}
• Break-even: ${level}
• P.O.P.: {probability}%

### If NEUTRAL / High IV Play:
**{Strategy Name}** — {one-liner}
• Structure: {legs}
• Max Profit: ${amount}
• Max Loss: ${amount}
• Break-evens: ${low}, ${high}
• P.O.P.: {probability}%

════════════════════════════════
📅 EARNINGS PLAY (if approaching)
════════════════════════════════

Earnings Date: {date} ({before/after market})
Expected Move: ±${amount} ({pct}%)
Historical Avg Move: ±{pct}%

Straddle Price: ${straddle} (at ATM)
Implied Move: ±{pct}%

Last 4 Earnings Reactions:
| Date | Expected | Actual | Direction |
|------|----------|--------|-----------|
| {date} | ±{exp}% | {actual}% | {up/down} |

Strategy Consideration: {premium selling vs buying}

════════════════════════════════
⚠️ RISK FACTORS
════════════════════════════════

• Earnings Risk: {yes/no — days until}
• Dividend Risk: {ex-date if applicable}
• Liquidity: {good/fair/poor} (based on bid-ask)
• IV Crush Risk: {high/low}

════════════════════════════════
🎯 QUICK SUMMARY
════════════════════════════════

Stock Outlook: {BULLISH | BEARISH | NEUTRAL}
IV Environment: {HIGH → sell premium | LOW → buy premium}
Best Strategy: {recommended}
Key Strikes: ${strike_1}, ${strike_2}
Expiry Recommendation: {date} ({days} DTE)

---
🎲 Options Guru • Derivatives Intelligence
⚠️ Complex Instruments • High Risk • Not Financial Advice
```

## Strategy Playbook

### High IV Strategies (IV Rank > 50%)

- Covered Calls
- Cash-Secured Puts
- Iron Condors
- Credit Spreads
- Short Strangles (with caution)

### Low IV Strategies (IV Rank < 30%)

- Long Calls/Puts
- Debit Spreads
- Calendar Spreads
- Long Straddles/Strangles

### Earnings Strategies

- Pre-earnings: Long straddles/strangles
- Post-earnings: Credit strategies

## Follow-Up Suggestions

- "Show me the {expiry} chain"
- "Calculate a {strategy} on {ticker}"
- "What's the expected move for earnings?"
- "Find unusual options activity today"
- "Build an iron condor on {ticker}"
