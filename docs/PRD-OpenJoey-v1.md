# OpenJoey Trading Bot - Product Requirements Document

**Version:** 1.0  
**Date:** February 8, 2025  
**Author:** Joey (AI Architect)  
**Status:** Draft

---

## 1. Executive Summary

OpenJoey is a **personal AI trading assistant** delivered via Telegram DM. Each user gets their own isolated Joey instance for private trading analysis, alerts, and research. The service operates on a freemium model with a 3-day trial and $10/month subscription.

### Key Differentiators

- **True Privacy:** Each user's data is completely isolated (no cross-user leakage)
- **Personal Touch:** 1:1 conversation in Telegram DM (not group bot)
- **Trading-Focused:** Purpose-built for crypto traders (Solana-first)
- **Transparent Pricing:** $10/month flat, no tiers or hidden limits

---

## 2. User Experience Flow

### 2.1 Discovery & Onboarding

```
[OpenJoey.com Landing Page]
         ↓
    "Get Your Trading Assistant"
         ↓
    Telegram Link (@OpenJoeyBot)
         ↓
[User Starts DM with Joey]
         ↓
Joey: "Welcome to OpenJoey! 🦞 I'm your personal trading assistant.
      You have 3 days of full access to test me out."
         ↓
Joey: "What token should we analyze first?"
```

### 2.2 Trial Period (Days 1-3)

**Capabilities:**

- Unlimited trading analysis (signal-fusion, trading-god)
- 5 price alerts active at once
- Full access to all trading skills
- Community group invitation

**Limitations:**

- No background cron jobs (alerts check on-demand only)
- No data export
- "TRIAL" watermark on analysis outputs

### 2.3 Trial Expiration (Day 3)

```
Joey: "Your 3-day trial ends in 2 hours! 🚨

To keep your alerts running and get unlimited access:
→ Subscribe for $10/month

[Subscribe Button] [Continue Free]"
         ↓
[If subscribed] → Stripe payment → Active subscriber
[If "Continue Free"] → Downgrade to Free Tier (1 chart/day)
```

### 2.4 Free Tier (Post-Trial)

**For users who don't subscribe after trial:**

**Capabilities:**

- 1 trading analysis per day (any token)
- No price alerts (on-demand only)
- No background monitoring
- Community group access

**Marketing Hooks (Built-in):**
After each free analysis, Joey drops subtle FOMO:

- "That was your daily free chart. Imagine what I can do with full access — unlimited scans, real-time alerts, whale tracking..."
- "Want me to watch this for you? Subscribe and I'll alert you the moment it moves."
- "3 days ago you had unlimited access. Ready to come back? $10/month unlocks everything."

**Upgrade Triggers:**

- User hits daily limit → "You've used your free chart for today. Upgrade for unlimited scans."
- After 7 days on free tier → "You've been missing out on 6 opportunities this week. Subscribe?"
- Market volatility detected → "Big moves happening and you're on free tier. Subscribe to catch the next one."

### 2.5 Active Subscriber Experience

**Capabilities:**

- Unlimited trading analysis
- Unlimited price alerts (background monitoring)
- Whale wallet tracking
- New token launch alerts
- Priority response time
- Data export (CSV/JSON)

### 2.6 Community Group (Optional)

- Separate Telegram group: "OpenJoey Traders"
- No bot commands (discussion only)
- Users share insights, setups, alpha
- Creator + mods moderate

---

## 3. Technical Architecture

### 3.1 High-Level Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     TELEGRAM CLOUD                           │
│                                                              │
│  User A DM ←────┐                                           │
│  User B DM ←────┼────→ @OpenJoeyBot Webhook                 │
│  User C DM ←────┘                                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    HETZNER SERVER                            │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           OPENCLAW GATEWAY                          │   │
│  │                                                     │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │   │
│  │  │ User A      │  │ User B      │  │ User C     │  │   │
│  │  │ Session     │  │ Session     │  │ Session    │  │   │
│  │  │ (isolated)  │  │ (isolated)  │  │ (isolated) │  │   │
│  │  └─────────────┘  └─────────────┘  └────────────┘  │   │
│  │                                                     │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │ Trading Skills Engine                       │   │   │
│  │  │ • signal-fusion                             │   │   │
│  │  │ • trading-god                               │   │   │
│  │  │ • price-alerts                              │   │   │
│  │  │ • whale-tracker                             │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ CRON SCHEDULER (background alerts)                  │   │
│  │ • Price checks every 4 hours (active subscribers)   │   │
│  │ • Whale movement detection                          │   │
│  │ • New token launch scanning                         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   SUPABASE DATABASE                          │
│                                                              │
│  • Users table (subscription status, trial dates)           │
│  • Sessions table (isolation keys, metadata)                │
│  • Alerts table (price targets, trigger history)            │
│  • Analytics table (usage metrics, retention)               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   STRIPE (Payments)                          │
│                                                              │
│  • Subscription management ($10/month)                      │
│  • Trial tracking                                           │
│  • Webhooks for status changes                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Component Details

#### 3.2.1 Telegram Bot (@OpenJoeyBot)

- **Webhook URL:** `https://api.openjoey.com/webhook/telegram`
- **Handler:** Routes messages to correct user session
- **Isolation:** Each user gets `session_key = user:${telegram_id}`
- **First-time UX:** Use `dmPolicy: "open"` and `allowFrom: ["*"]` so new users see the welcome message (not the pairing screen). See [openjoey-telegram-first-time-ux.md](install/openjoey-telegram-first-time-ux.md).

#### 3.2.2 OpenClaw Gateway (Hetzner)

- **Host:** Ubuntu 22.04 LTS on Hetzner Cloud
- **Specs:** 4 vCPU, 8GB RAM, 160GB SSD (scales with users)
- **Runtime:** Node.js + OpenClaw daemon
- **Uptime:** 24/7 via systemd service

#### 3.2.3 Session Isolation

```javascript
// Each user gets completely isolated context
const sessionConfig = {
  sessionKey: `user:${telegram_user_id}:${Date.now()}`,
  memoryPath: `/data/sessions/${telegram_user_id}/`,
  skills: ["signal-fusion", "trading-god", "price-alerts"],
  permissions: ["read", "write", "cron"],
  isolation: "strict", // No cross-session access
};
```

#### 3.2.4 Supabase Schema

https://clgplkenrdbxqmkkgyzq.supabase.co
**users table:**

```sql
create table users (
  id uuid primary key default uuid_generate_v4(),
  telegram_id bigint unique not null,
  telegram_username text,
  status text check (status in ('trial', 'free', 'active', 'premium', 'expired', 'cancelled')),
  tier text check (tier in ('trial', 'free', 'trader', 'premium', 'annual')),
  trial_started_at timestamptz,
  trial_ends_at timestamptz,
  subscription_started_at timestamptz,
  subscription_ends_at timestamptz,
  stripe_customer_id text,
  stripe_subscription_id text,
  referral_code text unique,
  referred_by uuid references users(id),
  credit_balance decimal(10,2) default 0.00,
  charts_used_today int default 0,
  charts_reset_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

**alerts table:**

```sql
create table alerts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id),
  token_symbol text not null,
  target_price decimal(20, 8) not null,
  condition text check (condition in ('above', 'below')),
  is_active boolean default true,
  triggered_at timestamptz,
  created_at timestamptz default now()
);
```

**sessions table:**

```sql
create table sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id),
  session_key text unique not null,
  status text default 'active',
  started_at timestamptz default now(),
  last_activity_at timestamptz default now()
);
```

**referrals table:**

```sql
create table referrals (
  id uuid primary key default uuid_generate_v4(),
  referrer_id uuid references users(id),
  referred_id uuid references users(id) unique,
  referrer_credit decimal(10,2) default 1.80,
  referred_credit decimal(10,2) default 1.20,
  status text default 'pending', -- pending, converted, paid, cancelled
  converted_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz default now()
);

-- Indexes for performance
create index idx_referrals_referrer on referrals(referrer_id);
create index idx_referrals_referred on referrals(referred_id);
create index idx_referrals_status on referrals(status);
```

**referral_analytics view:**

```sql
create view referral_leaderboard as
select
  u.telegram_username,
  u.referral_code,
  count(r.id) as total_referrals,
  count(case when r.status = 'converted' then 1 end) as converted_referrals,
  sum(case when r.status = 'paid' then r.referrer_credit else 0 end) as total_earned,
  u.credit_balance as current_balance
from users u
left join referrals r on u.id = r.referrer_id
where u.referral_code is not null
group by u.id, u.telegram_username, u.referral_code, u.credit_balance
order by total_earned desc;
```

---

## 4. Security & Isolation Architecture

### 4.1 Multi-Tenant Isolation

**Principle:** Each user operates in a complete sandbox.

```
User A                          User B
  │                               │
  ▼                               ▼
┌──────────────┐            ┌──────────────┐
│ Session A    │            │ Session B    │
│ • Memory A   │  ╳ NO    │ • Memory B   │
│ • Alerts A   │◄───────►│ • Alerts B   │
│ • History A  │  ACCESS  │ • History B  │
└──────────────┘            └──────────────┘
       │                           │
       └───────────┬───────────────┘
                   ▼
          Shared Skills (read-only)
```

### 4.2 Data Boundaries

| Data Type        | Isolation Level    | Storage                   |
| ---------------- | ------------------ | ------------------------- |
| Chat History     | User-only          | User's session file       |
| Price Alerts     | User-only          | Supabase (user_id scoped) |
| Trading Analysis | User-only          | Ephemeral (per request)   |
| Skill Code       | Shared (read-only) | Global skill directory    |
| Billing Info     | Admin-only         | Stripe (PCI compliant)    |

### 4.3 Permission System

**Free Tier (Post-Trial):**

```yaml
skills:
  allowed:
    - signal-fusion
    - trading-god

permissions:
  - run_analysis

limits:
  charts_per_day: 1
  alerts: 0
  cron_jobs: no
  data_export: no
  marketing_hooks: yes
```

**Trader ($10/month):**

```yaml
skills:
  allowed:
    - signal-fusion
    - trading-god
    - price-alerts
    - whale-tracker

permissions:
  - create_alerts
  - run_analysis
  - view_history
  - referral_program

limits:
  max_alerts: unlimited
  cron_jobs: yes
  data_export: yes
```

**Premium ($29/month):**

```yaml
skills:
  allowed:
    - signal-fusion-pro
    - trading-god-pro
    - price-alerts
    - whale-tracker
    - custom-strategies
    - api-access

permissions:
  - create_alerts
  - run_analysis
  - view_history
  - referral_program
  - api_access
  - priority_support

limits:
  max_alerts: unlimited
  cron_jobs: yes
  data_export: yes
  api_requests_per_day: 1000
```

**Trial Users:**

```yaml
status: trial
limits:
  max_alerts: 5
  cron_jobs: no (on-demand only)
  data_export: no
  duration: 3 days
  charts_per_day: unlimited
```

**Creator/Admin:**

```yaml
permissions:
  - view_all_sessions
  - broadcast_messages
  - manage_skills
  - access_analytics
  - user_support
  - referral_analytics
```

---

## 5. Subscription & Billing

### 5.1 Pricing Tiers

| Tier        | Price     | Features                                |
| ----------- | --------- | --------------------------------------- |
| **Trial**   | Free      | 3 days, unlimited everything            |
| **Free**    | $0        | 1 chart/day, marketing hooks, community |
| **Trader**  | $10/month | Unlimited everything                    |
| **Premium** | $29/month | Everything + multi-asset + API access   |
| **Annual**  | $100/year | Same as Trader (save $20/year)          |

### 5.2 Free Tier Psychology

**Purpose:** Keep users engaged who aren't ready to pay yet.

**Daily Flow:**

```
User: Analyze SOL
Joey: [Full Analysis]
Joey: "🔓 That was your free chart for today.
       Imagine having me watch 24/7 with unlimited scans
       and instant alerts... Subscribe for $10/month?"
```

**Conversion Triggers:**

- 3 free charts used → "3 insights, 0 alerts. Upgrade?"
- 7 days on free tier → "You've missed 6 opportunities this week."
- Major market move detected → "SOL just pumped 15% — free users found out late. Subscribe for real-time alerts."

### 5.2 Stripe Integration

**Webhook Events:**

- `checkout.session.completed` → Activate subscription
- `invoice.paid` → Extend subscription
- `invoice.payment_failed` → Grace period (3 days)
- `customer.subscription.deleted` → Downgrade to expired

**Trial Conversion Flow:**

```
Day 0: Trial starts (no payment method required)
Day 2: Reminder notification
Day 3: Final reminder + payment link
Day 3+6h: Downgrade to read-only if no payment
```

### 5.3 Referral Program

**The $3 Split Model:**

| Party                 | Credit | Value |
| --------------------- | ------ | ----- |
| **Referrer (User A)** | $1.80  | 60%   |
| **New User (User B)** | $1.20  | 40%   |

**How It Works:**

```
User A has referral link: openjoey.com/start?ref=A123
User B clicks → Starts trial → Subscribes
        ↓
User A gets $1.80 credit (applied to next bill)
User B gets $1.20 credit (applied to first bill)
        ↓
Net cost for User B's first month: $8.80
Next month for User A: $8.20 (or free if referrals stack)
```

**Credit Rules:**

- Credits apply automatically to next invoice
- Stack unlimited referrals → potentially free months
- Credits never expire while subscribed
- If user cancels, credits remain for 30 days (reactivate to restore)

**Marketing:**

- "Give $1.20, Get $1.80 — share your link"
- "Your next month could be free. Share Joey."
- Referral leaderboard (top referrers get featured)

**Supabase Schema Addition:**

```sql
create table referrals (
  id uuid primary key default uuid_generate_v4(),
  referrer_id uuid references users(id),
  referred_id uuid references users(id),
  referrer_credit decimal(10,2) default 1.80,
  referred_credit decimal(10,2) default 1.20,
  status text default 'pending', -- pending, converted, paid
  converted_at timestamptz,
  created_at timestamptz default now()
);
```

### 5.4 Annual Plan

**Pricing:** $100/year (vs $120/year monthly)
**Savings:** $20 (17% discount)

**Value Props:**

- "Save $20 — pay once, trade all year"
- "Lock in your price before we raise it"
- "One less thing to think about"

**Annual Perks:**

- Priority support
- Early access to new skills
- Annual member badge in community

### 5.5 Premium Tier ($29/month)

**For Power Traders:**

**Additional Features:**

- **Multi-Asset Coverage:**
  - Crypto (all chains, not just Solana)
  - Stocks (US equities)
  - Commodities (gold, silver, oil)
  - Forex (major pairs)
- **Advanced Alerts:**
  - Technical indicator triggers (RSI, MACD)
  - Correlation alerts ("When BTC drops, buy SOL")
  - Custom webhook alerts (connect to TradingView)
- **API Access:**
  - REST API for custom integrations
  - WebSocket for real-time data
  - Rate limit: 1000 req/day
- **White-Glove Support:**
  - Priority response (< 5 min)
  - Custom strategy requests
  - 1:1 onboarding call

**Premium Skills:**

- `signal-fusion-pro` (multi-asset)
- `trading-god-pro` (stocks, commodities)
- `custom-strategies` (build your own)
- `api-access` (programmatic access)

### 5.6 Cancellation

- Users can cancel anytime via `/cancel` command
- Access continues until end of billing period
- Data retained for 30 days (can reactivate)
- Credits remain for 30 days post-cancellation

---

## 6. Skills & Capabilities

### 6.1 Public Trading Skills

**signal-fusion**

- Comprehensive token analysis
- Price action + on-chain + sentiment
- Entry/exit recommendations
- Risk/reward calculations

**trading-god**

- Multi-agent research system
- Solana ecosystem deep dives
- Whale tracking
- News catalyst detection

**price-alerts**

- Set price targets
- Background monitoring (subscribers only)
- Multi-token watchlists
- Telegram notifications

**whale-tracker**

- Monitor specific wallet addresses
- Large transaction alerts
- Smart money flow analysis

### 6.2 Skills NOT Available to Public

- `gateway-config` (server management)
- `sessions_list` (view other users)
- `admin_broadcast` (mass messaging)
- `skill-install` (add new skills)
- `memory_search` (cross-user analytics)

---

## 7. Background Jobs (Cron)

### 7.1 Price Alert Checks

```yaml
job: price_alert_check
schedule: every 4 hours
target: active subscribers only
action:
  - Fetch current prices (DexScreener API)
  - Compare to alert thresholds
  - Send Telegram notification if triggered
```

### 7.2 Whale Monitoring

```yaml
job: whale_scan
schedule: every 15 minutes
target: tokens with active whale watches
action:
  - Check monitored wallets
  - Detect large transactions (>10k USD)
  - Alert subscribers watching those wallets
```

### 7.3 New Token Detection

```yaml
job: new_token_scan
schedule: every 30 minutes
action:
  - Scan Raydium/Jupiter for new pairs
  - Filter by liquidity threshold (>50k USD)
  - Alert subscribers with "new launches" enabled
```

---

## 8. Infrastructure (Using Existing Stack)

### 8.1 Hetzner (Primary Server)

**Current Use:** Clawbot runs 24/7
**New Use:** OpenJoey Gateway + Session Manager

**Migration:**

```bash
# Existing: Clawbot service
# New: OpenClaw Gateway (upgraded)

systemctl status clawbot  # Current
systemctl enable openclaw-gateway  # New (adds multi-user support)
```

**Scaling:**

- Start: CX21 (2 vCPU, 4GB RAM) - ~100 users
- Scale: CPX31 (4 vCPU, 8GB RAM) - ~500 users
- Scale: CPX51 (16 vCPU, 32GB RAM) - ~2000 users

### 8.2 Vercel (Landing Page)

**Current:** OpenJoey.com
**Enhancements Needed:**

- Pricing page ($10/month)
- Stripe Checkout integration
- Telegram bot deep link
- FAQ/Support docs

**New Pages:**

- `/pricing` - Subscription tiers
- `/start` - Redirect to Telegram with referral code
- `/docs` - User guide
- `/support` - Help center

### 8.3 Supabase (Database)

**Current Use:** Unknown/Minimal
**New Use:** Primary data store

**Why Supabase:**

- ✅ Already have it (zero migration cost)
- ✅ PostgreSQL (relational data for users/alerts)
- ✅ Real-time subscriptions (live alert status)
- ✅ Auth hooks (integrate with Telegram)
- ✅ Row Level Security (RLS) for data isolation

**RLS Example:**

```sql
-- Users can only see their own alerts
alter table alerts enable row level security;

create policy "Users can only view their own alerts"
  on alerts for select
  using (user_id = auth.uid());
```

---

## 9. API Integrations

### 9.1 Telegram Bot API

- **Webhook:** Receive messages
- **Send Message:** Respond to users
- **Inline Keyboard:** Buttons for actions

### 9.2 DexScreener API

- **Price Data:** Real-time token prices
- **Pairs:** Liquidity info
- **Volume:** 24h trading volume

### 9.3 Helius RPC (Solana)

- **On-chain Data:** Wallet balances, transactions
- **Webhooks:** Real-time whale alerts
- **Priority:** High-throughput for whale tracking

### 9.4 Stripe API

- **Checkout:** Subscription payments
- **Customer Portal:** Self-service billing
- **Webhooks:** Subscription status changes

---

## 10. Analytics & Monitoring

### 10.1 Key Metrics

**Business:**

- Trial-to-paid conversion rate (target: >20%)
- Monthly churn rate (target: <10%)
- Average revenue per user (ARPU): $10
- Customer lifetime value (LTV)

**Technical:**

- Active sessions
- Alert trigger rate
- API response times
- Error rates

**User Engagement:**

- Messages per user per day
- Most-used skills
- Peak usage hours

### 10.2 Monitoring Stack

- **Uptime:** UptimeRobot (Hetzner health)
- **Errors:** Sentry (OpenClaw errors)
- **Performance:** Supabase analytics
- **Business:** Stripe dashboard + custom Supabase queries

---

## 11. Launch Plan

### Phase 1: MVP (Week 1-2)

- [ ] Set up Telegram bot (@OpenJoeyBot)
- [ ] Implement session isolation
- [ ] Integrate signal-fusion + trading-god
- [ ] Build trial system (3 days)
- [ ] Stripe checkout integration
- [ ] Deploy to Hetzner

### Phase 2: Beta (Week 3-4)

- [ ] Invite 10-20 beta testers
- [ ] Price alerts with background checks
- [ ] Whale tracking
- [ ] Community group setup
- [ ] Landing page updates

### Phase 3: Public Launch (Week 5)

- [ ] Remove beta restrictions
- [ ] Free tier with marketing hooks
- [ ] Referral program ($3 split)
- [ ] Annual plan ($100/year)
- [ ] Premium tier ($29/month)
- [ ] Landing page pricing updates
- [ ] Support documentation

---

## 12. Decisions Log (Resolved)

| Question                   | Decision                                                 | Status               |
| -------------------------- | -------------------------------------------------------- | -------------------- |
| **Free Tier After Trial?** | ✅ Yes — 1 free chart/day with marketing hooks           | Implemented in PRD   |
| **Referral Program?**      | ✅ Yes — $3 split 60/40 ($1.80 referrer, $1.20 new user) | Implemented in PRD   |
| **Annual Discount?**       | ✅ Yes — $100/year (save $20)                            | Implemented in PRD   |
| **Premium Tier?**          | ✅ Yes — $29/month for multi-asset + API access          | Implemented in PRD   |
| **Creator Revenue Share?** | ⏸️ Deferred — focus on referral program first            | Future consideration |

### Referral Program Deep Dive

**Why 60/40 Split?**

- **60% to Referrer:** Incentivizes power users to promote heavily
- **40% to New User:** Sweetens the deal for signups (first month $8.80 instead of $10)
- **$3 Total:** Sustainable — we keep $7 from first month, $10 thereafter

**Math Example:**

```
User A refers 5 friends who subscribe
→ User A earns $9 credit (5 × $1.80)
→ Next month: FREE (credit covers $10 bill)

User B uses referral link
→ User B pays $8.80 first month (with $1.20 credit)
→ Month 2+: Regular $10/month
```

**Viral Loop Potential:**

- 10% of users refer 3+ friends → 30% of new signups from referrals
- Target: 20% of user base actively referring
- Average referrals per active referrer: 2.5

**Future Considerations:**

- Top referrer leaderboard (monthly prizes)
- Referral tiers (10 referrals = free premium for a month)
- Ambassador program for influencers (higher splits)

---

## 13. Build Status (What’s Done vs PRD)

| PRD item                                 | Status                                                                                                |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| **Supabase schema + RLS**                | ✅ Done (users, alerts, sessions, referrals, usage_events, whale_watches, stripe_events, views, RPCs) |
| **Session isolation (design + backend)** | ✅ Done (`sessionKey = user:telegram_id`, `resolveSession`, tier skills/permissions)                  |
| **User auth + trial flow**               | ✅ Done (register on first message, 3-day trial, auto-expire to free)                                 |
| **Free tier + marketing hooks**          | ✅ Done (1 chart/day, FOMO messages, conversion triggers in code)                                     |
| **Stripe integration**                   | ✅ Done (create-checkout edge function, stripe-webhook, activate/cancel in DB)                        |
| **Referral program ($3 split)**          | ✅ Done (DB, credits, leaderboard, apply on subscribe)                                                |
| **Price alerts + background checks**     | ✅ Done (check-alerts edge function, cron every 4h)                                                   |
| **Whale tracking**                       | ✅ Done (whale-scan edge function, whale_watches table, cron every 15m)                               |
| **Trial expiry**                         | ✅ Done (trial-expiry edge function, cron every 6h)                                                   |
| **Trading skills**                       | ✅ Done (signal-fusion, trading-god, price-alerts, whale-tracker)                                     |
| **Deploy to Hetzner**                    | ✅ Done (Docker, Supabase vars on server)                                                             |
| **Landing page (OpenJoey.com)**          | ✅ Done (static `landing/`, ClawHub-style UI, deployed to Vercel; www.openjoey.com)                   |
| **Landing ↔ Telegram/Hetzner/Supabase**  | ✅ Done (§17: user_registered in usage_events, ref support via `?ref=CODE`)                           |
| **Vercel deploy**                        | ✅ Done (openjoey project, production alias www.openjoey.com)                                         |

---

## 14. Remaining Work (Next on the Build)

### 14.1 Wire OpenJoey into the Telegram pipeline — ✅ Done

OpenJoey is wired into the Telegram pipeline (DM only): session key, slash commands, tier gate, responseSuffix, onAgentResponse.

**Current state:**

- Telegram uses the default session routing.
- `/start`, `/status`, `/subscribe`, etc. are not handled by our onboarding (they go to the agent).
- Tier gating and “free chart today” / FOMO are not applied.

**Required changes:**

- **Private chats:** Resolve session via `resolveSession(telegramId, …)` and use `sessionKey = user:${telegramId}`.
- **Slash commands:** Handle `/start`, `/status`, `/subscribe`, `/referral`, `/cancel`, `/help` in our handlers and send a direct reply (no agent call when we have a direct reply).
- **Tier gate:** Before running the agent, call `checkTierGate(telegramId, 'chart_analysis')`; if not allowed, send the upsell message and skip the agent.
- **After agent reply:** Append `responseSuffix` / `postAnalysisHook` for free/trial (e.g. “That was your free chart today…”).

---

### 14.2 Stripe production setup (config, not code) — **next**

- Add **STRIPE_SECRET_KEY** and **STRIPE_WEBHOOK_SECRET** to the server `.env` (and optionally to the add-supabase script or a small “add-stripe” script).
- In Stripe Dashboard: create a webhook endpoint for the `stripe-webhook` URL (e.g. `https://<project>.supabase.co/functions/v1/stripe-webhook`) and subscribe to `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.deleted`.

No new application code required; env and docs only.

---

### 14.3 Landing page (OpenJoey.com) — ✅ Done

**Done:** Static landing in repo `landing/index.html`; ClawHub-inspired UI; copy from openjoey.com; “OpenJoey Powered by OpenClaw”; Start on Telegram → t.me/OpenJoeyBot; Fork on GitHub → qbtheaiguy/openjoey-Open; `?ref=CODE` rewrites Telegram link to `?start=CODE`; deployed to Vercel (project **openjoey**), live at **www.openjoey.com**. See `docs/install/vercel-landing.md` for deploy steps.

**Optional later (not blocking):**

- **/pricing** — Dedicated page for tiers ($10/mo, $29/mo, $96/yr).
- **/docs** — User guide.
- **/support** — Help / contact.

---

### 14.4 Phase 2–3 operational

- Invite beta testers.
- Create “OpenJoey Traders” Telegram group (no bot commands).
- Support docs and any “remove beta restrictions” config.

---

## 15. Next Steps (Summary)

**Next on the build (in order):**

1. **§14.2 Stripe production** — Add `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` to server `.env`; create webhook in Stripe Dashboard for `stripe-webhook` (events: `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.deleted`). No new code.
2. **§14.4 Phase 2–3 ops** — Invite beta testers; create “OpenJoey Traders” Telegram group (no bot commands); support docs and any “remove beta restrictions” config.
3. **Optional:** Landing enhancements — `/pricing`, `/docs`, `/support` pages if desired (main landing is done and live at www.openjoey.com).

---

## 16. Testing OpenJoey on Telegram

Use this when you already have the OpenJoey bot on Telegram and want to verify the §14.1 wiring (session, slash commands, tier gating, FOMO).

### Prerequisites

- Gateway running with the **latest build** (OpenJoey hook wired in).
- **Supabase:** `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (or `OPENJOEY_SUPABASE_URL` / `OPENJOEY_SUPABASE_SERVICE_ROLE_KEY`) set in the gateway environment. If these are missing, the hook is skipped and the bot behaves as before (no slash-command handling, no tier gating).
- **Telegram:** Bot token in config; open a **DM** with the bot (OpenJoey runs only in private chats).

### Where to run

- **Hetzner:** Push the branch, rebuild the image, restart the gateway (see PUSH-AND-RUN-MIGRATION.md). Ensure the server `.env` has the Supabase vars.
- **Local:** From the repo root, set the same env vars, then run the gateway (e.g. `pnpm openclaw gateway run --bind lan` or your usual command). Only one process should run the bot (no 409 conflict).

### What to test (in Telegram DM)

| Action                                                      | Expected                                                                                                                               |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **/start**                                                  | Direct reply: welcome (new user) or status (existing). No agent call.                                                                  |
| **/start REF_CODE**                                         | Same, and your user is linked to the referral code.                                                                                    |
| **/status**                                                 | Direct reply with tier, trial/sub end, charts used today.                                                                              |
| **/subscribe**                                              | Direct reply with upgrade/checkout info.                                                                                               |
| **/referral**                                               | Direct reply with your referral code and stats.                                                                                        |
| **/help**                                                   | Direct reply with command list.                                                                                                        |
| **Normal message** (e.g. “analyze SOL”)                     | Agent runs; reply uses session `user:<your_telegram_id>`. If you’re on free/trial, a FOMO/upsell line may appear after the main reply. |
| **Over free limit** (free tier, already used 1 chart today) | Direct upsell message instead of running the agent.                                                                                    |

### Sanity checks

- **Logs:** On the machine running the gateway, check logs for `[openjoey]` or `OpenJoey` and for errors. If the hook throws (e.g. Supabase unreachable), you’ll see `OpenJoey telegram hook failed: ...` and the bot will still reply using the default pipeline.
- **Supabase:** In the `users` table, your `telegram_id` should appear after `/start`. After a chart request, `charts_used_today` (or equivalent) should update if `onAgentResponse` runs.
- **Session:** Sending a follow-up in the same DM should keep context (same session key `user:telegram_id`).

### Quick local test (one-off)

```bash
# Terminal 1: set env and run gateway (use your .env or export vars)
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
pnpm openclaw gateway run --bind lan
```

Then in Telegram DM with your bot: send `/status`. You should get a direct reply with your tier/status. If you get an agent-style reply or an error, check that the env vars are set and that the code is the latest (with the OpenJoey wiring).

---

## 17. Wiring: Landing Page → Telegram → Hetzner → Supabase

When a user clicks **Start on Telegram** on the landing page (or openjoey.com) and then starts a chat with the bot, the following ensures **Hetzner** (gateway), **Supabase**, and the **OpenJoey bot** all “see” the new user.

### 17.1 Flow (no code change required for basic wiring)

1. **Landing page (UI/UX)**
   - User clicks “Start on Telegram” → link goes to `https://t.me/OpenJoeyBot` (or, with referral, `https://t.me/OpenJoeyBot?start=REF_CODE` when the page is opened with `?ref=REF_CODE`).
   - No server call from the landing page; it only opens Telegram.

2. **User opens the bot in Telegram**
   - User may send `/start`, `/start REF_CODE`, or any first message (e.g. “Analyze SOL”).

3. **Telegram → Hetzner**
   - Telegram sends the update to the **webhook** configured for the bot (e.g. `https://<your-hetzner-host>/webhook/telegram` or the URL your gateway exposes).
   - The **OpenClaw Gateway** runs on the Hetzner server and receives the webhook. So **Hetzner “knows”** a new user in the sense that the gateway process on that server is the one handling the request.

4. **Gateway → OpenJoey hook**
   - For **private chats**, the Telegram pipeline calls `onTelegramMessage` (see §14.1).
   - The hook calls `resolveSession(telegramId, telegramUsername, telegramChatId)`.

5. **resolveSession → Supabase**
   - If the user does **not** exist in Supabase:
     - `registerUser(telegramId, telegramUsername)` is called → Supabase **users** table gets a new row (via RPC `register_telegram_user`).
     - `upsertSession(user_id, sessionKey, telegramChatId)` is called → Supabase **sessions** table gets a row.
     - `logUsage(user_id, 'user_registered')` is called → Supabase **usage_events** table gets a row (so “new user” is queryable).
   - If the user **already** exists: only `upsertSession` is called (updates `last_activity_at`).
   - So **Supabase “knows”** the new user via `users`, `sessions`, and optionally `usage_events`.

6. **OpenJoey “main bot”**
   - The same gateway process that receives the webhook is the OpenJoey bot. It “knows” the new user because it just ran the hook and has the `sessionKey` (`user:telegram_id`) and `userId`; it continues with that session for the rest of the message (and future messages in that DM).

### 17.2 What you must have in place

- **Hetzner:** Gateway running with the Telegram bot token; webhook URL pointing to this gateway (e.g. set via BotFather or your deployment script).
- **Supabase:** `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (or `OPENJOEY_SUPABASE_*`) set in the **gateway** environment on Hetzner so the hook can call `registerUser`, `upsertSession`, and `logUsage`.
- **Landing page:** “Start on Telegram” links to `https://t.me/OpenJoeyBot` (and, if you use refs, open the landing with `?ref=CODE` so the link becomes `https://t.me/OpenJoeyBot?start=CODE`).

### 17.3 Referral from the landing page

- Share links like `https://www.openjoey.com?ref=REF_CODE` (or `/start?ref=REF_CODE`).
- The landing page script rewrites all “Start on Telegram” links to `https://t.me/OpenJoeyBot?start=REF_CODE`.
- When the user opens the bot, Telegram sends `/start REF_CODE`; the OpenJoey `/start` handler receives the referral code and passes it to `registerUser`, so the new user is linked to the referrer in Supabase.

---

**End of PRD**
