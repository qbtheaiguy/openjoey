# Signal-Fusion

**Hybrid Trading Intelligence System** - Combining quantified edge calculation with human-interpretable analysis.

## 🎯 Overview

Signal-Fusion is a next-generation trading intelligence system that combines:

- **Signal Swarm** (quantified edge engine) - The Brain
- **Trading Council** (collaborative interpretation layer) - The Mouth

This fusion creates a system that is both **mathematically rigorous** AND **human-understandable**, providing quantified trading edge with transparent reasoning.

## ✨ Key Features

- ✅ **$0/month** - All data from FREE sources (DexScreener, Yahoo Finance, Solscan, etc.)
- ✅ **No rate limits** - Browser scraping approach
- ✅ **Real-time data** - Direct from source
- ✅ **Adversarial validation** - Signals tested before recommendation
- ✅ **Edge decay tracking** - Monitor signal half-life
- ✅ **Probabilistic reasoning** - Bayesian inference
- ✅ **Cross-market intelligence** - Crypto, stocks, penny stocks, commodities, forex
- ✅ **Trading Council** - 15 AI specialists providing interpretable analysis

## 🚀 Quick Start

### Installation

```bash
# Install as OpenClaw skill
openclaw skills install signal-fusion

# Or manual install
cd skills/signal-fusion
npm install
npm run build
```

### Basic Usage

```bash
# Analyze any asset
signal-fusion analyze SOL
signal-fusion analyze AAPL --market stock
signal-fusion analyze GOLD --market commodity

# Quick price check
signal-fusion quick BTC

# Compare assets
signal-fusion compare SOL ETH

# System status
signal-fusion status

# Performance stats
signal-fusion stats
```

## 📊 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              LAYER 1: SIGNAL SWARM ENGINE                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ SENSORS (24/7 Data Ingestion)                       │   │
│  │ ├── Price Feeds (crypto, stocks, forex)            │   │
│  │ ├── On-Chain (wallets, contracts, MEV)             │   │
│  │ ├── Social/News (Twitter, Reddit, RSS)             │   │
│  │ ├── Macro (Fed, DXY, VIX, rates)                   │   │
│  │ └── Penny Stocks (OTC markets)                     │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ SIGNAL PROCESSORS (Pattern Detection)              │   │
│  │ ├── Anomaly Detector                               │   │
│  │ ├── Pattern Matcher                                │   │
│  │ ├── Edge Calculator                                │   │
│  │ └── Adversarial Validator                          │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              LAYER 2: TRADING COUNCIL                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ MARKET SPECIALISTS                                  │   │
│  │ ├── Crypto Sage | Solana Scout | Meme Maestro      │   │
│  │ ├── Stock Sentinel | Penny Prospector              │   │
│  │ └── Commodity Chief | Forex Falcon                 │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ SKILL SPECIALISTS                                   │   │
│  │ ├── Chart Whisperer | Sentiment Sleuth             │   │
│  │ ├── Whale Tracker | News Hound                     │   │
│  │ └── Risk Advisor | Safety Inspector                │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              LAYER 3: FINAL MESSENGER                        │
│              (Quantified + Explained + Actionable)          │
└─────────────────────────────────────────────────────────────┘
```

## 🔍 How It Works

### 1. Signal Swarm Engine (Quantitative)

Gathers data from **FREE sources** in parallel (3-5 seconds):

- **Crypto**: DexScreener, Birdeye, CoinGecko
- **Stocks**: Yahoo Finance, Finviz
- **On-Chain**: Solscan, SolanaFM
- **Social**: Nitter, Reddit
- **Macro**: FRED, TradingView

Processes signals through:

- **Anomaly Detection** - Volume spikes, whale movements
- **Pattern Matching** - Historical pattern similarity
- **Edge Calculation** - Bayesian inference, win rates, EV
- **Adversarial Validation** - 8 counter-argument tests

### 2. Trading Council (Qualitative)

15 AI specialists debate the quantified data:

- **Market Specialists** - Domain experts (Crypto Sage, Stock Sentinel, etc.)
- **Skill Specialists** - Technical experts (Chart Whisperer, Risk Advisor, etc.)

### 3. Final Output

Combines quantified edge with human-interpretable reasoning:

- Expected value, win rate, risk/reward
- Entry/stop/target levels
- Position sizing (Kelly Criterion)
- Council consensus and debate points
- Key risks and opportunities

## 📈 Example Output

```
🧠 SIGNAL-FUSION ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Query: SOL
Time: 2026-02-04 20:00:00

📊 QUANTIFIED EDGE
  Expected Value: +6.5%
  Win Rate: 68%
  Risk/Reward: 1:2.4
  Conviction: 7.2/10
  Edge Half-Life: 24h

🎯 TRADE SETUP
  Direction: LONG
  Entry: $98.45 - $99.20
  Stop: $94.80 (4.2%)
  Position: 8% of portfolio

🏛️  COUNCIL CONSENSUS
  Agreement: 78%
  Majority: bullish

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 VERDICT: BUY (72% conviction)
⏰ URGENCY: SOON

⚠️  KEY RISKS:
  • Edge decays in 24 hours
  • Requires quick execution

💡 KEY OPPORTUNITIES:
  • Volume spike confirms breakout
  • Whale accumulation detected
  • Risk-on macro environment

Summary: BUY. 68% win rate. +6.5% EV. Strong council consensus.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## 🛠️ Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Development mode
npm run dev

# Type check
npm run typecheck

# Lint
npm run lint

# Test
npm run test
```

## 📚 Documentation

- [Signal-Fusion.md](./Signal-Fusion.md) - Complete architecture documentation
- [SKILL.md](./SKILL.md) - OpenClaw skill metadata

## 🎯 Supported Markets

- **Crypto** - BTC, ETH, SOL, altcoins, meme coins
- **Stocks** - NYSE, NASDAQ equities
- **Penny Stocks** - OTC markets
- **Commodities** - Gold, silver, oil
- **Forex** - Currency pairs

## 💡 Key Innovations

1. **Adversarial Validation** - Signals are attacked before recommendation
2. **Edge Decay Tracking** - Real-time monitoring of signal half-life
3. **Probabilistic Reasoning** - Bayesian inference instead of confidence scores
4. **Cross-Market Intelligence** - Connect signals across all markets
5. **$0/month Cost** - All data from free browser scraping

## ⚠️ Disclaimer

This system does NOT provide financial advice. It provides research to help users make informed decisions. No trades are executed. Always DYOR (Do Your Own Research).

## 📄 License

MIT

## 🙏 Credits

Built with OpenClaw framework.
