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

**Time Required:** 2-3 hours
**Cost:** $0 (uses existing Hetzner server)

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
