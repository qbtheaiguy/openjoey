# Migrate to OpenClaw on Hetzner — Simple Step-by-Step

Follow these steps in order. Do one step, check it worked, then do the next.

---

## Part 1: On your computer (get your new code ready)

### Step 1 — Open Terminal

- On Mac: press **Cmd + Space**, type **Terminal**, press Enter.
- You’ll see a window with text and a blinking cursor. That’s where you type commands.

### Step 2 — Go to your project folder

Type this and press Enter:

```bash
cd /Users/theaiguy/Downloads/openjoey-main
```

That just means: “go into the openjoey folder.”

### Step 3 — See what we added

Type:

```bash
git status
```

You should see the new files (migration doc, `.env.example.hetzner`, and maybe `docker-compose.yml`). That’s normal.

### Step 4 — Save these changes to Git

Type these three commands, one at a time (press Enter after each):

```bash
git add docs/install/hetzner-migration-openjoey-to-openclaw.md .env.example.hetzner docker-compose.yml
```

```bash
git commit -m "Add Hetzner migration guide and env example for Kimi and Telegram"
```

```bash
git push origin main
```

- If it asks for your GitHub username and password (or token), type them. Your password won’t show when you type — that’s normal.
- When it says something like “Everything up-to-date” or shows a push, you’re done. Your fork on GitHub now has the new files.

---

## Part 2: On the Hetzner server (replace old app with new one)

You need to log into your server. We do everything in order.

### Step 5 — Log into the server

On your computer, in Terminal, type (use your real server IP instead of `YOUR_SERVER_IP`):

```bash
ssh root@YOUR_SERVER_IP
```

- If it asks “Are you sure you want to connect?” type **yes** and press Enter.
- When you’re in, the prompt might change to something like `root@server:~#`. That means you’re on the server now.

### Step 6 — Back up your old config (so we don’t lose tokens and settings)

Copy the folder where the old app kept its config. Run these one by one:

```bash
cp -a /root/.openclaw /root/.openclaw.backup-$(date +%Y%m%d)
```

If you had a folder named `.openjoey` instead, do this too:

```bash
cp -a /root/.openjoey /root/.openjoey.backup-$(date +%Y%m%d)
```

- This makes a copy. Your original is still there. We’re just being safe.

### Step 7 — Stop the old app

**If you run the old app with Docker:**

Go to the folder where the old app lives (change the name if yours is different):

```bash
cd /root/openjoey
```

Then stop it:

```bash
docker compose down
```

**If you’re not sure:** try `docker compose down` in that folder. If it says “no such file” or “no project”, the old app might not be in Docker — then skip to Step 8.

### Step 8 — Move the old code out of the way (don’t delete the backup)

So we have a clean place for the new code:

```bash
cd /root
mv openjoey openjoey.old
```

- If it says “no such file or directory”, maybe your folder has another name (e.g. `openclaw`). Then run: `mv openclaw openclaw.old` (or whatever the name is). The idea is: old code is renamed, not deleted.

### Step 9 — Make sure the config folder exists

Type:

```bash
mkdir -p /root/.openclaw /root/.openclaw/workspace
chown -R 1000:1000 /root/.openclaw
```

- This makes the folder where the new app will keep config and data. The second line lets the app write to it.

### Step 10 — Clone the new code (your fork from GitHub)

Replace `YOUR_GITHUB_USERNAME` with your real GitHub username:

```bash
cd /root
git clone https://github.com/YOUR_GITHUB_USERNAME/openjoey.git openclaw
cd openclaw
```

- Example: if your username is `jane`, you’d type:  
  `git clone https://github.com/jane/openjoey.git openclaw`

### Step 11 — Create your .env file

Copy the example and then edit it:

```bash
cp .env.example.hetzner .env
nano .env
```

- You’ll see a list of variables. Change at least these:
  - **OPENCLAW_GATEWAY_TOKEN** — make up a long random password (or run `openssl rand -hex 32` and paste that).
  - **MOONSHOT_API_KEY** — your Kimi/Moonshot API key (starts with `sk-...`).
  - **OPENCLAW_CONFIG_DIR** — should already be `/root/.openclaw`.
  - **OPENCLAW_WORKSPACE_DIR** — should already be `/root/.openclaw/workspace`.

To save in nano: press **Ctrl+O**, then Enter, then **Ctrl+X** to exit.

### Step 12 — Put your Telegram token in the config

Create or edit the main config file:

```bash
nano /root/.openclaw/openclaw.json
```

If the file is empty or doesn’t exist, paste this (then change the bot token to yours):

```json
{
  "agents": {
    "defaults": {
      "model": { "primary": "moonshot/kimi-k2.5" }
    }
  },
  "channels": {
    "telegram": {
      "enabled": true,
      "botToken": "PUT_YOUR_TELEGRAM_BOT_TOKEN_HERE",
      "dmPolicy": "pairing"
    }
  }
}
```

- Get the Telegram token from @BotFather on Telegram. Replace `PUT_YOUR_TELEGRAM_BOT_TOKEN_HERE` with that token.
- Save: **Ctrl+O**, Enter, **Ctrl+X**.

### Step 13 — Build and start the new app

Back in the project folder:

```bash
cd /root/openclaw
docker compose build
```

Wait until it finishes (can take a few minutes). Then start the gateway:

```bash
docker compose up -d openclaw-gateway
```

- “Up -d” means “run in the background”. You should see something like “Container openclaw-openclaw-gateway-1  Started”.

### Step 14 — Check that it’s running

Type:

```bash
docker compose logs -f openclaw-gateway
```

- You should see a line like: `[gateway] listening on ws://0.0.0.0:18789`.
- Press **Ctrl+C** to stop watching the logs (the app keeps running).

### Step 15 — Use it from your computer (same way as before)

On **your computer** (not the server), open a **new** Terminal window and run:

```bash
ssh -N -L 18789:127.0.0.1:18789 root@YOUR_SERVER_IP
```

- Leave this window open. Then open your browser and go to: **http://127.0.0.1:18789/**
- When it asks for a token, paste the same value you put in **OPENCLAW_GATEWAY_TOKEN** in Step 11.
- You should see the Control UI. Send a message to your Telegram bot — it should reply using Kimi K 2.5.

---

## Done

- **Part 1 (Steps 1–4):** You put the new guide and env example on GitHub.
- **Part 2 (Steps 5–15):** You logged in to the server, backed up config, stopped the old app, installed the new code, set Kimi K 2.5 and Telegram, and started the new app. You’re now running the new codebase 24/7 with the same SSH tunnel.

If something doesn’t work, say which step number and what you see (or the error message), and we can fix it step by step.
