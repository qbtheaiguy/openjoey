# Maxun Integration for OpenJoey

A comprehensive integration of Maxun's open-source web scraping platform with OpenJoey, designed for edge fund level financial data extraction at scale.

## 🏗️ Architecture Overview

```
OpenJoey Skills
     ↓
Maxun Bridge (index.ts)
     ↓
┌─────────────────────────────────────────────────────────┐
│  5-Layer Caching System                                 │
│  Memory → Redis → File → Maxun DB → Robot Scrape       │
│  99% cache hit rate target                              │
└─────────────────────────────────────────────────────────┘
     ↓
Self-Hosted Maxun Instance (Hetzner: 116.203.215.213)
     ↓
60+ Specialized Robots (15 crypto categories)
     ↓
Kimi K 2.5 AI Extraction (NOT GPT)
```

## 📁 Directory Structure

```
src/openjoey/maxun/
├── index.ts              # Main entry point & OpenJoey integration
├── maxun-bridge.ts       # Core Maxun client & robot execution
├── types/
│   └── index.ts          # TypeScript types & interfaces
├── cache/
│   └── multi-layer.ts    # 5-tier caching system
├── health/
│   └── monitor.ts        # Robot health monitoring & failover
├── config/
│   └── robots.ts         # 60+ robot configurations
└── README.md             # This file
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Redis (optional but recommended for best performance)
npm install ioredis

# Or with Docker
docker run -d --name redis -p 6379:6379 redis:alpine
```

### 2. Environment Variables

```bash
# Maxun instance URL
export MAXUN_URL=http://localhost:3000

# Optional: Maxun API key if configured
export MAXUN_API_KEY=your-api-key

# Redis configuration (optional)
export REDIS_HOST=localhost
export REDIS_PORT=6379
```

### 3. Initialize in OpenJoey

```typescript
import maxun from "./src/openjoey/maxun/index.js";

// Initialize during OpenJoey startup
await maxun.initializeMaxun();

// Generate morning brief
const brief = await maxun.generateMorningBrief();
console.log(brief.summary);

// Extract data from any URL using Kimi K 2.5
const result = await maxun.extractDataFromUrl(
  "https://coinmarketcap.com/gainers-losers/",
  "Extract top 5 gaining cryptocurrencies with symbol, price, and 24h change",
);
```

## 🤖 Robot Categories

### Blue-Chip (Critical Priority)

- `btc-tracker` + `btc-tracker-backup`
- `eth-tracker` + `eth-tracker-backup`
- Schedule: Every minute
- Cache TTL: 60 seconds

### Meme Coins (High Priority)

- `meme-trending` - Trending meme tokens
- `meme-new-listings` - New meme coin launches
- `meme-whale-moves` - Large meme transactions
- AI-powered extraction with Kimi K 2.5

### DeFi (High Priority)

- `defi-prices` - Protocol token prices
- `defi-tvl` - Total value locked
- `defi-yields` - Yield opportunities
- `defi-governance` - Active proposals

### Day Trading (High Priority)

- `daytrade-breakouts` - Technical breakouts
- `daytrade-scalping` - Short-term setups
- `daytrade-liquidations` - Liquidation data

### Futures (High Priority)

- `funding-rates` - Perpetual funding
- `futures-premium` - Index premium
- `open-interest` - OI data

### And 10 more categories...

- Liquidity Pools, Trending, L1/L2, NFT, On-Chain, News, Airdrops, Macro, Gaming, Privacy

## 🔄 Multi-Layer Caching

### Cache Tiers (Performance Optimized)

1. **Memory** (1000 entries) - ~1ms access
2. **Redis** (hot data) - ~5ms access
3. **File** (warm data) - ~50ms access
4. **Maxun DB** (persistent) - ~200ms access
5. **Robot Scrape** (fresh data) - ~3-5s access

### Cache TTL by Category

| Category    | Redis  | File   |
| ----------- | ------ | ------ |
| Blue-Chip   | 1 min  | 5 min  |
| Day Trading | 30 sec | 2 min  |
| Meme Coins  | 3 min  | 10 min |
| DeFi        | 5 min  | 15 min |
| News        | 30 min | 60 min |

## 🏥 Health Monitoring & Failover

### Automatic Failover

- Primary robot fails → Backup robot → Cache → Stale cache
- Health checks every 5 minutes
- Alerts for degraded/down robots
- Load balancing across healthy robots

### Health Metrics

```typescript
const status = await maxun.getMaxunStatus();
console.log(`Cache hit rate: ${status.cacheHitRate}%`);
console.log(`Healthy robots: ${status.healthReport.summary.healthy}/${status.robotCount}`);
```

## 🎯 OpenJoey Skill Integration

### Enhanced Data Fetchers

```typescript
// BTC data with automatic fallback
const btc = await maxun.getEnhancedBTCData({
  useMaxun: true,
  fallbackToExisting: true,
  cacheFreshness: "fresh",
});

// Meme coins with limit
const memes = await maxun.getEnhancedMemeData({
  limit: 10,
  useMaxun: true,
});
```

### Morning Brief Skill

```typescript
const brief = await maxun.generateMorningBrief();
// Returns:
// - BTC/ETH prices and changes
// - Top 3 meme coins
// - Top 3 DeFi yields
// - Breaking news with sentiment
// - Data sources used
// - Cache hit rate
```

### Custom AI Extraction

```typescript
// Extract any data using Kimi K 2.5
const result = await maxun.extractDataFromUrl(
  "https://defillama.com/yields",
  "Extract top 5 yield opportunities with protocol, APY, and TVL",
);
```

## 🛠️ Robot Management

### Create Custom Robots

```typescript
// AI-powered extraction robot
const robot = await maxun.createOpenJoeyRobot({
  name: "custom-yield-tracker",
  type: "ai-extract",
  url: "https://example.com/yields",
  prompt: "Extract yield opportunities with protocol, APY, and risk level",
  schedule: "*/15 * * * *", // Every 15 minutes
});

// Selector-based extraction robot
const selectorRobot = await maxun.createOpenJoeyRobot({
  name: "custom-price-tracker",
  type: "extract",
  url: "https://example.com/prices",
  selectors: {
    price: ".price-value",
    change: ".change-value",
  },
});
```

## 📊 Performance Metrics

### Scalability Targets (100k users/day)

| Metric         | Target  | Achievement           |
| -------------- | ------- | --------------------- |
| Cache hit rate | 99%     | ✅ 5-layer caching    |
| Response time  | <100ms  | ✅ Memory/Redis cache |
| Scrapes/day    | 10,000  | ✅ 99% reduction      |
| Cost           | $300/mo | ✅ Self-hosted        |
| Availability   | 99.9%   | ✅ Backup robots      |

### Real-time Monitoring

```typescript
const metrics = maxun.getPerformanceMetrics();
console.log(`Cache hit rate: ${metrics.cacheStats.hitRate}%`);
console.log(`Active robots: ${metrics.robotCount}`);
console.log(`Critical robots: ${metrics.criticalRobots}`);
```

## 🔧 Configuration

### Robot Configuration Example

```typescript
// src/openjoey/maxun/config/robots.ts
export const customRobot: RobotConfig = {
  name: "custom-tracker",
  category: "defi",
  priority: "high",
  type: "ai-extract",
  source: "https://example.com",
  schedule: "*/5 * * * *",
  cacheTtl: 300,
  retries: 3,
  timeout: 8000,
  aiPrompt: "Extract structured data...",
  backup: {
    robotName: "custom-tracker-backup",
    trigger: "on_failure",
  },
};
```

### Environment Configuration

```bash
# Production
MAXUN_URL=https://your-maxun-instance.com
REDIS_HOST=redis-cluster.example.com
REDIS_PORT=6379

# Development
MAXUN_URL=http://localhost:3000
REDIS_HOST=localhost
```

## 🚨 Troubleshooting

### Common Issues

1. **Maxun instance unreachable**

   ```bash
   curl http://localhost:3000/api/health
   ```

2. **Redis connection failed**

   ```bash
   # Redis is optional - system will work with file cache only
   docker logs redis
   ```

3. **High cache miss rate**

   ```typescript
   const stats = getCacheStats();
   console.log(`Cache hit rate: ${stats.hitRate}%`);
   // Check robot schedules and cache TTLs
   ```

4. **Robot failures**
   ```typescript
   const report = getHealthReport();
   const downRobots = report.robots.filter((r) => r.status === "down");
   console.log("Down robots:", downRobots);
   ```

### Debug Mode

```typescript
// Enable detailed logging
process.env.DEBUG_MAXUN = "true";

// Check individual robot health
const health = await getRobotHealth("btc-tracker");
console.log("Robot health:", health);
```

## 📈 Monitoring & Alerts

### Health Check Endpoint

```typescript
// Add to your existing health check route
app.get("/health/maxun", async (req, res) => {
  const status = await maxun.getMaxunStatus();
  res.json(status);
});
```

### Alert Integration

```typescript
// Robot failure alerts
const alerts = getRecentAlerts(10);
alerts.forEach((alert) => {
  if (alert.severity === "critical") {
    // Send to your alert system (Slack, Discord, etc.)
    sendAlert(`🚨 ${alert.robotName}: ${alert.message}`);
  }
});
```

## 🔄 Migration from Existing Data Sources

### Gradual Migration Strategy

1. **Phase 1**: Deploy alongside existing sources (useMaxun: false)
2. **Phase 2**: Enable Maxun with fallback (useMaxun: true, fallbackToExisting: true)
3. **Phase 3**: Full migration (useMaxun: true, fallbackToExisting: false)

### Backward Compatibility

```typescript
// Existing code continues to work
const btc = await getExistingBTCData(); // Your current function

// Enhanced version with Maxun
const enhancedBtc = await maxun.getEnhancedBTCData({
  useMaxun: true,
  fallbackToExisting: true, // Falls back to getExistingBTCData()
});
```

## 🤝 Contributing

### Adding New Robot Categories

1. Define category in `types/index.ts`
2. Add cache TTLs to `CACHE_TIERS`
3. Create robot configs in `config/robots.ts`
4. Add data fetchers to `maxun-bridge.ts`
5. Update integration in `index.ts`

### Adding New Cache Tiers

1. Implement tier in `cache/multi-layer.ts`
2. Update `getCachedData()` and `setCachedData()`
3. Add tier-specific configuration
4. Update performance metrics

## 📄 License

This integration follows the same license as OpenJoey and uses Maxun under AGPLv3.

## 🙏 Acknowledgments

- **Maxun**: Open-source web scraping platform
- **Kimi K 2.5**: AI extraction provider
- **Redis**: High-performance caching
- **OpenJoey**: Core AI assistant platform
