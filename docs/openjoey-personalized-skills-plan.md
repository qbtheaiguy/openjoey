# OpenJoey Personalized Skills – Plan

**Goal:** Subscribers see only the skills we sell (trading + research). New users get 3 skills by default; the rest are à la carte. No coding/app-building capability for OpenJoey users (cost and product control).

---

## 1. Product intent

- **Selling:** Trading skills (signals, analysis, alerts, whale tracking, meme/alpha, research). Not coding, app building, or generic OpenClaw power.
- **Default:** Every user gets **3 skills** out of the gate (e.g. Signal Fusion, Trading God, Price Alerts).
- **À la carte:** User can add more from the catalog (e.g. Meme Lord, Whale Tracker, Gold/Options analysis, Research). Stored per user; enforced server-side.
- **Cost control:** At 10k subscribers, only the allowed skill set runs per user. No accidental exposure of expensive capabilities (e.g. coding-agent, canvas).

---

## 2. OpenJoey skill catalog (allowlist)

Only these skills are ever offered or run for OpenJoey Telegram users. Everything else is hidden.

| Skill ID       | Name / description      | Default (in 3) | À la carte  |
| -------------- | ----------------------- | -------------- | ----------- |
| signal-fusion  | Signal Fusion           | ✅             | —           |
| trading-god    | Trading God             | ✅             | —           |
| price-alerts   | Price Alerts            | ✅             | —           |
| whale-tracker  | Whale Tracker           | —              | ✅          |
| meme-lord      | Meme Lord               | —              | ✅          |
| research       | Research (future)       | —              | ✅          |
| (gold/options) | Gold / options analysis | —              | ✅ (future) |

**Not in catalog (never exposed):** coding-agent, canvas, github, notion, discord, etc. Server only ever passes catalog skills in `skillFilter`.

---

## 3. Data model

**Option A – Column on `users` (simplest for v1):**

- `users.allowed_skills text[]` – full list of skill IDs for this user (default 3 + add-ons).
- On first message / registration: set `allowed_skills = ['signal-fusion','trading-god','price-alerts']`.
- When user “adds” a skill (via /skills): append to `allowed_skills` (and optionally Stripe/entitlement check).

**Option B – Separate table (flexible for pricing/audit):**

- `user_skills (user_id, skill_id, source, added_at)`
  - `source`: `'default'` | `'subscription'` | `'add_on'`
- Default 3 inserted on registration; à la carte inserts with `source = 'add_on'`.
- Resolve allowed list: `SELECT skill_id FROM user_skills WHERE user_id = ?`.

Recommendation: **Option A** for speed to ship; migrate to Option B if you need per-skill pricing or audit history.

**Enforcement:** Gateway always resolves `skillFilter` for OpenJoey DMs from DB (tier + `allowed_skills`), never from global config. Only skill IDs in the catalog are allowed; unknown IDs are dropped.

---

## 4. Code flow (current vs target)

**Current:**

- Hook returns `allowedSkills: getAllowedSkills(session.tier)` (tier-based list).
- `allowedSkills` is **not** passed into the message context.
- `skillFilter` in context comes from topic/group config only; for DMs it’s `undefined`, so the agent can fall back to global config and see all skills.

**Target:**

1. **OpenJoey DM:** `skillFilter = hookResult.allowedSkills` (from Supabase: default 3 + user’s à la carte). Only catalog IDs; filter out any non-catalog before passing.
2. **Non-OpenJoey / groups:** Unchanged (topic/group config or global agent config).

So: add `skillFilterOverride` to the Telegram context options; when the OpenJoey hook runs, pass `hookResult.allowedSkills` into that override. In the context builder, use `skillFilter = firstDefined(options?.skillFilterOverride, topicConfig?.skills, groupConfig?.skills)`.

**Session-isolation / gateway-hook:** Keep returning `allowedSkills`. Later, replace the tier-only list with a DB-backed list: default 3 + `users.allowed_skills` add-ons, all intersected with the catalog.

---

## 5. UX – /skills and selection

**/skills command (in Telegram):**

1. **“Your skills”** – list the user’s current skills (default 3 + à la carte) with short labels.
2. **“Available to add”** – catalog skills not yet added, with one-line description and “Add” (or “Included in Premium”).
3. **Add flow:** “Add Meme Lord” → if allowed by tier/subscription, update `users.allowed_skills` and reply “Done. You now have Meme Lord.” If paywall: “Subscribe to add this skill” or “Add for $X/month.”

**Discovery:**

- Welcome / onboarding: “You have 3 skills: Signal Fusion, Trading guru, Price Alerts. Use /skills to see all and add more.”
- After first analysis: “Use /skills to add Whale Tracker or Meme Lord.”

**No separate web dashboard required for v1** – selection and “add” can live in Telegram only.

---

## 6. Implementation phases

**Phase 1 – Enforce tier-based skills (quick win)**

- Pass `hookResult.allowedSkills` into Telegram context as `skillFilterOverride`.
- In context builder: `skillFilter = firstDefined(options?.skillFilterOverride, topicConfig?.skills, groupConfig?.skills)`.
- Ensure `getAllowedSkills(tier)` returns only catalog skills (align with table above).
- **Outcome:** OpenJoey DMs only see tier-based list; no coding-agent etc.

**Phase 2 – Default 3 + catalog in code**

- Define `OPENJOEY_SKILL_CATALOG` and `OPENJOEY_DEFAULT_SKILLS` (3 IDs).
- `getAllowedSkills(tier)` for new users returns default 3; for paid tiers add more from catalog as today (or keep tier-based for now).
- Resolve `skillFilter` = intersection(user list, catalog).
- **Outcome:** Single source of truth for “what OpenJoey can run.”

**Phase 3 – DB-backed per-user skills**

- Add `users.allowed_skills` (or `user_skills` table).
- On registration: set default 3.
- Hook: load user → `allowed_skills = user.allowed_skills ?? default 3`; filter by catalog; return as `allowedSkills`.
- **Outcome:** Each user has an explicit list; no longer purely tier-based.

**Phase 4 – /skills command and à la carte**

- Implement /skills: show “Your skills” and “Available to add”; “Add” updates DB (and optionally Stripe).
- **Outcome:** Good UX for personalized skills; à la carte add-ons possible.

---

## 7. Summary

- **Catalog:** Trading + research only; no coding/app-building skills for OpenJoey.
- **Default:** 3 skills for everyone; rest à la carte.
- **Data:** `users.allowed_skills` (or `user_skills`) + catalog allowlist in code.
- **Enforcement:** `skillFilter` for OpenJoey DMs always from DB/catalog; never global full list.
- **UX:** /skills in Telegram to see and add skills; onboarding mentions “3 skills” and /skills.

Implementing Phase 1 (wire `allowedSkills` → context) gives immediate enforcement with the current tier-based list; Phases 2–4 add catalog, per-user list, and /skills UX.
