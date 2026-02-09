# OpenJoey V2 - Complete Implementation Plan

**Version:** 2.0  
**Date:** February 9, 2026  
**Status:** 🚀 Phase 0 Complete + Guru Skills Deployed

---

## 📊 Current State (Updated Feb 9, 2026)

### ✅ COMPLETED TODAY

| Task                          | Status        | Details                                          |
| ----------------------------- | ------------- | ------------------------------------------------ |
| **Gateway Fixed**             | ✅ Done       | Running with DeepSeek primary + Kimi K2.5 backup |
| **Telegram Bot**              | ✅ Live       | @OpenJoey_bot responding                         |
| **Auth Profiles**             | ✅ Configured | API keys for DeepSeek + Moonshot                 |
| **Guru Skills Created**       | ✅ Deployed   | 9 new Guru-tier skills                           |
| **Session Isolation Updated** | ✅ Done       | New skill tier mapping                           |
| **Synced to Hetzner**         | ✅ Done       | All skills and code deployed                     |

### 🆕 New Guru Skills Deployed

| Skill              | Emoji | Description                       | Tiers            |
| ------------------ | ----- | --------------------------------- | ---------------- |
| **signal-guru**    | 🧠    | Master multi-asset analyzer       | All              |
| **research-guru**  | 🔬    | Institutional-grade deep research | All              |
| **crypto-guru**    | 🔮    | Crypto-specific deep dives        | All              |
| **meme-guru**      | 🐸    | Meme coin degen intelligence      | All              |
| **stock-guru**     | 📈    | Stocks & ETFs analysis            | Trial+           |
| **forex-guru**     | 💱    | Currency pair analysis            | Trial+           |
| **commodity-guru** | ⚡    | Gold, oil, commodities            | Trial+           |
| **options-guru**   | 🎲    | Options chain & Greeks            | Premium          |
| **whale-guru**     | 🐋    | Whale tracking & smart money      | Subscriber       |
| **alert-guru**     | 🔔    | Price alert management            | Trial+ (limited) |

### Current Configuration

```json
{
  "model": {
    "primary": "deepseek/deepseek-chat",
    "fallbacks": ["moonshot/kimi-k2.5"]
  },
  "telegram": "@OpenJoey_bot ✅ LIVE",
  "supabase": "clgplkenrdbxqmkkgyzq.supabase.co (URL updated, key pending)"
}
```

### 🔴 PENDING: Supabase Service Role Key

The server has the correct URL but WRONG service role key:

- **Current key**: For `gzshfyonwaodxlgchgiz` (wrong project)
- **Needed**: Service role key for `clgplkenrdbxqmkkgyzq`

**Action Required**: Provide the correct service role key to enable database features.

---

## 🎯 OpenJoey V2 Vision (from claudeResearch)

### The Three-Tier Business Model

| Tier            | Access             | Price     | Target Users            |
| --------------- | ------------------ | --------- | ----------------------- |
| **Subscribers** | Telegram DM only   | $10/month | Everyday traders        |
| **Tech Users**  | Self-hosted fork   | Free      | Developers, power users |
| **Admin**       | Full system access | -         | You (platform owner)    |

### Multi-Asset Coverage (vs Current Crypto-Only)

- ✅ Crypto (existing)
- 🆕 Stocks & Equities
- 🆕 Options
- 🆕 Commodities (Gold, Oil)
- 🆕 Forex
- 🆕 Futures
- 🆕 Penny Stocks

### Security Layers (4-Layer RBAC)

1. **Database (Supabase RLS)** - Can't query other users' data
2. **Gateway Middleware (skillGuard)** - Block skills by tier
3. **AI System Prompt** - Last line of defense
4. **Code-Level Skill Filtering** - Only allowed skills in session

---

## 📋 Implementation Phases

### Phase 0: Emergency Fixes (Day 1) 🚨

**Fix the broken gateway so users can interact with Joey**

#### 0.1 Fix Model Configuration

```bash
# SSH to Hetzner
ssh -i ~/.ssh/hetzner-openjoey-new root@116.203.215.213

# Update openclaw.json with working model
cat > ~/.openclaw/openclaw.json << 'EOF'
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "anthropic/claude-sonnet-4-20250514",
        "fallbacks": ["openai/gpt-4o"]
      },
      "maxConcurrent": 4
    }
  },
  "tools": {
    "allow": ["web_search", "web_fetch", "session_status", "image", "cron"]
  },
  "gateway": { "mode": "local" },
  "plugins": {
    "entries": { "telegram": { "enabled": true } }
  },
  "channels": {
    "telegram": {
      "botToken": "${TELEGRAM_BOT_TOKEN}",
      "dmPolicy": "open",
      "allowFrom": ["*"]
    }
  }
}
EOF

# Restart service
systemctl restart openjoey-gateway
```

#### 0.2 Fix Supabase URL Consistency

```bash
# Verify correct Supabase URL
# Your Supabase: https://clgplkenrdbxqmkkgyzq.supabase.co

# Update .env on Hetzner
cat >> /opt/openjoey/.env << 'EOF'
SUPABASE_URL=https://clgplkenrdbxqmkkgyzq.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
EOF

# Restart gateway
systemctl restart openjoey-gateway
```

#### 0.3 Add API Keys for Primary Model

```bash
# Add Anthropic API key
echo "ANTHROPIC_API_KEY=<your-key>" >> /opt/openjoey/.env
# OR for OpenRouter
echo "OPENROUTER_API_KEY=<your-key>" >> /opt/openjoey/.env
```

**Estimated Time: 1-2 hours**

---

### Phase 1: Foundation (Week 1)

#### 1.1 Database Schema Updates

Add missing tables from claudeResearch architecture:

```sql
-- skill_usage table (for analytics + quotas)
CREATE TABLE skill_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  skill_category TEXT, -- 'trading', 'research', 'alerts', etc.
  tokens_used INTEGER DEFAULT 0,
  cost_usd DECIMAL(10,4) DEFAULT 0,
  execution_time_ms INTEGER,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_skill_usage_user ON skill_usage(user_id, created_at);
CREATE INDEX idx_skill_usage_skill ON skill_usage(skill_name, created_at);

-- audit_log table (for security)
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  resource TEXT,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_log_user ON audit_log(user_id, created_at);

-- skill_catalog table (dynamic skill definitions)
CREATE TABLE skill_catalog (
  id TEXT PRIMARY KEY, -- 'signal-fusion', 'trading-god', etc.
  display_name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  allowed_tiers TEXT[] DEFAULT ARRAY['trial', 'trader', 'premium', 'annual'],
  blocked_tiers TEXT[] DEFAULT ARRAY['free'],
  cost_tier TEXT DEFAULT 'standard', -- 'free', 'standard', 'expensive'
  is_active BOOLEAN DEFAULT true,
  requires_api_keys TEXT[], -- ['HELIUS_API_KEY'] etc.
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- analysis_cache table (for cost optimization)
CREATE TABLE analysis_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_type TEXT NOT NULL, -- 'stock', 'crypto', 'commodity', 'forex'
  asset_symbol TEXT NOT NULL,
  analysis_type TEXT NOT NULL, -- 'technical', 'sentiment', 'fundamental'
  content JSONB NOT NULL,
  embedding vector(1536), -- For QMD semantic search
  ttl_minutes INTEGER NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  is_valid BOOLEAN DEFAULT true,
  invalidated_reason TEXT,
  hit_count INTEGER DEFAULT 0,
  generation_cost DECIMAL(10,4),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed TIMESTAMPTZ
);

CREATE INDEX idx_analysis_cache_lookup ON analysis_cache(asset_type, asset_symbol, analysis_type, is_valid)
  WHERE expires_at > NOW();

-- quotas table (user-level limits)
CREATE TABLE user_quotas (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  daily_skill_calls_used INTEGER DEFAULT 0,
  daily_expensive_skill_calls_used INTEGER DEFAULT 0,
  last_reset_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Views for analytics
CREATE VIEW daily_skill_stats AS
SELECT
  date_trunc('day', created_at) as day,
  skill_name,
  COUNT(*) as call_count,
  SUM(cost_usd) as total_cost,
  AVG(execution_time_ms) as avg_time_ms,
  COUNT(CASE WHEN success THEN 1 END) as success_count
FROM skill_usage
GROUP BY 1, 2
ORDER BY 1 DESC, 2;

CREATE VIEW user_activity_summary AS
SELECT
  u.id,
  u.telegram_username,
  u.tier,
  u.status,
  COUNT(DISTINCT s.id) as total_sessions,
  COUNT(su.id) as total_skill_calls,
  SUM(su.cost_usd) as total_cost,
  MAX(su.created_at) as last_activity
FROM users u
LEFT JOIN sessions s ON u.id = s.user_id
LEFT JOIN skill_usage su ON u.id = su.user_id
GROUP BY u.id, u.telegram_username, u.tier, u.status;
```

#### 1.2 Seed Skill Catalog

```sql
INSERT INTO skill_catalog (id, display_name, description, category, allowed_tiers, cost_tier) VALUES
-- Trading Skills (All tiers)
('signal-fusion', 'Signal Fusion', 'Hybrid trading intelligence combining quantified edge + interpretation', 'trading', ARRAY['trial', 'trader', 'premium', 'annual'], 'standard'),
('trading-god', 'Trading God', 'Deep research system for multi-asset analysis', 'trading', ARRAY['trial', 'trader', 'premium', 'annual'], 'standard'),
('price-alerts', 'Price Alerts', 'Set and manage price alerts for any asset', 'alerts', ARRAY['trial', 'trader', 'premium', 'annual'], 'free'),
('whale-tracker', 'Whale Tracker', 'Monitor whale wallets and large transactions', 'research', ARRAY['trader', 'premium', 'annual'], 'standard'),
('meme-lord', 'Meme Lord', 'Find meme coins and trending tokens', 'trading', ARRAY['trial', 'trader', 'premium', 'annual'], 'standard'),

-- Asset-Specific Skills (To be created)
('stock-analyzer', 'Stock Analyzer', 'Technical and fundamental analysis for stocks', 'trading', ARRAY['trader', 'premium', 'annual'], 'standard'),
('options-analyzer', 'Options Analyzer', 'Options chain analysis with Greeks', 'trading', ARRAY['premium', 'annual'], 'expensive'),
('forex-analyzer', 'Forex Analyzer', 'Currency pair analysis', 'trading', ARRAY['trader', 'premium', 'annual'], 'standard'),
('commodity-tracker', 'Commodity Tracker', 'Gold, oil, and commodity analysis', 'trading', ARRAY['trader', 'premium', 'annual'], 'standard'),

-- Blocked Skills (Admin Only)
('coding-agent', 'Coding Agent', 'Write and execute code', 'system', ARRAY[]::TEXT[], 'expensive'),
('browser-automation', 'Browser Automation', 'Control browser for complex tasks', 'system', ARRAY[]::TEXT[], 'expensive');
```

#### 1.3 Create RLS Policies

```sql
-- Enable RLS
ALTER TABLE skill_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_quotas ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own skill_usage" ON skill_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own audit_log" ON audit_log
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can do everything
CREATE POLICY "Service role full access skill_usage" ON skill_usage
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access audit_log" ON audit_log
  FOR ALL USING (auth.role() = 'service_role');

-- Anyone can read cache (public)
CREATE POLICY "Anyone can read cache" ON analysis_cache
  FOR SELECT USING (true);

CREATE POLICY "Service role full access cache" ON analysis_cache
  FOR ALL USING (auth.role() = 'service_role');
```

**Estimated Time: 1-2 days**

---

### Phase 2: Skill Guard Middleware (Week 1-2)

#### 2.1 Update Session Isolation

File: `src/openjoey/session-isolation.ts`

```typescript
// Add to existing file

export interface SkillGuardResult {
  allowed: boolean;
  skill: string;
  tier: string;
  reason?: string;
  upsellMessage?: string;
}

// Skill definitions with tier requirements
export const SKILL_TIERS: Record<
  string,
  {
    allowedTiers: string[];
    costTier: "free" | "standard" | "expensive";
    displayName: string;
  }
> = {
  // Trading Skills (Most tiers)
  "signal-fusion": {
    allowedTiers: ["trial", "trader", "premium", "annual"],
    costTier: "standard",
    displayName: "Signal Fusion",
  },
  "trading-god": {
    allowedTiers: ["trial", "trader", "premium", "annual"],
    costTier: "standard",
    displayName: "Trading God",
  },
  "price-alerts": {
    allowedTiers: ["trial", "trader", "premium", "annual"],
    costTier: "free",
    displayName: "Price Alerts",
  },
  "whale-tracker": {
    allowedTiers: ["trader", "premium", "annual"],
    costTier: "standard",
    displayName: "Whale Tracker",
  },
  "meme-lord": {
    allowedTiers: ["trial", "trader", "premium", "annual"],
    costTier: "standard",
    displayName: "Meme Lord",
  },

  // Multi-asset skills (V2)
  "stock-analyzer": {
    allowedTiers: ["trader", "premium", "annual"],
    costTier: "standard",
    displayName: "Stock Analyzer",
  },
  "options-analyzer": {
    allowedTiers: ["premium", "annual"],
    costTier: "expensive",
    displayName: "Options Analyzer",
  },
  "forex-analyzer": {
    allowedTiers: ["trader", "premium", "annual"],
    costTier: "standard",
    displayName: "Forex Analyzer",
  },
  "commodity-tracker": {
    allowedTiers: ["trader", "premium", "annual"],
    costTier: "standard",
    displayName: "Commodity Tracker",
  },

  // Blocked (Admin Only)
  "coding-agent": { allowedTiers: [], costTier: "expensive", displayName: "Coding Agent" },
  "browser-automation": {
    allowedTiers: [],
    costTier: "expensive",
    displayName: "Browser Automation",
  },
};

/**
 * Check if a user can use a specific skill
 */
export function checkSkillAccess(tier: string, skillName: string): SkillGuardResult {
  const skill = SKILL_TIERS[skillName];

  // Unknown skill - allow by default (let gateway handle)
  if (!skill) {
    return { allowed: true, skill: skillName, tier };
  }

  // Blocked skill
  if (skill.allowedTiers.length === 0) {
    return {
      allowed: false,
      skill: skillName,
      tier,
      reason: "skill_blocked",
      upsellMessage: `⛔ ${skill.displayName} is not available for subscribers. This is an admin-only feature.`,
    };
  }

  // Check tier access
  if (!skill.allowedTiers.includes(tier)) {
    const requiredTier = skill.allowedTiers[0];
    return {
      allowed: false,
      skill: skillName,
      tier,
      reason: "tier_insufficient",
      upsellMessage: `🔒 ${skill.displayName} requires ${requiredTier} tier or higher. Upgrade → /subscribe`,
    };
  }

  return { allowed: true, skill: skillName, tier };
}
```

#### 2.2 Create Skill Guard Hook

New file: `src/openjoey/skill-guard.ts`

```typescript
/**
 * OpenJoey Skill Guard
 *
 * Intercepts skill execution requests and enforces tier + quota limits.
 */

import { getOpenJoeyDB } from "./supabase-client.js";
import { checkSkillAccess, SKILL_TIERS } from "./session-isolation.js";

export interface SkillExecutionContext {
  telegramId: number;
  userId: string;
  tier: string;
  skillName: string;
  userQuery: string;
}

export interface SkillGuardDecision {
  allowed: boolean;
  blockMessage?: string;
  shouldLogUsage: boolean;
  costTier: "free" | "standard" | "expensive";
}

// Daily limits per tier
const DAILY_LIMITS: Record<string, { standard: number; expensive: number }> = {
  trial: { standard: 50, expensive: 10 },
  free: { standard: 5, expensive: 1 },
  trader: { standard: 200, expensive: 20 },
  premium: { standard: -1, expensive: 100 }, // -1 = unlimited
  annual: { standard: 200, expensive: 20 },
};

export async function guardSkillExecution(ctx: SkillExecutionContext): Promise<SkillGuardDecision> {
  // 1. Check tier access
  const tierCheck = checkSkillAccess(ctx.tier, ctx.skillName);
  if (!tierCheck.allowed) {
    return {
      allowed: false,
      blockMessage: tierCheck.upsellMessage,
      shouldLogUsage: false,
      costTier: "free",
    };
  }

  const skill = SKILL_TIERS[ctx.skillName];
  const costTier = skill?.costTier ?? "standard";

  // 2. Check daily quotas (skip for premium unlimited)
  const limits = DAILY_LIMITS[ctx.tier] ?? DAILY_LIMITS.free;
  const db = getOpenJoeyDB();

  try {
    const quota = await db.getUserQuota(ctx.userId);

    if (costTier === "expensive" && limits.expensive >= 0) {
      if (quota.daily_expensive_skill_calls_used >= limits.expensive) {
        return {
          allowed: false,
          blockMessage: `⚠️ You've reached your daily limit for advanced analysis. Resets at midnight UTC. Upgrade for higher limits → /upgrade`,
          shouldLogUsage: false,
          costTier,
        };
      }
    }

    if (costTier === "standard" && limits.standard >= 0) {
      if (quota.daily_skill_calls_used >= limits.standard) {
        return {
          allowed: false,
          blockMessage: `⚠️ Daily analysis limit reached. Upgrade for unlimited access → /subscribe`,
          shouldLogUsage: false,
          costTier,
        };
      }
    }
  } catch (err) {
    // Fail open - don't block users due to quota check failures
    console.error("[openjoey] quota check failed:", err);
  }

  return {
    allowed: true,
    shouldLogUsage: true,
    costTier,
  };
}

export async function logSkillExecution(
  ctx: SkillExecutionContext,
  costTier: "free" | "standard" | "expensive",
  success: boolean,
  executionTimeMs: number,
  tokensUsed?: number,
  errorMessage?: string,
): Promise<void> {
  const db = getOpenJoeyDB();

  // Cost estimation (rough)
  const costMap = { free: 0, standard: 0.05, expensive: 0.15 };
  const cost = costMap[costTier];

  try {
    await db.logSkillUsage(ctx.userId, ctx.skillName, {
      cost_usd: cost,
      tokens_used: tokensUsed ?? 0,
      execution_time_ms: executionTimeMs,
      success,
      error_message: errorMessage,
      skill_category: SKILL_TIERS[ctx.skillName]?.allowedTiers[0] ?? "general",
    });

    // Increment quota counters
    await db.incrementQuota(ctx.userId, costTier);
  } catch (err) {
    console.error("[openjoey] failed to log skill usage:", err);
  }
}
```

#### 2.3 Update Supabase Client

Add to `src/openjoey/supabase-client.ts`:

```typescript
// Add these methods to OpenJoeyDB class

async getUserQuota(userId: string): Promise<{
  daily_skill_calls_used: number;
  daily_expensive_skill_calls_used: number;
  last_reset_at: string;
}> {
  const rows = await this.get<{
    daily_skill_calls_used: number;
    daily_expensive_skill_calls_used: number;
    last_reset_at: string;
  }>('user_quotas', `user_id=eq.${userId}&limit=1`);

  if (rows.length === 0) {
    // Create quota record
    await this.insert('user_quotas', { user_id: userId });
    return { daily_skill_calls_used: 0, daily_expensive_skill_calls_used: 0, last_reset_at: new Date().toISOString() };
  }

  // Check if needs reset (midnight UTC)
  const lastReset = new Date(rows[0].last_reset_at);
  const now = new Date();
  if (lastReset.toDateString() !== now.toDateString()) {
    await this.update('user_quotas', `user_id=eq.${userId}`, {
      daily_skill_calls_used: 0,
      daily_expensive_skill_calls_used: 0,
      last_reset_at: now.toISOString()
    });
    return { daily_skill_calls_used: 0, daily_expensive_skill_calls_used: 0, last_reset_at: now.toISOString() };
  }

  return rows[0];
}

async incrementQuota(userId: string, costTier: 'free' | 'standard' | 'expensive'): Promise<void> {
  const quota = await this.getUserQuota(userId);

  const updates: Record<string, number> = {};
  if (costTier === 'standard' || costTier === 'expensive') {
    updates.daily_skill_calls_used = quota.daily_skill_calls_used + 1;
  }
  if (costTier === 'expensive') {
    updates.daily_expensive_skill_calls_used = quota.daily_expensive_skill_calls_used + 1;
  }

  if (Object.keys(updates).length > 0) {
    await this.update('user_quotas', `user_id=eq.${userId}`, updates);
  }
}

async logSkillUsage(
  userId: string,
  skillName: string,
  data: {
    cost_usd: number;
    tokens_used: number;
    execution_time_ms: number;
    success: boolean;
    error_message?: string;
    skill_category?: string;
  }
): Promise<void> {
  await this.insert('skill_usage', {
    user_id: userId,
    skill_name: skillName,
    ...data
  });
}
```

**Estimated Time: 2-3 days**

---

### Phase 3: Caching System (Week 2)

#### 3.1 Install Redis on Hetzner

```bash
ssh -i ~/.ssh/hetzner-openjoey-new root@116.203.215.213

# Install Redis
apt-get update && apt-get install -y redis-server

# Configure Redis
cat > /etc/redis/redis.conf << 'EOF'
bind 127.0.0.1
port 6379
maxmemory 2gb
maxmemory-policy allkeys-lru
EOF

# Start and enable
systemctl start redis-server
systemctl enable redis-server

# Add to .env
echo "REDIS_HOST=127.0.0.1" >> /opt/openjoey/.env
echo "REDIS_PORT=6379" >> /opt/openjoey/.env
```

#### 3.2 Create Redis Cache Client

New file: `src/openjoey/cache/redis.ts`

```typescript
/**
 * OpenJoey Redis Cache
 *
 * Multi-tier caching for analysis data to achieve 90-95% cost reduction.
 */

import Redis from "ioredis";

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (redis) return redis;

  redis = new Redis({
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379"),
    password: process.env.REDIS_PASSWORD,
    db: 0,
    retryStrategy(times) {
      return Math.min(times * 50, 2000);
    },
  });

  redis.on("connect", () => console.log("[cache] Redis connected"));
  redis.on("error", (err) => console.error("[cache] Redis error:", err));

  return redis;
}

// Cache TTLs by asset type (seconds)
export const CACHE_TTL = {
  stock: {
    technical: 30 * 60, // 30 min (market hours)
    sentiment: 60 * 60, // 1 hour
    fundamentals: 24 * 3600, // 24 hours
  },
  crypto: {
    technical: 60 * 60, // 1 hour
    sentiment: 30 * 60, // 30 min (crypto moves fast)
    fundamentals: 12 * 3600, // 12 hours
  },
  commodity: {
    technical: 4 * 3600, // 4 hours
    sentiment: 6 * 3600, // 6 hours
    fundamentals: 24 * 3600, // 24 hours
  },
  forex: {
    technical: 2 * 3600, // 2 hours
    sentiment: 4 * 3600, // 4 hours
    fundamentals: 24 * 3600, // 24 hours
  },
  option: {
    technical: 30 * 60, // 30 min (Greeks change)
    sentiment: 60 * 60, // 1 hour
    fundamentals: 24 * 3600, // 24 hours
  },
};

/**
 * Get cached data or generate fresh
 */
export async function withCache<T>(
  key: string,
  ttl: number,
  generator: () => Promise<T>,
  options?: { skipCache?: boolean; refreshCache?: boolean },
): Promise<T> {
  const r = getRedis();

  if (options?.skipCache) {
    const fresh = await generator();
    await r.setex(key, ttl, JSON.stringify(fresh));
    return fresh;
  }

  const cached = await r.get(key);
  if (cached && !options?.refreshCache) {
    console.log(`[cache] HIT: ${key}`);
    await r.incr(`cache:hits:${new Date().toISOString().split("T")[0]}`);
    return JSON.parse(cached) as T;
  }

  console.log(`[cache] MISS: ${key}`);
  await r.incr(`cache:misses:${new Date().toISOString().split("T")[0]}`);

  const fresh = await generator();
  await r.setex(key, ttl, JSON.stringify(fresh));

  return fresh;
}

/**
 * Get cache hit rate for monitoring
 */
export async function getCacheHitRate(): Promise<number> {
  const r = getRedis();
  const date = new Date().toISOString().split("T")[0];
  const hits = parseInt((await r.get(`cache:hits:${date}`)) || "0");
  const misses = parseInt((await r.get(`cache:misses:${date}`)) || "0");
  return hits + misses > 0 ? hits / (hits + misses) : 0;
}

/**
 * Invalidate cache for an asset
 */
export async function invalidateCache(
  assetType: string,
  symbol: string,
  reason: string,
): Promise<void> {
  const r = getRedis();
  const pattern = `${symbol}:*:${assetType}`;
  const keys = await r.keys(pattern);
  if (keys.length > 0) {
    await r.del(...keys);
    console.log(`[cache] Invalidated ${keys.length} keys for ${symbol}: ${reason}`);
  }
}
```

#### 3.3 Update Signal-Fusion to Use Cache

Update `skills/signal-fusion/` to use caching for expensive operations.

**Estimated Time: 2-3 days**

---

### Phase 4: Multi-Asset Skills (Week 3-4)

#### 4.1 Create Stock Analyzer Skill

New file: `skills/stock-analyzer/SKILL.md`

```markdown
---
name: stock-analyzer
description: >
  Technical and fundamental analysis for stocks and ETFs.
  Covers US markets (NYSE, NASDAQ), international stocks, and penny stocks.
  Uses free data sources: Yahoo Finance, Finviz, SEC Edgar.
---

# Stock Analyzer

You analyze stocks for users. This skill covers:

- US stocks (NYSE, NASDAQ)
- ETFs
- International stocks (ADRs)
- Penny stocks (OTC)

## Data Sources (All Free)

- **Yahoo Finance**: Prices, charts, fundamentals
- **Finviz**: Screeners, technicals, news
- **SEC Edgar**: Filings, insider trading
- **TradingView** (via web_search): Charts

## Commands

| Intent        | Example                               |
| ------------- | ------------------------------------- |
| Analyze stock | "Analyze AAPL", "How's TSLA looking?" |
| Compare       | "Compare AAPL vs MSFT"                |
| Earnings      | "When is NVDA earnings?"              |
| Insider       | "Any insider buying on PLTR?"         |
| Penny stocks  | "Find penny stocks with volume"       |

## Output Format

### Full Analysis
```

📊 STOCK ANALYSIS — {TICKER}
━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 Price: ${price} ({change_pct}%)
📈 Market Cap: ${market_cap}

📊 TECHNICALS
• Trend: {bullish/bearish/neutral}
• Support: ${support}
• Resistance: ${resistance}
• RSI: {rsi} ({overbought/oversold/neutral})
• 50 SMA: ${sma_50} ({above/below price})

📋 FUNDAMENTALS
• P/E: {pe_ratio} (vs sector avg: {sector_pe})
• Revenue Growth: {rev_growth}%
• EPS: ${eps}
• Dividend Yield: {div_yield}%

📰 RECENT NEWS

1. {headline_1}
2. {headline_2}

⚠️ RISKS
• {risk_1}
• {risk_2}

📊 SIGNAL: {BUY/SELL/HOLD}
📍 Confidence: {1-10}/10

```

```

#### 4.2 Create Options Analyzer Skill

New file: `skills/options-analyzer/SKILL.md`

```markdown
---
name: options-analyzer
description: >
  Options chain analysis with Greeks, IV analysis, and strategy recommendations.
  Premium tier only. Uses free data from Yahoo Finance and public APIs.
---

# Options Analyzer

Premium skill for options traders.

## Features

1. **Options Chain**: Strike prices, bid/ask, volume, OI
2. **Greeks**: Delta, gamma, theta, vega, rho
3. **IV Analysis**: Current IV vs historical, IV rank, IV percentile
4. **Strategies**: Covered calls, iron condors, straddles
5. **Unusual Activity**: Detect unusual options flow

## Commands

| Intent   | Example                               |
| -------- | ------------------------------------- |
| Chain    | "AAPL options chain"                  |
| Greeks   | "What's the delta on SPY 450 calls?"  |
| Strategy | "Build a covered call on TSLA"        |
| Unusual  | "Any unusual options activity today?" |

## Output Format

### Options Chain
```

📈 OPTIONS CHAIN — {TICKER}
━━━━━━━━━━━━━━━━━━━━━━━━━

Stock: ${price} | IV: {iv}% | IV Rank: {iv_rank}%

📗 CALLS (exp {expiry})
| Strike | Bid | Ask | Vol | OI | Δ |
|--------|-----|-----|-----|----|----|
| $450 | 2.50| 2.55| 5k | 20k| .45|
| $455 | 1.80| 1.85| 3k | 15k| .35|

📕 PUTS (exp {expiry})
| Strike | Bid | Ask | Vol | OI | Δ |
|--------|-----|-----|-----|----|----|
| $445 | 1.50| 1.55| 2k | 10k|-.30|
| $440 | 1.00| 1.05| 1k | 8k |-.20|

💡 INSIGHT: {IV is elevated due to earnings}

```

```

#### 4.3 Create Forex Analyzer Skill

New file: `skills/forex-analyzer/SKILL.md`

```markdown
---
name: forex-analyzer
description: >
  Currency pair analysis for forex traders.
  Covers major, minor, and exotic pairs.
  Uses free data from Alpha Vantage, ExchangeRate-API.
---

# Forex Analyzer

Analyze currency pairs for forex traders.

## Data Sources

- **ExchangeRate-API**: Real-time rates
- **Alpha Vantage**: Historical data
- **TradingView** (web_search): Technical analysis

## Commands

| Intent        | Example                        |
| ------------- | ------------------------------ |
| Analyze       | "EUR/USD forecast"             |
| Correlations  | "What pairs are correlated?"   |
| Central banks | "When's the next Fed meeting?" |
| Compare       | "EUR/USD vs GBP/USD"           |
```

#### 4.4 Create Commodity Tracker Skill

New file: `skills/commodity-tracker/SKILL.md`

```markdown
---
name: commodity-tracker
description: >
  Gold, silver, oil, and commodity analysis.
  Covers spot prices, futures, and ETFs.
  Uses free data from Yahoo Finance, FRED.
---

# Commodity Tracker

Analyze commodities for traders.

## Supported Commodities

- **Precious Metals**: Gold, Silver, Platinum
- **Energy**: Crude Oil (WTI, Brent), Natural Gas
- **Agricultural**: Corn, Wheat, Soybeans
- **Industrial**: Copper, Aluminum

## Data Sources

- **Yahoo Finance**: Futures tickers (GC=F, SI=F, CL=F)
- **FRED**: Historical commodity prices
- **TradingView**: Technical analysis
```

**Estimated Time: 1 week**

---

### Phase 5: Admin Dashboard (Week 4-5)

#### 5.1 Create Next.js Admin App

```bash
cd /Users/theaiguy/CascadeProjects/openjoey-main
npx -y create-next-app@latest admin --typescript --tailwind --eslint --app --src-dir
```

#### 5.2 Dashboard Features

1. **Revenue Analytics**
   - MRR, ARR
   - Subscriber count by tier
   - Churn rate
   - LTV estimates

2. **Usage Analytics**
   - Daily skill calls
   - Popular skills
   - Cost per user
   - Cache hit rate

3. **User Management**
   - User list with search
   - Tier management
   - Usage history
   - Account actions

4. **System Health**
   - Gateway status
   - API latency
   - Error rates
   - Redis status

**Estimated Time: 1 week**

---

### Phase 6: Cost Optimization (Week 5-6)

#### 6.1 Free API Integrations

| Data Type     | Free API           | Rate Limit |
| ------------- | ------------------ | ---------- |
| Stock prices  | Yahoo Finance      | Unlimited  |
| Crypto prices | CoinGecko          | 50/min     |
| Forex rates   | ExchangeRate-API   | 1500/month |
| Commodities   | Yahoo Finance      | Unlimited  |
| News          | NewsAPI            | 1000/day   |
| On-chain      | Helius (free tier) | 100k/month |

#### 6.2 Implement Caching Layers

1. **Redis (L1)**: Hot cache, <1ms response
2. **Supabase (L2)**: Persistent cache with embeddings
3. **Generate (L3)**: Fresh analysis when cache miss

**Estimated Time: 1 week**

---

### Phase 7: Security Hardening (Week 6)

#### 7.1 Prompt Injection Prevention

- Sanitize all user inputs
- System prompt with explicit restrictions
- Skill whitelist enforcement

#### 7.2 Audit Logging

- Log all skill executions
- Log authentication events
- Suspicious activity detection

#### 7.3 Rate Limiting

- Per-user rate limits
- IP-based rate limits
- Skill-specific cooldowns

**Estimated Time: 3-4 days**

---

## 🔧 Critical Questions

Before proceeding, I need clarity on:

### 1. Model & API Keys

- **Q1**: Which AI model should we use? Options:
  - Anthropic Claude (current architecture assumes this)
  - OpenRouter (multi-model routing)
  - Deepseek (cheaper but lower quality)
  - OpenAI GPT-4o
- **Q2**: Do you have API keys for:
  - [ ] Anthropic (ANTHROPIC_API_KEY)
  - [ ] OpenAI (OPENAI_API_KEY)
  - [ ] OpenRouter (OPENROUTER_API_KEY)
  - [ ] Brave Search (BRAVE_API_KEY)
  - [ ] Helius (HELIUS_API_KEY for Solana on-chain)

### 2. Supabase Configuration

- **Q3**: Which Supabase project is correct?
  - `clgplkenrdbxqmkkgyzq.supabase.co` (in skill docs)
  - `gzshfyonwaodxlgchgiz.supabase.co` (in Hetzner .env)
  - Or should I create fresh tables in the correct one?

- **Q4**: Do you have the Supabase service role key?

### 3. Payment Integration

- **Q5**: Is Stripe already configured?
  - Do you have Stripe webhook endpoints set up?
  - What are the product/price IDs for each tier?

### 4. Landing Page

- **Q6**: Should the landing page link directly to Telegram (@OpenJoey_bot)?
- **Q7**: Do you want to add a referral tracking query param (e.g., `/start?ref=CODE`)?

### 5. Priorities

- **Q8**: What's the most critical fix right now?
  - [ ] Get the bot responding (fix model config)
  - [ ] Complete tier gating (RBAC enforcement)
  - [ ] Multi-asset support (stock, forex, commodities)
  - [ ] Cost optimization (caching)
  - [ ] Admin dashboard

### 6. Open Source Strategy

- **Q9**: How much of OpenJoey V2 should be in the public repo?
  - Keep subscriber-only features private?
  - Open source everything except API keys?

---

## 📅 Timeline Summary

| Phase           | Duration | Goal                           |
| --------------- | -------- | ------------------------------ |
| 0: Emergency    | Day 1    | Get bot responding             |
| 1: Foundation   | Week 1   | Database + RBAC                |
| 2: Skill Guard  | Week 1-2 | Tier enforcement               |
| 3: Caching      | Week 2   | Redis + cost reduction         |
| 4: Multi-Asset  | Week 3-4 | Stock, forex, commodity skills |
| 5: Dashboard    | Week 4-5 | Admin UI                       |
| 6: Optimization | Week 5-6 | 95% cost reduction             |
| 7: Security     | Week 6   | Hardening                      |

**Total: ~6 weeks to production-ready V2**

---

## 🎯 Next Steps

1. **Answer the critical questions above**
2. **Execute Phase 0 immediately** (fix model config)
3. **Run Phase 1 SQL migrations** on Supabase
4. **Deploy skill guard middleware**

Ready to build OpenJoey V2! 🦞
