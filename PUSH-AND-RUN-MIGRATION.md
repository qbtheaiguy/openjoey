# What to do next (after the bot did Part 1 for you)

## Part 1 is done on your computer

- Git repo was initialized and all files were committed (including the migration docs and server script).
- **You still need to push to YOUR fork** (the bot can’t log into GitHub for you).

### Push to your fork

1. Open Terminal and run:

   ```bash
   cd /Users/theaiguy/Downloads/openjoey-main
   ```

2. Point `origin` at **your** GitHub fork (replace `YOUR_GITHUB_USERNAME` with your real username):

   ```bash
   git remote set-url origin https://github.com/YOUR_GITHUB_USERNAME/openjoey.git
   ```

3. Push (use `--force` only if your fork already had a different history):

   ```bash
   git push -u origin main
   ```

   If it says the remote has different history and rejects the push, run:

   ```bash
   git push -u origin main --force
   ```

4. When it asks for username/password, use your GitHub username and a **Personal Access Token** (not your GitHub password). Create one at: GitHub → Settings → Developer settings → Personal access tokens.

---

## Part 2: On the Hetzner server (you run this)

The bot can’t SSH into your server. Do this yourself:

1. **SSH into the server:**

   ```bash
   ssh root@YOUR_SERVER_IP
   ```

2. **Download and run the migration script** (replace `YOUR_GITHUB_USERNAME` with your GitHub username):

   ```bash
   curl -sO https://raw.githubusercontent.com/YOUR_GITHUB_USERNAME/openjoey/main/scripts/hetzner-migration-run-on-server.sh
   bash hetzner-migration-run-on-server.sh YOUR_GITHUB_USERNAME
   ```

   Or, after you’ve pushed, clone the repo and run the script from inside it:

   ```bash
   cd /root
   git clone https://github.com/YOUR_GITHUB_USERNAME/openjoey.git openclaw
   cd openclaw
   bash scripts/hetzner-migration-run-on-server.sh YOUR_GITHUB_USERNAME
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
