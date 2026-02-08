---
summary: "Give your OpenClaw agent access to push to GitHub and trigger Vercel deploys so it can add code, push, and redeploy."
read_when:
  - You want the coding agent to build a function or skill and push to your repo
  - You want the agent to trigger a Vercel redeploy after pushing code
title: "Agent access to GitHub and Vercel (push and redeploy)"
---

# Giving your clawbot access to GitHub and Vercel

You want the agent to:

1. **Build** a function or skill in your codebase
2. **Push** the new code to your GitHub repo
3. **Redeploy** Vercel so the new function is live

Here is how to set that up when your gateway (and agent) runs on **Hetzner** in Docker.

---

## How it works

- The agent runs **inside the gateway container** on Hetzner. Any `exec` (bash/shell) commands run in that container.
- The agent needs a **clone of your repo** in the gateway’s **workspace** so it can edit files, then run `git add`, `git commit`, `git push`.
- **GitHub:** The container must have credentials to push (HTTPS + token, or SSH key).
- **Vercel:** Easiest is to let Vercel **auto-deploy on push** (Git integration). Then the agent only needs to push; no Vercel token on the server. Optionally you can give the agent a Vercel token to run `vercel --prod` or call the deploy API.
- **Hetzner:** The agent already has “access” to the server in the sense that it runs there. If you need it to run commands on the **host** (e.g. outside the container), you’d use exec with the appropriate host/elevated settings and ensure the host has the right tools; typically the clone and git/vercel flow stay inside the container or in the mounted workspace.

---

## 1. GitHub: token and push access

### Create a GitHub token

1. GitHub → **Settings** → **Developer settings** → **Personal access tokens** (or **Fine-grained tokens**).
2. Create a token with **repo** scope (read/write for your repositories). For fine-grained: contents read/write, metadata read.
3. Copy the token; you’ll put it on the server and in the container.

### Put the token on the server (Hetzner)

Add it to the gateway’s environment so the container can use it for `git push`:

**On the server** (`/root/openclaw/.env`):

```bash
GITHUB_TOKEN=ghp_your_token_here
```

**In docker-compose** (so the gateway container gets it), add to the `openclaw-gateway` service `environment` section:

```yaml
GITHUB_TOKEN: ${GITHUB_TOKEN:-}
```

(Your repo’s `docker-compose.yml` can be updated to include this.)

Then restart the gateway:

```bash
cd /root/openclaw && docker compose restart openclaw-gateway
```

### Clone your repo in the workspace (one-time)

The agent’s workspace on the server is typically `OPENCLAW_WORKSPACE_DIR` (e.g. `/root/.openclaw/workspace`), which is mounted into the container. The agent needs your **actual project** (the one you push to GitHub and deploy on Vercel) inside that workspace.

**On the server (SSH):**

```bash
# Example: clone your repo into the workspace
export WORKSPACE=/root/.openclaw/workspace
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git "$WORKSPACE/YOUR_REPO"
cd "$WORKSPACE/YOUR_REPO"
git config user.email "you@example.com"
git config user.name "Your Name"
```

To make `git push` use the token from the environment (no prompt), use HTTPS with the token in the URL (only in a protected env, not in logs):

```bash
# Replace YOUR_USERNAME, YOUR_REPO, and paste token when prompted or use credential helper
git remote set-url origin "https://YOUR_GITHUB_USERNAME:${GITHUB_TOKEN}@github.com/YOUR_USERNAME/YOUR_REPO.git"
```

Or use a **credential helper** so the container sees the token. When the agent runs `git push`, the process inherits the container’s env; if `GITHUB_TOKEN` is set, you can configure a helper that uses it (e.g. a small script that echoes the token). Simpler: set the remote URL as above once (the token is in the server’s `.env` and not committed).

**Important:** The user that runs the gateway (e.g. `node` in the container) must be able to read/write the clone. So clone as that user or chown the clone; on your setup the workspace is often bind-mounted from the host, so clone as root and ensure permissions match what the container expects (e.g. UID 1000). If the container runs as node (1000:1000), ensure the workspace dir is writable by 1000:1000.

---

## 2. Vercel: auto-deploy on push (recommended)

1. In **Vercel**, connect your GitHub repo (if not already): Project → **Settings** → **Git**.
2. Enable **Production** (and optionally Preview) from the branch you use (e.g. `main`).
3. When the agent (or you) **pushes to that branch**, Vercel deploys automatically. No token needed on the server for this.

So once the agent can push to GitHub, Vercel will reflect the new function after each push.

---

## 3. (Optional) Vercel token for explicit deploys

If you want the agent to run `vercel --prod` or trigger a deploy via API:

1. Create a token: [Vercel Dashboard](https://vercel.com/account/tokens) → **Create**.
2. On the server, add to `/root/openclaw/.env`:

   ```bash
   VERCEL_TOKEN=your_vercel_token
   ```

3. Add to the gateway service in docker-compose:

   ```yaml
   VERCEL_TOKEN: ${VERCEL_TOKEN:-}
   ```

4. Restart the gateway. If the image has the Vercel CLI, the agent can run `vercel --prod` in the project directory (with `VERCEL_TOKEN` in env, the CLI can use it). Otherwise you’d need to install the CLI in the image or run it via a script.

---

## 4. Allow the agent to run git and deploy

- **Tools:** The agent needs permission to run shell commands (e.g. `exec` or the bash tool). In `openclaw.json`, ensure `tools.allow` includes the exec/bash tool (or the group that includes it), and that you’re not denying it.
- **Security:** If you use exec security/allowlist, allow the agent to run `git` and, if you use it, `vercel`. Avoid giving broad “run anything” if you don’t need it.
- **Workspace:** The agent’s default workspace should be the directory that contains your repo (e.g. the clone inside `OPENCLAW_WORKSPACE_DIR`). You can set this per-agent in config (`agents.list[].workspace`) so that when the agent runs a command, its `workdir` is your project.

---

## 5. End-to-end flow (what you’re aiming for)

1. You ask the agent (e.g. via Telegram): “Add a new skill that does X and push it to the repo, then we should see it on Vercel.”
2. The agent (using the coding-agent skill or direct exec):
   - Edits files in the workspace (your cloned repo).
   - Runs `git add`, `git commit`, `git push origin main` (or your branch).
3. GitHub receives the push.
4. Vercel (with Git integration) builds and deploys from that branch.
5. The new function/skill is live.

---

## 6. Quick checklist (Hetzner + Docker)

| Item                                                                   | Done |
| ---------------------------------------------------------------------- | ---- |
| `GITHUB_TOKEN` in `/root/openclaw/.env`                                |      |
| `GITHUB_TOKEN` passed to gateway in docker-compose                     |      |
| Repo cloned in workspace, git `user.name` / `user.email` set           |      |
| Remote URL set so push uses token (HTTPS + token or credential helper) |      |
| Vercel connected to GitHub repo, auto-deploy on push                   |      |
| Agent has exec/bash allowed; workspace points at the repo clone        |      |
| Gateway restarted after env changes                                    |      |

---

## Security notes

- **Tokens:** Never commit `GITHUB_TOKEN` or `VERCEL_TOKEN` to the repo. Keep them only in the server’s `.env` and in Vercel/GitHub as needed.
- **Scope:** Use a GitHub token with the minimum scope (e.g. only the repos the agent should push to). Prefer fine-grained tokens when possible.
- **Audit:** Review `tools.exec` / bash allowlist and security settings so the agent can’t run arbitrary dangerous commands if that’s a concern.

See also: [Web tools](/tools/web), [Hetzner migration](/install/hetzner-migration-openjoey-to-openclaw), [Skills](/tools/skills).
