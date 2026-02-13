# Telegram Bot UI/UX: Skill Favorites & Menu Redesign

Design doc for OpenJoey Telegram: card-style menus (BotFather-style), user favorites, and AI-aware skill prioritization. All labels use **codebase skill names** (e.g. `meme-guru`, `whale-guru`, `edy`).

**Reference use:** §2.5–2.6 document the **data-driven automation** and **backend map** (current + after changes). §2.7 documents **scalability & extension points** (adding skills, auto agents, alert systems, new features). Use these to trace flows, implement wiring, add new capabilities in one place, and troubleshoot when something breaks.

---

## 0. Revised Direction: 100x Simpler = Progressive Disclosure

**Core principle:** _100x better UX = 100x simpler_, not 100x more features visible at once. The more powerful the bot, the simpler the first screen should be.

**What we got wrong in earlier drafts:**

- **Information overload on /start:** 7 lines of intro + 8 cards + 2 strips + commands + tip → new users freeze; no clear starting point.
- **Empty states everywhere:** "My Skills", "Watchlist", "Active Alerts" shown empty → confuse instead of help.
- **No progressive onboarding:** Showing everything at once instead of guiding to the first win in one tap.

**New approach:**

- **Don't show features before they're needed.** Reveal based on actual usage and lifecycle (day 1 → active → power user).
- **Day 1:** One short intro + **3 buttons only** → first success in under 30 seconds.
- **Day 2–3:** Offer watchlist and favorites _after_ they use something (e.g. "Add SOL to watchlist?" after first check).
- **Week 1 / active:** Show referral after they understand value.
- **Subscriber / power user:** Full menu with favorites, watchlist, referral.

**What we keep (but reveal in context):** Favorites (after 2–3 skill uses). Watchlist (build from usage; don't show card until 1+ symbols). Referral (one line, conditional; hide for first 24h). One-tap [Check] [Alert]. Skill descriptions and emoji. Grouped menus (Research, Trading, Alerts & Tracking) when we show the full menu.

---

## 0.1 Honest Take

**What’s strong:** The direction (progressive disclosure, 3 buttons day 1, no empty states) is right. It matches how people actually use bots: one clear action, then we grow from there.

**What’s missing:** The doc is mostly _what_ to show, not _how_ it updates by itself. If we don’t wire it, “day 1” vs “active” vs “power” is manual or guesswork, and “Add to watchlist?” / “Favorite this skill?” never fire. So below we lock in: **all branching is data-driven, all prompts are triggered by events we already have (or one-off new data). No manual steps for you; the system decides and updates automatically.**

**Your life 10x easier:** You don’t tag users, flip config, or “turn on” referral. We add a small amount of stored state (created_at, watchlist, favorites, optional use counts), one function that computes “lifecycle stage,” and hooks that attach the right keyboard and follow-up messages. After that, it runs on its own.

---

## 1. Design Goals

- **First win in one tap:** New users see 3 clear actions; no empty cards, no clutter.
- **Progressive disclosure:** Show favorites, watchlist, referral only when relevant (after use or after 24h / active).
- **Discoverability when ready:** Full menu (3–4 grouped cards, then drill down) for active/power users; skills and descriptions when they open a category.
- **AI prioritization:** Model sees favorites and watchlist once they exist; no logic change, just better prompts.
- **Referral visibility:** One line + one action when we show it; hide for day-1 users.
- **100x scalable:** Adding skills, auto agents, alert types, or new features must be a single-placement change (one allowlist, one table, one callback namespace). No rewrites of core flows; see §2.7.

---

## 2. Current State (Reference)

- **Session key:** `user:{telegramId}` (see `session-isolation.ts`).
- **Roles:** `admin` (all skills) vs `subscriber` (trading/research/chat only); `getSubscriberAllowedSkills()` defines the allowlist.
- **Skills (examples):** `edy`, `signal-guru`, `research-guru`, `crypto-guru`, `meme-guru`, `whale-guru`, `alert-guru`, `stock-guru`, `forex-guru`, `commodity-guru`, `options-guru`, `trading-god-pro`, plus many others under `skills/`.
- **Onboarding:** `onboarding.ts` — `/start`, `/help`, welcome message; no per-user favorites or skill menu yet.
- **Alerts & whales:** `alerts` table (user_id, token_symbol, target_price, condition); `getUserAlerts(userId)`. `whale_watches` for wallet tracking. No generic **watchlist** of symbols yet — add `user_watchlist` (or similar) for saved tokens/stocks/penny stocks so the Watchlist card has one-tap "Check" / "Alert".
- **Referral:** `/referral` and `handleReferral()` already exist; `getReferralStats(user.id)` returns `total_referrals`, `converted_referrals`, `total_earned`, `current_balance`. Amounts: $1.80 per referred subscriber (referrer), $1.20 off first month (referred). The new UI adds a **visible referral card** on /start and a one-tap modal so users see earnings without typing /referral.

---

## 2.5 Wiring & Automation — Everything Updates Automatically

**Goal:** No manual steps. Lifecycle (day 1 / active / power), which keyboard to show, and when to show “Add to watchlist?” / “Favorite this skill?” are all derived from data. You don’t configure anything; the system runs under the hood.

### What we have today (no change to logic)

- **Gateway hook** (`gateway-hook.ts`): Receives Telegram message, calls `handleStart()` etc., returns `directReply` + `sessionKey`, `userId`, `tier`, `allowedSkills`. Telegram bot sends `directReply` as one message (no keyboard today).
- **DB:** `users` (from `registerUser` / `getUser`), `alerts`, `whale_watches`, `referral_leaderboard` (via `getReferralStats`). We do **not** today have: `users.created_at` in the API (might exist in DB), watchlist table, favorites table, or per-skill use count.

### What we add once (minimal storage)

| Data                                       | Purpose                                               | Where                                                                                                                                                 |
| ------------------------------------------ | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `users.created_at`                         | Age of user → “day 1” vs “after 24h”                  | Likely already in DB; expose in `getUser()` or add a small `getUserLifecycle(userId)` that returns `{ created_at, watchlist_count, favorite_count }`. |
| `user_watchlist`                           | One row per (user_id, symbol); count = watchlist size | New table or JSONB on `users`. Used to: show watchlist strip only if count ≥ 1; “Add to watchlist?” only if symbol not already in list.               |
| `user_favorite_skills` (or JSONB on users) | One row per (user_id, skill_name) or array            | Used to: show “My Skills” only if count ≥ 1; “Favorite this skill?” only if not already favorited and use_count ≥ 2.                                  |
| Per-skill use count                        | “Favorite this skill?” after 2nd use                  | New table `user_skill_use` (user_id, skill_name, use_count, last_used) or single JSONB. Incremented when we know a skill ran (see below).             |

No new “config” or “feature flags” — only data that gets written when the user acts.

### How lifecycle is computed (automatic)

Define one function, e.g. `getLifecycleStage(userId)` or `getUserLifecycle(userId)`:

- Input: `user` (from `getUser(telegramId)`), `watchlist_count`, `favorite_count` (from new tables/columns).
- Output: `'day1' | 'active' | 'power'`.
- Rule:
  - **day1:** `created_at` under 24h ago **and** watchlist_count === 0 **and** favorite_count === 0. Show 3-button keyboard only; no referral, no watchlist strip, no favorites.
  - **active:** Otherwise (e.g. over 24h or has watchlist/favorites). Show referral line (if over 24h), watchlist strip if watchlist_count ≥ 1, “My Skills” if favorite_count ≥ 1; still can use simplified menu.
  - **power:** Same as active; “full menu” = 3–4 grouped cards when we choose to show it (e.g. after N messages or when they tap “More”). Optional: treat subscriber vs trial as power vs active.

Call this **only when building the reply for /start** (and when sending any “main menu” keyboard). No cron, no manual tagging.

### Where we wire it (no new “flows” — only branches)

1. **When handling `/start` (e.g. in `gateway-hook.ts` or the layer that builds the Telegram reply)**
   - After `handleStart()` returns the welcome text:
     - Call `getUserLifecycle(userId)` (and ensure `getUser` / DB exposes `created_at` and counts).
     - Attach inline keyboard to the **same** message:
       - If **day1:** 3 buttons only: [🔍 Check a Token] [📊 Market Overview] [❓ Ask Anything].
       - If **active/power:** Add referral line if over 24h; add watchlist strip if watchlist_count ≥ 1; add “My Skills” if favorite_count ≥ 1; optionally 3–4 grouped cards.
   - So: **one place** decides the keyboard from lifecycle. Rest of logic (handleStart, getReferralStats, etc.) unchanged.

2. **When sending the agent’s reply (Telegram layer, after we send the main reply)**
   - **“Add to watchlist?”**
     - If the **user’s last message** looks like a token check (e.g. “SOL”, “Check SOL”, “What’s up with BONK”), extract symbol; if not already in `user_watchlist`, send a **follow-up message**: “Add {symbol} to watchlist for quick access?” with [✅ Yes, add it] [Not now].
     - On [Yes] → insert into `user_watchlist`, edit or reply “Added.” No manual step.
   - **“Favorite this skill?”**
     - We need to know “this reply used skill X.” Options:
       - (A) Gateway (or skill-guard) writes `skill_used` into session or returns it in a small metadata blob that the Telegram layer can read when sending the reply. Then we increment `user_skill_use(skill)` and if count === 2 and not favorited, send “Favorite this skill?” with [Yes] [No].
       - (B) Heuristic: infer from reply or from last user message (weaker).
     - Prefer (A) so it’s reliable and automatic.

3. **Callback handlers (Telegram)**
   - `callback_query` for [Yes, add it] → add symbol to `user_watchlist`, answer callback, edit or send confirmation.
   - `callback_query` for [Favorite] → add to `user_favorite_skills`, answer callback, edit or send confirmation.
   - All other callbacks (Referral, Open watchlist, etc.) only **read** existing data (getReferralStats, getWatchlist, etc.) and show modals or text. No new business logic; same as today, just triggered by buttons.

### End-to-end: no lifting a finger

- **New user:** Registers → `created_at` set; watchlist/favorites empty → lifecycle = day1 → 3-button keyboard. They tap “Check a Token” → agent runs → we send reply → we see token-like message → we send “Add SOL to watchlist?” → they tap Yes → we insert watchlist. Next time they /start, watchlist_count ≥ 1 → lifecycle = active → we show watchlist strip.
- **Referral:** After 24h, `getLifecycleStage` is no longer day1 → we show referral line; when they tap, we call existing `getReferralStats()` and show modal.
- **Favorites:** When skill runs, we record use; on 2nd use we suggest favorite; they tap Yes → we insert favorite. Next /start we show “My Skills” because favorite_count ≥ 1.

Everything is driven by: **one lifecycle function**, **one place that picks the keyboard**, and **two triggers** (after reply: watchlist from message text, favorite from skill_used + use count). No manual updates; the data and the code do it.

**Your life 10x:** No config toggles, no manual tagging, no turning on referral per user. Deploy once; the bot adapts as users move (day 1 to active to power) and as they add watchlist or favorites. Everything updates automatically under the hood.

---

## 2.6 Backend map & data-driven automation (reference)

Single reference for how the backend works today and how it will work after automation. Use this to trace flows and debug.

### 2.6.0 Storage, infrastructure & where data lives

OpenJoey runs on three pieces that must work together seamlessly: **Vercel** (frontend), **Supabase** (data), **Hetzner** (backend runtime). All persistent data lives in **one Supabase project**; Vercel and Hetzner both talk to it. No duplicate state; no local DB on the server.

| Piece        | Role                                     | What runs there                                                                                                                                                                               | Where data is saved                                                                                                                                |
| ------------ | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Vercel**   | Frontend                                 | Admin dashboard (`packages/admin`, e.g. admin.openjoey.com), optional landing (openjoey.com). Next.js; server-side only for Supabase.                                                         | **None.** All reads/writes go to Supabase (same project as gateway). Use `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` in Vercel env (server-only). |
| **Supabase** | Single source of truth for all data      | PostgreSQL + Auth/RPC. No app logic runs here; only storage and RPCs.                                                                                                                         | **Everything:** see table below.                                                                                                                   |
| **Hetzner**  | Backend runtime (gateway + Telegram bot) | OpenClaw gateway in Docker (`/root/openclaw`); receives Telegram updates, runs agent, calls Supabase for users/sessions/alerts/referral and (after automation) watchlist/favorites/skill use. | **None locally.** All persistent state is in Supabase. Gateway uses `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` in server `.env`.                 |

**Where to save each piece of data (all in Supabase):**

| Data                                  | Save where (Supabase) | Table / RPC                                                                     | Used by                                             |
| ------------------------------------- | --------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------- |
| Users, tier, trial, referral code     | Supabase              | `users` (and `register_telegram_user` RPC)                                      | Hetzner (gateway), Vercel (admin)                   |
| Referral stats, earnings, leaderboard | Supabase              | `referrals`, `referral_leaderboard` (or equivalent); `getReferralStats` in code | Hetzner (onboarding, keyboard), Vercel (admin)      |
| Alerts (price, token)                 | Supabase              | `alerts`                                                                        | Hetzner (gateway, bot)                              |
| Whale watches                         | Supabase              | `whale_watches`                                                                 | Hetzner (gateway)                                   |
| Sessions / usage events               | Supabase              | `sessions`, `usage_events`                                                      | Hetzner (gateway), Vercel (admin)                   |
| **Watchlist** (new)                   | Supabase              | Table `user_watchlist` (user_id, symbol)                                        | Hetzner (lifecycle, keyboard, callback handlers)    |
| **Favorites** (new)                   | Supabase              | Table `user_favorite_skills` or JSONB on `users`                                | Hetzner (lifecycle, keyboard, callbacks)            |
| **Skill use count** (new)             | Supabase              | Table `user_skill_use` or JSONB                                                 | Hetzner (post-reply “Favorite?” trigger, lifecycle) |
| **User created_at** (for lifecycle)   | Supabase              | Column on `users` (likely already exists; expose in `getUser`)                  | Hetzner (`getLifecycleStage`)                       |

**How they work together:**

- **One Supabase project** is used by both the Hetzner gateway and the Vercel admin app. Same `SUPABASE_URL` and (server-side) `SUPABASE_SERVICE_ROLE_KEY` in both places. No sync or replication; single source of truth.
- **Hetzner** does not store users, watchlist, or favorites on disk; every read/write goes through `src/openjoey/supabase-client.ts` to Supabase. So when we add `user_watchlist`, `user_favorite_skills`, `user_skill_use`, we add tables (or columns) in Supabase and new methods in `supabase-client.ts`; the gateway just calls those methods.
- **Vercel** (admin) can show usage, revenue, and user counts by querying the same Supabase tables (e.g. `users`, `usage_events`, `referrals`). No separate API between Hetzner and Vercel; both hit Supabase.
- **Troubleshooting:** If data is missing or wrong, check Supabase (tables + RLS if any). If the bot doesn’t react, check Hetzner (gateway logs, env vars). If the admin dashboard is wrong, check Vercel env and that it’s using the same Supabase project. See §2.6.6 for a full “connect the dots” checklist.

References: [OpenJoey live checklist (Supabase and Hetzner)](install/openjoey-live-checklist.md), [OpenJoey Admin – Vercel](install/openjoey-admin-vercel.md).

### 2.6.1 Current backend map (today)

| Layer              | File(s)                             | Responsibility                                                                                                                                                      | Data read                                                                | Data written                      |
| ------------------ | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | --------------------------------- |
| **Telegram entry** | `src/telegram/bot.ts`               | Receives update, calls `onTelegramMessage(hook)`, sends `directReply` as one text message (no keyboard).                                                            | —                                                                        | —                                 |
| **OpenJoey hook**  | `src/openjoey/gateway-hook.ts`      | `onTelegramMessage` → if slash command, calls onboarding handler; else builds `HookResult` (sessionKey, userId, tier, allowedSkills, directReply or shouldProcess). | `getUser(telegramId)`, `resolveSession`, `getReferralStats` (for suffix) | —                                 |
| **Onboarding**     | `src/openjoey/onboarding.ts`        | `handleStart`, `handleStatus`, `handleReferral`, `getHelpMessage`, etc. Return **text only**.                                                                       | `db.registerUser`, `db.getUser`, `db.getReferralStats`                   | `registerUser` (creates user)     |
| **Session/role**   | `src/openjoey/session-isolation.ts` | `resolveSession(telegramId)` → sessionKey, userId, tier, role; `getAllowedSkillsForRole`.                                                                           | `db.getUser`                                                             | —                                 |
| **DB**             | `src/openjoey/supabase-client.ts`   | `registerUser`, `getUser`, `getUserAlerts`, `getReferralStats`, `createAlert`, etc.                                                                                 | Supabase `users`, `alerts`, `referral_leaderboard`, …                    | `users`, `referrals`, `alerts`, … |

**Flow today (e.g. /start):** Telegram → `bot.ts` → `onTelegramMessage` → `gateway-hook` sees `/start` → `handleStart(telegramId, …)` → `db.registerUser` or `db.getUser` → returns string → hook returns `{ directReply: string }` → `bot.ts` sends that string with `sendMessage` (no keyboard).

### 2.6.2 Backend map after automation (new pieces only)

| New/updated piece         | Location                                                          | Responsibility                                                                                                                                                                                     | Data read                                                                     | Data written                                                |
| ------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------- |
| **Lifecycle**             | New: e.g. `src/openjoey/lifecycle.ts` or inside `gateway-hook`    | `getLifecycleStage(userId)` or `getUserLifecycle(userId)`: returns `day1` \| `active` \| `power`.                                                                                                  | `user.created_at`, `watchlist_count`, `favorite_count`                        | —                                                           |
| **Watchlist**             | `supabase-client.ts` + new table `user_watchlist`                 | `getUserWatchlist(userId)`, `addToWatchlist(userId, symbol)`, `removeFromWatchlist`.                                                                                                               | `user_watchlist`                                                              | `user_watchlist`                                            |
| **Favorites**             | `supabase-client.ts` + `user_favorite_skills` or JSONB on `users` | `getUserFavorites(userId)`, `addFavorite`, `removeFavorite`.                                                                                                                                       | `user_favorite_skills`                                                        | `user_favorite_skills`                                      |
| **Skill use count**       | `supabase-client.ts` + `user_skill_use` or JSONB                  | `getSkillUseCount(userId, skill)`, `incrementSkillUse(userId, skill)`.                                                                                                                             | `user_skill_use`                                                              | `user_skill_use`                                            |
| **Keyboard builder**      | New or in `gateway-hook` / Telegram layer                         | `buildStartKeyboard(lifecycle, referralStats?, watchlist?, favorites?)` → Telegram InlineKeyboardMarkup.                                                                                           | Lifecycle + optional referral/watchlist/favorites                             | —                                                           |
| **Hook result extension** | `gateway-hook.ts`                                                 | When `directReply` is set (e.g. for /start), also set `replyMarkup` from keyboard builder (or return it so Telegram layer can attach).                                                             | `getUserLifecycle`, `getUser`, watchlist/favorite counts                      | —                                                           |
| **Telegram send**         | `bot.ts`                                                          | For /start (or when hook returns markup): send message with `reply_markup: keyboard`. After sending **agent** reply: run post-reply logic (see 2.6.4).                                             | —                                                                             | —                                                           |
| **Post-reply trigger**    | `bot.ts` or small OpenJoey helper                                 | After agent reply is sent: (1) If user message looks like token → “Add {symbol} to watchlist?” if not in list. (2) If `skill_used` and use_count === 2 and not favorited → “Favorite this skill?”  | Last user message, `user_watchlist`, `user_skill_use`, `user_favorite_skills` | — (only triggers send of follow-up; callbacks do the write) |
| **Callback handlers**     | `bot.ts` (or OpenJoey callback module)                            | On `callback_query`: `w:add:SYMBOL` → add to watchlist, confirm. `s:fav:skill` → add to favorites, confirm. `m:referral`, `r:share`, etc. → show referral modal or existing getReferralStats text. | `getReferralStats`, `getUserWatchlist`, …                                     | `user_watchlist`, `user_favorite_skills`                    |

No change to: `handleStart` text, `getReferralStats`, `resolveSession`, skill guard, or agent logic. Only additions: lifecycle, storage, keyboard builder, post-reply checks, callbacks.

### 2.6.3 Data flow (step-by-step)

**A. /start (data-driven keyboard)**

1. User sends `/start` (or deep link).
2. `gateway-hook`: calls `handleStart()` → gets welcome **text** (unchanged).
3. **New:** Resolve `userId` (from `getUser(telegramId)`); call `getLifecycleStage(userId)` which reads `user.created_at`, `watchlist_count`, `favorite_count`.
4. **New:** `buildStartKeyboard(stage, …)` builds 3-button (day1) or extended keyboard (active/power) with optional referral line, watchlist strip, My Skills.
5. Hook returns `directReply` + `replyMarkup` (or equivalent so Telegram layer has the keyboard).
6. `bot.ts`: `sendMessage(chatId, directReply, { reply_markup: replyMarkup })`.
7. User sees one message with the right keyboard. No manual step.

**B. Agent reply → “Add to watchlist?” (trigger)**

1. User sent a message (e.g. “SOL” or “Check BONK”); agent ran and reply was sent by `bot.ts`.
2. **New:** Before or after sending that reply, run **post-reply** logic:
   - Read last user message; if it matches token-like pattern (e.g. single ticker or “check TICKER”), extract `symbol`.
   - Query: is `symbol` already in `user_watchlist` for this user? If no → send follow-up message: “Add {symbol} to watchlist for quick access?” with [✅ Yes, add it] [Not now].
3. User taps [Yes] → callback handler runs → `addToWatchlist(userId, symbol)` → DB write; answer callback; send or edit “Added.” Next /start will see watchlist_count ≥ 1 → lifecycle active → show strip.

**C. Agent reply → “Favorite this skill?” (trigger)**

1. Agent reply was produced; we need to know which skill ran. Option A: gateway or skill-guard exposes `skill_used` (e.g. in session or in a return field). Option B: infer (weaker).
2. **New:** When sending the reply, read `skill_used`; call `incrementSkillUse(userId, skill)`; read new count and `isFavorited(userId, skill)`. If count === 2 and not favorited → send follow-up “Favorite this skill?” with [Yes] [No].
3. User taps [Yes] → callback → `addFavorite(userId, skill)` → DB write. Next /start favorite_count ≥ 1 → show My Skills.

**D. Callbacks (read/write)**

- All callback_data (e.g. `w:add:SOL`, `s:fav:meme-guru`, `m:referral`, `r:share`) are handled in Telegram layer. They either **write** (watchlist add, favorite add) or **read** (getReferralStats, getWatchlist) and then send or edit a message. No new business logic; same as today’s commands, triggered by buttons.

### 2.6.4 Trigger → data → outcome (reference table)

Use this to trace why something did or didn’t happen.

| What you see (or don’t)                            | What drives it                                                           | Data to check                                                         | Where it’s computed                          |
| -------------------------------------------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------- | -------------------------------------------- |
| Keyboard is 3 buttons only                         | Lifecycle = day1                                                         | `created_at` under 24h, `watchlist_count` = 0, `favorite_count` = 0   | `getLifecycleStage(userId)`                  |
| Keyboard has referral / watchlist / My Skills      | Lifecycle = active/power; counts ≥ 1 or age over 24h                     | `created_at`, `watchlist_count`, `favorite_count`, referral stats     | `getLifecycleStage`; `buildStartKeyboard`    |
| “Add to watchlist?” never appears                  | Post-reply trigger: token not extracted or symbol already in list        | Last user message (token regex), `user_watchlist`                     | Telegram layer after agent reply             |
| “Add to watchlist?” appears but [Yes] does nothing | Callback handler for `w:add:SYMBOL` not registered or DB error           | Callback handler registration, `addToWatchlist` in DB                 | `bot.ts` (callback_query), `supabase-client` |
| “Favorite this skill?” never appears               | No `skill_used` from gateway, or use_count under 2, or already favorited | `user_skill_use`, `user_favorite_skills`, gateway exposing skill_used | Post-reply trigger; skill-guard or gateway   |
| Referral line missing after 24h                    | Lifecycle still day1 (e.g. counts wrong) or created_at not exposed       | `user.created_at`, lifecycle rule                                     | `getLifecycleStage`                          |
| Watchlist strip empty when user has symbols        | Count not loaded or keyboard built with wrong data                       | `getUserWatchlist(userId).length` or equivalent                       | `buildStartKeyboard`; DB query               |

### 2.6.5 Process summary (how it works end-to-end)

- **Lifecycle:** One function, one place. Input = user + watchlist count + favorite count (+ created_at). Output = day1 | active | power. Called only when building /start (or main menu) reply.
- **Keyboard:** One function that takes lifecycle + optional referral/watchlist/favorites and returns Telegram markup. Used in the same place we send the /start message.
- **Watchlist prompt:** After every agent reply we run a small check: token extracted from last message? symbol not in watchlist? → send follow-up. Callback [Yes] → write DB.
- **Favorite prompt:** When we have skill_used and use_count === 2 and not favorited → send follow-up. Callback [Yes] → write DB.
- **All other UI:** Callbacks only read existing APIs (getReferralStats, getWatchlist, getFavorites) and show modals or text. No new logic.

### 2.6.6 Troubleshooting: connect the dots

When something is wrong, follow this checklist:

| Problem                                          | Check (in order)                                                                                                                                                                                                                                                           |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Wrong keyboard on /start**                     | 1) Is `getLifecycleStage` called with correct `userId`? 2) Are `created_at`, `watchlist_count`, `favorite_count` correct in DB? 3) Is `buildStartKeyboard` receiving the right stage and optional data? 4) Is `reply_markup` actually passed to `sendMessage` in `bot.ts`? |
| **“Add to watchlist?” never shows**              | 1) Is post-reply logic running after agent reply? 2) Is token extraction matching the user’s message (e.g. “SOL”, “Check BONK”)? 3) Is symbol already in `user_watchlist`? 4) Rate limit or “only once per symbol” — did we already show for this symbol?                  |
| **Watchlist strip empty but user added symbols** | 1) Did callback [Yes] call `addToWatchlist` and succeed? 2) On next /start, does `getUserWatchlist(userId)` return rows? 3) Does `buildStartKeyboard` get watchlist and add strip when count ≥ 1?                                                                          |
| **Referral line never shows**                    | 1) Is `created_at` over 24h? 2) Is lifecycle rule “show referral if not day1” (e.g. if age over 24h)? 3) Does keyboard builder add referral row when stage is active/power?                                                                                                |
| **“Favorite this skill?” never shows**           | 1) Is `skill_used` set by gateway/skill-guard when a skill runs? 2) Is `incrementSkillUse` called and count === 2? 3) Is user already in `user_favorite_skills`? 4) Is post-reply logic for favorites running?                                                             |
| **Callback [Yes] / [Share] does nothing**        | 1) Is `callback_query` handler registered for that `callback_data`? 2) Does handler call the right DB method (e.g. `addToWatchlist`)? 3) Any errors in logs (Supabase, network)? 4) Did we call `answerCallbackQuery` so Telegram stops loading?                           |

**Reference: where things live**

- **Lifecycle:** `getLifecycleStage` (new) — input from `users` + `user_watchlist` count + `user_favorite_skills` count.
- **Watchlist:** table `user_watchlist`; read in `getUserWatchlist`, written in `addToWatchlist` (and callback).
- **Favorites:** table or JSONB `user_favorite_skills`; read in `getUserFavorites`, written in `addFavorite` (and callback).
- **Skill use:** table or JSONB `user_skill_use`; read/incremented when agent reply is sent; drives “Favorite?” prompt.
- **Keyboard:** built in one place from lifecycle + referral/watchlist/favorites; attached to /start (and optionally other) messages in `bot.ts`.

---

## 2.7 Scalability & extension points (100x scalable)

**Principle:** Add new capabilities by adding **data + one touchpoint** (allowlist, table, callback prefix, or job type). Core flows (lifecycle, keyboard builder, hook, skill guard) stay generic and never hardcode a growing list of features.

### Adding more skills

| Step                    | Where                               | What to do                                                                                                                                  |
| ----------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Skill implementation | `skills/<skill-id>/`                | Add folder with `SKILL.md` (and tools if needed). Same pattern as existing skills (e.g. `meme-guru`, `whale-guru`).                         |
| 2. Allowlist            | `src/openjoey/session-isolation.ts` | Add skill id to the appropriate array in `getSubscriberAllowedSkills()` (CORE, TRADING, SUBSCRIBER, PREMIUM) or to a future catalog/config. |
| 3. Menu (optional)      | Keyboard builder / category config  | If you use categories for the full menu, add the skill to the right category in **one** place (e.g. config file or skill frontmatter).      |

**No changes needed:** gateway-hook, lifecycle, skill-guard (they already use `getAllowedSkillsForRole` and the allowlist). Favorites and “Favorite this skill?” work for any skill id automatically. To scale further, move the allowlist to a Supabase table or config file and have `getSubscriberAllowedSkills()` read from it so you never touch code to add a skill.

### Adding more auto agents / background jobs

| Approach              | Where                                         | Scalable pattern                                                                                                                                                                                                                   |
| --------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scheduled skills**  | Gateway or separate worker                    | One registry: “these skills can run on a schedule.” Add a new scheduled agent = add skill + register in scheduler config (cron or Supabase pg_cron). No change to Telegram or lifecycle.                                           |
| **Job queue**         | Supabase + worker on Hetzner                  | Table `jobs` (type, payload, status, run_after). Worker process polls or uses Supabase Realtime; dispatches by `type`. New job type = new row type + one handler; no change to core.                                               |
| **Alerts / triggers** | Existing `alerts` + future `alert_deliveries` | Today: price/whale alerts. Tomorrow: new alert types (e.g. news, sentiment) = new columns or table + one delivery path (Telegram, email, etc.). Single “delivery” layer that reads alert config and sends; add type = add handler. |

Keep a single entry point for “run background work” (one cron or one worker reading one queue). New auto agents = new job type or new scheduled skill id, not new processes or new ad-hoc scripts.

### Adding or extending alert systems

We already have: `alerts` table, `getUserAlerts`, `createAlert`, and (e.g.) price/whale conditions. To scale:

| What to add                                             | Where                                                                                                                                               | Touchpoints                                                                                             |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| **New alert type** (e.g. news, sentiment, volume spike) | Supabase: new table or `alert_type` column; `supabase-client.ts`: new method or extend `createAlert`.                                               | One (or two) places. UI/callbacks already use “list my alerts” and “create alert”; they just pass type. |
| **New delivery channel** (e.g. email, push)             | One “delivery” module that reads `alerts` (and maybe `alert_deliveries`) and sends. Add channel = add one sender; same job/worker that runs checks. | Single dispatcher; no change to Telegram flow.                                                          |
| **More conditions**                                     | Extend payload/columns for that alert type. Evaluation logic in one place (skill or worker) that knows how to evaluate each type.                   | Add branch in evaluator + optional UI for that condition.                                               |

So: **one schema for “what alerts exist” and “how they’re delivered”;** new types and channels are additive.

### Adding new user-facing features (strips, buttons, modals)

| Step                              | Pattern                                                                                                                                                                                                                                                                 |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Data                           | New table or columns in Supabase (e.g. `user_xyz`). New methods in `supabase-client.ts`: get/add/remove.                                                                                                                                                                |
| 2. Lifecycle (optional)           | If the feature should affect /start (e.g. show a strip when count ≥ 1), add one **numeric or boolean** to the lifecycle input (e.g. `xyz_count`) and one branch in `buildStartKeyboard`. Keep lifecycle generic: it only needs “counts” and “stage,” not feature names. |
| 3. Callbacks                      | One namespace prefix per feature (e.g. `w:` watchlist, `s:` favorites, `m:` referral, `a:` alerts). New feature = new prefix (e.g. `x:` for xyz) and a small callback router that delegates by prefix. No editing of existing callback handlers.                        |
| 4. Post-reply triggers (optional) | If you want “Add to xyz?” after some agent reply, add one condition in the single post-reply block (e.g. “if message matches pattern and not in user_xyz, show prompt”). One place, one branch.                                                                         |

So: **one new table + one client API + one callback prefix + optional lifecycle count and keyboard branch.** Core stays the same.

### Callback and menu namespacing

Use short prefixes for `callback_data` so new features don’t collide and routing stays one place:

| Prefix | Domain             | Example                                  |
| ------ | ------------------ | ---------------------------------------- |
| `w:`   | Watchlist          | `w:add:SOL`, `w:remove:BONK`, `w:open`   |
| `s:`   | Skills / favorites | `s:fav:meme-guru`, `s:unfav:whale-guru`  |
| `m:`   | Menu / navigation  | `m:research`, `m:alerts`, `m:referral`   |
| `r:`   | Referral           | `r:share`, `r:copy`, `r:details`         |
| `a:`   | Alerts             | `a:create:SOL`, `a:remove:123`, `a:open` |

New feature = new prefix; router in `bot.ts` (or OpenJoey callback module) does `callback_data.startsWith('x:')` and delegates. No growing switch of exact strings.

### Summary: how to keep it 100x scalable

- **Skills:** One allowlist (or catalog) + skills in `skills/`. Add skill = add folder + add id in one place.
- **Auto agents:** One job queue or one scheduler; new type = new handler or new skill id in config.
- **Alerts:** One alerts model + one delivery layer; new type/channel = new table or columns + one handler.
- **New UI features:** One table + one client API + one callback prefix + optional lifecycle count and keyboard branch.
- **Codebase:** Lifecycle, keyboard builder, hook, and skill guard stay generic (they work off data and role, not feature names). All persistent state in Supabase; one `supabase-client.ts` as the only writer/reader for that state.

When something new is needed, ask: “Where is the **one** place I add this?” (allowlist, table, callback prefix, job type.) If the answer is “in 5 files,” refactor so the next time it’s one place.

---

## 3. Proposed Flows & Layouts

### 3.1 `/start` — Progressive Onboarding (Day 1 = 3 Buttons Only)

**Rule:** Don't show features before they're needed. Guide step by step.

**Day 1 (new user): 3 buttons only — first win in one tap.** No empty cards, no referral strip, no watchlist strip.

**Intro (short, name from Telegram):**

```
Hey {FirstName} — I'm Joey. 🦞

I'm your AI trading assistant. I research markets 24/7 so you can focus on execution.

Let's start with something simple:

[🔍 Check a Token]  [📊 Market Overview]  [❓ Ask Anything]

💡 Try: "What's happening with SOL?" or "Find new meme coins"
```

- **Name:** From Telegram `from.first_name` (or `username` / "trader" fallback).
- **After first use (e.g. checked SOL):** "Nice! Want to save SOL to your watchlist for quick access?" [✅ Yes, add it] [Not now]. Build watchlist from usage.

**Active user (3+ sessions or 24h+):** Show watchlist strip only when 1+ symbols. Offer "⭐ Favorite this skill?" after 2nd use of same skill. Show referral after ~24h (one line; see below).

**Power user / subscriber:** Full menu = **3–4 grouped cards** (Research, Trading, Alerts & Tracking), then drill down. Show My Skills / Watchlist strip only if they have content.

**Day 1 layout (intro + 3 buttons only):**

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                    NEW USER: /start (Day 1 — 3 Buttons Only)                  │
├───────────────────────────────────────────────────────────────────────────────┤
│   Hey Sora — I'm Joey. 🦞                                                     │
│   I'm your AI trading assistant. I research markets 24/7 so you can focus    │
│   on execution.                                                               │
│                                                                               │
│   Let's start with something simple:                                         │
│                                                                               │
│   [🔍 Check a Token]  [📊 Market Overview]  [❓ Ask Anything]                  │
│                                                                               │
│   💡 Try: "What's happening with SOL?" or "Find new meme coins"               │
└───────────────────────────────────────────────────────────────────────────────┘
```

**Power-user menu (when we show full menu):** 3–4 grouped cards, then drill down — not 8 cards at once. Example: 🔍 RESEARCH [Go →] | 📊 TRADING [Go →] | 🔔 ALERTS & TRACKING [Go →]. Tap [Go →] opens that category's skills in a modal.

**Referral (when we show it, e.g. after 24h):** One line. If $0: "💰 Refer friends → earn credit" [📤 Get Link]. If earnings: "💰 Referral earnings: $12.60" [📤 Share] [Details].

**Watchlist:** Don't show card/strip until 1+ symbols. Build from "Add SOL to watchlist?" after they check a token.

- Tapping a card opens a **modal** (slide up to ~80% of chat) with that category’s skills or actions.
- **⭐ MY SKILLS** → Favorite skills (empty at first; CTA to browse and add). See §3.3.
- **📋 WATCHLIST** → Tokens, stocks, penny stocks you're watching; one-tap Check or Alert. See §3.7.
- **💰 EARN** → Referral modal (stats, link, share). See §3.6.
- **Referral strip:** Always visible on /start: “$X.XX earned” (from `referral_leaderboard.current_balance` or `total_earned`). Zero referrals = “$0.00 — Share to earn”. [📤 Share] copies/shares link; [📊 More] opens full referral modal.
- **Watchlist strip:** Always visible: first few symbols (e.g. SOL · BONK · AAPL) + count + [📋 Open] [➕ Add]. Empty = "No symbols yet" + [Add]. Puts your tokens/stocks one tap away.

### 3.2 Skill Discovery: `/skills` (Category Menu)

```
┌───────────────────────────────────────────────────────────────────────────────┐
│ 📚 All Skills (tap to use, ⭐ to favorite)                                    │
│                                                                               │
│ 🔥 POPULAR                                                                   │
│ │ meme-guru (⭐)   alert-guru   whale-guru   research-guru   signal-guru     │
│                                                                               │
│ 📊 TRADING                                                    [View All →]   │
│ │ stock-guru   forex-guru   commodity-guru   options-guru   trading-god-pro  │
│                                                                               │
│ 🔍 RESEARCH / CRYPTO                                            [View All →]   │
│ │ crypto-guru   meme-guru   dex-scanner   market-scanner   news-alerts       │
│                                                                               │
│ 🐋 & MORE                                                                     │
│ │ whale-guru   alert-guru   sentiment-tracker   correlation-tracker   …      │
│                                                                               │
│ ⭐ = Your favorites  |  Tap skill → use  |  Tap ⭐ → toggle favorite          │
│ [🔙 Back]  [⭐ My Favorites]  [🏠 Main]                                       │
└───────────────────────────────────────────────────────────────────────────────┘
```

- Inline keyboard: one row per category (or paginated); each button = skill name + optional ⭐.
- `callback_data` examples: `skill:use:meme-guru`, `skill:fav:meme-guru`.

### 3.3 My Favorites: `/favorites` or ⭐ MY SKILLS

```
┌───────────────────────────────────────────────────────────────────────────────┐
│ ⭐ Your Favorite Skills                                                       │
│ The AI will prioritize these when you ask questions.                         │
│                                                                               │
│ 1. meme-guru     "Research trending meme coins"     [🚀 Use] [⚙️] [🗑️]       │
│ 2. whale-guru    "Track whale wallet movements"     [🚀 Use] [⚙️] [🗑️]       │
│ 3. alert-guru    "Set price and volume alerts"      [🚀 Use] [⚙️] [🗑️]       │
│                                                                               │
│ [+ Add More]  [🔙 Back]  [🏠 Main]                                            │
│ 💡 Your favorites help the AI understand what you care about.                  │
└───────────────────────────────────────────────────────────────────────────────┘
```

- Stored in user profile (see Data Model below).
- **Use** → start a reply with that skill in context; **Settings** → optional per-skill prefs; **Remove** → unfavorite.

### 3.4 Individual Skill: e.g. `/meme-guru` (Detail View)

```
┌───────────────────────────────────────────────────────────────────────────────┐
│ 🐸 meme-guru                                                                  │
│ Research trending meme coins, sentiment, new launches on Solana.               │
│ ✅ Free API  |  ⚡ Real-time  |  🔄 Cached                                    │
│                                                                               │
│ [🔥 Find Trending]  [🔍 Search Token]  [📊 Sentiment]  [🆕 New Launches]       │
│ ⭐ In favorites                                                                 │
│ [🔙 Skills]  [🏠 Main]  [❓ Help]                                              │
└───────────────────────────────────────────────────────────────────────────────┘
```

- Shown when user taps a skill from /skills or from a category card.
- Optional: “Add to favorites” / “Remove from favorites” inline button.

### 3.6 Referral — One Line, Conditional (Simplified)

**When to show:** After ~24h or 3+ sessions; not day 1. **If $0:** “💰 Refer friends → earn credit” [📤 Get Link]. **If earnings:** “💰 Referral earnings: $12.60” [📤 Share] [Details]. Full modal on [Details] only.

**Optional (power-user):** Inline mini card when we show referral:

```
┌─────────────────────────────────────────────────────────────────────┐
│ 💰 Your referral earnings  │  $12.60 earned  │  [📤 Share] [📊 More] │
└─────────────────────────────────────────────────────────────────────┘
```

- **Copy:** “$12.60 earned” (use `total_earned` from `referral_leaderboard`; if no stats, show “$0.00 — Share to earn”).
- **📤 Share** → Copy link to clipboard or open share sheet (Telegram: send the referral link in a new message, or use a t.me link with ref).
- **📊 More** → Open referral modal (same as tapping 💰 EARN).

**Full Referral Modal (tap 💰 EARN or 📊 More):**

```
┌───────────────────────────────────────────────────────────────────────────────┐
│ 💰 Referral Program                                                           │
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  EARNED SO FAR                                                       │   │
│   │  $12.60                                                             │   │
│   │  (applied to your subscription)                                     │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│   📊 Stats                                                                   │
│   • Total referrals: 7                                                      │
│   • Converted (subscribed): 5                                                │
│   • Current balance: $9.00                                                   │
│                                                                               │
│   How it works:                                                             │
│   • You get $1.80 per referred subscriber                                   │
│   • They get $1.20 off their first month                                     │
│   • Refer 6 friends ≈ free month                                             │
│                                                                               │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  Your link  (tap to copy)                                            │   │
│   │  https://t.me/OpenJoeyBot?start=ABC123                               │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│   [📤 Share Link]  [📋 Copy]  [🔙 Back]  [🏠 Main]                            │
└───────────────────────────────────────────────────────────────────────────────┘
```

- **Data source:** Same as current `/referral`: `getReferralStats(user.id)` → `total_referrals`, `converted_referrals`, `total_earned`, `current_balance`; `user.referral_code` for the link.
- **Empty state (no referrals yet):** Show “$0.00 earned” and “No referrals yet — share your link to start!” with the same link and [Share] / [Copy]. Don’t hide the card.
- **UX win:** One tap from main menu to see earnings and share; no need to remember /referral.

### 3.7 Watchlist & Alerts (Build from Usage — Don't Show Empty)

**When to show:** Only when user has **1+ symbols** in watchlist. Do not show empty watchlist card or strip on day 1. **Build from usage:** After they check a token (e.g. SOL), prompt "Add SOL to watchlist for quick access?" [✅ Yes, add it] [Not now]. Then show strip/card.

**Why:** Users track tokens (SOL, BONK), stocks (AAPL), penny stocks. Watchlist card and strip put them in one place: tap to open, then one-tap "Check SOL" or "Set alert".

**Watchlist strip (when 1+ symbols):**

- Shows up to 5–6 symbols + total count, e.g. `SOL · BONK · AAPL (3)` or `SOL, BONK, WIF, AAPL, PENNY (5)`.
- [📋 Open] → full Watchlist modal. [➕ Add] → "Send a symbol to add (e.g. SOL or AAPL)" or open a small "Add symbol" flow.
- Empty state: "No symbols yet — add tokens or stocks to check them in one tap" + [➕ Add].

**Full Watchlist Modal (tap 📋 WATCHLIST or [📋 Open]):**

```
┌───────────────────────────────────────────────────────────────────────────────┐
│ 📋 Your Watchlist                                                             │
├───────────────────────────────────────────────────────────────────────────────┤
│ One-tap to check or set alerts. Grouped so you find things fast.              │
│                                                                               │
│ 🪙 TOKENS (crypto)                                                            │
│ │ SOL      [📊 Check] [🔔 Alert] [🗑️]   BONK    [📊 Check] [🔔 Alert] [🗑️]   │
│ │ WIF      [📊 Check] [🔔 Alert] [🗑️]   JUP     [📊 Check] [🔔 Alert] [🗑️]   │
│                                                                               │
│ 📈 STOCKS                                                                     │
│ │ AAPL     [📊 Check] [🔔 Alert] [🗑️]   NVDA    [📊 Check] [🔔 Alert] [🗑️]   │
│                                                                               │
│ 📉 PENNY / SCANNER                                                            │
│ │ (symbols from penny-stock-scanner or saved low-cap)                         │
│ │ XYZ      [📊 Check] [🔔 Alert] [🗑️]                                        │
│                                                                               │
│ 🔔 ACTIVE ALERTS (2)                                            [View all →]  │
│ │ SOL above $200   BONK below $0.00002   [Check] [Edit] [Off]                 │
│                                                                               │
│ [➕ Add token or stock]  [🔙 Back]  [🏠 Main]                                  │
└───────────────────────────────────────────────────────────────────────────────┘
```

- **📊 Check** → Send "Check SOL" (or that symbol) so the AI runs analysis with the right skill (e.g. meme-guru, crypto-guru, stock-guru). One tap instead of typing.
- **🔔 Alert** → Open alert-guru flow for that symbol (or "Set alert for SOL").
- **🗑️** → Remove from watchlist.
- **Grouping:** Tokens (crypto), Stocks, Penny / scanner — so tokens, stocks, and penny stocks are easy to find. Type can come from a `watchlist.type` field or be inferred (e.g. known crypto list vs stock tickers).
- **Active alerts:** Optional section at bottom: list from `getUserAlerts(userId)` with [Check] [Edit] [Off]. Or a single "🔔 2 active alerts" row that opens /alerts or an alerts modal.
- **Data:** New table `user_watchlist`: `user_id`, `symbol`, `type` (crypto_token | stock | penny_stock), `added_at`. Alerts already exist (`alerts` table); reuse for "Active alerts" section.
- **Empty state:** "Your watchlist is empty. Add tokens (e.g. SOL, BONK) or stocks (e.g. AAPL) to check them in one tap." [➕ Add symbol].

**Adding to watchlist:**

- From modal: [➕ Add token or stock] → bot replies "Send a symbol to add (e.g. SOL, BONK, AAPL)" → user sends "SOL" → add to watchlist and confirm.
- Optional: When user says "Check SOL" or "Set alert for BONK", offer "Add SOL to your watchlist?" with [Yes] [No] so the list grows from usage.

**UX win:** All favorite skills, watchlist symbols, and alerts live on /start or one tap away. No more "what was that symbol?" or retyping — 100x easier.

### 3.5 Modal Behavior (Target)

- **“Clicking any tab opens a modal upwards to ~80% of the chat screen.”**
- In Telegram this is approximated by:
  - **Option A:** Edit the same message to show the “modal” content (new text + new inline keyboard), with a “🔙 Back” that restores previous view.
  - **Option B:** Send a **new** message with the detail content and keyboard, so the thread scrolls and the new block acts like a “sheet” (no true 80% overlay in Telegram, but same UX idea).
- Prefer **Option A** where possible to avoid flooding the chat; use **Option B** for long content or when we want to keep history.
- **Referral modal** uses the same pattern: tap 💰 EARN or 📊 More → edit message to show referral content + [Share] [Copy] [Back].

---

## 4. Data Model: User Favorites

Store in the **existing OpenJoey user profile** (Supabase). No new tables required if we add a JSONB column; otherwise a small `user_favorite_skills` table.

### 4.1 Option A: Column on `users`

```text
users:
  id, telegram_id, username, display_name, role, tier, ...
  favorite_skills JSONB   -- array of { skill_name, category, added_at, usage_count, last_used, settings }
```

### 4.2 Option B: Separate table

```text
user_favorite_skills:
  user_id (FK users)
  skill_name (e.g. meme-guru, whale-guru)
  category (e.g. trading, research)
  added_at
  usage_count, last_used
  settings JSONB (optional per-skill prefs)
```

### 4.3 Favorite record shape (for AI + UI)

```json
{
  "skillName": "meme-guru",
  "category": "trading",
  "addedAt": "2025-02-10T08:30:00Z",
  "usageCount": 42,
  "lastUsed": "2025-02-10T14:20:00Z",
  "settings": {
    "defaultChain": "solana",
    "minMarketCap": 10000,
    "alertThreshold": 0.05
  }
}
```

### 4.4 AI context (optional, can be derived)

- `preferredCategories`, `tradingStyle`, `riskTolerance`, `preferredChains`, `lastActiveSkills` can be computed from favorites + usage or stored in profile for speed.

### 4.5 Watchlist (tokens, stocks, penny stocks)

- **New table `user_watchlist`:** `user_id`, `symbol` (e.g. SOL, AAPL), `type` (crypto_token | stock | penny_stock), `added_at`. Unique on (user_id, symbol). Enables the Watchlist card and strip; "Check" sends that symbol to the AI, "Alert" opens alert-guru for it.
- **Existing `alerts`:** Use for "Active alerts" section in the Watchlist modal (`getUserAlerts(userId)`). No new table for alerts.
- **Optional:** Infer `type` from symbol (e.g. known crypto list vs stock tickers) instead of storing it, to keep add-flow simple.

---

## 5. Telegram Bot API: Menus

- Use **InlineKeyboardMarkup** for all cards and modals (no ReplyKeyboard for this flow, to avoid “keyboard stuck” and to support callbacks).
- **callback_data** max 64 bytes; use short prefixes:
  - `m:main` | `m:research` | `m:alerts` | `m:trading` | `m:whales` | `m:fav` | `m:referral` | `m:help`
  - `s:use:<skill>` e.g. `s:use:meme-guru`
  - `s:fav:<skill>` to toggle favorite
  - `s:detail:<skill>` for skill detail view
  - `r:share` | `r:copy` | `r:more` for referral card (share link, copy, open full modal)
- `w:open` | `w:add` for watchlist strip (open modal, add symbol)
- `w:check:<symbol>` | `w:alert:<symbol>` | `w:remove:<symbol>` for watchlist modal (symbol truncated if needed to fit 64 bytes)
- **ReplyKeyboard** can still be used for a persistent “Menu” or “⭐ Favorites” button if desired (as in your screenshot).

---

## 6. AI Integration: Using Favorites

- When building the **system prompt** or **skill filter** for a user:
  - Load `user.favoriteSkills` (or equivalent).
  - **Prioritize** favorite skills in the list passed to the model (e.g. list favorites first with a “prefer these” note).
  - Optionally inject **skill settings** (e.g. default chain, min market cap) into the prompt or tool defaults.
- In **gateway-hook** / **skill-guard**: we already have `allowedSkills` by role; we can **merge** with favorites so that:
  - For subscribers: allowed set = intersection(role allowlist, all skills); ordering or “preferred” = favorites.
  - For admins: allow all; ordering = favorites first.

No need to change the guard logic for “allowed”; only add “preferred” for routing and prompt.

---

## 7. API Endpoints (if we add a small API layer)

- `GET /api/users/me/favorites` — list favorites (or derive from Supabase from Telegram ID).
- `POST /api/users/me/favorites` — add favorite (body: `skillName`, `category`, `settings?`).
- `DELETE /api/users/me/favorites/:skillName` — remove.
- `PATCH /api/users/me/favorites/:skillName/settings` — update settings.
- `POST /api/users/me/favorites/:skillName/use` — track use (usageCount++, lastUsed).

Alternatively, all of this can be done inside the bot (Supabase client) without a separate HTTP API.

---

## 8. User Flows (Short)

- **New user:** /start → main menu → tap category → skill list (modal) → tap skill to use or ⭐ to favorite.
- **Returning:** /start or /favorites → ⭐ MY SKILLS → one-tap “Use” for a favorite.
- **Discovery:** /skills → browse by category → tap to use or star.
- **Watchlist:** /start → watchlist strip (symbols + [Open] [Add]) → open modal → grouped tokens/stocks/penny → [Check] sends that symbol to AI; [Add] adds new symbol. One tap to find anything.
- **Referral:** /start → referral card shows “$X.XX earned” → tap [📤 Share] or [📊 More] → share link or open full referral modal (stats, copy link). No need to type /referral.
- **AI:** User says “Find me new memes” → AI sees meme-guru in favorites → uses meme-guru first and can prefill from favorite settings.

---

## 9. Brainstorm: 1000x Better, 100x User-Friendly

Below are concrete ideas to make this design significantly better and easier to use.

### 9.1 Reduce Friction

- **First-run:** After welcome, one tap to “See my skills” (empty state: “Add your first favorite”) with a single “Browse skills” button. Don’t show the full grid until they’ve chosen at least one favorite or one category.
- **Zero-tap for power users:** If the user has 1–3 favorites, consider a **persistent reply keyboard** with exactly those 3 (e.g. “meme-guru | whale-guru | alert-guru”) so they never need to open a menu.
- **Quick re-use:** After a skill runs, append inline buttons: “🔄 Again” and “⭐ Favorite” so the next action is one tap.

### 9.2 Modal and Navigation

- **Consistent “Back”:** Every modal/sheet has exactly one “🔙 Back” that returns to the previous view (main → category → skill detail). Store a tiny stack in callback_data or in a single “state” key (e.g. `prev=main`) so we can edit the message and show the previous keyboard.
- **Breadcrumb in message:** In the message text, add a short line like “Main → Research → meme-guru” so users always know where they are.
- **80% “modal”:** Since Telegram doesn’t have real modals, treat “modal” as: one message that we **edit** to show the new content + new keyboard. That way one message is the “current screen” and we don’t spam the chat.

### 9.3 Favorites and Personalization

- **Smart defaults:** First time a user uses a skill (e.g. meme-guru), ask once: “Add meme-guru to your favorites for quicker access?” with [Yes] [No]. If Yes, add and show a short “You can change this in ⭐ My Skills.”
- **Favorites cap:** Allow e.g. 5–10 favorites so the “⭐ MY SKILLS” view stays scannable; “Add More” opens /skills with a badge “X/10 used.”
- **Usage = preference:** Automatically suggest adding to favorites after N uses (e.g. 3) of the same skill in a session or week.
- **Per-skill settings:** Only show “⚙️ Settings” for skills that declare optional config (e.g. in SKILL.md or a small schema); keep the rest as “Use” and “Remove” only.

### 9.4 Copy and Onboarding

- **One line per skill in menus:** Under each skill name, one short line from SKILL.md description (e.g. “Research trending meme coins”). Same in /skills and in skill detail.
- **Role-aware wording:** For subscribers, don’t show skills they can’t use; in “Help” mention “You have access to trading, research, and chat skills” so they don’t try unavailable ones.
- **First favorite:** Empty state for ⭐ MY SKILLS: “Add skills you use most — the AI will prioritize them. Tap below to browse.”

### 9.5 Performance and Reliability

- **Callback timeout:** Answer every `callback_query` with `answerCallbackQuery` within a few seconds (e.g. “Loading…” or “Done”) so Telegram doesn’t show a loading spinner forever.
- **Edit vs send:** Prefer editing the same message for “modal” updates to avoid duplicate menus; only send a new message when we’re showing a result (e.g. “Used meme-guru: …”) or long text.
- **Pagination:** If we have 20+ skills, show 6–8 per screen with “Next” / “Prev” and optional “Jump to category.”

### 9.6 Delight and Clarity

- **Emoji per skill:** Use the same emoji we have in SKILL.md (e.g. 🐸 for meme-guru) in the menu so skills are recognizable at a glance.
- **Categories match codebase:** Group skills by the same categories we use for role allowlist (e.g. trading, research, whale/flow) so the menu mirrors what the AI can do.
- **“What can you do?”:** A single /help or “❓ Help” that shows: (1) short blurb, (2) “Your favorites: …” if any, (3) “All skills: /skills” and “Main menu: /start.”

### 9.7 Accessibility and Locale

- **Short callback_data:** Keep payloads under 64 bytes; use abbreviations (m:, s:use:, s:fav:) and short skill slugs.
- **No critical info in image only:** Any important instruction (e.g. “Tap ⭐ to favorite”) should be in the message text as well.
- **Future i18n:** Store UI strings in a small map (e.g. en: { mainMenu: "Main", favorites: "My Skills" }) so we can add another language later without scattering strings.

### 9.8 Metrics (for later)

- Track: favorites add/remove, skill use from menu vs free text, “Again” and “Favorite” tap rate. Use this to simplify the default path (e.g. show only top 3 categories on first screen).

### 9.9 Referral UX (100x Better)

- **Always show the number:** The referral card on /start must always display “$X.XX earned” (or “$0.00 — Share to earn”). Never hide earnings behind a command; visibility drives sharing.
- **One-tap share:** [📤 Share] should open the system share sheet or send the referral link in a way that’s one tap to forward (e.g. pre-filled message: “Join me on OpenJoey — you get $1.20 off: <link>”). Avoid “copy then open another app.”
- **Celebrate milestones:** When `total_earned` crosses a threshold (e.g. $5, $10, first converted referral), optionally send a short follow-up: “You’ve earned $5 in referrals! Share again?” with [Share] button. Don’t overdo it.
- **Explain in one line in the modal:** “You get $1.80, they get $1.20 off. Refer 6 ≈ free month.” Keep the full modal scannable; link to full terms elsewhere if needed.
- **Current balance vs total earned:** Show both in the modal (total_earned = all-time; current_balance = available to apply). Reduces support questions (“Where’s my $?”).
- **Empty state is still a CTA:** $0.00 earned + “No referrals yet — share your link to start!” + [Share] [Copy]. Same card, same position; no shame, just invitation.

### 9.10 Watchlist and "My Stuff" UX (100x Easier to Find Things)

- **One place for "my" things:** Favorite skills (⭐ MY SKILLS), watchlist (📋 tokens/stocks/penny), and active alerts (🔔) all surface on /start or one tap. Users don't search or remember symbols — they see them.
- **Group by type:** In the Watchlist modal, group tokens (crypto), stocks, and penny/scanner symbols so traders find the right list fast. Optional labels: TOKENS, STOCKS, PENNY.
- **Cap watchlist size:** e.g. 20–30 symbols so the modal stays scannable; "Add" can suggest removing an old one if at cap.
- **Add after use:** When user says "Check SOL" or "Set alert for BONK", prompt once: "Add SOL to your watchlist for one-tap access?" [Yes] [No]. Grows the list from real usage.
- **Check = one tap:** [📊 Check] sends "Check SOL" (or that symbol) so the AI runs the right skill. No typing. Same for [🔔 Alert] → prefill alert for that symbol.
- **Alerts section in same modal:** Show "Active alerts (N)" inside the Watchlist modal so users see alerts and watchlist together. Fewer places to look.

---

## 10. Quick Wins to Implement First

1. **Simplify /start to 3 buttons** for new users: [🔍 Check a Token] [📊 Market Overview] [❓ Ask Anything]. Short intro only; no 8 cards, no empty strips.
2. **Contextual "Add to watchlist?"** after first token check — [✅ Yes, add it] [Not now]. Build watchlist from usage.
3. **"Favorite this skill?"** after 2nd use of the same skill. Show My Skills only when they have 1+ favorite.
4. **Hide referral for first 24 hours** (or 3+ sessions). Then one line: $0 → [Get Link]; earnings → amount + [Share] [Details].
5. **Progressive menu:** Day 1 = 3 buttons; active = add watchlist/favorites when they have content; power user = 3–4 grouped cards, drill down.

---

## 11. Next Steps (Full Build)

When adding storage, callbacks, or new features, follow the **one-place pattern** in §2.7 so the system stays 100x scalable.

1. **Decide storage:** Add `favorite_skills` (or table) to OpenJoey user profile in Supabase; implement get/add/remove/update in existing code (e.g. next to `registerUser` / `getUser`).
2. **Implement /start menu:** Replace or extend current welcome with inline keyboard (main menu); handle `callback_query` for `m:research`, `m:alerts`, etc., and show “modal” by editing the same message.
3. **Implement /skills:** List skills by category (from `getSubscriberAllowedSkills()` or full list for admin), with ⭐ toggle; persist favorites on toggle.
4. **Implement /favorites:** List user’s favorites with Use / Settings / Remove; “Add More” → same view as /skills.
5. **Wire AI:** When building the prompt or skill list for a session, load user favorites and put them first; optionally inject favorite settings into tool defaults.
6. **Referral card + modal:** On /start, add the inline referral row (earned amount + [Share] [More]). Handle `m:referral` and `r:share` / `r:copy` / `r:more`; full referral modal uses existing `getReferralStats()` and `user.referral_code`. Keep /referral as a text fallback.
7. **Watchlist card + strip + modal:** Add `user_watchlist` table (user_id, symbol, type). On /start, watchlist strip (symbols + [Open] [Add]). Tap 📋 WATCHLIST or [Open] → full modal: tokens / stocks / penny grouped, [Check] [Alert] [Remove] per symbol; optional "Active alerts" section. Handle `w:open`, `w:add`, `w:check:<sym>`, `w:alert:<sym>`, `w:remove:<sym>`. Optional: "Add to watchlist?" after "Check SOL" or "Set alert".
8. **Polish:** Breadcrumbs, one-line descriptions, emoji, “Add to favorites?” after first use, and referral milestone nudge, watchlist "Add after use" prompt.

---

## 12. Doc History

- Created from design brainstorm: card-style menus, favorites, modal-up behavior, AI prioritization.
- All skill names and categories aligned with `session-isolation.ts` and `skills/` in the repo.
- Added referral card and modal; special cards for "my stuff" (favorite skills, watchlist, active alerts).
- **Revised for 100x simpler UX:** Progressive disclosure (day 1 = 3 buttons only), no empty states, referral/watchlist/favorites revealed after use or 24h. Quick wins and simplified referral/watchlist wording.
- **Backend map & automation reference (§2.6):** Current and post-automation backend map (files, data read/written), step-by-step data flows (/start, post-reply triggers, callbacks), trigger→data→outcome table, and troubleshooting checklist so the entire process and how it works are documented for ref and debugging.
- **Storage & infrastructure (§2.6.0):** Where to save data and how the stack works together: Vercel (frontend, no persistent data), Supabase (single source of truth for all tables), Hetzner (gateway/bot runtime, all reads/writes to Supabase). Table of which data lives where and references to live checklist and admin Vercel docs.
- **Scalability & extension points (§2.7):** 100x scalable design: adding skills (one allowlist + skills/), auto agents (one job queue or scheduler), alert systems (one schema + delivery layer), new UI features (one table + one callback prefix). Callback namespacing (w:, s:, m:, r:, a:) and “one place to add” principle so core flows stay generic.
