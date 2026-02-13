# OpenJoey Architecture Rules & Goal

**Version:** 1.0  
**Project:** OpenJoey  
**Type:** Mandatory Engineering Principles  
**Status:** Enforced

This is the **backbone document** for OpenJoey. It defines what the project is, what it is not, and what must be done so OpenJoey never turns back into a bloated OpenClaw clone.

For phased rollout tracking and implementation checklist, see [repo-update.md](repo-update.md).

---

# THE NON-NEGOTIABLE OPENJOEY ARCHITECTURE RULES

## CORE MISSION (THIS DEFINES EVERYTHING)

**OpenJoey is:**

> A **Trading Intelligence Multi-Agent Platform** designed to gather, analyze, and deliver real-time financial and market intelligence across crypto, forex, commodities, stocks, and meme assets.

**OpenJoey is NOT:**

- a general AI assistant
- a lifestyle assistant
- a coding assistant for users
- a productivity chatbot
- a messaging aggregator
- a consumer voice assistant

If a feature does not improve **trading intelligence**, **financial research**, **market monitoring**, or **automation of trading insights** → it does not belong in OpenJoey.

---

## RULE 1 — TRADING DOMAIN ONLY

All features must relate directly to:

- crypto trading
- forex
- Penny Stocks
- commodities
- stocks
- options trade
- market research
- sentiment analysis
- macroeconomic signals
- trading automation
- alerts & signals
- news and headlines
- rss feed for trending new about gold crypto forex etc

**Forbidden additions:**

- travel tools
- shopping tools
- general productivity assistants
- personal scheduling
- consumer lifestyle integrations
- non-financial entertainment features

---

## RULE 2 — CHANNELS ARE STRICTLY LIMITED

**Allowed delivery channels:**

- Telegram
- Discord
- WhatsApp
- Web Dashboard

**Not allowed:**

- Slack
- iMessage
- Line
- Signal
- SMS gateways (unless explicitly approved)
- generic chat platforms

Channels must be implemented via a **unified delivery router**. All agent outputs pass through ONE routing system.

---

## RULE 3 — MULTI-AGENT BY DESIGN

OpenJoey must NEVER rely on a single monolithic AI.

**Architecture requires:**

- Task Orchestrator
- Agent Registry
- Spawn Manager
- Result Aggregator
- Event Bus

**Example execution model:**

```
User Request → Orchestrator
Orchestrator → Spawn Specialized Agents
Agents → Collect Data
Aggregator → Merge Results
Router → Deliver Output
```

Agents must be: **small**, **specialized**, **disposable**, **parallelizable**.

---

## RULE 4 — SCRAPING & FREE DATA FIRST

**Primary data sources:**

- public APIs
- open datasets
- blockchain RPC endpoints
- web scraping
- social media feeds
- public news sources

**Paid APIs are:** last resort, optional, modular plugins only.

**Mandatory components:**

- scraping engine
- proxy manager (or anti-detection strategy)
- rate limiter
- cache layer
- data normalizer

---

## RULE 5 — NO GENERAL OPENCLAW FEATURES

The following must NOT exist in core (or must be removed / isolated as dev-only):

- **TTS engines** (AI speaking responses). **Exception:** User **voice input** must be supported — users send voice notes (e.g. “what’s happening with BTC”) that are transcribed to text and sent to the agent. Keep **speech-to-text** (audio transcription in `src/media-understanding/`); remove **text-to-speech** (e.g. `src/tts/`).
- browser automation for users
- canvas host tools
- personal assistant skills
- password manager integrations
- non-trading coding tools

If inherited from OpenClaw → **remove or isolate behind internal dev-only tools.**

---

## RULE 6 — DEVOPS SELF-MONITORING IS REQUIRED

OpenJoey must monitor itself.

**Mandatory internal agents / capabilities:**

- AI Queue Monitor
- GPU Monitor (if applicable)
- API Failure Detector
- Agent Health Checker
- Resource Usage Monitor
- System Recovery Agent

**Capabilities:** detect overload, auto restart workers, detect API downtime, notify developers, provide suggested fixes.

This is **internal infrastructure** — not user-facing.

---

## RULE 7 — AGENT COMMUNICATION MUST BE EVENT-BASED

Agents do NOT call each other directly. They communicate via a **core event bus**.

Benefits: scalable, fault tolerant, debuggable, observable.

---

## RULE 8 — MODULAR EXTENSIONS ONLY

Every major feature must live inside modular extensions (e.g. `extensions/trading/*` or equivalent). Examples: crypto-trends, whale-tracker, news-analyzer, macro-signal-engine, sentiment-engine, alert-engine.

**If an extension is disabled → the system still runs.**

---

## RULE 9 — COST CONTROL IS A CORE DESIGN GOAL

**Prioritize:**

- open source models
- batch processing
- caching results
- async agents
- local processing
- scheduled scraping

**Avoid:**

- constant polling of expensive APIs
- real-time expensive LLM calls for every request
- duplicated agent work
- redundant scraping

---

## RULE 10 — MORNING TRADING BRIEF IS A CORE FEATURE

System must generate:

- daily market brief
- trending tokens
- macro events
- whale activity
- news sentiment
- top movers
- risk alerts

Automatically delivered through: **Telegram, WhatsApp, Discord, Web Dashboard.** Users should wake up with insights already prepared.

---

## RULE 11 — SINGLE SOURCE OF TRUTH FOR TASK EXECUTION

All jobs must go through a **core orchestrator**. No agent runs independently outside orchestration.

---

## RULE 12 — OBSERVABILITY IS MANDATORY

System must track: agent runtime, failures, data freshness, scraping success rate, API latency, message delivery success.

**Dashboards required:** system health, trading signal accuracy, infrastructure usage.

---

## FINAL RULE (THE BIG ONE)

If a developer asks: _“Should this feature go into OpenJoey?”_

The answer must be **YES** to at least one of:

- Does this improve trading intelligence?
- Does this reduce trader workload?
- Does this improve speed of market awareness?
- Does this improve decision making?

**If not → It does not belong.**

---

# WHAT THE REPO CURRENTLY IS (PROBLEM)

OpenJoey **should be:** a **Multi-Agent Trading Intelligence System** focused on crypto, forex, market research, trend detection, alerts, and automation. Everything else is secondary or removed.

**Right now:**

- The repo is still basically a **big OpenClaw fork**.
- Lots of extra systems still exist:
  - old channels (iMessage, Slack, Signal, Line)
  - browser tools
  - voice / TTS
  - canvas stuff
  - random skills not related to trading

Some skills and extensions were removed, but **the heavy OpenClaw infrastructure is still inside the repo.**

So the current state is:

> Trading system added **on top of** a big general assistant.

**NOT:**

> Clean trading intelligence platform.

---

# WHAT WE WANT INSTEAD (GOAL)

## 1. Trading & Research Focused ONLY

**Main capabilities:**

- trending token detection
- whale tracking
- news analysis
- sentiment monitoring
- macro events
- trade alerts
- market research

**NOT:** personal assistant stuff, general coding assistant, password tools, random integrations, consumer messaging platforms we don’t use.

---

## 2. Supported Channels ONLY

**We keep:** Telegram, Discord, WhatsApp, Web Dashboard.

**Everything else:** removed or **completely disabled at core level** — not just hidden by config.

---

## 3. Multi-Agent Intelligence System

- Spawn agents for tasks.
- Agents handle different research jobs.
- Coordinator combines results.

**Example:** User asks for trending tokens → system spawns volume scanner, social trend scanner, whale wallet scanner, liquidity scanner, news scanner → coordinator merges results → sends final analysis.

---

## 4. Low-Cost Data Strategy

**Priority:** web scraping, free APIs, public data sources.

**NOT:** expensive enterprise APIs, heavy paid data feeds.

**System needs:** sophisticated scraper engine, caching layer, rate limiting, data normalizer.

---

## 5. Internal DevOps Safety System

- Detect AI queue overload
- Monitor GPU usage
- Auto restart AI workers
- Monitor agent health
- System self-healing

This is an **internal developer safety system**, not user features.

---

# WHAT WE WANT DONE NEXT (TASKS)

## Phase A — Strip OpenClaw Complexity

Remove or hard-disable:

- iMessage channel
- Slack channel
- Signal channel
- Line channel
- browser automation system
- TTS / voice modules
- canvas host
- mobile-specific systems (if not needed)

**Goal:** smaller, cleaner trading core.

---

## Phase B — Clean Skills

**Keep only:** trading, research, scraping, monitoring, diagnostics, deployment tools.

**Remove:** coding-agent (unless internal dev tool only), 1password, unrelated integrations, general assistant tools.

---

## Phase C — Build Core OpenJoey System

Must exist:

- task spawner
- master coordinator
- internal event bus
- agent registry
- spawn manager
- delivery router
- messaging gateway

_(Partially in place: internal_bus, fixed-roster agents, delivery router. Orchestrator and full spawn/aggregate flow to be completed.)_

---

## Phase D — Build Data Harvester Engine

Includes:

- web scraping framework
- free API clients
- cache system
- anti-detection strategy
- structured data output

_(Skeleton in place under `src/openjoey/data_harvester/`; implement real scrapers and pipelines.)_

---

# ONE SENTENCE SUMMARY FOR YOUR DEV

If they only read ONE thing:

> **“We are NOT building a general OpenClaw assistant. We are building a clean, trading-focused, multi-agent intelligence platform with scraping-first data collection and only Telegram, Discord, WhatsApp, and Web as delivery channels.”**
