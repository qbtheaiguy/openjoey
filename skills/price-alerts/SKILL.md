---
name: price-alerts
description: >
  Manage price alerts for crypto tokens. Use when the user wants to set, list, or remove price alerts.
  Alerts are stored in Supabase and checked by a background cron job (subscribers only get background checks;
  free/trial users get on-demand checks only).
---

# Price Alerts — Alert Management

You manage price alerts for the user. Alerts are stored in the Supabase database and checked periodically by a background job for subscribers.

## Commands the user might say

| Intent       | Example phrases                                                   |
| ------------ | ----------------------------------------------------------------- |
| Set alert    | "Alert me when SOL hits $200", "Set alert for BONK above 0.00005" |
| List alerts  | "Show my alerts", "What alerts do I have?"                        |
| Remove alert | "Delete the SOL alert", "Remove all alerts"                       |
| Check alert  | "Has my SOL alert triggered?", "Check my alerts now"              |

## Setting an alert

When the user wants to set a price alert:

1. **Parse the request** to extract:
   - `token_symbol` (e.g. "SOL", "BONK", "JUP")
   - `target_price` (the price threshold)
   - `condition` ("above" or "below")

2. **Check tier access** by calling Supabase:

   ```sql
   select public.check_tier_access({telegram_id}, 'create_alert')
   ```

   - If `allowed = false` and reason is `alerts_require_subscription`:
     > ⚠️ Price alerts require an active subscription. Subscribe for $10/month to get unlimited alerts with background monitoring → /subscribe
   - If `allowed = false` and reason is `trial_alert_limit`:
     > ⚠️ You've reached the trial limit of 5 active alerts. Subscribe to get unlimited alerts → /subscribe

3. **Get current price** for reference:

   ```
   https://api.dexscreener.com/latest/dex/search?q={token_symbol}
   ```

4. **Create the alert** in Supabase:

   ```sql
   insert into alerts (user_id, token_symbol, token_address, target_price, condition)
   values ({user_id}, '{symbol}', '{address}', {price}, '{condition}')
   ```

5. **Confirm to the user**:

   ```
   ✅ Alert set!

   📍 {TOKEN_SYMBOL}
   🎯 {condition} ${target_price}
   📊 Current price: ${current_price}
   📏 Distance: {distance}%

   {subscriber: "I'll check every 4 hours and ping you when it triggers."}
   {trial: "I'll check on-demand when you ask. Subscribe for background monitoring."}
   ```

## Listing alerts

Query the user's active alerts:

```sql
select * from alerts where user_id = {user_id} and is_active = true order by created_at desc
```

Format response:

```
📋 YOUR ACTIVE ALERTS
━━━━━━━━━━━━━━━━━━━

1. SOL — above $200.00 (current: $185.50, 7.8% away)
2. BONK — below $0.00003 (current: $0.000035, 14.3% away)
3. JUP — above $2.50 (current: $2.10, 19.0% away)

Total: 3 active alerts
{if subscriber: "Background checks: every 4 hours ✅"}
{if trial: "Background checks: ❌ (subscribe for auto-monitoring)"}
```

## Removing alerts

- If user says "delete the SOL alert" → deactivate the specific alert
- If user says "remove all alerts" → deactivate all active alerts for this user

```sql
update alerts set is_active = false where user_id = {user_id} and token_symbol = '{symbol}'
```

Confirm: "✅ Alert for {TOKEN} removed."

## On-demand check

When the user asks to check alerts now:

1. Fetch all their active alerts
2. For each, get the current price from DexScreener
3. Check if any have triggered
4. Report results:

```
🔔 ALERT CHECK — {timestamp}

✅ SOL: $185.50 (target: above $200) — 7.8% to go
✅ BONK: $0.000035 (target: below $0.00003) — not triggered
🚨 JUP: $2.55 (target: above $2.50) — TRIGGERED!

{if triggered: "Want me to deactivate triggered alerts or set new targets?"}
```

## Supabase connection

The gateway connects to Supabase using the service role key. Environment variables:

- `SUPABASE_URL` = https://clgplkenrdbxqmkkgyzq.supabase.co
- `SUPABASE_SERVICE_ROLE_KEY` (set in gateway env, never expose to users)

## Tier limits

| Tier    | Max active alerts | Background checks | On-demand checks |
| ------- | ----------------- | ----------------- | ---------------- |
| Trial   | 5                 | No                | Yes              |
| Free    | 0                 | No                | No               |
| Trader  | Unlimited         | Every 4 hours     | Yes              |
| Premium | Unlimited         | Every 15 min      | Yes              |
| Annual  | Unlimited         | Every 4 hours     | Yes              |
