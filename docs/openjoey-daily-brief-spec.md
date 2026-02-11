# OpenJoey Daily Brief — Product Spec (v1)

**Goal:** One text-only message every morning with what matters for trading: overnight moves, trade-relevant news (Fed, gold, forex, BTC, ETH), and — when the user has data — personal watchlist/alerts. Source links when available. New users get a full brief even with no watchlist or alerts.

---

## 1. Format and delivery

- **Text only** (no audio in v1).
- **One message per user per day**, sent in a configurable time window (e.g. 6–8 AM in user’s timezone or a fixed UTC window).
- **Source links:** Every news/market item that has a URL should include it (e.g. “Fed holds rates [link]”, “Gold hits record [link]”).
- **Markdown** in Telegram so links are clickable.

---

## 1.1 Branding / signature

Every Joey output (daily brief, and optionally all agent replies) ends with a **short signature** so the brand is clear when users read or forward content.

**Examples (pick one and use consistently):**

- `— Joey, your personal AI trading assistant`
- `Joey · Your personal AI for markets · openjoey.com`
- `🦞 Joey — your personal AI trading assistant`

**Recommendation:** One line, same everywhere. E.g. **"— Joey, your personal AI trading assistant"** or with lobster + link: **"🦞 Joey — your personal AI for markets · openjoey.com"**.

**Where to use:**

- **Daily brief:** Always; at the end of the message (before any "Pause / settings" footer).
- **Agent replies (optional):** Append the same signature to the end of every Joey reply in Telegram (or only for longer replies / when not in a tight thread). If used everywhere, keep it subtle so it doesn’t feel repetitive in long conversations.

**Implementation:** Single constant or config string (e.g. `JOEY_SIGNATURE` or in `constants.ts`) so the same line is used in the brief builder and any reply suffix.

---

## 2. Who gets the brief

- **Subscribers** (active paid): always eligible.
- **Trial users:** eligible (good habit from day one).
- **Free (post-trial):** optional — can be gated as a subscriber-only feature or offered as a shortened “teaser” brief.

**Opt-out / mute:** User can turn the brief off:

- **Pause:** 7 days / 30 days / until I turn it back on.
- **Time:** “Send my brief between 6–8 AM” (or one fixed time). If we don’t have timezone, use a default (e.g. 7 AM UTC) and add timezone later.
- Stored in DB (e.g. `users.daily_brief_paused_until`, `users.daily_brief_time_preference` or a small `user_brief_preferences` table).

---

## 3. New users (no watchlist or alerts)

**They still get a brief.** Content is market-wide + trade news only:

- **Market overnight:** BTC, ETH, major pairs (or “top movers” from an aggregate). Short line each, e.g. “BTC $97.2k (+0.5%), ETH $3.4k (-0.2%).”
- **Trade news:** Fed, rates, CPI, jobs; gold; forex (DXY, key pairs); crypto headlines (ETF, regulation, exchange). Each with a **source link** when available.
- **One “Joey take” (optional):** Single sentence: “Risk-on” / “Markets waiting for X” / “Quiet night.”

No empty “Your watchlist” or “Your alerts” sections. Optionally one line: “Add symbols to your watchlist in the app to get personalized overnight moves tomorrow.”

So: **new user brief = market snapshot + trade news (Fed, gold, forex, BTC, ETH, etc.) + links.**

---

## 4. Content types (trade news that affects trades)

**Macro / central banks**

- Fed (rates, FOMC, Powell). Link: Fed, Reuters, Bloomberg, etc.
- ECB, BoJ, other central banks if they moved or spoke.
- CPI, jobs, PMI — one line + link.

**Commodities**

- Gold (and silver if relevant). Levels or % move + link.
- Oil (WTI/Brent) if we want to include it.

**Forex**

- DXY (dollar index).
- Major pairs: EUR/USD, GBP/USD, USD/JPY (or a small set). One line each + link when available.

**Crypto**

- BTC, ETH (price and % change overnight).
- Top 5–10 movers (by volume or % move) — optional.
- Key headlines: ETF flows, regulation, exchange news, hacks. With links.

**Headlines**

- 3–5 items max. Each: one sentence + source link. Prefer: Fed, jobs, CPI, gold, dollar, crypto regulation, major exchange/protocol news.

**Source links**

- Prefer primary sources (Fed, BLS, exchange) or trusted wires (Reuters, Bloomberg). Store URL per item and render in the brief as “Title or summary [source](url)”.

---

## 5. Users with watchlist and/or alerts

**Same as above, plus a “Your overnight” section at the top:**

- **Watchlist:** “SOL +2.1%, BONK -4%, PEPE flat.” (or “No major moves on your watchlist.”)
- **Alerts:** “Your SOL above $142 alert triggered at 03:42 UTC.” Or “None of your alerts triggered.”

Then the rest: market snapshot, trade news (Fed, gold, forex, BTC, ETH, etc.) with links, then optional Joey take.

---

## 6. Brief structure (template)

```
📰 Your brief — [date]

[If has watchlist/alerts]
🔹 Your overnight
• Watchlist: SOL +2.1%, BONK -4%, PEPE flat.
• Alerts: SOL above $142 triggered. [link to alert history if we have it]

🔹 Market
• BTC $97.2k (+0.5%), ETH $3.4k (-0.2%).
• DXY 104.2; Gold $2,340 (+0.3%). [links if we have them]

🔹 Trade news
• Fed holds rates; dot plot unchanged. [link]
• Gold hits record on safe-haven bid. [link]
• [3–5 more headlines with links]

[Optional] Joey’s take: Risk-on; BTC holding range.

— Joey, your personal AI trading assistant

Pause or change time: /brief_settings (or button)
```

**New user (no watchlist/alerts):** Skip “Your overnight”; start with “Market” then “Trade news” then optional take. Optionally add: “Add a watchlist to get personalized moves tomorrow.”

---

## 7. Data and sources (to implement)

- **Prices (BTC, ETH, watchlist):** Existing or new price source (e.g. CoinGecko, Binance, or current alert pipeline). Overnight = last 8–12h or “since 22:00 UTC.”
- **News / headlines:** News API or RSS (e.g. Reuters, Bloomberg, CoinDesk, The Block). Filter for: Fed, CPI, jobs, gold, forex, BTC, ETH, regulation, exchanges. Store title + URL.
- **User preferences:** DB columns or table: `daily_brief_paused_until`, `daily_brief_time_utc` or timezone, `daily_brief_opted_in` (default true for subscribers/trial).

---

## 8. Sending (high level)

- **One job per day** (cron or Supabase pg_cron): “Run daily brief.”
- Job: For each user who is opted in and not paused, compute their send time (from preference or default); if “now” is in their window, build their brief (personal + market + news), then send one Telegram message (text + Markdown links).
- Build order: personal block (if any) → market block → news block (with links) → optional Joey take → footer with /brief_settings.

### 8.1 Cron (8 AM UTC)

- **Runner script:** `scripts/run-daily-brief.ts`. Requires env: `SUPABASE_URL` (or `OPENJOEY_SUPABASE_URL`), `SUPABASE_SERVICE_ROLE_KEY` (or `OPENJOEY_SUPABASE_SERVICE_ROLE_KEY`), `TELEGRAM_BOT_TOKEN` (or `OPENJOEY_TELEGRAM_BOT_TOKEN`).
- **Schedule:** Run once per day at 8 AM UTC so every user gets a brief when they wake up. Example crontab on the server:
  - `0 8 * * * cd /path/to/repo && bun run scripts/run-daily-brief.ts`
- **Opt-out / settings:** Footer in the brief: “Pause or change time: /brief_settings”. Implement `/brief_settings` (or `/brief_pause`) to call `setDailyBriefPaused` / `setDailyBriefOptedIn` (see Supabase client).

---

## 9. Out of scope for v1

- Audio / voice brief.
- Per-section mute (e.g. “no news”); can add later via preferences.
- User timezone (can default to one send window, e.g. 7 AM UTC, and add timezone later).

---

## 10. Summary

| Item           | Choice                                                                                                               |
| -------------- | -------------------------------------------------------------------------------------------------------------------- |
| Format         | Text only; source links when available                                                                               |
| New users      | Yes — full brief (market + trade news, no personal section)                                                          |
| Trade news     | Fed, gold, forex, BTC, ETH, macro, crypto headlines; links required where possible                                   |
| Opt-out        | Pause 7d/30d/indefinite; optional time preference later                                                              |
| Personal block | Watchlist overnight + alert triggers (only if user has them)                                                         |
| Branding       | Every brief (and optionally every Joey reply) ends with signature: e.g. "— Joey, your personal AI trading assistant" |

This gives every user a reason to open the app in the morning; new users get value from day one with trade-relevant news and links, and subscribers with watchlists get a personalized “what you missed” on top.
