# OpenJoey Skills Use Cases & Implementation Guide

> Making trading as simple as ABCD — from first trade to professional execution

---

## 1. Philosophy: The "One Command" Principle

**User types one sentence. OpenJoey delivers a complete answer.**

No learning curve. No complex syntax. No jargon without explanation.

### Examples of Simplicity

| What User Types            | What OpenJoey Does                                        |
| -------------------------- | --------------------------------------------------------- |
| "Should I buy Bitcoin?"    | Analyzes chart, gives YES/NO, entry, stop, target, reason |
| "Find me a stock to trade" | Scans S&P 500, returns top 3 setups with risk/reward      |
| "Set an alert for ETH"     | Creates price alert + suggests trigger levels             |
| "Analyze my portfolio"     | Reviews positions, suggests rebalancing, alerts           |

---

## 2. User Personas

### Beginners ("I opened my first trading app today")

**Trading Experience:** 0-6 months  
**Primary Need:** Education + Protection + Confidence  
**Risk Profile:** Conservative (1-2% per trade max)

**Journey:**

1. "What is Bitcoin?" → Simple 1-paragraph explanation
2. "Should I buy it?" → Clear YES/NO with visual chart markups
3. "How much?" → Position size calculated from their balance
4. "What if I'm wrong?" → Stop-loss set automatically
5. "Teach me why" → One-sentence education per indicator

**Success Metric:** Places first confident trade within 5 minutes

### Active Traders ("I trade a few times per week")

**Trading Experience:** 6 months - 3 years  
**Primary Need:** Speed + Validation + Idea Generation  
**Risk Profile:** Moderate (2-3% per trade)

**Journey:**

1. "Scan crypto" → 5 best setups delivered in 10 seconds
2. "Check SOL" → Technical + on-chain + sentiment combined
3. "Options for NVDA earnings" → Strategy with Greeks breakdown
4. "Whale activity on BTC?" → Smart money positioning

**Success Metric:** Finds and validates trades 5x faster than manual research

### Professional Traders ("Trading is my primary income")

**Trading Experience:** 3+ years  
**Primary Need:** Edge + Efficiency + Sophisticated Tools  
**Risk Profile:** Strategic (position sizing based on conviction)

**Journey:**

1. "Full market scan" → Multi-asset opportunities ranked by edge
2. "Portfolio hedge" → Correlation analysis + options overlay
3. "Unusual flow today" → Options whale activity + dark pool data
4. "COT positioning" → Institutional futures positioning

**Success Metric:** Gets complete market picture in under 30 seconds

---

## 3. How Each Skill Works (Technical Implementation)

### 3.1 Crypto Guru

**Command Patterns:**

- `/crypto BTC` - Quick analysis
- "Analyze Bitcoin" - Natural language
- "BTC 4 hour chart" - Specific timeframe
- Chart image upload - Visual analysis

**Implementation:**

```typescript
// Skill receives:
interface CryptoGuruInput {
  symbol: string; // "BTC", "ETH", "SOL"
  timeframe?: string; // "1h", "4h", "1d" (default: "4h")
  chartImage?: Buffer; // If user uploaded image
  context?: string; // "swing trade", "scalp", "invest"
}

// Skill returns:
interface CryptoGuruOutput {
  direction: "LONG" | "SHORT" | "NEUTRAL";
  confidence: number; // 0-100
  entry: number;
  stopLoss: number;
  targets: number[]; // Multiple take-profit levels
  riskReward: string; // "1:2.5"
  reasoning: string; // One-sentence explanation
  technicals: {
    trend: string;
    support: number[];
    resistance: number[];
    volume: string; // "above average", "low"
    indicators: string[]; // ["RSI oversold", "MACD bullish"]
  };
  riskWarning?: string; // For high volatility
}
```

**User Output Format:**

```
BTC/USDT (4H) — LONG SETUP
━━━━━━━━━━━━━━━
Direction: BULLISH (Confidence: 78%)

📍 Entry: $97,200
🛑 Stop:  $94,800 (-2.5%)
🎯 T1:   $101,000 (+3.9%, R:R 1.6x)
🎯 T2:   $105,000 (+8.0%, R:R 3.2x)

Technical Picture:
• Trend: Higher highs and lows intact
• Volume: 45% above 20-day average
• RSI: 62 (room to run before overbought)
• Support cluster: $95,500-$96,200

Risk Note: Set stop below last higher low.
Move stop to breakeven after T1 hit.
```

**Build Requirements:**

- [ ] Connect to price data API (CoinGecko, Binance)
- [ ] Technical indicator calculation (TA-Lib or custom)
- [ ] Support/resistance level detection algorithm
- [ ] Risk/reward calculator
- [ ] Natural language response generator

---

### 3.2 Signal Guru (Multi-Asset Master)

**Command Patterns:**

- `/signal` - Scans all asset classes
- "Best setups today" - Cross-asset ranking
- "What should I trade?" - Personalized picks

**Implementation:**

```typescript
// Aggregates all asset classes
interface SignalGuruOutput {
  opportunities: {
    asset: string; // "BTC", "AAPL", "EURUSD"
    assetClass: "crypto" | "stock" | "forex" | "commodity";
    direction: "LONG" | "SHORT";
    confidence: number;
    setupQuality: number; // Composite score 0-100
    timeToTrade: string; // "now", "this week", "setup forming"
    riskReward: string;
    keyLevels: {
      entry: number;
      stop: number;
      target: number;
    };
  }[];
  marketSummary: string; // "Risk-on today, tech leading..."
  topPick: string; // Highest conviction trade
}
```

**User Output Format:**

```
TODAY'S TOP 5 SETUPS
━━━━━━━━━━━━━━━

#1 BTC/USDT (Crypto) — 94/100 Quality
   LONG | Confidence: 82% | Trade NOW
   R:R 1:3.2 | Entry: $97,200 | Stop: $94,800

#2 NVDA (Stock) — 87/100 Quality
   SHORT | Confidence: 75% | Earnings play
   R:R 1:2.1 | Entry: $140 | Stop: $148

#3 EURUSD (Forex) — 81/100 Quality
   LONG | Confidence: 68% | This week
   R:R 1:2.8 | Entry: 1.0850 | Stop: 1.0780

Market Context: Risk-on day. Crypto and tech leading.
Dollar weakness benefiting forex pairs.
```

---

### 3.3 Meme Guru

**Command Patterns:**

- `/meme` - Hot meme coins right now
- "Find viral tokens" - Discovery mode
- "Is PEPE dead?" - Specific token analysis

**Implementation:**

```typescript
interface MemeGuruOutput {
  hotPicks: {
    symbol: string;
    name: string;
    price: number;
    marketCap: number;
    ageHours: number; // How long since launch
    volume24h: number;
    socialScore: number; // 0-100 based on mentions
    whaleActivity: string; // "accumulating", "selling", "neutral"
    riskLevel: "LOW" | "MEDIUM" | "HIGH" | "EXTREME";
    catalyst?: string; // Why it's trending
  }[];
  redFlags: string[]; // "Concentrated wallets", "No liquidity locked"
  disclaimer: string; // Meme coin risk warning
}
```

---

### 3.4 Stock Guru

**Command Patterns:**

- `/stock AAPL` - Single stock analysis
- "Best tech stock" - Sector scan
- Chart upload + "Analyze this" - Pattern recognition

**Key Features:**

- Earnings calendar integration
- Sector rotation awareness
- Institutional ownership data
- Analyst rating consensus

---

### 3.5 Options Guru

**Command Patterns:**

- `/options SPY` - Chain analysis
- "Sell covered calls on AAPL" - Income strategy
- "NVDA earnings play" - Event strategy

**Implementation:**

```typescript
interface OptionsGuruOutput {
  underlying: string;
  currentPrice: number;
  impliedVolatility: number;
  ivRank: number; // 0-100 vs historical
  ivPercentile: number;

  recommendations: {
    strategy: string; // "Long Call", "Put Credit Spread"
    direction: "BULLISH" | "BEARISH" | "NEUTRAL";
    expiration: string;
    strikes: {
      long?: number;
      short?: number;
    };
    maxProfit: number;
    maxLoss: number;
    breakeven: number;
    probabilityOfProfit: number;

    greeks: {
      delta: number;
      theta: number;
      vega: number;
      gamma: number;
    };

    rationale: string;
  }[];
}
```

---

### 3.6 Options Strategy Builder

**Command Patterns:**

- `/options-strategy iron-condor SPY` - Build specific strategy
- "Income strategy on SPY" - Goal-based
- "Protect my AAPL shares" - Hedging

**Supported Strategies:**
| Strategy | Use Case | Risk Level |
|----------|----------|------------|
| Long Call/Put | Directional play | Limited |
| Bull Call Spread | Moderate bullish | Limited |
| Bear Put Spread | Moderate bearish | Limited |
| Iron Condor | Range-bound, income | Limited |
| Butterfly | Low volatility play | Limited |
| Straddle/Strangle | High volatility expected | Limited |
| Covered Call | Income on existing shares | Limited |
| Cash-Secured Put | Income + acquire stock | Limited |
| Protective Put | Downside protection | Premium cost |
| Collar | Protection + income | Limited |

**Output Format:**

```
SPY Iron Condor — 30 Days
━━━━━━━━━━━━━━━

Setup:
   Sell $475 Call | Buy $480 Call
   Sell $455 Put  | Buy $450 Put

Credit Received: $2.15 per spread
Max Profit: $215 (if SPY stays $455-$475)
Max Loss: $285 (if SPY beyond $480 or $450)
Breakevens: $452.85 and $477.15
Probability of Profit: 62%

Greeks:
   Delta: -0.02 (market neutral)
   Theta: +0.12 (benefit from time decay)
   Vega: -0.25 (benefit if IV drops)

Rationale: IV rank at 72% (high). Selling premium
before earnings volatility crush.
```

---

### 3.7 Research Guru

**Command Patterns:**

- `/research Solana` - Deep dive
- "What is this token?" - Discovery
- "Compare ETH vs SOL" - Comparative analysis

**Data Points:**

```typescript
interface ResearchGuruOutput {
  overview: {
    name: string;
    symbol: string;
    sector: string;
    description: string; // One-paragraph summary
  };

  fundamentals: {
    marketCap: number;
    circulatingSupply: number;
    totalSupply: number;
    fullyDilutedValuation: number;
    revenue?: number; // For protocols
    treausry?: number;
  };

  tokenomics: {
    utility: string; // What is the token used for?
    inflation: string; // Emission schedule
    unlockSchedule?: string; // Vesting concerns
    concentrationRisk: string; // Top holders %
  };

  team: {
    founders: string[];
    backing: string[]; // Investors
    transparency: string; // "High" | "Medium" | "Low"
  };

  onChainMetrics?: {
    activeAddresses: number;
    transactionCount: number;
    tvl?: number; // For DeFi
    feesGenerated?: number;
  };

  redFlags: string[];
  catalysts: string[];

  verdict: {
    investmentGrade: string; // "A", "B", "C", "D", "F"
    timeHorizon: string; // "Speculative", "Swing", "Long-term"
    confidence: number; // 0-100
    summary: string;
  };
}
```

---

### 3.8 Whale Guru

**Command Patterns:**

- `/whale BTC` - Track large holders
- "What are whales buying?" - Accumulation detection
- "Track wallet 0x123..." - Specific wallet monitoring

**Data Sources:**

- Large exchange outflows (bullish)
- Large exchange inflows (bearish)
- Smart money wallet tracking
- Institutional filing analysis (13F)

---

### 3.9 Alert Guru

**Command Patterns:**

- `/alert BTC above 100000` - Price level
- `/alert` — List all alerts
- "Notify me when ETH drops 5%" - Percentage trigger
- "Alert at market open" - Time-based

**Alert Types:**

```typescript
type AlertType =
  | { type: "price_above"; symbol: string; price: number }
  | { type: "price_below"; symbol: string; price: number }
  | { type: "percent_change"; symbol: string; percent: number; timeframe: string }
  | { type: "volume_spike"; symbol: string; multiplier: number }
  | { type: "unusual_activity"; symbol: string }
  | { type: "technical"; symbol: string; pattern: string } // "breakout", "breakdown"
  | { type: "time"; time: string; message: string };
```

---

### 3.10 Edy (Personal AI Assistant)

**Command Patterns:**

- Everything. Edy is the default handler.

**How Edy Works:**

1. Intent Classification: Determines what user wants
2. Skill Routing: Decides which skill(s) to call
3. Context Memory: Remembers user's style, portfolio, history
4. Response Synthesis: Combines skill outputs into cohesive answer

**Personalization Data:**

```typescript
interface UserProfile {
  experience: "beginner" | "intermediate" | "advanced";
  riskTolerance: "conservative" | "moderate" | "aggressive";
  preferredAssets: string[];
  preferredTimeframes: string[];
  tradingStyle: "swing" | "day" | "position" | "invest";
  portfolio?: {
    positions: { symbol: string; size: number; entry: number }[];
    totalValue: number;
  };
  favoriteSkills: string[];
  alertPreferences: {
    notificationMethod: "telegram" | "email" | "push";
    quietHours?: { start: string; end: string };
  };
}
```

**Example Smart Routing:**
| User Input | Edy Detects | Routes To |
|------------|-------------|-----------|
| "Bitcoin?" | Asset question | Crypto Guru |
| "Find me a trade" | Opportunity scan | Signal Guru |
| "NVDA earnings" | Event play | Options Strategy + Economic Calendar |
| "My portfolio" | Position review | Trading God Pro |
| "What is DeFi?" | Education | Research Guru (explain mode) |

---

## 4. Skill Workflows (Multi-Skill Execution)

### Workflow 1: Complete Analysis Pipeline

**Trigger:** "Full analysis on SOL"

**Execution:**

1. **Research Guru** → Tokenomics, team, competitive position
2. **Crypto Guru** → Technical analysis, levels
3. **Whale Guru** → Smart money positioning
4. **Sentiment Tracker** → Social buzz, fear/greed
5. **Correlation Tracker** → How SOL moves with BTC, tech stocks

**Output:** Combined comprehensive report

---

### Workflow 2: Opportunity Discovery

**Trigger:** "Find me something to trade"

**Execution:**

1. **Signal Guru** → Scans all asset classes
2. **Market Scanner** → Unusual volume, breakouts
3. **Unusual Options** → Smart money flow
4. **Filter by user profile** → Match to their style
5. **Rank by conviction** → Top 5 delivered

---

### Workflow 3: Portfolio Protection

**Trigger:** "Protect my portfolio" or market volatility detected

**Execution:**

1. **Correlation Tracker** → Show correlated positions (risk concentration)
2. **Sentiment Tracker** → Market fear/greed level
3. **Options Guru** → Suggest hedges (protective puts, collars)
4. **Alert Guru** → Set trailing stops on key positions
5. **Economic Calendar** → Upcoming events that could impact

---

### Workflow 4: Earnings Play

**Trigger:** "NVDA earnings this week"

**Execution:**

1. **Economic Calendar** → Confirms date, time, expectations
2. **Stock Guru** → Technical setup
3. **Insider Tracker** → Recent executive activity
4. **Unusual Options** → Smart money positioning
5. **Options Strategy** → Suggests straddle/butterfly/strangle
6. **Alert Guru** → Pre-market reminder

---

## 5. Risk Management (Built Into Every Skill)

### Mandatory Elements:

1. **Stop Loss** — Every trade suggestion includes stop
2. **Position Sizing** — Based on user's account (1-2% default)
3. **Risk Warning** — High volatility assets flagged
4. **R:R Calculation** — Minimum 1:1.5 for suggestions

### Example Risk Output:

```
RISK MANAGEMENT
━━━━━━━━━━━━━━━
Position Size: $500 (2% of $25k account)
Stop Loss: $94,800 (-2.5% from entry)
Max Loss: $125
Risk/Reward: 1:3.2 (excellent)

Warning: Crypto is volatile. Only risk what
you can afford to lose completely.
```

---

## 6. Build Roadmap

### Phase 1: Core Skills (Weeks 1-4)

**Goal:** Make top 5 skills work flawlessly

**Skills to Build:**

1. Crypto Guru — Complete technical analysis
2. Stock Guru — Equity analysis with earnings
3. Signal Guru — Multi-asset scan
4. Alert Guru — Price alerts working
5. Edy — Smart routing working

**Success Criteria:**

- [ ] 95% of user queries handled correctly
- [ ] Sub-5-second response time
- [ ] Zero crashes in 1000 test queries

---

### Phase 2: Options & Advanced (Weeks 5-8)

**Goal:** Options skills for income and hedging

**Skills to Build:**

1. Options Guru — Chain analysis
2. Options Strategy — Builder with visualization
3. Unusual Options — Flow detection
4. Economic Calendar — Event tracking

---

### Phase 3: Research & Intelligence (Weeks 9-12)

**Goal:** Institutional-grade research tools

**Skills to Build:**

1. Research Guru — Deep dives
2. Whale Guru — Smart money tracking
3. Insider Tracker — Corporate activity
4. COT Analyzer — Institutional positioning
5. Correlation Tracker — Cross-asset analysis

---

### Phase 4: Automation (Weeks 13-16)

**Goal:** Proactive, not reactive

**Features:**

1. **Morning Brief** — Automated daily scan
2. **Portfolio Monitoring** — Auto-alerts on positions
3. **Opportunity Alerts** — "Your watchlist is moving"
4. **Risk Alerts** — "Market volatility spiking, tighten stops?"

---

## 7. Testing Checklist

### Functional Tests:

- [ ] Crypto Guru returns valid entry/stop/target
- [ ] Stock Guru includes earnings awareness
- [ ] Options Guru calculates Greeks correctly
- [ ] Alert Guru triggers at correct price
- [ ] Edy routes to correct skill 95%+ of time

### Edge Cases:

- [ ] Invalid symbol handled gracefully
- [ ] Market closed behavior defined
- [ ] Rate limiting (too many requests)
- [ ] API downtime fallback

### User Experience:

- [ ] Beginner understands output
- [ ] Professional gets detailed data
- [ ] Response time under 5 seconds
- [ ] Mobile-friendly formatting

---

## 8. Integration Architecture

### Data Flow:

```
User Message
    ↓
Edy (Intent Classification)
    ↓
Skill Router
    ↓
[Skill Execution]
    ├─→ Price Data API
    ├─→ Technical Analysis Engine
    ├─→ On-Chain Data
    ├─→ Options Chain API
    └─→ News/Sentiment API
    ↓
Response Formatter
    ↓
Telegram/Web Response
```

### APIs Needed:

- **Price Data:** CoinGecko (crypto), Polygon/Alpaca (stocks)
- **Options:** Tradier, CBOE, or similar
- **On-Chain:** Dune, Nansen, or The Graph
- **News:** CryptoPanic, Benzinga
- **Economic:** Investing.com, Forex Factory

---

## 9. Success Metrics

### User Success (What matters):

- [ ] 80% of beginners place first trade within 24 hours
- [ ] 70% of users return daily after week 1
- [ ] Average user NPS score > 50
- [ ] Support tickets < 5% of user base

### Technical Success:

- [ ] 99.9% uptime
- [ ] < 3 second average response time
- [ ] Zero data errors in trade suggestions
- [ ] 100% alert delivery rate

### Business Success:

- [ ] 30% conversion to paid tier
- [ ] $X revenue per user
- [ ] < 5% churn rate

---

## 10. Next Immediate Actions

### This Week:

1. [ ] Audit current skill outputs vs this spec
2. [ ] Fix any skills not returning required fields
3. [ ] Add risk management to all trading skills
4. [ ] Test 50 real user queries end-to-end

### Next Week:

1. [ ] Build missing skills (Options Strategy, COT Analyzer)
2. [ ] Implement skill workflows (multi-skill chains)
3. [ ] Create Edy smart routing logic
4. [ ] Add user personalization (experience level, risk)

---

**Document Version:** 1.0  
**Last Updated:** February 2026  
**Status:** Ready for implementation  
**Owner:** OpenJoey Product & Engineering

---

_Making trading as simple as ABCD_ 🎯
