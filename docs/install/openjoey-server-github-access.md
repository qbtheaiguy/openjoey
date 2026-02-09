# OpenJoey: Give Your Server Access to the Private Repo (Step by Step)

Your repo is **private**. The Hetzner server needs permission to download code from GitHub. We do that with a **deploy key** (a special SSH key that only has access to this one repo).

You will do two things: (1) create a key **on the server**, (2) add the **public** part of that key in GitHub. Then the server can `git pull` without ever asking for a password.

---

## Step 1: Log into your server

**You run (on your Mac, in Terminal):**

```bash
ssh -i ~/.ssh/hetzner-openjoey-new root@116.203.215.213
```

**You should see:** Something like “Welcome to Ubuntu” or a login message, then a new prompt that looks like:

```text
root@openjoey-hetzner-1:~#
```

That means you are **on the server** now. All the next steps until we say “back on your Mac” are on this server.

---

## Step 2: Create a deploy key on the server

**You run (copy and paste this whole line):**

```bash
ssh-keygen -t ed25519 -C "openjoey-deploy" -f ~/.ssh/id_ed25519_openjoey -N ""
```

**You should see:** Two or three lines, for example:

```text
Generating public/private ed25519 key pair.
Your identification has been saved in /root/.ssh/id_ed25519_openjoey
Your public key has been saved in /root/.ssh/id_ed25519_openjoey.pub
```

No password, no questions. If it says “already exists”, that’s OK — we can use the same key.

---

## Step 3: Show the public key so you can copy it

**You run:**

```bash
cat ~/.ssh/id_ed25519_openjoey.pub
```

**You should see:** One long line that starts with `ssh-ed25519` and ends with `openjoey-deploy`, for example:

```text
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI...lots of letters/numbers... openjoey-deploy
```

**What to do:** Select that **entire line** (from `ssh-ed25519` to `openjoey-deploy`) and **copy** it (Cmd+C on Mac). You will paste it in GitHub in the next step.

---

## Step 4: Add the key in GitHub (on your Mac, in the browser)

1. Open: **https://github.com/qbtheaiguy/openjoey**
2. Click **Settings** (tab at the top of the repo).
3. In the left sidebar, click **Deploy keys** (under “Security”).
4. Click the green button **“Add deploy key”**.
5. **Title:** type something like `Hetzner server` (so you remember what it’s for).
6. **Key:** paste the line you copied in Step 3 (the whole `ssh-ed25519 ... openjoey-deploy` line).
7. Leave **“Allow write access”** **unchecked** (read-only is enough for pull).
8. Click **“Add key”**.

**You should see:** The new key listed under Deploy keys, and maybe a green message that the key was added.

---

## Step 5: Tell the server to use this key for GitHub

**You run (still on the server):**

```bash
mkdir -p ~/.ssh && (echo "Host github.com"; echo "  IdentityFile ~/.ssh/id_ed25519_openjoey"; echo "  IdentitiesOnly yes") >> ~/.ssh/config && chmod 600 ~/.ssh/config
```

**You should see:** Nothing (no output). That’s normal.

---

## Step 6: Point the repo at GitHub with SSH (not HTTPS)

**You run:**

```bash
cd /root/openclaw && git remote -v
```

**You should see:** Two lines with `origin` and `https://github.com/qbtheaiguy/openjoey.git`.

Then run:

```bash
git remote set-url origin git@github.com:qbtheaiguy/openjoey.git && git remote -v
```

**You should see:** Two lines with `origin` and `git@github.com:qbtheaiguy/openjoey.git`. So “https” is now “git@github.com” (SSH).

---

## Step 7: Pull the latest code

**You run:**

```bash
git pull origin main
```

**You should see:** Something like:

```text
From https://github.com/qbtheaiguy/openjoey
 * branch            main       -> FETCH_HEAD
Already up to date.
```

or a short list of files “changed, X insertions…” if there was new code. No password prompt.

If you see **“Permission denied (publickey)”**: the deploy key is not set up correctly. Go back to Step 4 and make sure you pasted the **full** line from Step 3 and saved the deploy key.

---

## Step 8: Restart the gateway with the new settings (healthcheck, etc.)

**You run:**

```bash
docker compose up -d openclaw-gateway
```

**You should see:** One or two lines like:

```text
Container openclaw-openclaw-gateway-1  Recreated
Container openclaw-openclaw-gateway-1  Started
```

(or “Started” only if it didn’t need to recreate). Your bot is now running with the latest code and the new healthcheck.

---

## Step 9: Check that the container is running

**You run:**

```bash
docker ps --filter name=openclaw-gateway
```

**You should see:** A table with one row: container name, image `openclaw:local`, status **Up**, and ports `0.0.0.0:18789->18789/tcp`. If you see “Up” and the port, you’re good.

---

## Done

From now on, when you want to update the server:

1. On your Mac: push code as usual (`git push origin main`).
2. On the server, run:

   ```bash
   cd /root/openclaw && git pull origin main && docker compose up -d openclaw-gateway
   ```

No password needed on the server anymore.

---

## Quick recap (what we did)

| Step | Where   | What we did                                     |
| ---- | ------- | ----------------------------------------------- |
| 1    | Mac     | SSH into the server                             |
| 2–3  | Server  | Created a key and showed the public part        |
| 4    | Browser | Added that public key in GitHub (Deploy keys)   |
| 5–6  | Server  | Told Git to use that key and use SSH for GitHub |
| 7–9  | Server  | Pulled latest code and restarted the gateway    |

If any step shows an error different from what’s here, copy the exact message and we can fix it.
