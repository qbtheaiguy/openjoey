# Deploying skills from laptop to Hetzner

How to get a skill that lives on your laptop onto the OpenClaw gateway running on Hetzner.

---

## Where skills can live on the server

OpenClaw loads skills from three places (in order of precedence for discovery):

| Source               | Typical path on Hetzner                               | When to use                                                                                  |
| -------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **Workspace skills** | `/root/.openclaw/workspace/skills/`                   | Add a skill without rebuilding the Docker image; survives `git pull` but not workspace wipe. |
| **Managed skills**   | `/root/.openclaw/skills/` (config dir)                | Same idea; config-driven.                                                                    |
| **Bundled skills**   | Inside the Docker image (`/app/skills/` in container) | Skill is in the repo; deploy by push + rebuild.                                              |

For **meme-lord** (or any new skill), you can use either **bundled** (repo) or **workspace** (no rebuild).

---

## Your current situation

- **meme-lord on laptop:** `/Users/theaiguy/CascadeProjects/openJoey/skills/meme-lord/`  
  (That’s the **CascadeProjects/openJoey** project, not this **openjoey-main** repo.)
- **Hetzner repo clone:** `/root/openclaw` (clone of your repo, e.g. `qbtheaiguy/openjoey`).
- **Workspace on server:** `/root/.openclaw/workspace` (for agent files; can also hold `workspace/skills/`).

---

## Option 1: Add skill to the repo (recommended)

Skill becomes part of the codebase and deploys every time you push and rebuild.

**1. Get meme-lord into the repo that Hetzner pulls from.**

If that repo is **this one** (openjoey-main / qbtheaiguy/openjoey):

```bash
# Copy from CascadeProjects into this repo
cp -R /Users/theaiguy/CascadeProjects/openJoey/skills/meme-lord /Users/theaiguy/Downloads/openjoey-main/skills/

# Commit and push
cd /Users/theaiguy/Downloads/openjoey-main
git add skills/meme-lord/
git commit -m "Add meme-lord skill"
git push origin main
```

If instead you deploy from **CascadeProjects/openJoey** (and that’s the repo cloned on the server), do the same there:

```bash
cd /Users/theaiguy/CascadeProjects/openJoey
git add skills/meme-lord/
git commit -m "Add meme-lord skill"
git push origin main
```

**2. On the Hetzner server**

```bash
ssh root@YOUR_HETZNER_IP

cd /root/openclaw
git pull origin main
docker compose build openclaw-gateway
docker compose up -d openclaw-gateway
```

The new image will contain `skills/meme-lord/`. No need to touch `/opt/openclaw` unless that’s where you run the app from; with the migration script, the app runs from `/root/openclaw` and the image holds the repo (including `skills/`).

---

## Option 2: SCP to server (no repo change)

Use this if you want the skill on the server **once** without committing it (e.g. for a quick test).  
If you later rebuild the image from git, the container’s bundled skills come from the repo again; SCP’ing into the **clone** on the host only helps if the container mounts that directory or you run the gateway from the host.

**SCP into the repo’s skills dir (so it’s there after next pull/rebuild you’d overwrite it; better: use workspace):**

```bash
# Copy skill to the server's clone (so next git pull might overwrite; prefer Option 1 or 3)
scp -r /Users/theaiguy/CascadeProjects/openJoey/skills/meme-lord root@YOUR_HETZNER_IP:/root/openclaw/skills/
```

**SCP into workspace skills (persists until you delete it; not overwritten by git pull):**

```bash
# On server, ensure workspace skills dir exists (once)
ssh root@YOUR_HETZNER_IP "mkdir -p /root/.openclaw/workspace/skills"

# From laptop: copy meme-lord into workspace skills
scp -r /Users/theaiguy/CascadeProjects/openJoey/skills/meme-lord root@YOUR_HETZNER_IP:/root/.openclaw/workspace/skills/
```

Then restart the gateway so it rescans skills:

```bash
ssh root@YOUR_HETZNER_IP "cd /root/openclaw && docker compose restart openclaw-gateway"
```

---

## Option 3: Git from a different repo

If **meme-lord** lives in a different repo (e.g. only in CascadeProjects/openJoey):

1. Add and push it in that repo, then on the server clone that repo (or add it as a submodule), and either:
   - Copy `meme-lord` into `/root/openclaw/skills/` after each pull, or
   - Point the gateway at that repo’s `skills` dir (if your setup supports it), or
   - Merge the skill into the repo you use for Hetzner (Option 1).

---

## After the skill is on the server

1. **Restart the gateway** (if you didn’t rebuild):
   ```bash
   cd /root/openclaw && docker compose restart openclaw-gateway
   ```
2. If the skill must be **allowed** for your agent/session, ensure it’s in the allowlist (e.g. in `openclaw.json` or session config).
3. Use the bot as intended (e.g. “hunt for meme coins”, “analyze token X”).

---

## How you usually deploy (from this repo)

From **PUSH-AND-RUN-MIGRATION.md** and the PRD:

1. **Laptop:** Change code (or add a skill), commit, push to your repo (e.g. `qbtheaiguy/openjoey`).
2. **Hetzner:** SSH in, then:
   ```bash
   cd /root/openclaw
   git pull origin main
   docker compose build openclaw-gateway
   docker compose up -d openclaw-gateway
   ```
3. **Optional:** Use the local image so the gateway runs the image built from your repo (Kimi model fix, etc.); see “Using the local image” in PUSH-AND-RUN-MIGRATION.md.

**Workspace** (`/root/.openclaw/workspace` or `~/.openclaw/workspace` on the laptop) is used for the **agent** (AGENTS.md, identity, tools). It is **not** the same as the repo’s `skills/` directory. Skills in the repo are bundled into the image; skills in `workspace/skills/` on the server are loaded from the workspace and do not require a rebuild.

---

## Summary

| Goal                                          | Action                                                                                                             |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Deploy meme-lord with normal “push + rebuild” | Add `meme-lord` to the repo that the server clones (Option 1), then `git pull` → `docker compose build` → `up -d`. |
| Add meme-lord without touching the repo       | SCP to `/root/.openclaw/workspace/skills/meme-lord` (Option 2), then restart gateway.                              |
| Path on server (repo)                         | `/root/openclaw/skills/` (clone path from migration script).                                                       |
| Path on server (workspace)                    | `/root/.openclaw/workspace/skills/`.                                                                               |
