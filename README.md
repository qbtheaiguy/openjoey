# 🎯 OpenJoey — AI-Powered Trading Assistant

<p align="center">
  <img src="https://raw.githubusercontent.com/qbtheaiguy/openjoey/main/docs/assets/openjoey-banner.png" alt="OpenJoey" width="800">
</p>

<p align="center">
  <strong>Your 24/7 AI Trading Companion</strong><br>
  Multi-agent intelligence for crypto, forex, and market analysis
</p>

<p align="center">
  <a href="https://github.com/qbtheaiguy/openjoey/actions"><img src="https://img.shields.io/github/actions/workflow/status/qbtheaiguy/openjoey/ci.yml?style=for-the-badge" alt="CI"></a>
  <a href="https://github.com/qbtheaiguy/openjoey/releases"><img src="https://img.shields.io/github/v/release/qbtheaiguy/openjoey?style=for-the-badge" alt="Release"></a>
  <a href="https://t.me/OpenJoey_bot"><img src="https://img.shields.io/badge/Telegram-@OpenJoey__bot-2CA5E0?style=for-the-badge&logo=telegram" alt="Telegram"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge" alt="License"></a>
</p>

---

## 🚀 What is OpenJoey?

**OpenJoey** is a production-ready AI trading assistant that monitors markets, analyzes trends, and delivers personalized insights through Telegram. Built on a multi-agent architecture with **Kimi K2.5** and **DeepSeek** AI models.

### 🎯 Positioning

> **Full Trading AI Product** — Not a framework. Not an engine. A complete, deployable trading assistant with:
>
> - 🤖 Multi-agent intelligence (Coordinator, News, Alerts, DevOps)
> - 📊 Real-time market data (CoinGecko, on-chain)
> - 🌅 Automated morning briefs
> - 🔔 Smart price alerts & whale watching
> - 💬 Telegram bot with natural language
> - 📈 Admin dashboard for user management

---

## ✨ Features

### 🤖 AI Agents

| Agent                  | Purpose                                 |
| ---------------------- | --------------------------------------- |
| **Master Coordinator** | Routes tasks, manages workflow          |
| **News Agent**         | Market news & sentiment analysis        |
| **Alert Agent**        | Price alerts & whale tracking           |
| **Meme Agent**         | Crypto meme trends & social signals     |
| **DevOps AI**          | Self-healing, monitoring, health checks |

### 📊 Market Intelligence

- **Real-time prices** via CoinGecko API
- **Whale tracking** — large wallet movements
- **Token discovery** — trending & new listings
- **Macro events** — economic calendar integration
- **Technical analysis** — AI-powered chart insights

### 🌅 Automated Briefings

- **Morning Brief** — Daily 9 AM market summary
- **Pre-market snapshot** — Key levels & overnight moves
- **Whale alerts** — Big moves as they happen
- **Personalized** — Based on user's watchlist

### 💬 Telegram Bot

- Natural language queries: _"What's Bitcoin doing?"_
- Chart analysis with AI insights
- Price alerts: _"Alert me when ETH hits $3000"_
- Subscription management via `/subscribe`

### 📈 Admin Dashboard

- User management with tier controls
- Real-time system monitoring
- Referral tracking & analytics
- Broadcast messaging to all users

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    OpenJoey Architecture                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Telegram   │    │  Admin Dash  │    │   Internal   │  │
│  │     Bot      │◄──►│   (Next.js)  │◄──►│     Bus      │  │
│  └──────────────┘    └──────────────┘    └──────┬───────┘  │
│         │                                        │          │
│         │           ┌────────────────────────────┘          │
│         │           │                                       │
│  ┌──────▼───────────▼──────┐    ┌────────────────────────┐  │
│  │    Gateway Hook         │    │    Multi-Agent System   │  │
│  │  • Session isolation    │◄──►│  • Master Coordinator   │  │
│  │  • Tier gating          │    │  • News Agent           │  │
│  │  • Marketing hooks      │    │  • Alert Agent          │  │
│  └─────────────────────────┘    │  • Meme Agent           │  │
│                                 │  • DevOps AI            │  │
│  ┌─────────────────────────┐    └────────────────────────┘  │
│  │    Data Harvester       │              │                 │
│  │  • CoinGecko prices     │◄─────────────┘               │
│  │  • On-chain data        │                               │
│  │  • News aggregation     │                               │
│  └─────────────────────────┘                               │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    AI Models                          │   │
│  │  • Kimi K2.5 (Moonshot)  • DeepSeek  • OpenAI       │   │
│  │  • Anthropic Claude      • Gemini    • Ollama       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                 Supabase Backend                      │   │
│  │  • Users & sessions    • Alerts    • Usage tracking   │   │
│  │  • Watchlists          • Referrals • Analytics        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer          | Technology                                     |
| -------------- | ---------------------------------------------- |
| **Core**       | TypeScript, Node.js 22+, ESM                   |
| **AI Models**  | Kimi K2.5, DeepSeek, OpenAI, Anthropic, Gemini |
| **Backend**    | Supabase (Postgres + Auth)                     |
| **Bot**        | Telegram Bot API                               |
| **Dashboard**  | Next.js 14, React, Tailwind CSS                |
| **Deployment** | Docker, Hetzner Cloud                          |
| **Monitoring** | Self-healing DevOps AI                         |

---

## 🚀 Quick Start

### Prerequisites

- Node.js ≥22
- Supabase account
- Telegram Bot Token ([@BotFather](https://t.me/botfather))
- Moonshot API Key (for Kimi K2.5)

### 1. Clone & Install

```bash
git clone https://github.com/qbtheaiguy/openjoey.git
cd openjoey
pnpm install
```

### 2. Environment Setup

```bash
cp .env.example .env
# Edit .env with your keys:
# - SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY
# - MOONSHOT_API_KEY
# - TELEGRAM_BOT_TOKEN
```

### 3. Database Setup

Run the SQL migrations in `supabase/migrations/` to create tables:

- `users` — User profiles & tiers
- `alerts` — Price alerts
- `usage_events` — Analytics tracking
- `watchlists` — User watchlists

### 4. Start Development

```bash
# Start gateway (Telegram bot + AI)
pnpm dev

# Start admin dashboard
cd packages/admin && pnpm dev
```

### 5. Production Deploy

```bash
# Build Docker image
docker build -t openjoey .

# Run on server
docker run -d \
  --name openjoey-gateway \
  --env-file .env \
  -p 18789:18789 \
  openjoey node dist/index.js gateway --bind lan --port 18789
```

---

## 📱 Usage

### Telegram Commands

| Command      | Description                |
| ------------ | -------------------------- |
| `/start`     | Welcome & account setup    |
| `/status`    | View your tier & usage     |
| `/subscribe` | Upgrade to Pro ($10/month) |
| `/alerts`    | Manage price alerts        |
| `/help`      | Show available skills      |

### Natural Language Queries

- _"Analyze Bitcoin"_ — Get AI-powered chart analysis
- _"What's trending in crypto?"_ — Market hot topics
- _"Alert me when SOL hits $200"_ — Set price alert
- _"Show me whale activity"_ — Large wallet movements

---

## 📊 Tiers

| Feature          | Free | Trader ($10/mo) | Premium ($29/mo) |
| ---------------- | ---- | --------------- | ---------------- |
| Charts/day       | 1    | Unlimited       | Unlimited        |
| Price alerts     | 0    | Unlimited       | Unlimited        |
| Whale tracking   | ❌   | ✅              | ✅               |
| API access       | ❌   | ❌              | ✅               |
| Priority support | ❌   | ❌              | ✅               |

---

## 🛡️ Security

- ✅ No hardcoded secrets
- ✅ Environment-based configuration
- ✅ Admin whitelist (`OPENJOEY_ADMIN_TELEGRAM_IDS`)
- ✅ Tier-based skill gating
- ✅ Code-request filtering for non-admins

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## 📜 License

MIT © [qbtheaiguy](https://github.com/qbtheaiguy)

---

## 🔗 Links

- 🌐 **Live Bot**: [@OpenJoey_bot](https://t.me/OpenJoey_bot)
- 📚 **Documentation**: [docs.openjoey.ai](https://docs.openjoey.ai)
- 💬 **Discord**: [discord.gg/openjoey](https://discord.gg/openjoey)
- 🐦 **Twitter**: [@OpenJoeyAI](https://twitter.com/OpenJoeyAI)

---

<p align="center">
  <sub>Built with ❤️ using <a href="https://openclaw.ai">OpenClaw</a></sub>
</p>
