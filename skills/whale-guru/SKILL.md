---
name: whale-guru
description: >
  Elite whale tracking and smart money monitoring skill. Tracks large wallet movements,
  institutional flows, and smart money patterns across Solana and EVM chains. Requires
  active subscription (trader/premium/annual).
metadata:
  openclaw:
    emoji: "🐋"
    requires:
      bins: ["curl", "jq"]
    env: []
---

# Whale Guru — Smart Money Intelligence

> **Disclaimer**: Past whale activity doesn't predict future results. Not financial advice.

## Overview

Whale Guru is your **smart money specialist** for tracking:

- Large wallet movements
- Institutional flows
- Exchange in/outflows
- Known fund activity
- Accumulation/distribution patterns

## Tier Requirement

⚠️ **Subscriber Feature**: Whale Guru requires `trader`, `premium`, or `annual` subscription.

```typescript
allowedTiers: ["trader", "premium", "annual"];
blockedTiers: ["free", "trial"];
```

## When to Activate

- User asks: "track wallet", "watch this whale"
- User says: "whale movements", "smart money"
- User wants: "who's buying", "big transactions"
- User mentions: "institutional flows", "exchange flows"

## Data Sources (All Free)

### On-Chain Data

```
Helius (Solana): https://api.helius.xyz/v0/addresses/{address}/transactions
Solscan: web_search "solscan {address} transactions"
Etherscan: web_search "etherscan {address} transactions"
```

### Exchange Flows

```
CryptoQuant: web_search "cryptoquant {token} exchange flows"
Glassnode (free tier): web_search "glassnode {token} exchange balance"
```

### Smart Money Tracking

```
Arkham: web_search "arkham intelligence {address}"
Nansen (free summaries): web_search "nansen {token} smart money"
```

## Features

### 1. Watch a Wallet

Store and monitor specific wallets:

```sql
INSERT INTO whale_watches (user_id, wallet_address, label, chain, last_balance)
VALUES (?, ?, ?, 'solana', ?)
```

### 2. Check Watched Wallets

Query for movements on demand or background (premium):

```typescript
for (const watch of userWatches) {
  const currentBalance = await fetchBalance(watch.address);
  if (significantChange(watch.lastBalance, currentBalance)) {
    notify(user, watch, currentBalance);
  }
}
```

### 3. Find Top Holders

Identify whales for any token:

```
DexScreener: Top holders via token page
Solscan: Top holders tab
Etherscan: Token holders page
```

### 4. Exchange Flow Analysis

Track macro in/outflows:

- CEX inflows = selling pressure
- CEX outflows = accumulation
- Stablecoin inflows = buying power

## Output Formats

### Wallet Watch Added

```
🐋 WHALE WATCH ADDED
━━━━━━━━━━━━━━━━━━━━

📍 Wallet: {short_address}
🏷️ Label: "{label}"
💰 Current Balance: {balance} {token}
🔗 Chain: {Solana/Ethereum/Base}

Monitoring for:
• Balance changes > 10%
• New token acquisitions
• Large outflows

{if premium: "Background checks every 15 min"}
{if trader: "Background checks every 4 hours"}
{if trial: "Manual checks only — subscribe for auto-monitoring"}
```

### Whale Activity Report

```
🐋 WHALE ACTIVITY REPORT
━━━━━━━━━━━━━━━━━━━━━━━━

📅 {timestamp}

════════════════════════════════
📍 {label} — {short_address}
════════════════════════════════

Status: {⚡ ACTIVITY DETECTED | ✅ No significant changes}

{if activity:}
Last 24h Transactions:
| Time | Type | Amount | Token | Value |
|------|------|--------|-------|-------|
| {time} | {send/receive} | {amount} | {token} | ${value} |
| {time} | {send/receive} | {amount} | {token} | ${value} |

Notable:
• {interpretation of activity}

{endif}

Balance Summary:
• SOL: {balance} (${value})
• Top Tokens:
  - {token_1}: {balance} (${value})
  - {token_2}: {balance} (${value})

Change (24h): {+/- $amount}

---
{repeat for each watched wallet}
---

📊 SUMMARY
• Active Watches: {count}
• Wallets with Activity: {count}
• Net Movement: ${amount}
```

### Top Holders Analysis

```
🐋 TOP HOLDERS — {TOKEN}
━━━━━━━━━━━━━━━━━━━━━━━━

| # | Wallet | Balance | % Supply | Activity |
|---|--------|---------|----------|----------|
| 1 | {short} | {amount} | {pct}% | {accumulating/distributing/holding} |
| 2 | {short} | {amount} | {pct}% | {activity} |
| 3 | {short} | {amount} | {pct}% | {activity} |
| 4 | {short} | {amount} | {pct}% | {activity} |
| 5 | {short} | {amount} | {pct}% | {activity} |

Top 10 Hold: {pct}% of supply
Top 50 Hold: {pct}% of supply

Concentration Risk: {LOW | MEDIUM | HIGH}

Known Wallets:
• {address}: {identifier — e.g., "Jump Trading", "Binance Hot Wallet"}

Recent Whale Movements (24h):
• {wallet}: {bought/sold} ${amount} worth
• {wallet}: {bought/sold} ${amount} worth

📊 Overall: {ACCUMULATION | DISTRIBUTION | NEUTRAL}

Want to track any of these? Reply with the number.
```

### Exchange Flows

```
🐋 EXCHANGE FLOWS — {TOKEN}
━━━━━━━━━━━━━━━━━━━━━━━━━━

Period: Last 24 hours

📥 CEX INFLOWS: {amount} ({$value})
   → More tokens moving to exchanges
   → Potential selling pressure

📤 CEX OUTFLOWS: {amount} ({$value})
   → Tokens leaving exchanges
   → Potential accumulation

📊 NET FLOW: {inflow/outflow} {amount}

Interpretation: {BEARISH — selling | BULLISH — accumulating | NEUTRAL}

Historical Context:
• 7D Net: {net}
• 30D Net: {net}
• Trend: {increasing outflows / increasing inflows}

Top Exchange Activity:
| Exchange | Inflow | Outflow | Net |
|----------|--------|---------|-----|
| Binance | {in} | {out} | {net} |
| Coinbase | {in} | {out} | {net} |
| OKX | {in} | {out} | {net} |
```

## Commands

| Command                      | Description                     |
| ---------------------------- | ------------------------------- |
| "Watch wallet {address}"     | Add wallet to watchlist         |
| "My whale watches"           | List all tracked wallets        |
| "Check whales"               | Activity report for all watches |
| "Stop tracking {address}"    | Remove from watchlist           |
| "Top holders of {token}"     | Find the biggest wallets        |
| "Exchange flows for {token}" | CEX in/outflow analysis         |

## Background Monitoring

For subscribers, the check-alerts cron job includes whale watches:

| Tier    | Check Frequency  | Notification         |
| ------- | ---------------- | -------------------- |
| Premium | Every 15 minutes | Instant via Telegram |
| Trader  | Every 4 hours    | Instant via Telegram |
| Annual  | Every 4 hours    | Instant via Telegram |
| Trial   | Manual only      | —                    |
| Free    | Not available    | —                    |

### Alert Triggers

- Balance change > 10%
- Balance change > $10,000 value
- New token acquisition (significant)
- Complete wallet drain

## Follow-Up Suggestions

- "Track this whale's top holdings"
- "Set alert for when this wallet buys {token}"
- "Compare whale activity vs price"
- "Find wallets that bought {token} early"
- "Who else is this whale copying?"
