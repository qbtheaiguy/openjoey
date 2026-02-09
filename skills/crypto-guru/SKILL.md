---
name: crypto-guru
description: >
  Elite crypto analysis skill for all cryptocurrencies. Covers majors (BTC, ETH, SOL),
  altcoins, DeFi tokens, and Layer 2s. Combines on-chain analytics, DEX data, funding rates,
  whale tracking, and social sentiment. Uses free data from DexScreener, CoinGecko, and Birdeye.
metadata:
  openclaw:
    emoji: "🔮"
    requires:
      bins: ["curl", "jq"]
    env: []
---

# Crypto Guru — Digital Asset Intelligence

> **Disclaimer**: Crypto is extremely volatile. Not financial advice. DYOR. Never invest more than you can afford to lose.

## Overview

Crypto Guru is your **cryptocurrency specialist** covering:

- Major cryptos (BTC, ETH, SOL, etc.)
- Altcoins and mid-caps
- DeFi tokens
- Layer 2 solutions
- Stablecoins analysis
- Cross-chain opportunities

## Supported Assets

| Category       | Examples             | Data Sources           |
| -------------- | -------------------- | ---------------------- |
| **Majors**     | BTC, ETH, SOL, BNB   | CoinGecko, Binance     |
| **Altcoins**   | AVAX, MATIC, ARB, OP | CoinGecko, DexScreener |
| **DeFi**       | UNI, AAVE, LDO, JUP  | DeFiLlama, DexScreener |
| **Solana**     | JTO, JUP, BONK, WIF  | Birdeye, DexScreener   |
| **L2s**        | ARB, OP, STRK, MANTA | L2Beat, DeFiLlama      |
| **New Tokens** | Any contract address | DexScreener, Birdeye   |

## When to Activate

- User asks about any crypto token
- User sends a contract address
- User asks: "what's BTC doing", "ETH analysis"
- User mentions: crypto, blockchain, on-chain, DeFi

## Data Sources (All Free)

### Price & Market Data

```
CoinGecko: https://api.coingecko.com/api/v3/coins/{id}
CoinGecko List: https://api.coingecko.com/api/v3/coins/list
DexScreener: https://api.dexscreener.com/latest/dex/search?q={symbol}
DexScreener Token: https://api.dexscreener.com/latest/dex/tokens/{address}
```

### Solana Specific

```
Birdeye: https://public-api.birdeye.so/public/tokenlist
Birdeye Token: https://public-api.birdeye.so/public/token/{address}
Jupiter: https://quote-api.jup.ag/v6/tokens
```

### On-Chain Analytics

```
DeFiLlama: https://api.llama.fi/protocol/{protocol}
DeFiLlama TVL: https://api.llama.fi/v2/chains
```

### Funding & Derivatives

```
Binance Funding: https://fapi.binance.com/fapi/v1/premiumIndex?symbol={symbol}USDT
Binance OI: https://fapi.binance.com/fapi/v1/openInterest?symbol={symbol}USDT
```

### Social Sentiment

```
web_search: "twitter {token} trending"
web_search: "reddit {token} sentiment"
```

## Analysis Workflow

### Step 1: Token Identification

```typescript
// Detect if it's a symbol or contract address
if (isSolanaAddress(input)) {
  // Fetch from Birdeye/DexScreener
} else if (isEthereumAddress(input)) {
  // Fetch from DexScreener Ethereum
} else {
  // Search by symbol on CoinGecko/DexScreener
}
```

### Step 2: Core Data Collection

Fetch in parallel:

- Current price, 24h change
- Market cap, FDV
- 24h volume, volume/mcap ratio
- Price history (7d, 30d, 90d)
- Circulating vs total supply

### Step 3: On-Chain Metrics

For DeFi/Smart contract tokens:

- TVL and TVL trend
- Active users / Daily transactions
- Protocol revenue
- Token emissions schedule
- Holder distribution

### Step 4: DEX Analysis

From DexScreener:

- DEX liquidity (all pools)
- Buy/sell ratio
- Recent trades
- Liquidity depth
- Top pools

### Step 5: Derivatives Data

For major tokens:

- Funding rate (perpetuals)
- Open interest
- Long/short ratio
- Liquidation levels

### Step 6: Sentiment Analysis

- Twitter mentions and trend
- Reddit activity
- Telegram/Discord community size
- Google Trends
- Fear & Greed context

## Output Format

```
🔮 CRYPTO GURU — {TOKEN}
━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 PRICE: ${price} ({change_24h}%)
📊 MCap: ${mcap} | FDV: ${fdv}
📈 Vol (24h): ${volume} | Vol/MCap: {ratio}

════════════════════════════════
📊 PRICE ACTION
════════════════════════════════

Performance:
• 1H: {pct}%
• 24H: {pct}%
• 7D: {pct}%
• 30D: {pct}%
• ATH: ${ath} (-{pct}% from ATH)

Trend: {BULLISH | BEARISH | CONSOLIDATING}

Key Levels:
• Resistance: ${r1}, ${r2}
• Support: ${s1}, ${s2}
• Next Major: ${key_level}

Indicators:
• RSI (14): {value} — {condition}
• MACD: {signal}
• 50/200 EMA: {relationship}

════════════════════════════════
⛓️ ON-CHAIN METRICS
════════════════════════════════

Supply:
• Circulating: {circ} ({pct}% of total)
• Total: {total}
• Max: {max or "No max"}

Holder Distribution:
• Top 10 Holders: {pct}%
• Top 100 Holders: {pct}%
• Concentration Risk: {LOW | MEDIUM | HIGH}

Activity:
• Active Addresses (24h): {count}
• Transactions (24h): {count}
• Trend: {increasing/decreasing}

═══{if DeFi protocol}═════════
TVL:
• Current: ${tvl}
• 7D Change: {pct}%
• 30D Change: {pct}%
• Rank: #{rank}

Revenue (if applicable):
• 24h Fees: ${amount}
• 7D Revenue: ${amount}
• P/F Ratio: {ratio}

════════════════════════════════
💧 DEX LIQUIDITY (DexScreener)
════════════════════════════════

Total Liquidity: ${total_liq}

Top Pools:
| DEX | Pair | Liquidity | 24h Vol |
|-----|------|-----------|---------|
| {dex} | {pair} | ${liq} | ${vol} |
| {dex} | {pair} | ${liq} | ${vol} |
| {dex} | {pair} | ${liq} | ${vol} |

Buy/Sell Ratio (24h): {buys}:{sells}
Unique Traders (24h): {count}

Slippage Estimate:
• $1,000: ~{pct}%
• $10,000: ~{pct}%
• $100,000: ~{pct}%

════════════════════════════════
📈 DERIVATIVES (if available)
════════════════════════════════

Perpetual Futures:
• Funding Rate: {rate}% ({positive = longs pay})
• Open Interest: ${oi}
• OI Change (24h): {pct}%

Long/Short Ratio: {ratio}

Interpretation: {what funding + OI signals}

Liquidation Clusters:
• Long Liq Zone: ${level}
• Short Liq Zone: ${level}

════════════════════════════════
🐋 WHALE ACTIVITY
════════════════════════════════

Notable Recent Transactions:
• {time}: Whale {bought/sold} ${amount} (${value})
• {time}: Whale {bought/sold} ${amount} (${value})

Exchange Flows (24h):
• Inflows: ${amount} (selling pressure)
• Outflows: ${amount} (accumulation)
• Net: {inflow/outflow}

Top Holder Movements:
• {wallet_short}: {activity}

════════════════════════════════
📰 SENTIMENT & SOCIAL
════════════════════════════════

Social Score: {BULLISH | BEARISH | NEUTRAL}

Platforms:
• Twitter Mentions (24h): {count} ({trend})
• Reddit Activity: {level}
• Telegram: {members}

News Headlines:
1. "{headline_1}"
2. "{headline_2}"

Crypto Fear & Greed: {value} ({sentiment})

════════════════════════════════
⚠️ RISK ASSESSMENT
════════════════════════════════

| Risk Factor | Level | Notes |
|-------------|-------|-------|
| Smart Contract | {LOW/MED/HIGH} | {audit status} |
| Liquidity | {LOW/MED/HIGH} | {depth assessment} |
| Concentration | {LOW/MED/HIGH} | {holder distribution} |
| Team/Rug Risk | {LOW/MED/HIGH} | {doxxed? locked LP?} |
| Regulatory | {LOW/MED/HIGH} | {any concerns} |

Overall Risk: {LOW | MEDIUM | HIGH | EXTREME}

════════════════════════════════
🎯 TRADE SETUP
════════════════════════════════

📈 BULLISH CASE ({probability}%)
• Entry Zone: ${low} — ${high}
• Target 1: ${t1} (+{pct}%)
• Target 2: ${t2} (+{pct}%)
• Stop Loss: ${sl} (-{pct}%)
• Thesis: {catalyst}

📉 BEARISH CASE ({probability}%)
• Short Entry: ${level}
• Target: ${target}
• Stop: ${stop}
• Thesis: {what goes wrong}

════════════════════════════════
🎯 SIGNAL SUMMARY
════════════════════════════════

Technical: {BULLISH | BEARISH | NEUTRAL}
On-Chain: {BULLISH | BEARISH | NEUTRAL}
Sentiment: {BULLISH | BEARISH | NEUTRAL}
Derivatives: {BULLISH | BEARISH | NEUTRAL}

📊 OVERALL: {STRONG BUY | BUY | HOLD | SELL | AVOID}
📍 CONVICTION: {1-10}/10
⏰ TIMEFRAME: {scalp | swing | position}

Best Entry: {timing or level}
Key Catalyst: {upcoming event}

---
🔮 Crypto Guru • Digital Asset Intelligence
⚠️ Extreme Volatility • Not Financial Advice • DYOR
```

## Special Cases

### For New/Meme Tokens

- Extra honeypot/rug checks
- LP lock verification
- Contract analysis
- Holder distribution focus
- Team token unlock schedule

### For DeFi Protocols

- TVL deep dive
- Revenue analysis
- Token emissions vs revenue
- Governance activity

### For L2 Tokens

- L2Beat data
- TPS and activity
- Bridge TVL
- Sequencer revenue

## Follow-Up Suggestions

- "Track this token's whale wallets?"
- "Set alert for ${level}?"
- "Compare to {similar_token}?"
- "What's the next catalyst?"
- "Is this a rug?" (→ safety check)
