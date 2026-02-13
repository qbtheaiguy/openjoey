# OpenJoey Repo Update — Phased Rollout Reference

This doc is the **reference plan** for implementing the next items from [openjoey-codebase-scan.md](openjoey-codebase-scan.md) (UPDATE and ADD sections) **without breaking the working codebase or existing user data**. Use it phase by phase; no big-bang cutover.

---

## Principles (non-negotiable)

1. **Add, don’t replace first.** New modules live alongside current code. Existing paths keep working until we explicitly switch.
2. **Gate by config / feature flags.** New behavior is opt-in via env or config (e.g. `OPENJOEY_USE_DELIVERY_ROUTER`, `OPENJOEY_EVENT_ENGINE`). Default = off so production stays on current behavior.
3. **Database: additive only.** New tables or columns only; no destructive migrations. Backfill optional and async. Never drop or rename columns/tables that live data depends on.
4. **Rollback = flip flag or revert deploy.** Every change must be reversible without data loss.

---

## Phase 1 — Observability and config (low risk)

**Goal:** Improve visibility and make “OpenJoey-only” channel set configurable. No behavior change by default.

### Steps

1. **Add trade / AI logging**
   - Add new log sinks or modules (e.g. under `src/logging/` or `src/openjoey/`) for: trade decisions, AI reasoning, token-safety.
   - Do **not** change existing log calls or levels.
   - Logs are additive; existing flows unchanged.

2. **Add OpenJoey channel config**
   - Introduce config (env or `openclaw.json`) that lists which channels to load for OpenJoey (e.g. `openjoey.channels: ["telegram", "discord", "web", "whatsapp"]`).
   - **Default:** current behavior (load whatever loads today).
   - When ready, set the list to only Telegram, WhatsApp, Discord, Web.
   - No removal of channel code; only “do we load this channel?” gated by config.

3. **Document flags and config**
   - In this doc or in `docs/install/` / runbooks: list new env vars and config keys, what “on” means, and how to roll back.

**Exit criteria:** New logging and config exist; defaults leave production behavior unchanged. No DB migrations in this phase unless purely additive (e.g. new table for log metadata only).

### Phase 1 — Implemented

- **Trade / AI logging:** `src/openjoey/logging.ts` — `logTradeDecision()`, `logAIReasoning()`, `logTokenSafety()`, `getOpenJoeyLogger()`. No existing log calls changed; use from new code when needed.
- **OpenJoey channel config:** `openjoey.channels` in config (and env `OPENJOEY_CHANNELS`, comma-separated). When set, gateway loads only those channel ids; when unset, all channels (current behavior). Implemented in `src/openjoey/config.ts` (`getOpenJoeyChannelsAllowlist`), gated in `src/gateway/server-channels.ts` (startChannels, getRuntimeSnapshot) and `src/gateway/server.impl.ts` (channelLogs, channelMethods).
- **Config schema:** `openjoey: { channels?: string[] }` added to `src/config/types.openclaw.ts` and `src/config/zod-schema.ts`.

---

## Phase 2 — New code paths behind flags

**Goal:** Delivery router, Event Engine, and data harvester/connectors exist as optional paths. Current flows unchanged.

### Steps

1. **Delivery router**
   - Add `src/openjoey/delivery/` (or agreed path): thin router that delegates to existing telegram / discord / web / whatsapp.
   - Gateway continues to call current channel code by default.
   - Add feature flag (e.g. `OPENJOEY_USE_DELIVERY_ROUTER=true`). When on, gateway calls router instead of channel X.
   - Switch one channel at a time (e.g. Telegram first); verify; then others.
   - Rollback: set flag to false.

2. **Event Engine (cron)**
   - Add new cron/event jobs (pre-market, whale snapshots, hourly scans, etc.) as **additional** jobs. Do **not** replace the existing daily-brief cron.
   - Daily brief stays as-is until we explicitly move it under the event engine (later phase).
   - New jobs use new code paths only; existing `scripts/run-daily-brief.ts` and cron entries unchanged.

3. **Data harvester / connectors**
   - Add `src/openjoey/data_harvester/` and optionally `data/connectors/` (or under data_harvester).
   - Used only by **new** flows (e.g. new pre-market job or new agent). Existing daily-brief and CoinGecko usage stay unchanged.
   - No changes to `src/openjoey/daily-brief.ts` or `trade-news-feeds.ts` unless additive (e.g. optional new data source).

4. **Testing and rollout**
   - All new paths gated by flags; default off.
   - E2E/smoke: existing tests stay green. Add tests for “flag on” behavior.
   - Optional: run new path in “shadow” (e.g. log what router would do) before enabling for real traffic.

**Exit criteria:** Router, event-engine jobs, and data harvester exist and are off by default. Current production behavior unchanged. Clear rollback (flag off).

### Phase 2 — Implemented

- **Delivery router:** `src/openjoey/delivery/router.ts` — thin delegate to `deliverOutboundPayloadsInternal`. When `OPENJOEY_USE_DELIVERY_ROUTER` or `openjoey.useDeliveryRouter` is set, `deliverOutboundPayloads` (in `src/infra/outbound/deliver.ts`) routes through the router. Default: off.
- **Event Engine:** `src/openjoey/event-engine/jobs.ts` — job templates for pre-market brief, whale snapshot, hourly scan. Not auto-registered; use scripts or gateway hooks to add to cron store when desired. Existing daily-brief and cron unchanged.
- **Data harvester:** `src/openjoey/data_harvester/` — skeleton with `scrapers`, `free_api_clients`, `data_normalizer`, `cache_layer`, `rate_limiter` (stubs). Used only by new flows; daily-brief and trade-news-feeds unchanged.
- **Config:** `openjoey.useDeliveryRouter` in config type and zod schema; `isOpenJoeyDeliveryRouterEnabled()` in `src/openjoey/config.ts`.

---

## Phase 3 — New agents and internal bus

**Goal:** Internal bus and fixed-roster agents exist alongside current agent flow. No replacement of current agents until we choose to.

### Steps

1. **Internal bus**
   - Add `src/openjoey/internal_bus/`: job queue, result queue, event stream (or agreed shape).
   - Existing agent flow does **not** use the bus by default; it keeps running as today.
   - New “fixed roster” agents consume from the bus; they are **additional** until we switch routing.

2. **Fixed-roster agents**
   - Add `src/openjoey/agents/` (or agreed path): e.g. master_coordinator, news_agent, alert_agent, meme_agent, etc.
   - These agents are **new**; routing stays “current agent for now” unless we explicitly route some traffic to the new agents (e.g. by feature flag or by product).

3. **Optional: devops_ai / Ops Guardian**
   - Add `src/openjoey/agents/devops_ai/` and/or Ops/Code Guardian as read-only, alerting components. They do not replace existing health or cron; they add new checks and alerts.

4. **Rollout**
   - Bus and new agents are opt-in. No change to how existing users are handled until we decide to route them to the new agents.
   - Document how to enable “new agent path” and how to roll back.

**Exit criteria:** Internal bus and new agents exist; current agent path still default. Additive only; no removal of existing agent code in this phase.

### Phase 3 — Implemented

- **Internal bus:** `src/openjoey/internal_bus/` — types (`BusJob`, `BusJobResult`, `BusEvent`), in-memory job queue (`enqueueJob`, `dequeueJob`, `peekNextJob`, `getQueueLength`), result queue (`pushResult`, `getResult`, `clearResult`), event stream (`publish`, `subscribe`). Existing agent flow does **not** use the bus by default.
- **Fixed-roster agents:** `src/openjoey/agents/` — `master_coordinator`, `news_agent`, `alert_agent`, `meme_agent`, each with a `handle(ctx)` stub; plus `devops_ai` (read-only/alerting stub). Routing stays on the current agent; no wiring from gateway or auto-reply to the bus or these agents yet.
- **Config:** `openjoey.useAgentBus` in config type and zod schema; env **`OPENJOEY_USE_AGENT_BUS`** overrides; **`isOpenJoeyAgentBusEnabled(cfg)`** in `src/openjoey/config.ts`.
- **Wiring (shadow mode):** When the flag is on, **`src/auto-reply/reply/get-reply.ts`** enqueues an `inbound_message` job and publishes `job.enqueued` at the start of `getReplyFromConfig`, then continues with the current flow. All channels (gateway, Telegram, Discord, Web) go through this path, so one opt-in point covers all. Replies still come from the current agent; the bus is observable for future consumers.

**Enable:** Set `openjoey.useAgentBus: true` in config or `OPENJOEY_USE_AGENT_BUS=true`. Inbound messages will be enqueued and events published; behavior is unchanged (shadow mode).

**Rollback:** Set `openjoey.useAgentBus: false` or `OPENJOEY_USE_AGENT_BUS=false`; no jobs enqueued, current agent path unchanged.

---

## Phase 4 — Cleanup (strip OpenClaw + clean skills)

**Goal:** Clean the codebase so OpenJoey is a trading-focused platform, not a general OpenClaw fork. Do this **before** building more features. Only Telegram, Discord, WhatsApp, and Web are supported channels; non-trading skills and general-assistant code are removed or disabled at core. See [OPENJOEY_ARCHITECTURE_RULES.md](OPENJOEY_ARCHITECTURE_RULES.md).

### Steps

1. **Strip OpenClaw complexity (channels)**
   - **Allowed channels only:** Telegram, Discord, WhatsApp, Web Dashboard.
   - iMessage, Slack, Signal, Line: **remove** — delete `src/imessage/`, `src/slack/`, `src/signal/`, `src/line/` and all references. We are not gating; we do not need them.

2. **Strip OpenClaw complexity (other systems)**
   - **Remove:** browser automation (`src/browser/`), TTS — text-to-speech for AI replies (`src/tts/`), canvas host (`src/canvas-host/`). Delete code and references; we do not need them.
   - **Keep voice input:** Users must be able to send **voice notes** (e.g. “what’s happening with BTC”) that are transcribed to text and sent to the agent. That is **speech-to-text** (audio transcription) in `src/media-understanding/` — keep it. We are removing **TTS** (AI speaking responses), not user voice messaging.
   - Mobile-specific systems: remove if not needed for the four delivery channels.

3. **Clean skills**
   - **Keep:** trading, research, scraping, monitoring, diagnostics, deployment tools (e.g. healthcheck, brave-api-setup), and supporting skills (discord, wacli, session-logs, skill-creator, clawhub, edy).
   - **Remove:** 1password, coding-agent, github, and any other non-trading / general-assistant skills. coding-agent may be kept as internal dev-only if explicitly decided.

4. **Database**
   - Additive-only. No dropping columns or tables that live data depends on.

5. **Docs**
   - Update [openjoey-codebase-scan.md](openjoey-codebase-scan.md): Phase 4 done, channel/skill list current.
   - Reference [OPENJOEY_ARCHITECTURE_RULES.md](OPENJOEY_ARCHITECTURE_RULES.md) for ongoing rules.

**Exit criteria:** Only the four channels exist in the repo; non-allowed channel code removed. Non-trading skills removed. Browser, TTS, canvas removed. **Voice input (user voice notes → transcription → agent) preserved** via `src/media-understanding/`. No destructive DB changes.

### Phase 4 — Implemented (cleanup)

- **Channels at core:** `OPENJOEY_ALLOWED_CHANNELS` in `src/openjoey/config.ts` = `["telegram", "discord", "web", "whatsapp"]`. When OpenJoey channel filter is active, only these four are accepted. **Next:** remove `src/imessage/`, `src/slack/`, `src/signal/`, `src/line/` and all references.
- **Skills removed:** `skills/1password/`, `skills/coding-agent/`, `skills/github/` deleted.
- **Voice:** User voice notes (speech-to-text) kept via `src/media-understanding/` (audio transcription). TTS (AI speaking) to be removed: delete `src/tts/` and TTS usage.
- **Browser / canvas:** To be removed: delete `src/browser/`, `src/canvas-host/` and references.
- **Docs:** [openjoey-codebase-scan.md](openjoey-codebase-scan.md) and this section updated.

---

## Safety checklist (every phase)

- [ ] New code is additive; existing entry points unchanged or gated by flag.
- [ ] Default config/flag = current behavior.
- [ ] Migrations (if any) are additive only (CREATE TABLE, ADD COLUMN, CREATE INDEX, RLS). No DROP of user-facing columns/tables.
- [ ] Rollback is defined (flip flag or revert deploy).
- [ ] Existing e2e/smoke tests pass.
- [ ] Docs/runbooks updated with new flags and rollback steps.

---

## Quick reference: flags and config

| Flag / config                         | Purpose                                                                                                                                          | Default                   | Rollback                       |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------- | ------------------------------ |
| `openjoey.channels` (config)          | Channel ids to load (e.g. `["telegram", "discord", "web", "whatsapp"]`). When set, only these channels start and appear in runtime snapshot.     | unset = load all channels | Remove key or set to full list |
| `OPENJOEY_CHANNELS` (env)             | Comma-separated channel ids; overrides `openjoey.channels` if set.                                                                               | unset                     | Unset env var                  |
| `openjoey.useDeliveryRouter` (config) | Route outbound delivery through OpenJoey delivery router.                                                                                        | `false`                   | Set to `false`                 |
| `OPENJOEY_USE_DELIVERY_ROUTER` (env)  | Same as above; overrides config when set to `true`/`1` or `false`/`0`.                                                                           | unset                     | Unset or set to `false`        |
| _(Phase 2)_ `OPENJOEY_EVENT_ENGINE`   | Optional: enable registration of OpenJoey event-engine jobs (pre-market, whale, hourly). Job templates exist; auto-register not yet implemented. | off                       | N/A                            |
| `openjoey.useAgentBus` (config)       | Route some traffic through internal bus to fixed-roster agents. Not wired yet; flag ready for Phase 3 rollout.                                   | `false`                   | Set to `false`                 |
| `OPENJOEY_USE_AGENT_BUS` (env)        | Same as above; overrides config when set to `true`/`1` or `false`/`0`.                                                                           | unset                     | Unset or set to `false`        |

---

## Related docs

- [OpenJoey Codebase Scan](openjoey-codebase-scan.md) — what we have, what to add, what to update.
- [OpenJoey Reduction & Execution Plan](openjoey-reduction-execution-plan.md) — overall product/reduction plan.
- [OpenJoey Daily Brief Spec](openjoey-daily-brief-spec.md) — daily brief behavior and delivery.

---

_Reference doc for repo updates. Update this file as phases are completed and new flags or steps are added._
