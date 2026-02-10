# OpenJoey live checklist – Supabase and Hetzner

Use this checklist to confirm the OpenJoey gateway is wired to Supabase and Hetzner and works in production.

## 1. Hetzner server

- **Path:** Gateway runs in `/root/openclaw` (pulled from Git, run via Docker Compose).
- **Deploy:** From your machine run `./scripts/deploy-hetzner.sh` (uses `~/.ssh/hetzner-openjoey-new` and `root@116.203.215.213`). Or SSH and run:
  ```bash
  cd /root/openclaw && git pull origin main && docker compose build openclaw-gateway && docker compose up -d openclaw-gateway
  ```
- **Environment:** Docker Compose reads `/root/openclaw/.env`. Ensure this file exists on the server and includes at least:

  | Variable                    | Purpose                                                             |
  | --------------------------- | ------------------------------------------------------------------- |
  | `SUPABASE_URL`              | OpenJoey Supabase project URL (or `OPENJOEY_SUPABASE_URL`)          |
  | `SUPABASE_SERVICE_ROLE_KEY` | Service role key for RPCs (or `OPENJOEY_SUPABASE_SERVICE_ROLE_KEY`) |
  | `TELEGRAM_BOT_TOKEN`        | Telegram bot token for OpenJoey                                     |
  | `OPENJOEY_REDIS_URL`        | Optional; Redis for session/cache if used                           |

  Other vars (e.g. `OPENCLAW_GATEWAY_TOKEN`, `STRIPE_*`, `MOONSHOT_API_KEY`, `BRAVE_API_KEY`) are passed through from the same `.env` if present. **Admin access:** Set `OPENJOEY_ADMIN_TELEGRAM_IDS` to a comma-separated list of Telegram user IDs (e.g. your own) to grant full skill access (including coding); other users get trading/research/chat only.

- **Skills:** When the gateway runs in Docker with no `agents.defaults.workspace` set, it uses `/app` as the workspace so that `skills/` from the image (repo) is loaded. Trading skills (e.g. meme-guru, signal-guru) are then available to the agent according to the user’s tier (see `getAllowedSkills` in `src/openjoey/session-isolation.ts`). To use a different workspace, set `agents.defaults.workspace` in the gateway config.

- **Verify gateway:** After deploy, check logs:
  ```bash
  ssh -i ~/.ssh/hetzner-openjoey-new root@116.203.215.213 'docker compose -f /root/openclaw/docker-compose.yml logs -f openclaw-gateway'
  ```
  Health: `http://127.0.0.1:18789/` (or the bind address) is used by the Docker healthcheck.

## 2. Supabase project

The gateway calls Supabase for user registration, sessions, and usage. Ensure the **same** project used by the admin dashboard has:

- **Tables (at least):** `users`, `referrals`, `sessions`, `usage_events`. Schema is reflected in `src/openjoey/database.types.ts` (generated from the live project).
- **RPC:** `register_telegram_user(p_telegram_id, p_username, p_display_name, p_referral_code)` – used on `/start` to create or get a user and attribute referrals.
- **Service role:** Use the **service role** key in the gateway (and in the admin dashboard server-side). Never expose it to the client.

If the RPC or tables are missing, create them in the Supabase SQL editor (or via migrations). The TypeScript types assume the RPC returns JSON with user/session info; the gateway uses it in `src/openjoey/supabase-client.ts` and `src/openjoey/onboarding.ts`.

## 3. Live test

1. Open Telegram and send **/start** to the OpenJoey bot (e.g. @OpenJoeyBot).
2. You should get the **premium welcome message** (Joey as research partner, 3 days full access, “Try me”, “Refer friends” with referral link).
3. Send **/status** – you should see tier, trial end time, usage today, credit balance, and referral code.

If you see a generic reply or an error, check:

- Hetzner gateway logs for `OpenJoey telegram hook failed` (indicates Supabase or env issue).
- That `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set in `/root/openclaw/.env` on the server and that the Supabase project has `register_telegram_user` and the `users` table.

## 4. Admin dashboard (optional)

The admin dashboard is deployed separately to Vercel (see [OpenJoey Admin – Vercel](openjoey-admin-vercel.md)). It uses the same Supabase project and the same `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (set in the Vercel project env). No extra wiring is required for “live” beyond the gateway and Supabase steps above.
