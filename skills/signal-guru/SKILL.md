---
name: signal-guru
description: >
  Elite multi-asset trading intelligence system. Combines quantified edge analysis with
  market-aware interpretation across ALL asset classes: crypto, stocks, forex, commodities,
  options, and futures. The master skill for any "analyze X" request.
metadata:
  openclaw:
    emoji: "🧠"
    requires:
      bins: ["curl", "jq"]
    env: []
---

# Signal Guru — Multi-Asset Trading Intelligence

> **Disclaimer**: This system provides research to help users make informed decisions. No financial advice. No trades executed. Always DYOR.

## Overview

Signal Guru is your **master analysis skill** for any tradeable asset. It automatically detects the asset type and applies the appropriate analysis methodology.

### Supported Asset Classes

| Asset Class      | Examples                       | Data Sources                    |
| ---------------- | ------------------------------ | ------------------------------- |
| **Crypto**       | BTC, SOL, BONK, meme coins     | DexScreener, CoinGecko, Birdeye |
| **Stocks**       | AAPL, TSLA, NVDA, SPY          | Yahoo Finance, Finviz           |
| **Forex**        | EUR/USD, GBP/JPY               | ExchangeRate-API, TradingView   |
| **Commodities**  | Gold, Silver, Oil, Natural Gas | Yahoo Finance (futures), FRED   |
| **Options**      | AAPL calls, SPY puts           | Yahoo Finance options chains    |
| **Futures**      | ES, NQ, GC, CL                 | Yahoo Finance (=F tickers)      |
| **Penny Stocks** | OTC, pink sheets               | OTC Markets, Yahoo Finance      |

## When to Activate

- User says: "analyze X", "what do you think about X", "how's X looking", "X analysis"
- User sends a ticker symbol or contract address
- User asks about market conditions for any asset

## Workflow

### Step 1: Asset Detection

```typescript
function detectAssetType(query: string): AssetType {
  // Crypto patterns
  if (isSolanaAddress(query)) return "crypto-solana";
  if (isEthereumAddress(query)) return "crypto-eth";
  if (cryptoTickers.includes(query.toUpperCase())) return "crypto";

  // Forex patterns
  if (/^[A-Z]{3}\/[A-Z]{3}$/.test(query)) return "forex";
  if (["EURUSD", "GBPUSD", "USDJPY"].includes(query.replace("/", ""))) return "forex";

  // Commodities
  if (["GOLD", "SILVER", "OIL", "GC", "SI", "CL"].includes(query.toUpperCase())) return "commodity";

  // Options (with strike/expiry)
  if (/\d+[CP]\s*\d{1,2}\/\d{1,2}/.test(query)) return "option";

  // Futures
  if (["ES", "NQ", "YM", "RTY"].includes(query.toUpperCase())) return "futures";

  // Default to stock
  return "stock";
}
```

## Data Sources

Signal Guru uses high-quality, free data sources across all supported asset classes:

### Crypto Data

```
DexScreener: https://api.dexscreener.com/latest/dex/search?q={symbol}
CoinGecko: https://api.coingecko.com/api/v3/coins/{id}
Birdeye: https://public-api.birdeye.so/public/tokenlist?sort_by=v24hUSD&sort_type=desc
```

#### Stock Data

```
Yahoo Finance: https://query1.finance.yahoo.com/v8/finance/chart/{ticker}
Yahoo Quote: https://query1.finance.yahoo.com/v7/finance/quote?symbols={ticker}
Finviz: web_search "finviz {ticker} technical analysis"
```

#### Forex Data

```
ExchangeRate-API: https://api.exchangerate-api.com/v4/latest/{base}
TradingView: web_search "tradingview {pair} forecast"
```

#### Commodities Data

```
Yahoo Finance: GC=F (gold), SI=F (silver), CL=F (oil), NG=F (nat gas)
FRED: https://api.stlouisfed.org/fred/series/observations?series_id={id}
```

### Step 3: Analysis Layers

#### Layer 1: Technical Analysis

- Trend direction (bullish/bearish/neutral)
- Key support and resistance levels
- RSI, MACD, moving averages
- Volume analysis
- Chart patterns

#### Layer 2: Sentiment Analysis

- Social media mentions (Twitter, Reddit)
- News sentiment
- Funding rates (crypto)
- Put/call ratio (options)
- COT data (futures)

#### Layer 3: Fundamental Analysis

- Crypto: On-chain metrics, holder distribution, TVL
- Stocks: P/E, revenue growth, earnings
- Commodities: Supply/demand, seasonality
- Forex: Interest rate differentials, economic calendar

#### Layer 4: Signal Synthesis

- Weighted conviction score (1-10)
- Bull/bear probability split
- Entry, targets, stop-loss levels
- Risk/reward ratio

## Output Format

Signal Guru analysis is designed to be high-conviction and easy to read:

```
🧠 SIGNAL GURU ANALYSIS — {ASSET}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 CURRENT: ${price} ({change_24h}%)
📈 MARKET CAP: ${market_cap} | VOL: ${volume_24h}

📊 TECHNICAL SNAPSHOT
┌────────────────────────────────┐
│ Trend:     {BULLISH|BEARISH|NEUTRAL}
│ Support:   ${support_1}, ${support_2}
│ Resistance: ${resistance_1}, ${resistance_2}
│ RSI (14):  {rsi} ({overbought|oversold|neutral})
│ MACD:      {bullish_cross|bearish_cross|neutral}
└────────────────────────────────┘

🎯 SIGNAL LEVELS
• Entry Zone:  ${entry_low} — ${entry_high}
• Target 1:    ${target_1} (+{pct_1}%)
• Target 2:    ${target_2} (+{pct_2}%)
• Stop Loss:   ${stop_loss} (-{risk_pct}%)
• R:R Ratio:   {reward_ratio}:1

📰 SENTIMENT
• Social Score: {positive|neutral|negative}
• News Flow: {bullish|bearish|mixed}
• Smart Money: {accumulating|distributing|neutral}

⚠️ RISKS
• {risk_1}
• {risk_2}

📊 CONVICTION: {1-10}/10
🎯 SIGNAL: {STRONG BUY | BUY | HOLD | SELL | STRONG SELL}
⏰ TIMEFRAME: {hours|days|weeks}

---
_Signal Guru • Multi-Asset Intelligence • Not Financial Advice_
```

## Asset-Specific Additions

### For Crypto

Add: Funding rate, open interest, whale movements, DEX vs CEX volume

### For Stocks

Add: Earnings date, insider activity, analyst ratings, sector performance

### For Forex

Add: Central bank stance, economic calendar events, correlation pairs

### For Commodities

Add: Seasonality, COT positioning, inventory data, weather impacts

### For Options

Add: Greeks (delta, gamma, theta, vega), IV rank, unusual activity

## Follow-Up Suggestions

After analysis, offer:

- "Want me to set a price alert at ${key_level}?"
- "Should I track this asset for you?"
- "Want a deeper research report?" (→ Research Guru)
- "Compare this to {related_asset}?"

## Quality Standards

1. **Cite sources**: Always mention where data came from
2. **Timestamp**: Note when data was fetched
3. **Calibrate confidence**: Be honest about uncertainty
4. **Consider both sides**: Bull AND bear cases
5. **DYOR disclaimer**: Always remind user this isn't financial advice
