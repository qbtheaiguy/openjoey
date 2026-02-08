# What to do next (after the bot did Part 1 for you)

## Part 1 is done on your computer

- Git repo was initialized and all files were committed (including the migration docs and server script).
- **You still need to push to your fork** (the bot can’t log into GitHub for you).
- Your fork: **https://github.com/qbtheaiguy/openjoey**

### Push to your fork

1. Open Terminal and run:

   ```bash
   cd /Users/theaiguy/Downloads/openjoey-main
   ```

2. Origin is already set to your fork. Push:

   ```bash
   git push -u origin main
   ```

   If it says the remote has different history and rejects the push, run:

   ```bash
   git push -u origin main --force
   ```

   (You are pushing to **qbtheaiguy/openjoey** — not the upstream openclaw repo.)

4. When it asks for username/password, use your GitHub username and a **Personal Access Token** (not your GitHub password). Create one at: GitHub → Settings → Developer settings → Personal access tokens.

---

## Part 2: On the Hetzner server (you run this)

The bot can’t SSH into your server. Do this yourself:

1. **SSH into the server:**

   ```bash
   ssh root@YOUR_SERVER_IP
   ```

2. **After you’ve pushed**, on the server clone **your fork** and run the migration script:

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
