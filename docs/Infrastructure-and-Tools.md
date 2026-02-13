# OpenJoey Infrastructure & Tools Architecture

> From Skills to Tools: Building the Edge Fund Engine
> Free Data First, Web Scraping Second, API Calls Last

---

## 1. Current Infrastructure (What We Have)

### ✅ Data Harvester (Built)

**Location:** `src/openjoey/data_harvester/`

| Component             | Status     | What It Does                                               |
| --------------------- | ---------- | ---------------------------------------------------------- |
| `free_api_clients.ts` | ✅ Working | CoinGecko API client with rate limiting (50/min free tier) |
| `scrapers.ts`         | ✅ Working | Web scrapers for CoinMarketCap, Yahoo Finance, news sites  |
| `cache_layer.ts`      | ✅ Working | File-based cache with TTL (reduces API calls by 80%)       |
| `rate_limiter.ts`     | ✅ Working | Sliding window rate limiter per domain                     |
| `data_normalizer.ts`  | ✅ Working | Normalizes data from various sources to common format      |
| `index.ts`            | ✅ Working | Unified export and orchestration                           |

**Current Capabilities:**

- ✅ Fetch top 100 crypto prices (CoinGecko free tier)
- ✅ Scrape market news from CoinDesk/Yahoo
- ✅ Cache data for 5 minutes (massive API savings)
- ✅ Rate limit to avoid bans
- ✅ Alert system integration (checks prices, triggers alerts)
- ✅ Daily brief generation

**Current Limitations:**

- ❌ No technical indicator calculations
- ❌ No on-chain data (whale tracking)
- ❌ No options chain data
- ❌ No stock fundamentals
- ❌ No sentiment analysis
- ❌ No portfolio tracking tools

---

## 2. The Philosophy: Tools Enable Skills

**Skills = Instructions**  
**Tools = Capabilities**

A skill tells the AI what to do. A tool allows the AI to actually do it.

### Example: Crypto Guru Skill

```
Skill (Instructions):
"Analyze BTC chart and provide entry/stop/target"

Tools Required:
1. Price fetcher → Gets current price
2. OHLC fetcher → Gets historical candles
3. Technical indicator engine → Calculates RSI, MACD, EMA
4. Support/resistance detector → Finds key levels
5. Risk calculator → Position size, R:R ratio
```

Without tools, the skill is just a prompt. With tools, it becomes a trading edge.

---

## 3. The Free-First Data Strategy

### Priority Hierarchy:

1. **Free APIs** (CoinGecko, FRED, Binance public)
2. **Web Scraping** (Yahoo Finance, CoinMarketCap, SEC filings)
3. **Caching** (Avoid redundant calls entirely)
4. **Paid APIs** (Last resort, only for edge cases)

### Cost Optimization Math:

| Data Source   | Cost Without Strategy | Cost With Strategy | Savings |
| ------------- | --------------------- | ------------------ | ------- |
| Crypto Prices | $500/mo (paid API)    | $0 (CoinGecko)     | 100%    |
| Stock Prices  | $200/mo (Polygon)     | $0 (Yahoo scrape)  | 100%    |
| News          | $100/mo (Benzinga)    | $0 (RSS scrape)    | 100%    |
| On-Chain      | $300/mo (Nansen)      | $50/mo (Dune)      | 83%     |
| **TOTAL**     | **$1,100/mo**         | **~$50/mo**        | **95%** |

---

## 4. Tool Architecture (What We Need to Build)

### 4.1 Market Data Tools (P0 - Critical)

#### Tool: `PriceFeedTool`

**Purpose:** Real-time price data for any asset  
**Priority:** P0  
**Free Sources:**

- CoinGecko (crypto, 50/min free)
- Yahoo Finance scraper (stocks)
- Binance public API (crypto, no key needed)
- Forex Factory scraper (forex)

```typescript
interface PriceFeedTool {
  getPrice(symbol: string): Promise<PriceData>;
  getPrices(symbols: string[]): Promise<PriceData[]>;
  getTopMovers(limit: number): Promise<PriceData[]>;
}

interface PriceData {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  marketCap?: number;
  high24h: number;
  low24h: number;
  timestamp: string;
  source: string; // "coingecko", "yahoo", "binance"
}
```

**Implementation:**

- Try cache first (TTL: 5 min for crypto, 15 min for stocks)
- Try free API second (CoinGecko, Binance)
- Scrape as fallback (Yahoo Finance)
- Return mock only if all fail (for testing)

---

#### Tool: `OHLCFetcherTool`

**Purpose:** Historical candlestick data for technical analysis  
**Priority:** P0  
**Free Sources:**

- Binance public klines API (crypto)
- Yahoo Finance historical scraper (stocks)
- CoinGecko market chart API (crypto)

```typescript
interface OHLCFetcherTool {
  getCandles(
    symbol: string,
    timeframe: "1m" | "5m" | "15m" | "1h" | "4h" | "1d",
    limit: number,
  ): Promise<Candle[]>;
}

interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}
```

**Cache Strategy:**

- Historical data: Cache forever (doesn't change)
- Recent candles: Cache 1 minute
- This reduces API calls by 90% for technical analysis

---

### 4.2 Technical Analysis Tools (P0 - Critical)

#### Tool: `TechnicalIndicatorTool`

**Purpose:** Calculate technical indicators from OHLC data  
**Priority:** P0  
**Implementation:** Pure JavaScript/TypeScript (no API calls!)

```typescript
interface TechnicalIndicatorTool {
  // Trend Indicators
  calculateSMA(candles: Candle[], period: number): number[];
  calculateEMA(candles: Candle[], period: number): number[];
  calculateMACD(candles: Candle[]): MACDResult;

  // Momentum Indicators
  calculateRSI(candles: Candle[], period: number): number[];
  calculateStochastic(candles: Candle[]): StochasticResult;
  calculateCCI(candles: Candle[]): number[];

  // Volatility Indicators
  calculateBollingerBands(candles: Candle[]): BollingerResult;
  calculateATR(candles: Candle[]): number[];

  // Volume Indicators
  calculateOBV(candles: Candle[]): number[];
  calculateVolumeProfile(candles: Candle[]): VolumeProfile;

  // Pattern Detection
  detectSupportResistance(candles: Candle[]): LevelsResult;
  detectBreakouts(candles: Candle[]): BreakoutResult;
  detectChartPatterns(candles: Candle[]): PatternResult[];
}
```

**Key Algorithms:**

- SMA/EMA: Standard rolling calculations
- RSI: 100 - (100 / (1 + RS)) where RS = avg gain / avg loss
- MACD: EMA(12) - EMA(26), signal = EMA(9) of MACD
- Bollinger: SMA(20) ± 2 × StdDev(20)
- Support/Resistance: Pivot point detection + clustering algorithm

**Zero API Cost** — All calculations happen locally on cached OHLC data.

---

#### Tool: `SignalGeneratorTool`

**Purpose:** Combine indicators into actionable trading signals  
**Priority:** P0

```typescript
interface SignalGeneratorTool {
  generateSignal(
    candles: Candle[],
    strategy: "trend_following" | "mean_reversion" | "breakout",
  ): SignalResult;
}

interface SignalResult {
  direction: "LONG" | "SHORT" | "NEUTRAL";
  confidence: number; // 0-100
  entry: number;
  stopLoss: number;
  targets: number[];
  riskReward: string;
  reasoning: string;
  indicatorsUsed: string[];
}
```

**Signal Logic:**

```typescript
function generateTrendFollowingSignal(candles: Candle[]): SignalResult {
  const ema20 = calculateEMA(candles, 20);
  const ema50 = calculateEMA(candles, 50);
  const rsi = calculateRSI(candles, 14);
  const macd = calculateMACD(candles);
  const levels = detectSupportResistance(candles);

  // Long conditions
  const bullish =
    ema20[current] > ema50[current] && // Golden cross
    rsi[current] > 50 && rsi[current] < 70 && // Strong but not overbought
    macd.histogram > 0 && // Positive momentum
    candles[current].close > levels.nearestResistance * 0.98; // Near breakout

  if (bullish) {
    return {
      direction: "LONG",
      confidence: calculateConfidence([ema20, rsi, macd]),
      entry: candles[current].close,
      stopLoss: levels.nearestSupport * 0.99,
      targets: [levels.nextResistance, levels.nextResistance * 1.05],
      ...
    };
  }

  return { direction: "NEUTRAL", ... };
}
```

---

### 4.3 On-Chain Intelligence Tools (P1 - High Priority)

#### Tool: `WhaleTrackerTool`

**Purpose:** Track large wallet movements and smart money  
**Priority:** P1  
**Free Sources:**

- Etherscan API (free tier: 100k calls/day)
- Solscan API (free)
- Arkham Intelligence (free tier)
- Dune Analytics (free with limits)

```typescript
interface WhaleTrackerTool {
  // Large transactions
  getLargeTransactions(
    symbol: string,
    minValueUsd: number,
    timeframe: string,
  ): Promise<WhaleTransaction[]>;

  // Exchange flows
  getExchangeFlows(symbol: string): Promise<ExchangeFlow[]>;

  // Smart money wallets
  getSmartMoneyHoldings(symbol: string): Promise<SmartMoneyPosition[]>;

  // Whale concentration
  getHolderDistribution(symbol: string): Promise<HolderDistribution>;
}

interface WhaleTransaction {
  txHash: string;
  from: string;
  to: string;
  amount: number;
  valueUsd: number;
  type: "exchange_in" | "exchange_out" | "wallet_transfer";
  timestamp: string;
}
```

**Cost:** ~$50/mo for Dune premium (optional, free tier works for most)

---

#### Tool: `OnChainMetricsTool`

**Purpose:** Fundamental blockchain analysis  
**Priority:** P1

```typescript
interface OnChainMetricsTool {
  getNetworkHealth(symbol: string): Promise<NetworkHealth>;
  getDeFiMetrics(symbol: string): Promise<DeFiMetrics>;
  getTransactionActivity(symbol: string): Promise<ActivityMetrics>;
  getDeveloperActivity(symbol: string): Promise<DevActivity>;
}

interface NetworkHealth {
  activeAddresses24h: number;
  transactionCount24h: number;
  averageFee: number;
  hashRate?: number;
  stakingRatio?: number;
}
```

**Free Sources:**

- Dune Analytics (free tier: 4,000 credits/month)
- DefiLlama API (free, no limits)
- Token Terminal (free tier available)

---

### 4.4 Research & Fundamental Tools (P1 - High Priority)

#### Tool: `TokenomicsAnalyzerTool`

**Purpose:** Deep dive into token economics  
**Priority:** P1  
**Free Sources:**

- CoinGecko (supply, market cap)
- CoinMarketCap scraper (vesting schedules)
- Token unlock calendars (scraped)
- Whitepaper analysis (AI parsing)

```typescript
interface TokenomicsAnalyzerTool {
  analyzeTokenomics(symbol: string): Promise<TokenomicsReport>;
  checkUnlockSchedule(symbol: string): Promise<UnlockEvent[]>;
  calculateInflationRate(symbol: string): Promise<number>;
  assessConcentrationRisk(symbol: string): Promise<ConcentrationRisk>;
}

interface TokenomicsReport {
  grade: "A" | "B" | "C" | "D" | "F";
  circulatingSupply: number;
  totalSupply: number;
  maxSupply: number | null;
  inflationRate: number;
  unlockRisk: "Low" | "Medium" | "High";
  concentrationRisk: "Low" | "Medium" | "High";
  utility: string;
  redFlags: string[];
}
```

---

#### Tool: `FundamentalScraperTool`

**Purpose:** Scrape fundamental data for stocks and crypto  
**Priority:** P1

```typescript
interface FundamentalScraperTool {
  // Crypto fundamentals
  scrapeCoinGeckoDetail(coinId: string): Promise<CoinDetail>;
  scrapeDefiLlamaData(protocol: string): Promise<DefiData>;
  scrapeTokenTerminalData(token: string): Promise<TokenData>;

  // Stock fundamentals
  scrapeYahooFinancials(symbol: string): Promise<StockFinancials>;
  scrapeSECFilings(symbol: string): Promise<SECFiling[]>;
}

interface CoinDetail {
  description: string;
  homepage: string;
  githubRepos: string[];
  twitterFollowers: number;
  redditSubscribers: number;
  sentimentVotesUp: number;
  sentimentVotesDown: number;
}
```

**Free Sources:**

- CoinGecko detail endpoint (free)
- DefiLlama API (free)
- Yahoo Finance scraper (free)
- SEC EDGAR API (free)

---

### 4.5 Options & Derivatives Tools (P2 - Medium Priority)

#### Tool: `OptionsChainTool`

**Purpose:** Fetch and analyze options data  
**Priority:** P2  
**Free Sources:**

- Tradier API (free tier: limited)
- CBOE delayed quotes (free)
- Yahoo Finance scraper (free)

```typescript
interface OptionsChainTool {
  getOptionsChain(symbol: string, expiration?: string): Promise<OptionsChain>;

  calculateGreeks(
    option: OptionContract,
    underlyingPrice: number,
    volatility: number,
  ): Promise<Greeks>;

  findUnusualActivity(symbol: string): Promise<UnusualActivity[]>;
  suggestStrategy(
    outlook: "bullish" | "bearish" | "neutral" | "volatile",
    riskLevel: "low" | "medium" | "high",
  ): Promise<StrategySuggestion>;
}
```

**Cost:** Tradier free tier is limited. May need $30/mo for real-time.

---

### 4.6 Sentiment & News Tools (P2 - Medium Priority)

#### Tool: `SentimentAnalyzerTool`

**Purpose:** Analyze social sentiment and news  
**Priority:** P2  
**Free Sources:**

- CryptoPanic API (free tier)
- Reddit scraper (free)
- Twitter/X scraper (challenging, may need API)
- RSS feeds (free)

```typescript
interface SentimentAnalyzerTool {
  analyzeSocialSentiment(symbol: string): Promise<SentimentResult>;
  getTrendingTopics(): Promise<TrendingTopic[]>;
  analyzeNewsSentiment(symbol: string): Promise<NewsSentiment>;
  calculateFearGreedIndex(): Promise<FearGreedResult>;
}

interface SentimentResult {
  overall: "very_positive" | "positive" | "neutral" | "negative" | "very_negative";
  score: number; // -100 to +100
  volume: number; // Mention count
  trend: "improving" | "stable" | "declining";
  topSources: string[];
}
```

---

### 4.7 Alert & Monitoring Tools (P0 - Critical)

#### Tool: `AlertEngineTool`

**Purpose:** Monitor prices and trigger alerts  
**Priority:** P0  
**Implementation:** Internal (no external APIs)

```typescript
interface AlertEngineTool {
  createAlert(config: AlertConfig): Promise<Alert>;
  checkAlerts(): Promise<TriggeredAlert[]>;
  getUserAlerts(userId: string): Promise<Alert[]>;
  deleteAlert(alertId: string): Promise<void>;
}

interface AlertConfig {
  userId: string;
  symbol: string;
  type: "price_above" | "price_below" | "percent_change" | "volume_spike" | "technical";
  threshold: number;
  timeframe?: string;
  notificationMethod: "telegram" | "email" | "push";
}
```

**Architecture:**

- Background job runs every 60 seconds
- Fetches current prices once (batch request)
- Checks all active alerts against price data
- Triggers notifications for triggered alerts
- Uses Supabase for persistence

---

#### Tool: `PortfolioTrackerTool`

**Purpose:** Track user portfolios and performance  
**Priority:** P1

```typescript
interface PortfolioTrackerTool {
  addPosition(userId: string, position: Position): Promise<void>;
  getPortfolio(userId: string): Promise<Portfolio>;
  calculatePerformance(userId: string): Promise<PerformanceMetrics>;
  calculateRiskMetrics(userId: string): Promise<RiskMetrics>;
  suggestRebalancing(userId: string): Promise<RebalanceSuggestion>;
}

interface Portfolio {
  positions: Position[];
  totalValue: number;
  totalCost: number;
  unrealizedPnL: number;
  realizedPnL: number;
  allocation: Allocation[];
}
```

---

## 5. The Morning Brief System (Daily Engagement)

**Goal:** Give users a reason to open Telegram every morning at 8 AM.

### What is the Morning Brief?

A personalized, curated summary delivered to users at market open (8:30 AM ET) that includes:

1. **Market Snapshot** (30 seconds to read)
   - BTC/ETH prices + 24h change
   - Top 3 market movers
   - Fear & Greed index
   - Key economic events today

2. **Your Watchlist** (15 seconds to scan)
   - Any of your tracked assets moving >5%
   - Alerts triggered overnight
   - Breaking news on your positions

3. **Today's Opportunities** (60 seconds to review)
   - Top 3 setups across all markets
   - Why each setup exists (1 sentence)
   - Risk level for each

4. **Portfolio Check** (20 seconds)
   - Your portfolio P&L
   - Any positions needing attention (near stop, big move)
   - Correlation risk (too concentrated?)

5. **Smart Suggestion** (Based on your history)
   - "You usually trade BTC on Mondays. Want a scan?"
   - "SOL is breaking out. You asked about it yesterday."

### Technical Implementation:

```typescript
// Background job runs at 8:00 AM ET daily
async function generateMorningBrief(userId: string): Promise<MorningBrief> {
  const user = await getUserProfile(userId);

  // Fetch all data in parallel
  const [marketSnapshot, watchlistData, opportunities, portfolio, personalized] = await Promise.all(
    [
      fetchMarketSnapshot(),
      fetchWatchlistData(user.watchlist),
      fetchTopOpportunities(user.preferredAssets),
      fetchPortfolio(userId),
      generatePersonalizedInsight(userId),
    ],
  );

  return {
    date: new Date().toISOString(),
    marketSnapshot,
    watchlist: watchlistData,
    opportunities: opportunities.slice(0, 3),
    portfolio,
    personalized,
    generatedAt: Date.now(),
  };
}
```

### Engagement Hooks:

1. **Predictable Delivery** — Every day at 8 AM, like clockwork
2. **Personalization** — Different for each user based on their watchlist
3. **Actionable** — Every brief has clear next steps ("Tap to see BTC analysis")
4. **Brevity** — Takes < 3 minutes to consume
5. **Value** — Information they can't get elsewhere (your watchlist + opportunities)

---

## 6. Edge Fund Level Upgrades (1000x Better)

### What Makes an Edge Fund?

1. **Speed** — Information advantage (get data faster)
2. **Synthesis** — Connect dots others miss
3. **Execution** — Act on signals instantly
4. **Risk Management** — Never blow up
5. **Proprietary Data** — Unique insights

### Upgrade Roadmap:

#### Phase 1: Speed (Month 1)

- **Real-time WebSocket feeds** (Binance, Coinbase) for live prices
- **In-memory caching** (Redis) for sub-millisecond lookups
- **Parallel data fetching** (fetch 20 assets simultaneously)
- **Edge deployment** (Vercel Edge Functions for global low latency)

**Impact:** Response time < 1 second (currently ~3-5 seconds)

---

#### Phase 2: Synthesis (Month 2)

- **Multi-factor scoring** — Combine technical + on-chain + sentiment
- **Correlation matrix** — Real-time asset correlation tracking
- **Event detection** — Auto-detect unusual volume, breakouts, whale moves
- **AI reasoning** — GPT-4o to synthesize multiple signals into conviction score

**Impact:** Signal quality 85% → 95%

---

#### Phase 3: Execution (Month 3)

- **One-tap trading** — Connect to exchanges (Coinbase, Binance) for instant execution
- **Paper trading** — Test strategies without real money
- **Auto-alerts** → Auto-orders (optional, user-controlled)
- **Position sizing** — Auto-calculate based on account size and risk

**Impact:** Time to trade 2 minutes → 10 seconds

---

#### Phase 4: Risk Management (Month 4)

- **Portfolio heat map** — Visual risk exposure
- **VaR calculator** — Value at Risk for portfolio
- **Max drawdown alerts** — Warn before big losses
- **Kelly criterion** — Optimal position sizing math

**Impact:** User account blowups → Zero

---

#### Phase 5: Proprietary Data (Month 5-6)

- **On-chain alpha** — Whale wallet tracking (detect accumulation before pump)
- **Options flow** — Unusual options activity (smart money positioning)
- **Social sentiment** — Reddit/Twitter buzz (predict viral moves)
- **Cross-exchange arb** — Price differences between exchanges

**Impact:** Unique insights not available on Bloomberg or CoinGecko

---

## 7. Infrastructure Scaling Plan

### Current Architecture:

```
Telegram → Gateway → AI Agent → Data Harvester → Free APIs/Scrapers
```

### Edge Fund Architecture:

```
User → Edge Function → Cache (Redis) → Tools → Data Sources
                ↓
         Background Jobs (crons)
                ↓
         ML Models (embeddings, predictions)
```

### Components to Add:

#### 1. Redis Cache Layer (P1)

- In-memory cache for hot data (prices, indicators)
- Pub/sub for real-time updates
- TTL management for different data types

**Cost:** $20-50/mo (Upstash or Railway)

---

#### 2. WebSocket Feeds (P2)

- Binance WebSocket API (free, real-time crypto prices)
- WebSocket connection manager (reconnect logic)
- Broadcast updates to connected users

**Impact:** Real-time price updates instead of polling

---

#### 3. Background Job Queue (P1)

- BullMQ or similar on Redis
- Jobs: Alert checking, daily brief generation, data harvesting
- Retry logic, dead letter queues

**Cost:** Included with Redis

---

#### 4. ML Inference Service (P3)

- Embeddings for semantic search (skills, documentation)
- Sentiment analysis model (fine-tuned on financial text)
- Pattern recognition (chart patterns from images)

**Cost:** $50-100/mo (Hugging Face Inference API or self-hosted)

---

## 8. Data Source Deep Dive (Free First)

### Tier 1: Completely Free, No Limits

| Source         | Data                      | Reliability | Implementation      |
| -------------- | ------------------------- | ----------- | ------------------- |
| CoinGecko      | Crypto prices, market cap | ⭐⭐⭐⭐    | REST API, 50/min    |
| Binance Public | Crypto prices, OHLC       | ⭐⭐⭐⭐⭐  | REST + WebSocket    |
| DefiLlama      | DeFi TVL, yields          | ⭐⭐⭐⭐    | REST API, no limits |
| FRED API       | Economic data             | ⭐⭐⭐⭐⭐  | REST, 120/min       |
| SEC EDGAR      | Stock filings             | ⭐⭐⭐⭐    | FTP + REST          |

### Tier 2: Free with Limits

| Source         | Data               | Limit          | Strategy           |
| -------------- | ------------------ | -------------- | ------------------ |
| CoinGecko      | Detailed coin data | 10K calls/mo   | Cache aggressively |
| Etherscan      | On-chain data      | 100K calls/day | Batch requests     |
| Dune Analytics | SQL queries        | 4K credits/mo  | Optimize queries   |
| CryptoPanic    | News               | 100 calls/day  | RSS fallback       |
| Reddit API     | Social sentiment   | 100 calls/min  | Scrape fallback    |

### Tier 3: Scraping Required

| Source        | Data              | Approach                      |
| ------------- | ----------------- | ----------------------------- |
| Yahoo Finance | Stock prices      | Cheerio/Puppeteer             |
| CoinMarketCap | Prices, rankings  | Scraping (respect robots.txt) |
| Twitter/X     | Social sentiment  | Nitter API or scraping        |
| Investing.com | Economic calendar | Scraping                      |

### Tier 4: Paid (Last Resort)

| Source     | Data                  | Cost       | When to Use          |
| ---------- | --------------------- | ---------- | -------------------- |
| Polygon.io | Real-time stocks      | $49/mo     | Need real-time       |
| Tradier    | Options data          | $0-30/mo   | Options features     |
| Nansen     | On-chain intelligence | $150/mo    | Whale tracking       |
| The Graph  | DeFi data             | Query fees | Complex DeFi queries |

---

## 9. API Cost Budget (Conservative)

### Current (Month 1): $0-50

- CoinGecko: Free tier
- Binance: Free
- DefiLlama: Free
- Scraping: Free (infrastructure cost only)

### Growth (Month 6): $100-200

- CoinGecko: $0 (still on free)
- Dune Analytics: $50 (pro tier for more queries)
- Redis: $30 (caching layer)
- Tradier: $30 (options data)
- Scraping infra: $50 (proxies, rotation)

### Scale (Year 1): $300-500

- CoinGecko: $79 (pro tier, more calls)
- Polygon: $49 (stocks)
- Nansen: $150 (on-chain intelligence)
- Tradier: $30 (options)
- Redis: $50 (larger cache)
- Scraping: $100 (robust infrastructure)

**Total at Scale:** Still <$500/mo for institutional-grade data

---

## 10. Implementation Roadmap

### Week 1: Foundation

- [ ] Audit current data harvester
- [ ] Set up Redis cache layer
- [ ] Build TechnicalIndicatorTool (SMA, RSI, MACD)
- [ ] Add OHLC fetching from Binance

### Week 2: Core Tools

- [ ] Build SignalGeneratorTool
- [ ] Implement support/resistance detection
- [ ] Add risk calculator (position sizing, R:R)
- [ ] Connect tools to Crypto Guru skill

### Week 3: On-Chain

- [ ] Build WhaleTrackerTool (Etherscan API)
- [ ] Add exchange flow monitoring
- [ ] Integrate with Whale Guru skill
- [ ] Set up Dune Analytics connection

### Week 4: Morning Brief

- [ ] Build MorningBrief generator
- [ ] Set up cron job (8 AM ET daily)
- [ ] Add personalization logic
- [ ] Test with 10 beta users

### Week 5: Portfolio & Alerts

- [ ] Build PortfolioTrackerTool
- [ ] Enhance AlertEngineTool
- [ ] Add correlation tracking
- [ ] Portfolio risk metrics

### Week 6: Research

- [ ] Build TokenomicsAnalyzerTool
- [ ] Add fundamental scraper
- [ ] Research Guru skill integration
- [ ] Grade calculation (A-F system)

### Week 7: Options

- [ ] Build OptionsChainTool
- [ ] Greeks calculator
- [ ] Strategy builder
- [ ] Unusual activity detection

### Week 8: Polish & Scale

- [ ] Performance optimization
- [ ] Error handling improvements
- [ ] WebSocket real-time feeds
- [ ] Production hardening

---

## 11. Success Metrics (Technical)

### Data Quality:

- [ ] Price data accuracy: > 99.9%
- [ ] Indicator calculation latency: < 100ms
- [ ] Cache hit rate: > 80%
- [ ] API cost per user: <$0.10/month

### System Performance:

- [ ] Response time (p95): < 3 seconds
- [ ] Alert delivery delay: < 60 seconds
- [ ] Daily brief generation: < 5 seconds per user
- [ ] Uptime: 99.9%

### User Engagement:

- [ ] Morning brief open rate: > 70%
- [ ] Daily active users: > 60%
- [ ] Feature adoption (3+ tools): > 50%
- [ ] Retention (week 4): > 40%

---

## 12. Risk Mitigation

### API Outage Fallbacks:

1. **CoinGecko down** → Use Binance API
2. **Binance down** → Use cached data (15 min stale)
3. **Cache miss** → Scrape CoinMarketCap
4. **All fail** → Return "data temporarily unavailable, try again"

### Scraping Protection:

- Rotate user agents
- Use residential proxies (if needed)
- Respect robots.txt
- Add jitter between requests
- Cache aggressively to reduce scrape frequency

### Rate Limit Handling:

- Exponential backoff
- Queue requests
- Prioritize user-facing vs background jobs
- Alert when approaching limits

---

## 13. The Vision: Why This Wins

### Current Trading Tools:

- **CoinGecko:** Just prices
- **TradingView:** Just charts
- **Nansen:** Just on-chain
- **Discord groups:** Just noise

### OpenJoey Edge Fund:

- **All-in-one:** Prices + technicals + on-chain + sentiment + execution
- **AI-powered:** Natural language, smart routing, synthesis
- **Personalized:** Your watchlist, your risk, your style
- **Proactive:** Alerts you before the move happens
- **Affordable:** Free tier for everyone, $30/mo for pros (vs $500+/mo for Bloomberg)

### The Moat:

1. **Tool Integration:** No one else combines all these data sources
2. **AI Synthesis:** GPT-4o reasoning on top of raw data
3. **User Memory:** Learns your style over time
4. **Community:** Best trade ideas rise to the top
5. **Network Effects:** More users = better sentiment data = better signals

---

**Document Version:** 1.0  
**Last Updated:** February 2026  
**Status:** Ready for implementation  
**Next Action:** Start Week 1 implementation (Redis + Technical Indicators)

---

_Building the edge fund that fits in your pocket_ 🎯
