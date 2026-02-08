---
summary: "Migrate from old OpenJoey to this OpenClaw codebase on Hetzner (Docker, 24/7, Kimi K2.5, Telegram-only)"
read_when:
  - You are replacing an existing OpenJoey deployment with this codebase on the same Hetzner server
  - You want to keep config (tokens, model, channel settings) and switch to Docker
title: "Hetzner migration (OpenJoey → OpenClaw)"
---

# Migrate from old OpenJoey to OpenClaw on Hetzner (A–Z)

This guide replaces your **old OpenJoey** app on the same Hetzner server with **this OpenClaw codebase** running in Docker 24/7, with **Kimi K 2.5** as the default model and **Telegram only**. Server hostname, SSH keys, and SSH tunnel stay the same.

---

## What we are doing

| Step | Action |
|------|--------|
| A | Back up existing config and credentials (so we keep tokens, model, Telegram) |
| B | Stop and remove the old OpenJoey process/container and optional old code |
| C | Keep or create the persistent host directories for OpenClaw |
| D | Deploy this codebase via Docker (build + run) |
| E | Restore or set config: Kimi K 2.5 default, Telegram only |
| F | Verify and use the same SSH tunnel |

---

## Prerequisites

- Same Hetzner VPS (root or sudo), same SSH access.
- You have (or will have) a **Moonshot API key** for Kimi K 2.5 and a **Telegram bot token**.
- Optional: if the old app used different paths (e.g. `~/.openjoey`), we will copy from there into OpenClaw’s layout.

---

## Step A — Back up existing config (keep tokens, model, channel)

On the **Hetzner server** over SSH:

```bash
# If the old app used ~/.openclaw (same as OpenClaw)
sudo cp -a /root/.openclaw /root/.openclaw.backup-$(date +%Y%m%d) 2>/dev/null || true

# If the old app used a different path (e.g. openjoey)
sudo cp -a /root/.openjoey /root/.openjoey.backup-$(date +%Y%m%d) 2>/dev/null || true

# List to confirm
ls -la /root/.openclaw* /root/.openjoey* 2>/dev/null || true
```

Do not delete these backups until the new stack is working. You will reuse `openclaw.json`, credentials, and (if present) session/store files from the backup.

---

## Step B — Stop and remove old OpenJoey (keep server and SSH)

Still on the server:

**If the old app runs in Docker:**

```bash
# Find the project dir (e.g. openjoey or openclaw)
cd /root/openjoey   # or wherever the old app lives

# Stop and remove containers (compose project name may be 'openjoey' or 'openclaw')
docker compose down
# Or if you used a different compose file:
# docker compose -f docker-compose.old.yml down

# Optional: remove old images to free space
docker images | grep -E 'openjoey|openclaw'
# docker rmi <image_id>   # only if you are sure
```

**If the old app runs as a systemd service:**

```bash
sudo systemctl stop openjoey   # or the real service name
sudo systemctl disable openjoey
```

**If the old app runs manually (e.g. node/pnpm in tmux):**

```bash
pkill -f "openjoey\|openclaw"   # adjust to the actual process name
# Or find and kill by port, e.g. process using 18789
# ss -tlnp | grep 18789
```

**Remove only the old code (optional but recommended):**

```bash
# Move or delete the old repo dir so we have a clean place for the new one
sudo mv /root/openjoey /root/openjoey.old-$(date +%Y%m%d)   # or: sudo rm -rf /root/openjoey
```

Do **not** remove `/root/.openclaw` (or the backup we made). We will use that for the new container’s config and credentials.

---

## Step C — Persistent host directories for OpenClaw

Use the same paths the new Docker setup will mount. If you already have `/root/.openclaw` from the old app (or restored from backup), keep it.

```bash
sudo mkdir -p /root/.openclaw /root/.openclaw/workspace
sudo chown -R 1000:1000 /root/.openclaw
```

If you backed up from `~/.openjoey`, copy the important files into `/root/.openclaw`:

```bash
# Example: copy config and credentials from old openjoey backup
sudo cp -a /root/.openjoey.backup-*/.openclaw/openclaw.json /root/.openclaw/ 2>/dev/null || true
sudo cp -a /root/.openjoey.backup-*/credentials /root/.openclaw/ 2>/dev/null || true
# Adjust paths to match your backup layout; then fix ownership:
sudo chown -R 1000:1000 /root/.openclaw
```

---

## Step D — Deploy this OpenClaw codebase with Docker

**Option 1 — Clone this repo (your openjoey-main / OpenClaw clone):**

If this codebase is in a Git repo (e.g. your fork):

```bash
cd /root
git clone https://github.com/YOUR_USER/openjoey.git openclaw
cd openclaw
```

**Option 2 — Clone upstream OpenClaw (same codebase):**

```bash
cd /root
git clone https://github.com/openclaw/openclaw.git openclaw
cd openclaw
```

Then:

**1) Create `.env`** (use the Hetzner example; set token, dirs, and Moonshot key):

```bash
cp .env.example.hetzner .env
nano .env   # set OPENCLAW_GATEWAY_TOKEN, OPENCLAW_CONFIG_DIR, OPENCLAW_WORKSPACE_DIR, MOONSHOT_API_KEY
```

**Optional (recommended for SSH-tunnel-only access):** In `docker-compose.yml`, under `openclaw-gateway` → `ports`, change to bind only to loopback so the gateway is reachable only via SSH tunnel:

```yaml
ports:
  - "127.0.0.1:${OPENCLAW_GATEWAY_PORT:-18789}:18789"
  # - "${OPENCLAW_BRIDGE_PORT:-18790}:18790"   # uncomment only if you use iOS/Android nodes
```

**2) Build and run (Telegram-only: no extra binaries needed in the image; the repo Dockerfile is enough):**

```bash
docker compose build
docker compose up -d openclaw-gateway
```

**3) Check logs:**

```bash
docker compose logs -f openclaw-gateway
```

Expect something like: `[gateway] listening on ws://0.0.0.0:18789`. Exit with Ctrl+C.

---

## Step E — Config: Kimi K 2.5 default + Telegram only

Config lives in the **host** directory mounted into the container (e.g. `/root/.openclaw` → `/home/node/.openclaw`). Edit on the host.

**1) Create or edit `openclaw.json`** in `/root/.openclaw/`:

```bash
sudo nano /root/.openclaw/openclaw.json
```

**2) Minimal config (Kimi K 2.5 + Telegram only):**

```json5
{
  "agents": {
    "defaults": {
      "model": { "primary": "moonshot/kimi-k2.5" }
    }
  },
  "channels": {
    "telegram": {
      "enabled": true,
      "botToken": "YOUR_TELEGRAM_BOT_TOKEN",
      "dmPolicy": "pairing"
    }
  }
}
```

- Replace `YOUR_TELEGRAM_BOT_TOKEN` with your bot token from @BotFather.
- Moonshot (Kimi) API key: either put `MOONSHOT_API_KEY` in the container env (e.g. in `.env` and docker-compose) or use config `env.MOONSHOT_API_KEY` / credential store. Easiest: add to `.env` and pass through in `docker-compose.yml` (see below).

**3) Ensure the container gets the Moonshot key**

Set in `.env`:

```bash
MOONSHOT_API_KEY=sk-your-moonshot-key
```

The repo’s `docker-compose.yml` already passes `MOONSHOT_API_KEY` into the gateway container. Then restart:

```bash
docker compose up -d openclaw-gateway
```

**4) (Optional) Disable other channels**

If you had WhatsApp/Discord/etc. in config, remove or set `enabled: false` for those channels so only Telegram is active.

---

## Step F — Same SSH tunnel and verify

From your **laptop**:

```bash
ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
```

Then open: `http://127.0.0.1:18789/` and paste your gateway token (from `.env`: `OPENCLAW_GATEWAY_TOKEN`).

- **Telegram:** Open Telegram, message your bot; you may need to run pairing once:  
  `docker compose exec openclaw-gateway node dist/index.js pairing approve telegram <CODE>` (or use the CLI from the host if you have `openclaw` installed there).

You are now running this OpenClaw codebase 24/7 on Hetzner with Kimi K 2.5 and Telegram only, with the same SSH tunnel as before.

---

## Summary checklist

- [ ] Backed up `/root/.openclaw` and/or `/root/.openjoey`
- [ ] Stopped and removed old OpenJoey (container/service/process)
- [ ] Removed or moved old code directory
- [ ] Created/kept `/root/.openclaw` and `/root/.openclaw/workspace` with ownership 1000:1000
- [ ] Cloned this repo (openjoey or openclaw) into `/root/openclaw`
- [ ] Created `.env` with gateway token, config dirs, and `MOONSHOT_API_KEY`
- [ ] Set `openclaw.json` with `moonshot/kimi-k2.5` and Telegram only
- [ ] Built and started: `docker compose up -d openclaw-gateway`
- [ ] Verified logs and Control UI over SSH tunnel

---

## References

- [Hetzner (Docker, production)](https://docs.openclaw.ai/install/hetzner) — generic OpenClaw on Hetzner
- [Moonshot (Kimi)](https://docs.openclaw.ai/providers/moonshot) — Kimi K 2.5 config
- [Telegram](https://docs.openclaw.ai/channels/telegram) — bot setup and options
