# Maxun Implementation Guide for OpenJoey

> Complete A-Z Setup: Self-Hosted Maxun + AI Extraction Integration
> From Zero to Financial Intelligence Pipeline

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Phase 1: Server Setup](#phase-1-server-setup)
4. [Phase 2: Maxun Installation](#phase-2-maxun-installation)
5. [Phase 3: Robot Configuration](#phase-3-robot-configuration)
6. [Phase 4: AI Extraction Setup](#phase-4-ai-extraction-setup)
7. [Phase 5: OpenJoey Integration](#phase-5-openjoey-integration)
8. [Phase 6: Testing & Verification](#phase-6-testing--verification)
9. [Phase 7: Production Hardening](#phase-7-production-hardening)
10. [Troubleshooting](#troubleshooting)
11. [Maintenance](#maintenance)

---

## Overview

This guide walks you through deploying Maxun on your existing Hetzner server (`116.203.215.213`) and integrating it with OpenJoey for financial data extraction.

**What You'll Build:**

- Self-hosted Maxun instance running on Docker
- 6 financial data robots (structured + AI extraction)
- OpenJoey bridge for seamless data flow
- Hybrid data pipeline (free scraping + AI intelligence)
- **NEW: Multi-layer caching for 100k+ users/day**
- **NEW: Category-specific robots with backup/failover**

**Time Required:** 2-3 hours
**Cost:** $0 (uses existing Hetzner server)

---

## Architecture Overview: Handling 100k Users/Day

### The Problem with Single Robots

- One "crypto" robot = bottleneck at scale
- No redundancy = single point of failure
- Scraping every request = API bans + slow response times
- 100k users × 10 requests/day = 1M scrapes/day = disaster

### The Solution: Distributed Robot Architecture + Multi-Layer Caching

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER REQUEST (100k/day)                      │
└─────────────────────────┬───────────────────────────────────────┘
                          │
              ┌───────────▼───────────┐
              │  LAYER 1: EDGE CACHE  │ ← CDN/Cloudflare (if using)
              │  TTL: 30 seconds      │
              └───────────┬───────────┘
                          │
              ┌───────────▼───────────┐
              │  LAYER 2: REDIS CACHE │ ← In-memory, sub-millisecond
              │  TTL: 60 seconds      │    Hot data (prices, sentiment)
              └───────────┬───────────┘
                          │
              ┌───────────▼───────────┐
              │  LAYER 3: FILE CACHE  │ ← ~/.openjoey/cache/
              │  TTL: 5-60 minutes    │    Warm data (news, analysis)
              └───────────┬───────────┘
                          │
              ┌───────────▼───────────┐
              │  LAYER 4: MAXUN DB     │ ← Persistent storage
              │  Last robot run data   │    Fallback data
              └───────────┬───────────┘
                          │
              ┌───────────▼───────────┐
              │  LAYER 5: ROBOT FARM   │ ← Only if cache miss
              │  20+ category robots    │    Distributed load
              └─────────────────────────┘
```

### Cache Hit Rate Targets

- Layer 1 (Edge): 40% hit rate
- Layer 2 (Redis): 35% hit rate
- Layer 3 (File): 20% hit rate
- Layer 4 (DB): 4% hit rate
- Layer 5 (Scrape): 1% of requests (only fresh data)

**Result:** 99% of requests served from cache, 1% require scraping

---

## Crypto Robot Categories (Distributed Architecture)

Instead of one "crypto" robot, we create **15+ specialized robots**:

### Category 1: Blue-Chip Crypto (Bitcoin, Ethereum)

| Robot                | Source    | Schedule | Cache TTL | Backup                               |
| -------------------- | --------- | -------- | --------- | ------------------------------------ |
| `btc-tracker`        | CoinGecko | 2 min    | 5 min     | `btc-tracker-backup` (CoinMarketCap) |
| `eth-tracker`        | CoinGecko | 2 min    | 5 min     | `eth-tracker-backup` (Binance API)   |
| `bluechip-marketcap` | CoinGecko | 5 min    | 15 min    | `bluechip-cmc-backup`                |

**Why separate?** BTC/ETH are most requested, need fastest updates, can't afford downtime

---

### Category 2: DeFi Tokens

| Robot             | Source    | Schedule | Cache TTL | Purpose                        |
| ----------------- | --------- | -------- | --------- | ------------------------------ |
| `defi-prices`     | CoinGecko | 5 min    | 10 min    | AAVE, UNI, COMP, MKR prices    |
| `defi-tvl`        | DefiLlama | 10 min   | 30 min    | Total Value Locked by protocol |
| `defi-yields`     | DefiLlama | 15 min   | 60 min    | APY rates across chains        |
| `defi-governance` | Snapshot  | 30 min   | 120 min   | Active DAO proposals           |

**Skills served:** DeFi Yield Hunter, DeFi Opportunity Scanner

---

### Category 3: Meme Coins

| Robot               | Source        | Schedule | Cache TTL | Purpose                     |
| ------------------- | ------------- | -------- | --------- | --------------------------- |
| `meme-trending`     | CoinMarketCap | 3 min    | 5 min     | DOGE, SHIB, PEPE, WIF, BONK |
| `meme-new-listings` | CoinGecko     | 10 min   | 30 min    | New meme coin launches      |
| `meme-social-buzz`  | AI extraction | 5 min    | 15 min    | Twitter/Reddit mentions     |
| `meme-whale-moves`  | Etherscan     | 5 min    | 10 min    | Large meme coin transfers   |

**Skills served:** Meme Coin Hunter, Trending Token Scanner

---

### Category 4: Day Trading Setups

| Robot                   | Source    | Schedule | Cache TTL | Purpose                  |
| ----------------------- | --------- | -------- | --------- | ------------------------ |
| `daytrade-breakouts`    | Binance   | 1 min    | 3 min     | Volume + price breakouts |
| `daytrade-scalping`     | Binance   | 1 min    | 2 min     | 1-minute candle patterns |
| `daytrade-liquidations` | Coinglass | 2 min    | 5 min     | Futures liquidations     |
| `daytrade-orderbook`    | Binance   | 30 sec   | 60 sec    | Bid/ask depth analysis   |

**Skills served:** Day Trade Setup, Scalping Assistant

---

### Category 5: Futures & Perpetuals

| Robot                 | Source    | Schedule | Cache TTL | Purpose                        |
| --------------------- | --------- | -------- | --------- | ------------------------------ |
| `funding-rates`       | Binance   | 5 min    | 15 min    | Perp funding rates by exchange |
| `futures-premium`     | Binance   | 3 min    | 10 min    | Spot vs futures premium        |
| `open-interest`       | Coinglass | 10 min   | 30 min    | Open interest changes          |
| `liquidation-heatmap` | Coinglass | 5 min    | 15 min    | Liquidation levels             |

**Skills served:** Futures Analyzer, Perp Opportunity Finder

---

### Category 6: Liquidity Pools (DEX)

| Robot                 | Source        | Schedule | Cache TTL | Purpose              |
| --------------------- | ------------- | -------- | --------- | -------------------- |
| `lp-uniswap-v3`       | TheGraph      | 5 min    | 15 min    | Uniswap V3 pool data |
| `lp-pancakeswap`      | BSCScan + API | 5 min    | 15 min    | BSC DEX pools        |
| `lp-impermanent-loss` | Custom calc   | 15 min   | 60 min    | IL risk calculator   |
| `lp-volume-24h`       | DexScreener   | 10 min   | 30 min    | DEX volume leaders   |

**Skills served:** LP Opportunity Finder, DEX Volume Tracker

---

### Category 7: Trending & Hot

| Robot              | Source        | Schedule | Cache TTL | Purpose                  |
| ------------------ | ------------- | -------- | --------- | ------------------------ |
| `trending-twitter` | AI extraction | 5 min    | 10 min    | Trending crypto hashtags |
| `trending-reddit`  | AI extraction | 10 min   | 20 min    | Hot posts on r/CC        |
| `trending-search`  | Google Trends | 30 min   | 120 min   | Search interest spikes   |
| `trending-youtube` | AI extraction | 15 min   | 60 min    | Viral crypto videos      |

**Skills served:** Trending Token Scanner, Social Buzz Tracker

---

### Category 8: Layer 1/Layer 2

| Robot            | Source    | Schedule | Cache TTL | Purpose                        |
| ---------------- | --------- | -------- | --------- | ------------------------------ |
| `l1-performance` | Various   | 10 min   | 30 min    | SOL, ADA, AVAX, NEAR metrics   |
| `l2-activity`    | L2Beat    | 15 min   | 60 min    | Arbitrum, Optimism, Base stats |
| `bridge-volume`  | DefiLlama | 30 min   | 120 min   | Cross-chain bridge volume      |
| `gas-tracker`    | Etherscan | 2 min    | 5 min     | ETH, BSC, SOL gas prices       |

**Skills served:** Layer 1 Comparison, L2 Opportunity Scanner

---

### Category 9: NFT Market

| Robot              | Source      | Schedule | Cache TTL | Purpose                  |
| ------------------ | ----------- | -------- | --------- | ------------------------ |
| `nft-floor-prices` | OpenSea API | 15 min   | 60 min    | Top collection floors    |
| `nft-volume`       | NFTGo       | 30 min   | 120 min   | 24h volume by collection |
| `nft-minting`      | Etherscan   | 10 min   | 30 min    | New mint contracts       |
| `nft-whales`       | NFTNerds    | 30 min   | 120 min   | Whale purchases          |

**Skills served:** NFT Floor Tracker, NFT Opportunity Finder

---

### Category 10: On-Chain Intelligence

| Robot               | Source    | Schedule | Cache TTL | Purpose                   |
| ------------------- | --------- | -------- | --------- | ------------------------- |
| `whale-exchanges`   | Etherscan | 3 min    | 10 min    | Exchange inflows/outflows |
| `whale-wallets`     | Arkham    | 10 min   | 30 min    | Smart money tracking      |
| `exchange-reserves` | Glassnode | 30 min   | 120 min   | Exchange BTC/ETH reserves |
| `active-addresses`  | Glassnode | 60 min   | 240 min   | Network activity metrics  |

**Skills served:** Whale Tracker, Exchange Flow Monitor

---

### Category 11: AI News & Sentiment

| Robot                   | Source        | Schedule | Cache TTL | Purpose                   |
| ----------------------- | ------------- | -------- | --------- | ------------------------- |
| `news-ai-coindesk`      | AI extraction | 15 min   | 30 min    | CoinDesk article analysis |
| `news-ai-cointelegraph` | AI extraction | 15 min   | 30 min    | Cointelegraph analysis    |
| `news-ai-twitter`       | AI extraction | 10 min   | 20 min    | Crypto Twitter sentiment  |
| `news-aggregator`       | Multi-source  | 30 min   | 60 min    | Combined news feed        |

**Skills served:** Crypto News AI, Sentiment Analyzer

---

### Category 12: Airdrops & Opportunities

| Robot                 | Source      | Schedule | Cache TTL | Purpose                    |
| --------------------- | ----------- | -------- | --------- | -------------------------- |
| `airdrop-tracker`     | Airdrops.io | 60 min   | 240 min   | Active airdrop campaigns   |
| `testnet-opps`        | Various     | 120 min  | 480 min   | Testnet incentive programs |
| `retroactive-rewards` | DefiLlama   | 60 min   | 240 min   | Unclaimed protocol rewards |
| `yield-opportunities` | DeBank      | 30 min   | 120 min   | High yield farming ops     |

**Skills served:** Airdrop Hunter, Opportunity Scanner

---

### Category 13: Macro & Correlations

| Robot              | Source           | Schedule | Cache TTL | Purpose                   |
| ------------------ | ---------------- | -------- | --------- | ------------------------- |
| `macro-btc-dxy`    | FRED + CoinGecko | 15 min   | 60 min    | BTC vs DXY correlation    |
| `macro-etf-flows`  | Various          | 30 min   | 120 min   | Spot ETF inflows/outflows |
| `macro-hashrate`   | Glassnode        | 60 min   | 240 min   | BTC network hashrate      |
| `macro-difficulty` | Glassnode        | 60 min   | 240 min   | Mining difficulty         |

**Skills served:** Macro Market Analyst, Bitcoin Metrics

---

### Category 14: Gaming & Metaverse

| Robot                 | Source        | Schedule | Cache TTL | Purpose              |
| --------------------- | ------------- | -------- | --------- | -------------------- |
| `gaming-tokens`       | CoinGecko     | 15 min   | 60 min    | AXS, SAND, MANA, etc |
| `gaming-volume`       | Various       | 30 min   | 120 min   | Game NFT volume      |
| `gaming-active-users` | DappRadar     | 60 min   | 240 min   | DAU by game          |
| `gaming-new-releases` | AI extraction | 120 min  | 480 min   | New game launches    |

**Skills served:** GameFi Tracker, Metaverse Opportunity

---

### Category 15: Privacy Coins

| Robot              | Source    | Schedule | Cache TTL | Purpose               |
| ------------------ | --------- | -------- | --------- | --------------------- |
| `privacy-prices`   | CoinGecko | 15 min   | 60 min    | XMR, ZEC, DASH prices |
| `privacy-adoption` | Various   | 120 min  | 480 min   | Privacy coin metrics  |

**Skills served:** Privacy Coin Tracker

---

## Backup & Failover Architecture

### Primary-Backup Pattern

Every critical robot has a backup:

```typescript
// OpenJoey bridge with failover
async function getCryptoPricesWithFailover(): Promise<PriceData> {
  // Try primary
  try {
    return await getFromRobot("btc-tracker");
  } catch (primaryError) {
    console.log("Primary robot failed, trying backup...");
  }

  // Try backup
  try {
    return await getFromRobot("btc-tracker-backup");
  } catch (backupError) {
    console.log("Backup failed too, using cache...");
  }

  // Fallback to stale cache (better than nothing)
  return await getStaleCache("btc-prices", 60); // Allow 60 min stale
}
```

### Robot Health Monitoring

```typescript
// Health check all robots every 5 minutes
async function checkRobotHealth(): Promise<HealthReport> {
  const robots = [
    "btc-tracker",
    "eth-tracker",
    "meme-trending",
    "defi-prices",
    // ... all robots
  ];

  const health = await Promise.all(
    robots.map(async (name) => {
      const lastRun = await getRobotLastRun(name);
      const isHealthy = Date.now() - lastRun < 10 * 60 * 1000; // 10 min threshold
      return { name, healthy: isHealthy, lastRun };
    }),
  );

  // Alert on unhealthy robots
  const unhealthy = health.filter((h) => !h.healthy);
  if (unhealthy.length > 0) {
    await alertAdmin(`Robots down: ${unhealthy.map((u) => u.name).join(", ")}`);
  }

  return health;
}
```

### Load Distribution

```
User Request for "BTC price"
         │
         ▼
┌─────────────────────┐
│  Which robot?       │
│  Round-robin:       │
│  1. btc-tracker     │
│  2. btc-tracker-2   │ ← Clone for load
│  3. btc-tracker-3   │ ← Clone for load
└─────────────────────┘
```

---

## Multi-Layer Caching Implementation

### Layer 1: Redis (Hot Data)

```typescript
// Redis cache for sub-millisecond access
import Redis from "ioredis";

const redis = new Redis({
  host: "localhost",
  port: 6379,
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

async function getFromRedis<T>(key: string): Promise<T | null> {
  const data = await redis.get(key);
  return data ? JSON.parse(data) : null;
}

async function setToRedis<T>(key: string, data: T, ttlSeconds: number): Promise<void> {
  await redis.setex(key, ttlSeconds, JSON.stringify(data));
}

// Usage in bridge
export async function getBTCPrice(): Promise<number | null> {
  // Try Redis first (Layer 1)
  const cached = await getFromRedis("btc:price");
  if (cached) return cached.price;

  // Try file cache (Layer 2)
  const fileCached = await getFromFileCache("btc:price");
  if (fileCached) {
    // Promote to Redis
    await setToRedis("btc:price", fileCached, 60);
    return fileCached.price;
  }

  // Fetch from robot (Layer 3)
  const fresh = await fetchFromRobot("btc-tracker");
  await setToRedis("btc:price", fresh, 60);
  await setToFileCache("btc:price", fresh, 300);
  return fresh.price;
}
```

### Layer 2: File Cache (Warm Data)

```typescript
// Existing cache_layer.ts enhanced
const CACHE_TIERS = {
  price: { redis: 60, file: 300 }, // 1 min / 5 min
  news: { redis: 300, file: 1800 }, // 5 min / 30 min
  sentiment: { redis: 600, file: 3600 }, // 10 min / 60 min
  onchain: { redis: 300, file: 900 }, // 5 min / 15 min
};

async function getCachedData(category: string, key: string) {
  const tiers = CACHE_TIERS[category];
  if (!tiers) throw new Error(`Unknown category: ${category}`);

  // Try Redis
  const redisData = await getFromRedis(`${category}:${key}`);
  if (redisData) return redisData;

  // Try file
  const fileData = await getCached(key); // existing function
  if (fileData) {
    await setToRedis(`${category}:${key}`, fileData, tiers.redis);
    return fileData;
  }

  return null;
}
```

### Layer 3: Maxun Database (Persistent)

```typescript
// Store last successful robot run in Maxun DB
async function persistRobotData(robotName: string, data: unknown): Promise<void> {
  await maxunFetch(`/api/robots/${robotName}/persist`, {
    method: "POST",
    body: JSON.stringify({
      data,
      timestamp: Date.now(),
      ttl: 24 * 60 * 60 * 1000, // 24 hours
    }),
  });
}

async function getPersistedData(robotName: string): Promise<unknown | null> {
  try {
    return await maxunFetch(`/api/robots/${robotName}/last-run`);
  } catch {
    return null;
  }
}
```

---

## Scalability Math (100k Users/Day)

### Without This Architecture:

```
100,000 users × 10 requests/day = 1,000,000 requests
1,000,000 requests × 2 scrapes each = 2,000,000 scrapes/day
2,000,000 ÷ 86,400 seconds = 23 scrapes/second
Result: BANNED from every data source within hours
```

### With Multi-Layer Caching + 20 Robots:

```
100,000 users × 10 requests/day = 1,000,000 requests
Cache hit rate: 99% (990,000 from cache)
Cache misses: 1% (10,000 requests)
Distributed across 20 robots: 500 scrapes/robot/day
Per robot: 500 ÷ 24 hours = 20 scrapes/hour = 1 scrape/3 minutes
Result: Well within rate limits, instant responses
```

### Cost at Scale:

| Component    | 1k Users   | 10k Users  | 100k Users        |
| ------------ | ---------- | ---------- | ----------------- |
| Redis        | $0         | $20/mo     | $50/mo            |
| Scraping     | $0         | $0         | $0 (cached)       |
| OpenAI       | $10/mo     | $50/mo     | $200/mo           |
| Maxun Server | $20/mo     | $20/mo     | $50/mo (upgraded) |
| **TOTAL**    | **$30/mo** | **$90/mo** | **$300/mo**       |

**vs. paying for APIs:** $10,000+/mo at 100k users

---

## Implementation Priority (Updated)

### Week 1: Foundation

- [ ] Deploy Maxun on Hetzner
- [ ] Set up Redis cache layer
- [ ] Build 3 robots: `btc-tracker`, `eth-tracker`, `meme-trending`
- [ ] Implement 3-layer caching in OpenJoey

### Week 2: Core Categories

- [ ] Build 6 robots: `defi-prices`, `funding-rates`, `daytrade-breakouts`, `whale-exchanges`, `news-ai-coindesk`, `trending-twitter`
- [ ] Add backup robots for critical categories
- [ ] Implement health monitoring

### Week 3: Expansion

- [ ] Build 6 more robots: `l2-activity`, `nft-floor-prices`, `gaming-tokens`, `macro-etf-flows`, `lp-uniswap-v3`, `airdrop-tracker`
- [ ] Set up robot failover logic
- [ ] Load testing with 1000 concurrent users

### Week 4: Polish

- [ ] Build final 5 robots for niche categories
- [ ] Optimize cache TTLs based on usage patterns
- [ ] Production hardening
- [ ] Document all robots

---

## Robot Configuration Templates

### Template: High-Frequency Price Robot

```json
{
  "name": "btc-tracker",
  "type": "extract",
  "priority": "critical",
  "config": {
    "url": "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true",
    "method": "GET",
    "headers": {
      "Accept": "application/json"
    },
    "schedule": "*/2 * * * *",
    "retries": 3,
    "timeout": 10000,
    "cache": {
      "ttl": 120,
      "key": "btc:price"
    },
    "alerts": {
      "on_failure": true,
      "on_stale": true,
      "stale_threshold": 300
    }
  },
  "backup": {
    "robot": "btc-tracker-backup",
    "trigger": "on_failure_or_stale"
  }
}
```

### Template: AI News Robot

```json
{
  "name": "news-ai-coindesk",
  "type": "ai-extract",
  "priority": "high",
  "config": {
    "url": "https://www.coindesk.com/",
    "ai_prompt": "Extract top 3 headlines with sentiment (bullish/bearish/neutral), confidence 0-100, and one-sentence summary. Return JSON array.",
    "schedule": "*/15 * * * *",
    "cache": {
      "ttl": 1800,
      "key": "news:coindesk"
    },
    "cost_control": {
      "max_tokens": 500,
      "model": "gpt-4o-mini"
    }
  }
}
```

### Template: On-Chain Robot

```json
{
  "name": "whale-exchanges",
  "type": "extract",
  "priority": "high",
  "config": {
    "url": "https://etherscan.io/accounts/label/exchange",
    "selectors": {
      "wallets": ".table tbody tr",
      "balance": ".text-right",
      "change": ".change-24h"
    },
    "schedule": "*/3 * * * *",
    "cache": {
      "ttl": 600,
      "key": "onchain:whales"
    },
    "rate_limit": {
      "requests_per_minute": 20,
      "delay_ms": 3000
    }
  }
}
```

---

## Summary: Why This Architecture Wins

| Metric                    | Old (1 Robot)                 | New (20+ Robots + Cache) |
| ------------------------- | ----------------------------- | ------------------------ |
| **Scrapes/day**           | 1,000,000                     | 10,000 (99% reduction)   |
| **Response time**         | 3-5 seconds                   | 50-100ms (cache hit)     |
| **Availability**          | 95% (single point of failure) | 99.9% (distributed)      |
| **Rate limit risk**       | Guaranteed ban                | Within limits            |
| **Scale to 100k users**   | Impossible                    | $300/mo                  |
| **New category addition** | Refactor entire robot         | Add 1 new robot          |

---

**Document Version:** 1.1  
**Last Updated:** February 2026  
**Architecture Status:** Production-ready for 100k+ users  
**Next Step:** Start with Week 1 (Redis + 3 critical robots)

---

_Distributed intelligence at scale_ 🕷️📊⚡

---

## Prerequisites

### Hardware (You Already Have)

- **Server:** Hetzner cloud instance
- **IP:** `116.203.215.213`
- **SSH Key:** `~/.ssh/hetzner-openjoey-new`
- **OS:** Ubuntu (assumed)

### Software Requirements

- Docker 20.10+ (installed on server)
- Docker Compose 2.0+ (installed on server)
- OpenAI API key (for AI extraction)
- Node.js 18+ (for OpenJoey integration)

### Access Requirements

- SSH access to Hetzner server
- OpenJoey repository access
- Telegram bot token (for testing)

### Pre-Flight Checklist

```bash
# Verify SSH access (run from your local machine)
ssh -i ~/.ssh/hetzner-openjoey-new root@116.203.215.213 echo "SSH OK"

# Verify Docker (run on server)
docker --version  # Should show 20.10+
docker-compose --version  # Should show 2.0+

# Verify disk space (need at least 10GB free)
df -h /
```

---

## Phase 1: Server Setup

### Step 1.1: Create Maxun Directory Structure

```bash
# SSH into your server
ssh -i ~/.ssh/hetzner-openjoey-new root@116.203.215.213

# Create directory structure
mkdir -p /opt/maxun/{data,logs,robots}
cd /opt/maxun

# Set permissions (Maxun runs as non-root in containers)
chmod 755 /opt/maxun
chmod 777 /opt/maxun/data  # Needs write access for DB
```

### Step 1.2: Configure Firewall (if UFW is active)

```bash
# Allow Maxun port (3000) from localhost only (security)
ufw allow from 127.0.0.1 to any port 3000

# If you need external access (not recommended without auth):
# ufw allow 3000/tcp

# Verify
ufw status
```

### Step 1.3: Prepare Environment File

```bash
cd /opt/maxun

# Create environment file
cat > .env << 'EOF'
# Maxun Core Settings
NODE_ENV=production
PORT=3000

# Database (SQLite for single-server setup)
DATABASE_URL=file:./data/maxun.db

# Redis (for job queue)
REDIS_URL=redis://localhost:6379

# AI/LLM Settings (Required for Option 4 AI extraction)
OPENAI_API_KEY=your_openai_key_here
OPENAI_MODEL=gpt-4o-mini  # Cheaper option: gpt-3.5-turbo

# Browser Settings
BROWSER_HEADLESS=true
BROWSER_ARGS=--no-sandbox,--disable-setuid-sandbox

# Rate Limiting (protect target websites)
MAX_REQUESTS_PER_MINUTE=30
DELAY_BETWEEN_REQUESTS=2000

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/maxun.log

# Security (generate strong random string)
JWT_SECRET=your_random_jwt_secret_min_32_chars
ADMIN_PASSWORD=your_admin_password
EOF

# IMPORTANT: Edit the file and replace placeholders
nano .env
```

### Step 1.4: Create Docker Network (for OpenJoey communication)

```bash
# Create dedicated network
docker network create maxun-network

# Verify
docker network ls | grep maxun
```

---

## Phase 2: Maxun Installation

### Step 2.1: Clone Maxun Repository

```bash
cd /opt/maxun

# Clone (using develop branch for latest features)
git clone -b develop https://github.com/getmaxun/maxun.git src

# Verify structure
ls -la src/
# Should show: browser/  docs/  maxun-core/  server/  src/  etc.
```

### Step 2.2: Create Custom Docker Compose

```bash
cd /opt/maxun

# Create optimized docker-compose for your setup
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  # Redis for job queue and caching
  redis:
    image: redis:7-alpine
    container_name: maxun-redis
    restart: unless-stopped
    volumes:
      - ./data/redis:/data
    networks:
      - maxun-network
    command: redis-server --appendonly yes

  # Maxun Backend API
  backend:
    build:
      context: ./src
      dockerfile: Dockerfile.backend
    container_name: maxun-backend
    restart: unless-stopped
    env_file:
      - .env
    environment:
      - REDIS_URL=redis://redis:6379
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
      - ./robots:/app/robots
    ports:
      - "127.0.0.1:3000:3000"  # Localhost only for security
    networks:
      - maxun-network
    depends_on:
      - redis
    # Resource limits (adjust based on your Hetzner specs)
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
        reservations:
          cpus: '1'
          memory: 2G

  # Maxun Frontend (optional - for creating robots via UI)
  frontend:
    build:
      context: ./src
      dockerfile: Dockerfile.frontend
    container_name: maxun-frontend
    restart: unless-stopped
    environment:
      - VITE_API_URL=http://localhost:3000
    ports:
      - "127.0.0.1:3001:80"  # Localhost only
    networks:
      - maxun-network
    depends_on:
      - backend

networks:
  maxun-network:
    external: true

volumes:
  redis-data:
EOF
```

### Step 2.3: Build and Start Services

```bash
cd /opt/maxun

# Build (this takes 5-10 minutes)
docker-compose build

# Start services
docker-compose up -d

# Check status
docker-compose ps
# Should show: backend, frontend, redis all "Up"

# View logs
docker-compose logs -f backend
```

### Step 2.4: Verify Installation

```bash
# Test backend API
curl http://localhost:3000/health
# Expected: {"status":"ok"}

# Test from OpenJoey container (if running)
docker exec openjoey curl http://maxun-backend:3000/health

# Check logs for errors
docker-compose logs backend | tail -50
```

---

## Phase 3: Robot Configuration

### Step 3.1: Access Maxun UI

```bash
# Create SSH tunnel to access UI securely (run on your local machine)
ssh -i ~/.ssh/hetzner-openjoey-new -L 3001:localhost:3001 -L 3000:localhost:3000 root@116.203.215.213 -N

# Now open browser:
# Frontend: http://localhost:3001
# API: http://localhost:3000
```

### Step 3.2: Create Robot #1 - Crypto Prices (Structured)

**Purpose:** Scrape real-time crypto prices from CoinMarketCap

**Via UI:**

1. Open `http://localhost:3001`
2. Click "New Robot" → "Extract"
3. Name: `crypto-prices-cmc`
4. URL: `https://coinmarketcap.com/`
5. Recorder Mode: Click elements:
   - BTC price (".price")
   - BTC 24h change (".change")
   - ETH price
   - ETH 24h change
   - Top 5 gainers (name + change)
6. Pagination: "Load more" if needed
7. Schedule: Every 5 minutes
8. Save

**Via API (Alternative):**

```bash
curl -X POST http://localhost:3000/api/robots \
  -H "Content-Type: application/json" \
  -d '{
    "name": "crypto-prices-cmc",
    "type": "extract",
    "config": {
      "url": "https://coinmarketcap.com/",
      "selectors": {
        "btc_price": ".coin-price-btc .price",
        "btc_change": ".coin-price-btc .change",
        "eth_price": ".coin-price-eth .price",
        "eth_change": ".coin-price-eth .change"
      },
      "schedule": "*/5 * * * *"
    }
  }'
```

**Test:**

```bash
curl http://localhost:3000/api/robots/crypto-prices-cmc/run
```

### Step 3.3: Create Robot #2 - Stock Screener (Structured)

**Purpose:** Unusual volume stocks from Yahoo Finance

**UI Steps:**

1. New Robot → "Extract"
2. Name: `stock-unusual-volume`
3. URL: `https://finance.yahoo.com/screener/predefined/ms_day_gainers`
4. Extract columns:
   - Symbol
   - Company Name
   - Price
   - Volume
   - % Change
   - Avg Volume
5. Schedule: Every 15 minutes (market hours only)
6. Save

**Advanced: Market Hours Only**
Add to robot config:

```json
{
  "schedule": "*/15 9-16 * * 1-5",
  "timezone": "America/New_York"
}
```

### Step 3.4: Create Robot #3 - SEC Filings (Structured)

**Purpose:** Latest SEC filings for trending stocks

**UI Steps:**

1. New Robot → "Extract"
2. Name: `sec-latest-filings`
3. URL: `https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent`
4. Extract:
   - Company name
   - Filing type (10-K, 10-Q, 8-K)
   - Date
   - Link to filing
5. Schedule: Every hour
6. Add delay: 2000ms (respect SEC rate limits)

**Compliance Note:** Add user-agent header:

```
User-Agent: OpenJoey Research Bot contact@yourdomain.com
```

### Step 3.5: Create Robot #4 - Whale Wallets (Structured)

**Purpose:** Track large wallet movements

**UI Steps:**

1. New Robot → "Extract"
2. Name: `etherscan-whales`
3. URL: `https://etherscan.io/accounts/label/exchange`
4. Extract:
   - Wallet address
   - Balance
   - Percentage change
   - Exchange label
5. Schedule: Every 10 minutes
6. Save

---

## Phase 4: AI Extraction Setup (Option 4)

### Step 4.1: Configure OpenAI Integration

```bash
# Edit .env file
nano /opt/maxun/.env

# Add/update these lines:
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4o-mini
MAX_TOKENS_PER_REQUEST=2000
AI_REQUEST_TIMEOUT=30000
```

Restart:

```bash
cd /opt/maxun
docker-compose restart backend
```

### Step 4.2: Create Robot #5 - News Sentiment Analysis (AI)

**Purpose:** Extract structured insights from crypto news

**UI Steps:**

1. New Robot → "Extract" → "AI Mode"
2. Name: `crypto-news-ai`
3. URL: `https://www.coindesk.com/` (or news site)
4. AI Prompt:

```
Analyze the top 3 crypto news articles on this page.

For each article, extract:
{
  "headline": "article title",
  "sentiment": "bullish/bearish/neutral",
  "confidence": 0-100,
  "summary": "one sentence summary",
  "catalysts": ["reason 1", "reason 2"],
  "coins_mentioned": ["BTC", "ETH", etc],
  "price_predictions": ["any numbers mentioned"],
  "urgency": "breaking/normal/old"
}

Return as JSON array. Be concise.
```

5. Schedule: Every 30 minutes
6. Save

**Test via API:**

```bash
curl -X POST http://localhost:3000/api/robots/crypto-news-ai/run \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.coindesk.com/",
    "ai_prompt": "Extract top 3 headlines with sentiment analysis"
  }'
```

### Step 4.3: Create Robot #6 - Reddit Sentiment (AI)

**Purpose:** Analyze social sentiment from r/CryptoCurrency

**UI Steps:**

1. New Robot → "Extract" → "AI Mode"
2. Name: `reddit-crypto-sentiment`
3. URL: `https://www.reddit.com/r/CryptoCurrency/hot/`
4. AI Prompt:

```
Analyze the top 10 posts on r/CryptoCurrency.

Extract:
{
  "overall_sentiment": "bullish/bearish/neutral",
  "sentiment_score": -100 to +100,
  "trending_topics": ["topic1", "topic2", "topic3"],
  "most_upvoted_coin": "which coin has most mentions",
  "fear_level": "low/medium/high",
  "summary": "2-sentence summary of community mood"
}

Focus on actionable trading signals.
```

5. Schedule: Every hour
6. Save

### Step 4.4: Create Robot #7 - Earnings Analysis (Hybrid)

**Purpose:** Combine structured financials + AI analysis

**Two-Step Process:**

**Step A - Structured Scraping:**

1. New Robot → "Extract"
2. Name: `earnings-structured`
3. URL: `https://finance.yahoo.com/calendar/earnings`
4. Extract table: Symbol, EPS estimate, EPS actual, Revenue, Time
5. Schedule: Every hour during earnings season

**Step B - AI Enhancement:** 6. New Robot → "Extract" → "AI Mode" 7. Name: `earnings-ai-analysis` 8. URL: Dynamic (from Step A results) 9. AI Prompt:

```
Given this earnings data: {EPS: X, Revenue: Y, Growth: Z}

Analyze and provide:
{
  "beat_expectations": true/false,
  "sentiment": "bullish/bearish/neutral",
  "key_highlights": ["point 1", "point 2"],
  "guidance": "raised/lowered/unchanged",
  "red_flags": ["concern 1"],
  "trading_implication": "buy/sell/hold signal"
}
```

---

## Phase 5: OpenJoey Integration

### Step 5.1: Create Maxun Bridge Module

Create file: `/src/openjoey/maxun-bridge.ts`

```typescript
/**
 * Maxun Bridge for OpenJoey
 * Connects self-hosted Maxun to OpenJoey skills
 */

import { getOrCompute } from "./data_harvester/cache_layer.js";

const MAXUN_BASE_URL = process.env.MAXUN_URL || "http://localhost:3000";
const MAXUN_API_KEY = process.env.MAXUN_API_KEY; // If you add auth

// Types
export interface CryptoPriceData {
  btc_price: number;
  btc_change_24h: number;
  eth_price: number;
  eth_change_24h: number;
  top_gainers: Array<{
    symbol: string;
    price: number;
    change_24h: number;
  }>;
  timestamp: string;
}

export interface NewsInsight {
  headline: string;
  sentiment: "bullish" | "bearish" | "neutral";
  confidence: number;
  summary: string;
  catalysts: string[];
  coins_mentioned: string[];
  urgency: string;
}

export interface WhaleAlert {
  wallet: string;
  balance: number;
  exchange: string;
  change_24h: number;
  timestamp: string;
}

/**
 * Fetch with error handling
 */
async function maxunFetch(endpoint: string, options?: RequestInit): Promise<unknown> {
  const url = `${MAXUN_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(MAXUN_API_KEY && { Authorization: `Bearer ${MAXUN_API_KEY}` }),
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Maxun API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error(`Maxun fetch failed for ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Robot #1: Get crypto prices (with caching)
 */
export async function getCryptoPrices(): Promise<CryptoPriceData | null> {
  return getOrCompute(
    "maxun_crypto_prices",
    async () => {
      const result = await maxunFetch("/api/robots/crypto-prices-cmc/run");
      return result as CryptoPriceData;
    },
    5, // Cache for 5 minutes
  );
}

/**
 * Robot #2: Get unusual volume stocks
 */
export async function getUnusualVolumeStocks(): Promise<unknown | null> {
  return getOrCompute(
    "maxun_unusual_volume",
    async () => {
      const result = await maxunFetch("/api/robots/stock-unusual-volume/run");
      return result;
    },
    15, // Cache for 15 minutes
  );
}

/**
 * Robot #3: Get latest SEC filings
 */
export async function getLatestSECFilings(): Promise<unknown | null> {
  return getOrCompute(
    "maxun_sec_filings",
    async () => {
      const result = await maxunFetch("/api/robots/sec-latest-filings/run");
      return result;
    },
    60, // Cache for 1 hour
  );
}

/**
 * Robot #4: Get whale wallet movements
 */
export async function getWhaleMovements(): Promise<WhaleAlert[] | null> {
  return getOrCompute(
    "maxun_whale_movements",
    async () => {
      const result = await maxunFetch("/api/robots/etherscan-whales/run");
      return result as WhaleAlert[];
    },
    10, // Cache for 10 minutes
  );
}

/**
 * Robot #5: Get AI-extracted news insights
 */
export async function getNewsInsights(): Promise<NewsInsight[] | null> {
  return getOrCompute(
    "maxun_news_insights",
    async () => {
      const result = await maxunFetch("/api/robots/crypto-news-ai/run");
      return result as NewsInsight[];
    },
    30, // Cache for 30 minutes
  );
}

/**
 * Robot #6: Get Reddit sentiment analysis
 */
export async function getRedditSentiment(): Promise<{
  overall_sentiment: string;
  sentiment_score: number;
  trending_topics: string[];
  summary: string;
} | null> {
  return getOrCompute(
    "maxun_reddit_sentiment",
    async () => {
      const result = await maxunFetch("/api/robots/reddit-crypto-sentiment/run");
      return result as {
        overall_sentiment: string;
        sentiment_score: number;
        trending_topics: string[];
        summary: string;
      };
    },
    60, // Cache for 1 hour
  );
}

/**
 * Generic AI extraction - analyze any URL on-demand
 */
export async function aiExtractUrl(url: string, prompt: string): Promise<unknown> {
  const result = await maxunFetch("/api/ai-extract", {
    method: "POST",
    body: JSON.stringify({ url, prompt }),
  });
  return result;
}

/**
 * Health check
 */
export async function checkMaxunHealth(): Promise<boolean> {
  try {
    const result = await maxunFetch("/health");
    return (result as { status: string }).status === "ok";
  } catch {
    return false;
  }
}

/**
 * Get all data for morning brief
 */
export async function getMorningBriefData(): Promise<{
  prices: CryptoPriceData | null;
  news: NewsInsight[] | null;
  sentiment: {
    overall_sentiment: string;
    sentiment_score: number;
    trending_topics: string[];
    summary: string;
  } | null;
  whales: WhaleAlert[] | null;
}> {
  const [prices, news, sentiment, whales] = await Promise.allSettled([
    getCryptoPrices(),
    getNewsInsights(),
    getRedditSentiment(),
    getWhaleMovements(),
  ]);

  return {
    prices: prices.status === "fulfilled" ? prices.value : null,
    news: news.status === "fulfilled" ? news.value : null,
    sentiment: sentiment.status === "fulfilled" ? sentiment.value : null,
    whales: whales.status === "fulfilled" ? whales.value : null,
  };
}
```

### Step 5.2: Add Environment Variables

Edit `/opt/openjoey/.env` (or wherever OpenJoey env is):

```bash
# Maxun Integration
MAXUN_URL=http://localhost:3000
# MAXUN_API_KEY=optional_if_you_add_auth
```

### Step 5.3: Create Morning Brief Skill Using Maxun

Create/update: `/src/openjoey/skills/morning-brief.ts`

```typescript
import { getMorningBriefData } from "../maxun-bridge.js";

export async function generateMorningBrief(userId: string): Promise<string> {
  // Fetch all data in parallel from Maxun
  const data = await getMorningBriefData();

  let brief = "☀️ *Good Morning! Your Market Brief*\n";
  brief += "━━━━━━━━━━━━━━━\n\n";

  // Section 1: Prices (from Maxun Robot #1)
  if (data.prices) {
    const p = data.prices;
    brief += "📊 *MARKET SNAPSHOT*\n";
    brief += `• BTC: $${p.btc_price.toLocaleString()} (${formatChange(p.btc_change_24h)})\n`;
    brief += `• ETH: $${p.eth_price.toLocaleString()} (${formatChange(p.eth_change_24h)})\n`;

    if (p.top_gainers?.length > 0) {
      brief += "\n🔥 *Top Gainers:*\n";
      p.top_gainers.slice(0, 3).forEach((g) => {
        brief += `• ${g.symbol}: ${formatChange(g.change_24h)}\n`;
      });
    }
    brief += "\n";
  }

  // Section 2: AI News Insights (from Maxun Robot #5)
  if (data.news && data.news.length > 0) {
    brief += "📰 *AI-ANALYZED NEWS*\n";
    const topStory = data.news[0];
    brief += `Sentiment: *${topStory.sentiment.toUpperCase()}* (${topStory.confidence}% confidence)\n`;
    brief += `Top Story: ${topStory.headline}\n`;
    brief += `Summary: ${topStory.summary}\n`;

    if (topStory.catalysts?.length > 0) {
      brief += `Key Catalysts: ${topStory.catalysts.join(", ")}\n`;
    }
    brief += "\n";
  }

  // Section 3: Reddit Sentiment (from Maxun Robot #6)
  if (data.sentiment) {
    brief += "🗣️ *COMMUNITY SENTIMENT*\n";
    brief += `Overall: *${data.sentiment.overall_sentiment.toUpperCase()}*\n`;
    brief += `Score: ${data.sentiment.sentiment_score}/100\n`;
    brief += `Trending: ${data.sentiment.trending_topics.slice(0, 3).join(", ")}\n`;
    brief += `Summary: ${data.sentiment.summary}\n\n`;
  }

  // Section 4: Whale Activity (from Maxun Robot #4)
  if (data.whales && data.whales.length > 0) {
    const recent = data.whales.filter((w) => Math.abs(w.change_24h) > 10);
    if (recent.length > 0) {
      brief += "🐋 *WHALE MOVEMENTS*\n";
      recent.slice(0, 2).forEach((w) => {
        const direction = w.change_24h > 0 ? "📈" : "📉";
        brief += `${direction} ${w.exchange}: ${w.change_24h > 0 ? "+" : ""}${w.change_24h}%\n`;
      });
      brief += "\n";
    }
  }

  brief += "━━━━━━━━━━━━━━━\n";
  brief += "🤖 _Powered by OpenJoey + Maxun AI_";

  return brief;
}

function formatChange(change: number): string {
  const emoji = change >= 0 ? "🟢" : "🔴";
  const sign = change >= 0 ? "+" : "";
  return `${emoji} ${sign}${change.toFixed(2)}%`;
}
```

### Step 5.4: Wire Into Telegram Command

Update your gateway hook or command handler:

```typescript
// In your Telegram command handler
import { generateMorningBrief } from "./skills/morning-brief.js";

// Add command: /morningbrief or /brief
if (message === "/morningbrief" || message === "/brief") {
  const brief = await generateMorningBrief(userId);
  await sendTelegramMessage(chatId, brief, { parse_mode: "Markdown" });
}
```

---

## Phase 6: Testing & Verification

### Step 6.1: Test Each Robot Individually

```bash
# Test Robot #1: Crypto Prices
curl http://localhost:3000/api/robots/crypto-prices-cmc/run | jq

# Test Robot #5: AI News
curl http://localhost:3000/api/robots/crypto-news-ai/run | jq

# Test Robot #6: Reddit Sentiment
curl http://localhost:3000/api/robots/reddit-crypto-sentiment/run | jq
```

### Step 6.2: Test OpenJoey Bridge

```bash
# From OpenJoey directory
node -e "
const { getMorningBriefData } = require('./dist/openjoey/maxun-bridge.js');
getMorningBriefData().then(console.log).catch(console.error);
"
```

### Step 6.3: Test Full Morning Brief

```bash
# Send test Telegram message
node -e "
const { generateMorningBrief } = require('./dist/openjoey/skills/morning-brief.js');
generateMorningBrief('test-user').then(console.log);
"
```

### Step 6.4: Verify Data Flow

Check that data flows: Maxun → Cache → OpenJoey → Telegram

```bash
# Check Maxun is producing data
docker exec maxun-backend cat /app/data/latest-run.json

# Check OpenJoey cache
ls -la ~/.openjoey/cache/ | grep maxun

# Check logs
docker logs maxun-backend | tail -20
cat /var/log/openjoey.log | grep maxun
```

---

## Phase 7: Production Hardening

### Step 7.1: Add Authentication (Optional but Recommended)

```bash
# Generate strong password
openssl rand -base64 32

# Add to .env
MAXUN_ADMIN_PASSWORD=your_generated_password
JWT_SECRET=another_generated_secret

# Restart
docker-compose restart backend
```

### Step 7.2: Configure Nginx Reverse Proxy (If exposing externally)

```nginx
# /etc/nginx/sites-available/maxun
server {
    listen 80;
    server_name maxun.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Step 7.3: Set Up Monitoring

```bash
# Add to docker-compose.yml (monitoring section)
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "127.0.0.1:9090:9090"

  grafana:
    image: grafana/grafana
    ports:
      - "127.0.0.1:3002:3000"
    volumes:
      - ./grafana-data:/var/lib/grafana
```

### Step 7.4: Backup Strategy

```bash
# Create backup script
cat > /opt/maxun/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backups/maxun"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup database
cp /opt/maxun/data/maxun.db $BACKUP_DIR/maxun_$DATE.db

# Backup robots
tar -czf $BACKUP_DIR/robots_$DATE.tar.gz /opt/maxun/robots/

# Keep only last 7 days
find $BACKUP_DIR -mtime +7 -delete
EOF

chmod +x /opt/maxun/backup.sh

# Add to crontab (daily at 2 AM)
0 2 * * * /opt/maxun/backup.sh
```

### Step 7.5: Resource Monitoring

```bash
# Add to crontab - check every hour
0 * * * * docker stats --no-stream maxun-backend maxun-redis >> /var/log/maxun-resources.log 2>&1
```

---

## Troubleshooting

### Problem: Maxun backend won't start

```bash
# Check logs
docker-compose logs backend

# Common issues:
# 1. Port 3000 already in use
sudo lsof -i :3000
# Kill process or change port in docker-compose.yml

# 2. Permission issues
sudo chown -R 1000:1000 /opt/maxun/data

# 3. Database locked
rm /opt/maxun/data/maxun.db
```

### Problem: Robots not running

```bash
# Check if robots are configured
curl http://localhost:3000/api/robots

# Trigger manual run and check logs
curl -X POST http://localhost:3000/api/robots/{robot-id}/run
docker-compose logs -f backend | grep -i "robot\|scrape"
```

### Problem: AI extraction not working

```bash
# Check OpenAI API key is set
docker exec maxun-backend env | grep OPENAI

# Test OpenAI directly
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer your-key"

# Check Maxun logs for AI errors
docker-compose logs backend | grep -i "ai\|openai\|error"
```

### Problem: OpenJoey can't connect to Maxun

```bash
# Test from OpenJoey container
docker exec openjoey curl http://maxun-backend:3000/health

# If using localhost, check both are on same network
docker network inspect maxun-network

# Check environment variable
printenv | grep MAXUN
```

### Problem: Data not caching

```bash
# Check cache directory
ls -la ~/.openjoey/cache/

# Check file permissions
sudo chown -R $(whoami):$(whoami) ~/.openjoey/

# Clear cache and retry
rm -rf ~/.openjoey/cache/maxun_*
```

### Problem: Rate limited by target websites

```bash
# Check current rate limit settings
docker exec maxun-backend cat /app/.env | grep -i rate

# Increase delays in robot config
# Edit robot and increase "delayBetweenRequests" to 3000-5000ms

# Use residential proxy (if needed)
# Add to .env: PROXY_URL=http://user:pass@proxy:port
```

---

## Maintenance

### Daily

```bash
# Check robot status
curl http://localhost:3000/api/robots | jq '.[].lastRunStatus'

# Check disk space
df -h

# Check logs for errors
docker-compose logs --tail=100 | grep -i error
```

### Weekly

```bash
# Update Maxun
cd /opt/maxun/src
git pull origin develop
docker-compose build
docker-compose up -d

# Clean old cache
find ~/.openjoey/cache -mtime +7 -delete

# Review OpenAI usage (cost control)
# Check OpenAI dashboard for spend
```

### Monthly

```bash
# Full system update
apt update && apt upgrade -y
docker system prune -f

# Review and optimize robots
# - Remove unused robots
# - Adjust schedules based on usage
# - Update selectors if websites changed

# Backup verification
cd /backups/maxun
ls -la | tail -5
```

---

## Quick Reference Commands

```bash
# SSH to server
ssh -i ~/.ssh/hetzner-openjoey-new root@116.203.215.213

# Maxun management
cd /opt/maxun
docker-compose up -d          # Start
docker-compose down           # Stop
docker-compose restart        # Restart
docker-compose logs -f        # Follow logs
docker-compose ps             # Status

# Access UI via SSH tunnel (run on local machine)
ssh -i ~/.ssh/hetzner-openjoey-new -L 3001:localhost:3001 -L 3000:localhost:3000 root@116.203.215.213 -N

# Then open: http://localhost:3001

# Test API
curl http://localhost:3000/health
curl http://localhost:3000/api/robots

# OpenJoey integration test
node -e "require('./dist/openjoey/maxun-bridge.js').checkMaxunHealth().then(console.log)"

# Backup
/opt/maxun/backup.sh

# Emergency: Reset everything
# WARNING: This deletes all data
cd /opt/maxun
docker-compose down
rm -rf data/* logs/*
docker-compose up -d
```

---

## Success Checklist

- [ ] Maxun running on `http://localhost:3000`
- [ ] 7 robots configured and running
- [ ] Crypto prices updating every 5 minutes
- [ ] AI news extraction working
- [ ] Reddit sentiment captured
- [ ] Whale movements tracked
- [ ] OpenJoey bridge module created
- [ ] Morning brief skill using Maxun data
- [ ] `/morningbrief` command working in Telegram
- [ ] Caching layer reducing API calls
- [ ] Backups automated
- [ ] Monitoring in place
- [ ] Documentation updated

---

**Document Version:** 1.0  
**Last Updated:** February 2026  
**Status:** Ready for implementation  
**Estimated Time:** 2-3 hours  
**Next Step:** Start with Phase 1 (Server Setup)

---

_Turning the web into your financial intelligence engine_ 🕷️📊
