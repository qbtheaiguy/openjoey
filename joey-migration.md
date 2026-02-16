# Joey Migration Blueprint

## Complete Joey System Requirements

This document outlines EVERYTHING Joey needs to work 100% - all tools, processes, APIs, logic, flows, and user experiences. Use this as the migration checklist when forking nanobot.

---

## 1. Core Bot Functionality

### 1.1 Telegram Integration

- **Bot Token**: `8218039957:AAE-nrwhGbbJiNs1sPMqx0H9YJDaoV57ITs`
- **Bot Username**: `@OpenJoey_bot`
- **Admin Telegram IDs**: `8342663403`
- **Message Types**: Text, commands, media, callbacks
- **Response Requirements**:
  - Typing indicators for natural language
  - Instant responses for slash commands
  - Support for direct replies
  - Group chat handling

### 1.2 Command System

**Core Commands:**

- `/start` - Onboarding flow
- `/help` - Help menu with tier-specific features
- `/status` - User subscription status
- `/subscribe` or `/upgrade` - Subscription management
- `/referral` - Referral system
- `/cancel` - Cancel current operation
- `/stop` - Stop bot interactions
- `/alerts` - Alert management
- `/skills` or `/favorites` - Skill management

**Dynamic Commands (from skills):**

- `/price` - Token price queries
- `/trending` - Market trends
- `/portfolio` - Portfolio tracking
- `/trade` - Trading operations
- `/analyze` - Market analysis

---

## 2. User Management & Authentication

### 2.1 Session Management

- **User Identification**: Telegram user ID
- **Session Storage**: Supabase database
- **Session Tracking**: Last interaction, preferences, context
- **Tier Management**: Free, Trader, Premium, Annual

### 2.2 Subscription System

**Tiers:**

- **Free**: Basic commands, limited queries
- **Trader**: Advanced features, real-time data
- **Premium**: Full access, priority support
- **Annual**: Premium + discounts

**Subscription Flow:**

1. User triggers `/subscribe`
2. Bot presents tier options
3. Payment processing (Stripe integration)
4. Confirmation and tier upgrade
5. Feature unlock

### 2.3 Referral System

- **Referral Codes**: Unique per user
- **Tracking**: Referral conversions
- **Rewards**: Credits or tier upgrades
- **Analytics**: Referral performance

---

## 3. Trading & Financial Tools

### 3.1 Market Data APIs

**Primary Sources:**

- **CoinGecko API**: Price data, market caps
- **CoinMarketCap**: Alternative price source
- **DEX APIs**: Uniswap, PancakeSwap for DeFi data
- **CEX APIs**: Binance, Coinbase for liquidity data

**Data Requirements:**

- Real-time price updates
- Historical price data
- Trading volumes
- Market sentiment indicators
- Token metadata

### 3.2 Trading Features

**Core Trading Functions:**

- **Price Queries**: `/price BTC`, `/price ETH-USDT`
- **Portfolio Tracking**: User holdings, P&L calculations
- **Market Analysis**: Trend indicators, RSI, MACD
- **Trading Signals**: Buy/sell recommendations
- **Risk Management**: Stop-loss, position sizing

**Trading Workflows:**

1. User requests price/analysis
2. Bot fetches real-time data
3. Apply technical indicators
4. Generate recommendation
5. Present with confidence scores

### 3.3 Alert System

**Alert Types:**

- **Price Alerts**: Target price notifications
- **Volume Alerts**: Unusual trading volume
- **News Alerts**: Market-moving news
- **Technical Alerts**: Indicator breakouts

**Alert Management:**

- Create alerts via `/alerts`
- Modify existing alerts
- Alert history and performance
- Notification preferences

---

## 4. AI & Natural Language Processing

### 4.1 Joey V1 AI Core

**AI Model Integration:**

- **Primary Model**: OpenAI GPT-4 or equivalent
- **Fallback Models**: Claude, Llama for redundancy
- **Context Management**: Conversation history, user preferences
- **Prompt Engineering**: Trading-focused prompts

**Natural Language Features:**

- **Intent Recognition**: Command vs. conversation
- **Entity Extraction**: Tokens, amounts, timeframes
- **Sentiment Analysis**: Market sentiment from text
- **Contextual Responses**: Previous conversation awareness

### 4.2 Response Generation

**Response Types:**

- **Analytical**: Market analysis, data interpretation
- **Educational**: Explain trading concepts
- **Advisory**: Trading recommendations with risks
- **Conversational**: Natural chat interactions

**Response Requirements:**

- Typing indicators for processing
- Structured data presentation
- Source citations for data
- Risk disclaimers for financial advice

---

## 5. Data Sources & Integration

### 5.1 Primary Data Sources

**Supabase Database:**

- **User Data**: Sessions, subscriptions, preferences
- **Trading Data**: Portfolios, transaction history
- **Alert Data**: User alerts, trigger conditions
- **Analytics**: Usage metrics, performance data

**External APIs:**

- **Market Data**: CoinGecko, CoinMarketCap
- **News Sources**: Crypto news aggregators
- **Social Data**: Twitter sentiment, Reddit discussions
- **On-chain Data**: DeFi protocols, token movements

### 5.2 Data Processing Pipeline

**Data Flow:**

1. **Ingestion**: Real-time API polling
2. **Validation**: Data quality checks
3. **Processing**: Technical indicators, calculations
4. **Storage**: Cache frequently accessed data
5. **Distribution**: Serve to users via commands

**Data Freshness:**

- **Prices**: < 1 minute delay
- **Market Data**: < 5 minute delay
- **News**: < 10 minute delay
- **Analytics**: Batch processed hourly

---

## 6. Infrastructure & Deployment

### 6.1 System Architecture

**Core Components:**

- **Telegram Bot**: Message handling, command routing
- **AI Service**: Natural language processing
- **Data Service**: Market data aggregation
- **Alert Service**: Monitoring and notifications
- **Database**: User data and persistence

**Deployment Requirements:**

- **Server**: Hetzner (current) or similar
- **Process Management**: PM2 or systemd
- **Monitoring**: Health checks, error tracking
- **Scaling**: Horizontal scaling capability

### 6.2 Security & Reliability

**Security Measures:**

- **API Key Management**: Secure storage, rotation
- **User Data Privacy**: GDPR compliance
- **Rate Limiting**: Prevent abuse
- **Input Validation**: Sanitize all user inputs

**Reliability Features:**

- **Error Handling**: Graceful degradation
- **Retry Logic**: Failed API requests
- **Backup Systems**: Data redundancy
- **Monitoring**: Uptime, performance metrics

---

## 7. User Experience & Features

### 7.1 Onboarding Flow

**New User Journey:**

1. User starts chat with `/start`
2. Bot introduces Joey and capabilities
3. Collect user preferences (risk tolerance, interests)
4. Explain tier system and limitations
5. Guide through first command usage

### 7.2 Advanced Features

**Power User Tools:**

- **Custom Alerts**: Complex trigger conditions
- **Portfolio Analytics**: Advanced P&L reporting
- **Market Scanning**: Automated opportunity detection
- **Export Features**: CSV, PDF reports
- **API Access**: For third-party integrations

### 7.3 Localization & Accessibility

**Multi-language Support:**

- **Primary**: English
- **Secondary**: Spanish, Chinese, Hindi
- **Command Aliases**: Localized command shortcuts
- **Cultural Adaptation**: Region-specific trading preferences

---

## 8. Analytics & Monitoring

### 8.1 Usage Analytics

**Metrics to Track:**

- **Active Users**: DAU, MAU, retention
- **Command Usage**: Most popular features
- **Conversion Rates**: Free to paid upgrades
- **Response Times**: Bot performance metrics
- **Error Rates**: Failed commands, API issues

### 8.2 Business Intelligence

**KPIs:**

- **Revenue**: Subscription income, transaction fees
- **User Engagement**: Session duration, feature adoption
- **Market Impact**: Trading volume influenced
- **Support Load**: Help requests, issue resolution

---

## 9. Integration Points

### 9.1 Payment Processing

**Stripe Integration:**

- **Subscription Billing**: Recurring payments
- **One-time Payments**: Feature upgrades
- **Refund Processing**: Automated refunds
- **Webhook Handling**: Payment status updates

### 9.2 External Services

**Third-party Integrations:**

- **Trading Platforms**: API connections for live trading
- **Wallet Services**: Portfolio tracking
- **News Providers**: Real-time news feeds
- **Social Platforms**: Community engagement

---

## 10. Migration Implementation Plan

### Phase 1: Core Bot (Week 1)

- [ ] Fork nanobot repository
- [ ] Set up basic Telegram bot with our token
- [ ] Implement core commands (/start, /help, /status)
- [ ] Add Supabase integration for user data
- [ ] Test basic message flow

### Phase 2: Trading Features (Week 2-3)

- [ ] Integrate CoinGecko API for price data
- [ ] Implement /price and /trending commands
- [ ] Add portfolio tracking functionality
- [ ] Create basic alert system

### Phase 3: AI Integration (Week 3-4)

- [ ] Integrate Joey V1 AI model
- [ ] Implement natural language processing
- [ ] Add contextual conversation support
- [ ] Create trading analysis features

### Phase 4: Advanced Features (Week 4-6)

- [ ] Implement subscription system with Stripe
- [ ] Add referral program
- [ ] Create advanced analytics dashboard
- [ ] Implement group chat features

### Phase 5: Polish & Scale (Week 6-8)

- [ ] Add comprehensive error handling
- [ ] Implement monitoring and logging
- [ ] Optimize for performance
- [ ] Deploy to production with migration

---

## 11. Critical Success Factors

### Must-Have for MVP:

1. **Working Telegram bot** with core commands
2. **Real-time price data** from reliable APIs
3. **User authentication** via Telegram ID
4. **Basic AI responses** for natural language
5. **Supabase integration** for data persistence

### Success Metrics:

- **Bot Response Time**: < 3 seconds
- **Uptime**: > 99.5%
- **User Satisfaction**: > 4.5/5 rating
- **Feature Adoption**: > 70% of users use > 3 features

---

## 12. Risk Assessment & Mitigation

### Technical Risks:

- **API Rate Limits**: Implement caching, multiple sources
- **Telegram API Changes**: Use official libraries, stay updated
- **Database Scaling**: Optimize queries, consider read replicas

### Business Risks:

- **Market Volatility**: Clear risk disclaimers
- **Regulatory Changes**: Legal compliance monitoring
- **Competition**: Focus on unique features and UX

---

**This blueprint serves as the complete specification for Joey functionality. Use it as the migration checklist when implementing nanobot fork to ensure no features are missed.**
