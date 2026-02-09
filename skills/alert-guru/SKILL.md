---
name: alert-guru
description: >
  Elite price and event alert management skill. Set, manage, and receive alerts for
  any asset across crypto, stocks, forex, and commodities. Supports price targets,
  percentage moves, and event triggers.
metadata:
  openclaw:
    emoji: "🔔"
    requires:
      bins: ["curl", "jq"]
    env: []
---

# Alert Guru — Never Miss a Move

> **Alert Guru helps you set and manage price alerts across all asset classes.**

> **Disclaimer**: Alerts are for informational purposes only. System latency or data provider issues may occur. Always monitor your positions independently. Not financial advice.

## Overview

Alert Guru is your **alert management specialist** for:

- Price target alerts (above/below)
- Percentage move alerts
- Multi-asset support (crypto, stocks, forex, commodities)
- Background monitoring for subscribers
- Telegram notifications

## Tier Access

| Tier    | Max Active Alerts | Background Checks | On-Demand |
| ------- | ----------------- | ----------------- | --------- |
| Trial   | 5                 | ❌ No             | ✅ Yes    |
| Free    | 0                 | ❌ No             | ❌ No     |
| Trader  | Unlimited         | Every 4 hours     | ✅ Yes    |
| Premium | Unlimited         | Every 15 min      | ✅ Yes    |
| Annual  | Unlimited         | Every 4 hours     | ✅ Yes    |

## When to Activate

- User says: "alert me when", "set alert", "notify me"
- User asks: "show my alerts", "what alerts do I have"
- User wants: "delete alert", "remove all alerts"
- User says: "check my alerts now"

## Supported Commands

| Intent       | Example Phrases                   |
| ------------ | --------------------------------- |
| Set alert    | "Alert me when SOL hits $200"     |
| Set alert    | "Tell me if BTC drops below $40k" |
| Set alert    | "Notify when AAPL reaches $180"   |
| Set alert    | "Alert if EUR/USD breaks 1.10"    |
| Set alert    | "Watch gold above $2100"          |
| List alerts  | "Show my alerts"                  |
| Check alerts | "Check my alerts now"             |
| Delete alert | "Remove the SOL alert"            |
| Delete all   | "Clear all my alerts"             |

## Alert Creation Flow

### Step 1: Parse User Intent

Extract:

- `asset`: Token/stock/pair symbol or address
- `condition`: "above" or "below"
- `target_price`: The price threshold
- `asset_type`: crypto/stock/forex/commodity (auto-detect)

### Step 2: Check Tier Access

```typescript
const access = await checkTierAccess(telegramId, "create_alert");

if (!access.allowed) {
  if (access.reason === "alerts_require_subscription") {
    return "⚠️ Alerts require a subscription. Subscribe for $10/month → /subscribe";
  }
  if (access.reason === "trial_alert_limit") {
    return "⚠️ Trial limit: 5 alerts. Subscribe for unlimited → /subscribe";
  }
}
```

### Step 3: Get Current Price

Fetch current price for reference:

- Crypto: DexScreener or CoinGecko
- Stocks: Yahoo Finance
- Forex: ExchangeRate-API
- Commodities: Yahoo Finance futures

### Step 4: Create Alert

```sql
INSERT INTO alerts (user_id, token_symbol, token_address, target_price, condition, asset_type)
VALUES (?, ?, ?, ?, ?, ?)
```

## Output Format

Alert Guru confirms and lists alerts using a standardized, clear format:

### Alert Confirmation

🔔 ALERT SET
━━━━━━━━━━━━

📍 Asset: {SYMBOL}
🎯 Target: {above/below} ${target_price}
📊 Current: ${current_price}
📏 Distance: {distance}% {to go}

{if subscriber}
✅ Auto-check: Every {4h/15m}
📱 You'll get a Telegram ping when it triggers.

{if trial}
⚠️ Trial alerts: Manual check only.
🔄 Check anytime: "check my alerts"
💡 Subscribe for auto-monitoring → /subscribe

```

## Alert Checking

### On-Demand Check

When user says "check my alerts":

```

🔔 ALERT CHECK — {timestamp}
━━━━━━━━━━━━━━━━━━━━━━━━━

{for each active alert}

📍 {SYMBOL}: ${current_price}
Target: {above/below} ${target_price}
Status: {✅ {distance}% to go | 🚨 TRIGGERED!}

---

Summary:
• Active Alerts: {count}
• Triggered: {count},

{if any triggered}
🚨 ALERTS TRIGGERED:
• {SYMBOL} hit ${price} (target was {above/below} ${target})

Want me to deactivate triggered alerts or set new targets?

````

### Background Check (Subscribers Only)

Cron job runs every 4h (trader) or 15m (premium):

```typescript
const alerts = await getActiveAlerts(userId);
for (const alert of alerts) {
  const currentPrice = await getPrice(alert.token_symbol);
  if (alertTriggered(alert, currentPrice)) {
    await sendTelegramNotification(userId, alert, currentPrice);
    await markAlertTriggered(alert.id);
  }
}
````

### Notification Format

```
🚨 ALERT TRIGGERED!
━━━━━━━━━━━━━━━━━━

📍 {SYMBOL} just hit your target!

🎯 Your Alert: {above/below} ${target_price}
💰 Current Price: ${current_price}
📈 Move: {+/-}{change}% since alert set

⏰ Time: {timestamp}

---
Reply with:
• "analyze {symbol}" for quick analysis
• "set new alert" for new target
• "my alerts" to see remaining alerts
```

## Alert Management

### List Active Alerts

```
🔔 YOUR ACTIVE ALERTS
━━━━━━━━━━━━━━━━━━━━

| # | Asset | Condition | Target | Current | Distance |
|---|-------|-----------|--------|---------|----------|
| 1 | SOL | above | $200 | $185 | 8.1% |
| 2 | BTC | below | $40k | $43k | 7.0% |
| 3 | AAPL | above | $180 | $175 | 2.9% |

Total: {count} active alerts
{if subscriber: "Auto-checks: Every {frequency} ✅"}
{if trial: "Manual checks only"}

Commands:
• "Check alerts" — Check all now
• "Remove alert 1" — Delete specific alert
• "Clear all alerts" — Remove all
```

### Delete Alert

```
✅ Alert removed.

Deleted: {SYMBOL} {above/below} ${target}

Remaining active alerts: {count}
```

### Delete All Alerts

```
✅ All {count} alerts removed.

Set new alerts anytime: "alert me when [asset] hits [price]"
```

## Data Sources

Alert Guru pulls real-time price data from high-reliability free APIs across all asset classes:

### Crypto Alerts

```
Examples:
• "Alert when SOL hits $200"
• "Tell me if BONK drops 20%"
• "Watch 5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d above $0.01"

Data: DexScreener, CoinGecko
```

### Stock Alerts

```
Examples:
• "Alert when AAPL reaches $180"
• "Notify if TSLA drops below $200"
• "Watch SPY at $450"

Data: Yahoo Finance
```

### Forex Alerts

```
Examples:
• "Alert when EUR/USD breaks 1.10"
• "Tell me if USD/JPY hits 150"

Data: ExchangeRate-API, Yahoo Finance
```

### Commodity Alerts

```
Examples:
• "Alert when gold hits $2100"
• "Watch oil below $70"
• "Notify if silver breaks $30"

Data: Yahoo Finance (GC=F, CL=F, SI=F)
```

## Database Schema

```sql
CREATE TABLE alerts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  token_symbol TEXT NOT NULL,
  token_address TEXT,
  target_price DECIMAL NOT NULL,
  condition TEXT CHECK (condition IN ('above', 'below')),
  asset_type TEXT DEFAULT 'crypto',
  is_active BOOLEAN DEFAULT true,
  triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_alerts_user_active ON alerts(user_id, is_active);
```

## Error Handling

### Can't Determine Price

```
⚠️ I couldn't find price data for "{asset}".

Try:
• Using the full symbol (e.g., "BTC" not "bitcoin")
• Providing a contract address for new tokens
• Checking the asset exists on major exchanges
```

### At Limit (Trial)

```
⚠️ You've reached your trial limit of 5 alerts.

Active Alerts: 5/5

To set more alerts:
1. Delete an existing alert: "remove alert [number]"
2. Or subscribe for unlimited: /subscribe
```

## Follow-Up Suggestions

- "Check my alerts" — Manual check now
- "Set another alert for {asset}"
- "Show me current price of {asset}"
- "What happens when it triggers?" — Explain notifications
