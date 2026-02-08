# OpenJoey: Keeping your fixes from reverting

When you sync with **openclaw/openclaw** (upstream), your OpenJoey-specific changes can be overwritten if conflicts are resolved in favor of upstream. This doc and the scripts below help you keep your fixes.

---

## 1. Resolve conflicts in your favor for OpenJoey code

When you see merge conflicts, **keep your version** (or merge carefully) for these areas:

| Area                     | Paths                                                                                                                       |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| OpenJoey backend         | `src/openjoey/`                                                                                                             |
| Meme Lord & skills       | `skills/meme-lord/`, `skills/whale-tracker/`, other `skills/*` you added                                                    |
| Landing                  | `landing/`                                                                                                                  |
| Telegram + OpenJoey hook | `src/telegram/bot*.ts`, `src/telegram/bot-*.ts`                                                                             |
| OpenJoey config / deploy | `openclaw.openjoey.json`, `vercel.json`, `scripts/add-supabase-to-hetzner.sh`, `scripts/hetzner-migration-run-on-server.sh` |
| Docs you added           | `docs/PRD-OpenJoey-v1.md`, `docs/install/skills-deploy-laptop-to-hetzner.md`, `docs/install/vercel-landing.md`, etc.        |

In a conflict, choose **ours** (your OpenJoey version) for these paths unless you intentionally want an upstream change.

---

## 2. Do not merge upstream into main blindly

**Avoid:** `git checkout main && git merge upstream/main` without reviewing every conflict.

**Prefer:** Use a separate branch, resolve conflicts there, then merge into main:

```bash
# From repo root (openjoey-main)
./scripts/openjoey-sync-upstream.sh
```

That script creates a `sync-upstream` branch, merges `upstream/main` into it, and tells you to resolve conflicts (keeping OpenJoey changes) and then merge `sync-upstream` into `main`.

Manual equivalent:

```bash
git fetch upstream
git checkout -b sync-upstream
git merge upstream/main
# Resolve conflicts (keep OpenJoey code in the paths above)
git add . && git commit -m "Merge upstream/main, keep OpenJoey changes"
git checkout main
git merge sync-upstream
git push origin main
# Optional: delete the branch
git branch -d sync-upstream
```

---

## 3. One source of truth for OpenJoey

- **Use this repo** (e.g. `openjoey-main` on your machine) as the only place you make and push OpenJoey fixes.
- **Do not** push to `origin main` from another clone that might have older code or that just did a raw `git merge upstream/main` without resolving conflicts in your favor.
- If you use multiple machines, always pull from `origin main` first, then make changes and push from one “primary” clone.

---

## 4. Check before pushing

Before `git push origin main`, confirm what you’re pushing:

```bash
./scripts/openjoey-check-before-push.sh
```

That shows `git status`, commits that are ahead of `origin/main`, and a short diff summary. Fix or amend if something looks wrong.

Manual checks:

```bash
git status
git log origin/main..HEAD --oneline
git diff origin/main --stat
```

---

## Quick reference

| Goal                               | Command / doc                                                                                                                                 |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Sync openclaw into OpenJoey safely | `./scripts/openjoey-sync-upstream.sh`                                                                                                         |
| Check what will be pushed          | `./scripts/openjoey-check-before-push.sh`                                                                                                     |
| Deploy to Hetzner after push       | See [PUSH-AND-RUN-MIGRATION.md](../../PUSH-AND-RUN-MIGRATION.md) and [skills-deploy-laptop-to-hetzner.md](skills-deploy-laptop-to-hetzner.md) |
