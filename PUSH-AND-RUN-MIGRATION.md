# What to do next (after the bot did Part 1 for you)

## Part 1 is done on your computer

- Git repo was initialized and all files were committed (including the migration docs and server script).
- **You still need to push to your repo** (the bot can’t log into GitHub for you).
- Your repo: **https://github.com/qbtheaiguy/openjoey** (standalone, private)

### Push to your repo

1. Open Terminal and run:

   ```bash
   cd /Users/theaiguy/Downloads/openjoey-main
   ```

2. Origin is already set to your repo. Push:

   ```bash
   git push -u origin main
   ```

   If it says the remote has different history and rejects the push, run:

   ```bash
   git push -u origin main --force
   ```

   (You are pushing to **qbtheaiguy/openjoey** — your OpenJoey repo, not openclaw.)

3. **Before pushing**, check what you’re about to push (keeps OpenJoey fixes from being overwritten):

   ```bash
   ./scripts/openjoey-check-before-push.sh
   ```

4. When it asks for username/password, use your GitHub username and a **Personal Access Token** (not your GitHub password). Create one at: GitHub → Settings → Developer settings → Personal access tokens.

---

## Part 2: On the Hetzner server (you run this)

The bot can’t SSH into your server. Do this yourself:

1. **SSH into the server:**

   ```bash
   ssh root@YOUR_SERVER_IP
   ```

2. **After you’ve pushed**, on the server clone **your repo** and run the migration script:

   ```bash
   cd /root
   git clone https://github.com/qbtheaiguy/openjoey.git openclaw
   cd openclaw
   bash scripts/hetzner-migration-run-on-server.sh qbtheaiguy
   ```

3. **Edit secrets** (the script creates `.env` and `openclaw.json`; you must put in your real tokens):
   - Gateway token and Moonshot key: `nano /root/openclaw/.env`
   - Telegram bot token: `nano /root/.openclaw/openclaw.json`

4. **Restart the gateway** after editing:

   ```bash
   cd /root/openclaw && docker compose up -d openclaw-gateway
   ```

5. **On your laptop**, open the tunnel and the Control UI:

   ```bash
   ssh -N -L 18789:127.0.0.1:18789 root@YOUR_SERVER_IP
   ```

   Then in the browser: **http://127.0.0.1:18789/** (paste your gateway token when asked).

Done.

---

## Using the local image (Kimi model fix)

If you see **"Unknown model: anthropic/kimi-k2.5"**, the gateway must run the image built from this repo (so the model is resolved as Moonshot). On the server:

1. **Pull latest** (includes memory/onboard fix so the build succeeds):

   ```bash
   cd /root/openclaw && git pull origin main
   ```

2. **Build the image** (Dockerfile uses `OPENCLAW_A2UI_SKIP_MISSING=1`):

   ```bash
   docker compose build openclaw-gateway
   ```

   Or: `docker build -t openclaw:local -f Dockerfile .`

3. **Use the local image**: in `/root/openclaw/.env` set:

   ```bash
   OPENCLAW_IMAGE=openclaw:local
   ```

   (Or remove `OPENCLAW_IMAGE` so compose defaults to `openclaw:local`.)

4. **Restart the gateway**:

   ```bash
   docker compose up -d openclaw-gateway
   ```

---

## Keep the gateway running 24/7 (no sleep, no downtime)

So users don’t see the bot go offline:

1. **Hetzner VPS** — The server does not sleep; it’s always on. No action needed.

2. **Docker restart policy** — The compose file sets `restart: unless-stopped` for the gateway. If the container exits, Docker restarts it. After a server reboot, Docker starts the container again as long as the Docker daemon is enabled.

3. **Docker on boot** — On the Hetzner server, ensure Docker starts on boot (default on most installs):

   ```bash
   sudo systemctl enable docker
   sudo systemctl status docker   # should be active
   ```

4. **Healthcheck** — The compose file includes a healthcheck that hits the gateway every 60s. If the gateway stops responding, Docker marks the container as unhealthy (`docker ps` will show it). Docker does not auto-restart on unhealthy by default; if you want that, add a cron job on the server that runs `docker inspect --format '{{.State.Health.Status}}' openclaw-openclaw-gateway-1` and, when not `healthy`, runs `cd /root/openclaw && docker compose restart openclaw-gateway`.

5. **Don’t run the gateway twice** — Only run the gateway in Docker on the server. If you start a native `openclaw gateway` process on the same host, it will bind port 18789 and the Docker container will fail to start. Use one or the other.

6. **Optional: external uptime monitor** — Use a service like UptimeRobot or Better Uptime to ping your bot or gateway (e.g. via a webhook or public endpoint) and alert you if it’s down.

---

## Keeping your OpenJoey fixes from reverting

When you sync with openclaw (upstream), always resolve conflicts in favor of your OpenJoey code. Use:

- **Safe upstream sync:** `./scripts/openjoey-sync-upstream.sh` — merges upstream into a branch so you can fix conflicts before merging into main.
- **Check before push:** `./scripts/openjoey-check-before-push.sh` — see commits and files you’re about to push.

Full steps: [docs/install/openjoey-sync-upstream.md](docs/install/openjoey-sync-upstream.md).
