---
name: whale-tracker
description: >
  Monitor whale wallets and detect large transactions on Solana. Use when the user wants to
  track a wallet, watch for whale movements, or analyze smart money flows.
  Requires an active subscription (trader/premium/annual).
---

# Whale Tracker — Smart Money Monitoring

You track whale wallets on Solana for the user. This skill requires an active subscription.

## Commands the user might say

| Intent       | Example phrases                                             |
| ------------ | ----------------------------------------------------------- |
| Track wallet | "Watch this wallet: ABC123...", "Track the whale at ABC..." |
| List watches | "Show my whale watches", "What wallets am I tracking?"      |
| Remove watch | "Stop tracking ABC...", "Remove all whale watches"          |
| Check whales | "Any whale moves?", "Check my tracked wallets"              |
| Find whales  | "Who are the top holders of SOL?", "Find whales for BONK"   |

## Adding a whale watch

1. **Check tier access**:

   ```sql
   select public.check_tier_access({telegram_id}, 'whale_watch')
   ```

   If not allowed:

   > 🐋 Whale tracking requires an active subscription. Subscribe for $10/month → /subscribe

2. **Validate the wallet address** (Solana addresses are base58, 32-44 chars)

3. **Get current balance** via web_search or Solscan:

   ```
   https://api.helius.xyz/v0/addresses/{wallet}/balances?api-key={HELIUS_API_KEY}
   ```

   Or use web_search: "solscan wallet {address} balance"

4. **Store the watch**:

   ```sql
   insert into whale_watches (user_id, wallet_address, label, chain, last_balance)
   values ({user_id}, '{address}', '{label}', 'solana', {balance})
   ```

5. **Confirm**:

   ```
   🐋 Whale watch set!

   📍 Wallet: {short_address}
   🏷️ Label: {label or "Unnamed"}
   💰 Current balance: {balance} SOL
   🔗 Chain: Solana

   I'll monitor this wallet for large transactions (>$10k).
   ```

## Listing watches

```sql
select * from whale_watches where user_id = {user_id} and is_active = true
```

Format:

```
🐋 YOUR WHALE WATCHES
━━━━━━━━━━━━━━━━━━━━

1. 🏷️ "DEX Whale" — 7xK2...9pQm
   💰 Last balance: 45,230 SOL
   🕐 Last checked: 2h ago

2. 🏷️ "Smart Money" — 3nF8...2vKx
   💰 Last balance: 12,500 SOL
   🕐 Last checked: 2h ago

Total: 2 active watches
```

## On-demand whale check

When user asks to check whale activity:

1. For each watched wallet, fetch current balance/recent transactions
2. Compare with stored `last_balance`
3. Report any significant changes:

```
🐋 WHALE ACTIVITY REPORT — {timestamp}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📍 "DEX Whale" (7xK2...9pQm)
   ⚡ MOVEMENT DETECTED
   • Sent 5,000 SOL to Raydium
   • Value: ~$925,000
   • Possible: LP provision or large swap

📍 "Smart Money" (3nF8...2vKx)
   ✅ No significant activity
   • Balance: 12,500 SOL (unchanged)

💡 Insight: The DEX whale appears to be adding liquidity.
   This could signal confidence in a specific pair.
```

## Finding whales for a token

When user asks "who are the top holders of X":

1. Search for the token's top holders via web_search
2. Present the concentration data:

```
🐋 TOP HOLDERS — {TOKEN}
━━━━━━━━━━━━━━━━━━━━━━

| # | Wallet | Balance | % Supply |
|---|--------|---------|----------|
| 1 | 7xK2...9pQm | 5.2M | 8.3% |
| 2 | 3nF8...2vKx | 3.1M | 4.9% |
| 3 | 9aB4...7wLp | 2.8M | 4.5% |
| ... | ... | ... | ... |

Top 10 hold: {total_pct}% of supply
Concentration risk: {LOW/MEDIUM/HIGH}

Want me to watch any of these wallets? Reply with the number.
```

## Background monitoring

The `check-alerts` edge function (Supabase) also covers whale watches for subscribers. The cron checks every 15 minutes for:

- Balance changes > 10% or > $10,000 in value
- New token acquisitions by watched wallets
- Large outflows (potential sell signals)

## Data sources

- **Helius API**: Primary on-chain data source (if API key available)
- **Solscan**: Fallback for wallet/transaction data
- **DexScreener**: For price context on moved tokens
- **web_search**: General intelligence gathering
