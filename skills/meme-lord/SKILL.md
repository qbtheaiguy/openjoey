---
name: meme-lord
description: "Meme coin and small-cap token alpha hunter with multi-platform verification. Aggregates data from DexScreener (free, real-time), GeckoTerminal (free, historical), and DEXTools (free tier available) to cross-verify token data. Analyzes contracts via blockchain explorers (Etherscan, Solscan, Bscscan), checks for rugs/honeypots, monitors liquidity, volume, and price action. Provides actionable buy signals with risk scoring for 50%+ quick gains. Use when user wants to find new meme tokens, degen plays, or early-entry opportunities with comprehensive safety checks across multiple data sources."
metadata:
  { "openclaw": { "emoji": "🐸", "requires": { "bins": ["curl", "jq", "node"] }, "env": [] } }
---

# Meme Lord 🐸

> "Find the gems before they moon. Avoid the rugs before they pull."

## Overview

Meme Lord is your degen trading companion. It hunts for early-stage meme coins and small-cap tokens across multiple DEX platforms, performs comprehensive safety checks, analyzes smart money flows, and delivers actionable buy signals with calculated risk.

**Target:** 50%+ quick gains (not 100x moonshots — those are lottery tickets)
**Timeframe:** Hours to days (swing trading, not holding)
**Risk Tolerance:** High, but managed

## Core Workflow

```
┌─────────────────────────────────────────────────────────────┐
│  PHASE 1: TOKEN DISCOVERY                                    │
│  Scan platforms for new/fresh pairs with momentum           │
│  • DexScreener, GeckoTerminal, Pump.fun                     │
│  • GMGN.ai, BullX, DEXTools                                 │
│  Filter: Age <7 days, Liquidity >$50K, Volume >$100K/24h    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  PHASE 2: SAFETY CHECK                                       │
│  Verify contract isn't a trap                                │
│  • Honeypot check                                            │
│  • Rug pull indicators                                       │
│  • Contract verification status                              │
│  • Ownership renounced?                                      │
│  • Mint function disabled?                                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  PHASE 3: FUNDAMENTAL ANALYSIS                               │
│  Tokenomics & distribution health                            │
│  • Holder count & distribution (no whale >5%)               │
│  • Liquidity depth & lock status                             │
│  • Market cap vs FDV                                         │
│  • Buy/sell tax analysis                                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  PHASE 4: SMART MONEY ANALYSIS                               │
│  Who's buying? Who's selling?                                │
│  • Whale wallet tracking                                     │
│  • Dev wallet movements                                      │
│  • Insider accumulation patterns                             │
│  • Smart money vs retail flow                                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  PHASE 5: SENTIMENT & BUZZ                                   │
│  What's the market saying?                                   │
│  • Twitter/X mentions & sentiment                            │
│  • Telegram group activity                                   │
│  • Reddit discussions                                        │
│  • Influencer attention (good or bad?)                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  PHASE 6: TECHNICAL SNAPSHOT                                 │
│  Price action & chart health                                 │
│  • Entry zone calculation                                    │
│  • Support/resistance levels                                 │
│  • Volume profile                                            │
│  • Momentum indicators                                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  OUTPUT: ACTIONABLE SIGNAL                                   │
│  BUY / WAIT / AVOID with:                                    │
│  • Specific entry price/range                                │
│  • Stop loss level                                           │
│  • Target prices (50%, 100%, 200%)                          │
│  • Risk score (1-10)                                         │
│  • Position size recommendation                              │
└─────────────────────────────────────────────────────────────┘
```

## Commands

```bash
# Hunt for new opportunities (scans DexScreener + GeckoTerminal simultaneously)
meme-lord hunt [--chain solana|ethereum|bsc|base|arbitrum] [--min-liquidity 50k]

# Deep dive on specific token (cross-platform verification)
meme-lord analyze <token-address> --chain <chain>

# Compare token across platforms
meme-lord compare <token-address>

# Check contract safety only
meme-lord safety <token-address> --chain <chain>

# Monitor whale movements on token
meme-lord whales <token-address> --min-value 10k

# Watchlist management
meme-lord watchlist [add|remove|list] <token-address>

# Get latest signals
meme-lord signals [--risk low|medium|high] [--min-gain 50]
```

## Safety Check Criteria

**🚨 AUTO-REJECT (Red Flags):**

- Honeypot detected (can't sell)
- Contract not verified
- Mint function enabled
- Ownership not renounced + suspicious functions
- Liquidity <30% of market cap
- Single wallet holds >10% supply
- Buy tax >10% or sell tax >15%
- Liquidity not locked/burned
- Contract created by known scammer

**⚠️ CAUTION (Yellow Flags):**

- Contract <24 hours old
- Owner still has admin functions (but renounce planned)
- 2-3 wallets hold 5-8% each (possible team wallets)
- Liquidity 30-50% of market cap
- Low holder count (<100)
- Suspicious token name (ElonTrumpDoge420)

**✅ GREEN LIGHT:**

- Contract verified + audited
- Ownership renounced
- Liquidity burned/locked >1 year
- Mint disabled
- No suspicious functions
- Fair holder distribution
- Healthy liquidity/MC ratio (>50%)

## Risk Scoring

| Score | Risk Level | Position Size      | Description                           |
| ----- | ---------- | ------------------ | ------------------------------------- |
| 1-3   | Low        | 2-3% portfolio     | Established meme, strong fundamentals |
| 4-6   | Medium     | 1-2% portfolio     | Fresh but clean, some uncertainty     |
| 7-8   | High       | 0.5-1% portfolio   | Very new, high upside, manage risk    |
| 9-10  | Extreme    | 0.1-0.5% portfolio | Degen play, could 10x or go to zero   |

## Data Sources (All Free APIs)

**Primary Data (Real-time):**
| Platform | API Cost | Rate Limit | Data Quality |
|----------|----------|------------|--------------|
| **DexScreener** | FREE | Unlimited | ⭐⭐⭐⭐⭐ Fastest |
| **GeckoTerminal** | FREE | 30 req/min | ⭐⭐⭐⭐⭐ Historical |
| **DEXTools** | FREE tier | 1M credits/mo | ⭐⭐⭐⭐ Deep ETH/BSC |

**Verification Sources:**

- Cross-reference 2-3 platforms for data accuracy
- Flags inconsistencies (potential manipulation)
- Higher confidence score for multi-source tokens

**Supported Chains:**

- Solana, Ethereum, BSC, Base, Arbitrum, Optimism, Polygon, Avalanche

**Blockchain Explorers:**

- Solscan, Etherscan, BscScan, BaseScan (for contract verification)

**Safety Check APIs:**

- Honeypot.is, Token Sniffer, RugCheck.xyz

## Reference Files

- `references/platforms.md` — Platform-specific scanning guides
- `references/red-flags.md` — Complete rug/honeypot detection checklist
- `references/safety-checks.md` — Contract verification procedures
- `references/whale-tracking.md` — Smart money analysis methods

## Output Format

```
🐸 MEME LORD SIGNAL

Token: $TOKEN (Chain)
Contract: 0x... / So11...

⏰ Age: X hours/days
💰 Price: $0.0000XXX
📊 Market Cap: $XXXK
💧 Liquidity: $XXXK (locked/burned ✓)
👥 Holders: XXX

🛡️ SAFETY SCORE: X/10
✅ Contract verified
✅ Ownership renounced
✅ Mint disabled
✅ Liquidity locked 2 years
⚠️ 2 team wallets hold 6% each

🐋 WHALE ACTIVITY:
• 3 new whales bought $50K+ in last 6h
• Dev wallet hasn't moved (good)
• Smart money inflow: +$120K

📈 TECHNICAL:
Entry: $0.0000XXX - $0.0000XXX
Stop: $0.0000XXX (-20%)
Target 1: $0.0000XXX (+50%)
Target 2: $0.0000XXX (+100%)
Target 3: $0.0000XXX (+200%)

🎯 VERDICT: BUY / WAIT / AVOID
Position: X% of portfolio
Risk: Low/Medium/High/Extreme

📋 Notes: [Specific insights]
```

## Multi-Platform Verification

Meme Lord aggregates data from multiple free sources for higher accuracy:

### Data Sources

| Platform          | Type          | Free Tier          | Best For                    |
| ----------------- | ------------- | ------------------ | --------------------------- |
| **DexScreener**   | Real-time API | Unlimited, no key  | Live prices, trending pairs |
| **GeckoTerminal** | Real-time API | 30 req/min, no key | Volume analysis, history    |
| **DEXTools**      | Real-time API | 1M credits/mo      | Ethereum/BSC depth          |
| **GMGN.ai**       | Web scraping  | Limited            | Solana whale tracking       |

### Why Cross-Verification Matters

**Example Scenario:**

```
Token $XYZ:
- DexScreener: $100K liquidity, +150% (24h)
- GeckoTerminal: $95K liquidity, +148% (24h) ✓ Consistent
- Safety score increases because data is verified
```

**Red Flag Scenario:**

```
Token $ABC:
- DexScreener: $500K liquidity
- GeckoTerminal: $50K liquidity ⚠️ 10x difference!
→ Investigation needed: likely fake volume or wash trading
```

### How It Works

1. **Discovery Phase:** Scans DexScreener + GeckoTerminal simultaneously
2. **Deduplication:** Merges tokens found on multiple platforms
3. **Enrichment:** Fills missing data from secondary sources
4. **Verification:** Flags inconsistencies for manual review
5. **Scoring:** Higher safety score for multi-source verified tokens

### Benefits

- ✅ **Higher Confidence:** 2-3 sources confirming data = better signal
- ✅ **Gap Coverage:** Some tokens only on certain platforms
- ✅ **Manipulation Detection:** Inconsistent data = potential scam
- ✅ **Zero Cost:** All using free APIs, no paid subscriptions needed

## Important

Meme Lord identifies opportunities but **cannot guarantee profits**. Meme coins are highly volatile and can go to zero quickly. Always:

- Use stop losses
- Size positions appropriately
- Never risk more than you can afford to lose
- Take profits on the way up

**This is gambling with better data, not investing.**
