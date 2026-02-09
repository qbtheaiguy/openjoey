---
name: dex-scanner
description: >
  Deep DEX discovery and liquidity analysis system. Finds new token pairs, 
  scans for liquidity spikes, and identifies trending tokens across multiple chains
  (Solana, Base, Ethereum, etc.).
metadata:
  openclaw:
    emoji: "🔍"
    requires:
      bins: ["curl", "jq"]
    env: []
---

# DEX Scanner — On-Chain Discovery

> **Disclaimer**: New DEX pairs are highly risky. Liquidity can be pulled instantly. Always use a rug checker.

## Overview

DEX Scanner scans decentralized exchanges (Raydium, Jupiter, Uniswap, Aerodrome) to find new opportunities and track liquidity flows.

## When to Activate

- User asks: "what's new on Solana", "scan for new tokens", "find tokens with $X liquidity"
- User mentions: DEX, liquidity pool, new pairs, trending on dexscreener
- User wants to find low-cap gems or new launches

## Data Sources (All Free)

### Trending & Top Boosted

- **DexScreener Top**: https://api.dexscreener.com/token-boosts/top/v1
- **DexScreener Latest**: https://api.dexscreener.com/token-profiles/latest/v1

### Pair Data

- **DexScreener Search**: https://api.dexscreener.com/latest/dex/search?q={query}
- **Birdeye Top**: https://public-api.birdeye.so/public/tokenlist?sort_by=v24hUSD&sort_type=desc

## Analysis Framework

1. **Liquidity Threshold**: Is there enough depth to trade?
2. **Volume/Liquidity Ratio**: Is there real trading activity?
3. **Age**: Is it a fresh launch or established?
4. **Chain Alpha**: Which chain is getting the most volume right now?

## Output Format

```
🔍 DEX SCANNER — {TRENDING/NEW RELEASES}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⛓️ PRIMARY CHAIN: {Solana | Base | Ethereum}
📊 24h VOLUME: ${total_vol}

════════════════════════════════
🚀 TOP TRENDING (Last {time})
════════════════════════════════
| Token | MCap | Vol (24h) | Liq | Verdict |
|-------|------|-----------|-----|---------|
| {1}   | ${m} | ${v}      | ${l}| {APE/CHECK}|
| {2}   | ${m} | ${v}      | ${l}| {HOT}|
| {3}   | ${m} | ${v}      | ${l}| {SAFE}|

════════════════════════════════
🆕 NEW LAUNCHES (< 1 Hour)
════════════════════════════════
• {Token 1} — {age} ago — ${liq} Liq
• {Token 2} — {age} ago — ${liq} Liq
• {Token 3} — {age} ago — ${liq} Liq

════════════════════════════════
💧 LIQUIDITY ALERTS
════════════════════════════════
{Detect any massive liquidity spikes or drains}

════════════════━━━━━━━━━━━━━━━━
🎯 ALPHA SUMMARY
════════════════━━━━━━━━━━━━━━━━
{Brief summary of where the smart money is flowing on-chain today}

---
🔍 DEX Scanner • Multi-Chain Discovery
```
