---
name: signal-fusion
description: "Hybrid trading intelligence system combining Signal Swarm quantified edge engine with Trading Council interpretation layer. Analyzes crypto, stocks, penny stocks, commodities, and forex using free browser-based data collection."
metadata:
  { "openclaw": { "emoji": "🧠", "requires": { "bins": ["curl", "jq", "node"] }, "env": [] } }
---

# Signal-Fusion - Hybrid Trading Intelligence System

> **Disclaimer**: This system does NOT provide financial advice. It provides research to help users make informed decisions. No trades are executed. Always DYOR.

## Overview

Signal-Fusion combines:

- **Signal Swarm** (quantified edge engine) - The Brain
- **Trading Council** (collaborative interpretation layer) - The Mouth

This fusion creates a system that is both **mathematically rigorous** AND **human-understandable**.

## Architecture

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
│  ┌─────────────────────────────────────────────────────┐   │
│  │ SYNTHESIS (Trade Construction)                      │   │
│  │ ├── Edge Aggregation                               │   │
│  │ ├── Scenario Planning                              │   │
│  │ └── Conviction Scoring                             │   │
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

## Commands

```bash
# Analyze any asset
signal-fusion analyze <asset> [--market crypto|stock|forex|commodity|penny]

# Quick technical snapshot
signal-fusion quick <asset>

# Compare multiple assets
signal-fusion compare <asset1> <asset2>

# Show system status
signal-fusion status

# Watchlist management
signal-fusion watchlist [add|remove|list] <asset>

# Backtest signals
signal-fusion backtest <asset> --days 30
```

## Data Sources (All Free)

- **Crypto**: DexScreener, Birdeye, CoinGecko, Jupiter
- **Stocks**: Yahoo Finance, Finviz, TradingView
- **Penny Stocks**: OTC Markets
- **On-Chain**: Solscan, SolanaFM, Etherscan
- **Social**: Nitter, Reddit, Google News
- **Macro**: FRED, TradingView, TradingEconomics

## Features

- ✅ **$0/month** - All data from free sources
- ✅ **No rate limits** - Browser scraping approach
- ✅ **Real-time data** - Direct from source
- ✅ **Adversarial validation** - Signals tested before recommendation
- ✅ **Edge decay tracking** - Monitor signal half-life
- ✅ **Probabilistic reasoning** - Bayesian inference
- ✅ **Cross-market intelligence** - Connect signals across markets

## Installation

```bash
# Install as OpenClaw skill
openclaw skills install signal-fusion

# Or manual install
cd skills/signal-fusion
npm install
npm run build
```

## Usage

```bash
# Direct CLI
signal-fusion analyze SOL

# Via OpenClaw agent
"Hey OpenClaw, analyze SOL with Signal-Fusion"
```
