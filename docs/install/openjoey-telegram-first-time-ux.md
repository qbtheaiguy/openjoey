# OpenJoey: First-Time User UX (No Pairing Message)

## The problem

When a new user taps **Start on Telegram** and opens @OpenJoey_bot, they see:

```
OpenClaw: access not configured.
Your Telegram user id: 7699130589
Pairing code: YNFCGCT8
Ask the bot owner to approve with:
openclaw pairing approve telegram <code>
```

That is **bad UX**. We want new users to see a **welcome message** that explains who Joey is and what it can do, and we want the backend to treat them as a new user (register, trial, guardrails).

## Why it happens

The OpenClaw gateway uses a **DM policy** for Telegram:

- **`dmPolicy: "pairing"`** (default): Only users who have been “approved” (via `openclaw pairing approve telegram <code>`) can use the bot. Everyone else gets the pairing message above and never reaches the OpenJoey logic.
- So the **welcome message** (and registration) in OpenJoey never runs for first-time users, because they are blocked earlier in the pipeline.

## The fix (plain English)

**Let everyone into DMs for OpenJoey.**

- Set the Telegram channel so that **private chats are open** — no pairing required. Then when someone opens the bot or sends `/start`, the gateway does **not** show the pairing message. The message goes to the OpenJoey hook.
- The OpenJoey hook already:
  1. **Registers** new users in Supabase (`resolveSession` → `registerUser`).
  2. Sends the **welcome message** for `/start` (who Joey is, trial, commands, referral).
  3. Logs **new user** (e.g. `user_registered` in usage_events).
- **User count:** You get it from the **Supabase `users` table** (e.g. `SELECT COUNT(*) FROM users` or your dashboard).
- **New-user guardrails:** The backend already treats “no user in DB” as new user → register → trial start; you can add more guardrails in the same place if needed.

So the only change required is **config**: use **open** DM policy for the OpenJoey bot.

## What to change on the server

On the **Hetzner server** (or wherever the gateway runs), edit the OpenClaw config so Telegram uses **open** for DMs.

**Option A — `openclaw.json` (recommended)**

In `~/.openclaw/openclaw.json` (or `/root/.openclaw/openclaw.json` on the server), under `channels.telegram`:

```json
"channels": {
  "telegram": {
    "enabled": true,
    "botToken": "YOUR_BOT_TOKEN",
    "dmPolicy": "open",
    "allowFrom": ["*"]
  }
}
```

- **`dmPolicy: "open"`** — Do not require pairing; allow all DM senders.
- **`allowFrom: ["*"]`** — Explicit “everyone” for DMs (required when using `open`).

Then restart the gateway (e.g. `docker compose restart openclaw-gateway`).

**Option B — Same in `openclaw.openjoey.json`**

If you use a project-specific config file (e.g. `openclaw.openjoey.json`), set the same `channels.telegram.dmPolicy` and `allowFrom` there.

## After the change

1. **First-time user** taps Start on Telegram → opens @OpenJoey_bot → sends first message (or Telegram sends `/start`).
2. Gateway **does not** show the pairing message; the message goes to the OpenJoey hook.
3. OpenJoey runs **resolveSession** → new user is **registered** in Supabase.
4. If the first message is **/start** (or contains start payload), the user gets the **welcome message** (trial, capabilities, commands, referral).
5. **User count:** Use Supabase `users` table (or your admin/analytics).

## Security note

With **open** DMs, anyone can message the bot. That is intended for a **public** product like OpenJoey. Mitigations you already have or can add:

- Rate limiting (gateway/Telegram)
- Trial and subscription limits (Supabase + Stripe)
- Abuse handling (e.g. block by `telegram_id` in your own allow/block list later)

## Summary

| Goal                             | How it’s done                                                                 |
| -------------------------------- | ----------------------------------------------------------------------------- |
| No pairing message for new users | Set `dmPolicy: "open"` and `allowFrom: ["*"]` for Telegram on the server.     |
| Welcome message                  | Already implemented: OpenJoey sends it for `/start` once the user is allowed. |
| Backend knows “new user”         | Already implemented: `resolveSession` → `registerUser` and usage events.      |
| User count                       | Supabase `users` table (or dashboard).                                        |
