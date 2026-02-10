# Debugging: Skills Not Found in Telegram (OpenJoey)

This maps the generic “skills not found” checklist to the **OpenJoey codebase** so you know exactly where to look and what to run.

---

## 1. Skill allowlist (OpenJoey)

**Doc checklist:** “openclaw.json → skills.entries”, “user.tier”, “feature flags”.

**In this repo:**

- **Tier is not in openclaw.json.** It comes from **Supabase** (`users.tier`). The Telegram hook calls `resolveSession(telegramId)` → DB → `session.tier` → `getAllowedSkills(tier)`.
- **Code:** `src/openjoey/session-isolation.ts` → `getAllowedSkills(tier)`.
  - **free:** only `CORE_SKILLS` (edy, signal-guru, research-guru, crypto-guru, meme-guru).
  - **trial:** CORE + TRADING + `alert-guru`.
  - **trader / annual:** CORE + TRADING + SUBSCRIBER (e.g. whale-guru, alert-guru, …).
  - **premium:** all of the above + PREMIUM_SKILLS (options-guru, trading-god-pro, api-access, …).
- **Flow:** `gateway-hook.ts` → `resolveSession()` → `getAllowedSkills(session.tier)` → `hookResult.allowedSkills` → passed as `skillFilterOverride` into the reply pipeline. Only skills in that list are kept when building the skill snapshot (`workspace.ts` → `filterSkillEntries` with `skillFilter`).

**What to check:**

- In Supabase, for the Telegram user: what is `users.tier`? If it’s `free`, they only get the 5 CORE_SKILLS (meme-guru is included).
- If the user should have more skills, fix tier in DB or onboarding (e.g. after /subscribe).
- **No CLI for tier.** Use Supabase dashboard or your admin app. Optionally add a debug log in `gateway-hook.ts`: log `session.tier` and `hookResult.allowedSkills` for the failing user.

**Quick test:** Temporarily in `getAllowedSkills()`, return `[...CORE_SKILLS, ...TRADING_SKILLS, ...SUBSCRIBER_SKILLS]` for all tiers and see if skills appear in Telegram. If yes, the bug is tier/DB.

---

## 2. Workspace path (where skills are loaded from)

**Doc checklist:** “How is the gateway started?”, “--workspace”, “Docker volume mounts”, “openclaw config get workspace.dir”.

**In this repo:**

- Workspace is **per agent**, from config: `resolveAgentWorkspaceDir(cfg, agentId)` in `src/agents/agent-scope.ts`.
  - Uses `agents.entries[agentId].workspace` or `agents.defaults.workspace` if set.
  - **Docker:** if `process.cwd() === "/app"` and `fs.existsSync("/app/skills")`, workspace is **`/app`** (so skills load from `/app/skills`).
  - Otherwise falls back to **`~/.openclaw/workspace`** (or `~/.openclaw/workspace-${OPENCLAW_PROFILE}`).
- The **same** workspace is used when the Telegram handler runs the agent: `get-reply.ts` calls `resolveAgentWorkspaceDir(cfg, agentId)` then builds the skill snapshot from `workspaceDir` + managed + bundled dirs.

**What to check:**

- **Where does the Telegram bot run?** (Same process as gateway? Same host? Docker?)
  - If **Docker:** ensure the repo (or at least a directory that contains `skills/`) is mounted so that the process sees `./skills` (e.g. `-v $(pwd)/skills:/app/skills` and run with `WORKDIR /app`, or mount the whole repo at `/app`).
  - If **same host as CLI:** ensure the same config is used. The gateway typically loads config from state dir (e.g. `~/.openclaw/openclaw.json`). So `openclaw config get agents.defaults.workspace` (or the agent’s `workspace`) should point to a directory that contains `skills/`.
- **CLI (from the same env as the bot):**
  - `openclaw config get agents.defaults.workspace` — if set, that’s the workspace for the default agent.
  - Then `ls -la $(openclaw config get agents.defaults.workspace)/skills/` — you should see e.g. `meme-guru`, `alert-guru`, etc.
- **Note:** There is no single `workspace.dir` key; the effective dir is from `resolveAgentWorkspaceDir`. The gateway’s config RPC may expose it; otherwise infer from `agents.defaults.workspace` or Docker `cwd` + `/app/skills`.

---

## 3. Skill snapshot at request time

**Doc checklist:** “Skills loaded at boot but not in the agent handling Telegram”, “session isolation”.

**In this repo:**

- Each Telegram message goes through the OpenJoey hook → `baseProcessMessage(..., skillFilterOverride: hookResult.allowedSkills)`.
- The reply pipeline (`get-reply.ts`) gets `workspaceDir` and builds the skill snapshot **with** `skillFilter` (the merged list including `allowedSkills`). So the **same** workspace and **same** filter are used for that request.
- If the **workspace** is wrong (e.g. different process, different config, or Docker without skills mounted), the snapshot can be empty or missing skills. If **tier** is wrong, the filter will drop skills.

**What to do:**

- Run the agent via **CLI** with the **same** config and (if possible) same workspace the server uses:
  - `openclaw agent --message "use meme_guru"` (or “list my skills”).
  - If CLI works but Telegram doesn’t → workspace or config differs between CLI and the Telegram process (e.g. different `openclaw.json`, or Docker not mounting skills).
  - If CLI also fails → workspace has no skills or skill names don’t match the filter (see #1 and skill name matching below).

---

## 4. Skills in the system prompt

**Doc checklist:** “Skill description must be in the prompt”, “verbose”, “&lt;skills&gt;…&lt;/skill&gt;”.

**In this repo:**

- The skill snapshot is built in `src/agents/skills/workspace.ts` (and related) and injected into the system/workspace prompt. If `skillFilter` is applied and the list is empty (or only includes names that don’t match any loaded skill), the prompt will have no skills.
- **Skill name matching:** Filter uses `entry.skill.name`. That comes from the skill’s **frontmatter `name:`** (or derived from the folder). So the names in `getAllowedSkills()` (e.g. `meme-guru`, `alert-guru`) must **exactly** match the `name` of the skill as loaded (e.g. folder `meme-guru` with `name: meme-guru` in SKILL.md). If you had `name: meme_guru` in SKILL.md, it would not match `meme-guru` in the filter.

**What to do:**

- Confirm each skill folder has `SKILL.md` with `name: <folder-name>` (e.g. `name: meme-guru` for `skills/meme-guru/`).
- Optional: enable verbose/debug and look for log lines like `[skills] Applying skill filter: ...` and `[skills] After filter: ...` (see `workspace.ts` filterSkillEntries). That shows which skills remain after the tier filter.

---

## 5. Telegram command registration

**Doc checklist:** “Slash commands cached”, “getMyCommands”, “Re-register with BotFather”.

**In this repo:**

- Skill slash commands are registered from the skill registry (user-invocable skills). Names are sanitized (e.g. `meme-guru` → `meme_guru`) in `src/agents/skills/workspace.ts` → `sanitizeSkillCommandName`.
- If the **bot** registers commands at startup, they should include `/meme_guru`, `/alert_guru`, etc., for skills that are loaded and user-invocable. If the **skill snapshot** is empty for the default agent (e.g. no workspace or all filtered out), the list of commands to register might be empty or stale.

**What to do:**

- Call Telegram API: `curl "https://api.telegram.org/bot<TOKEN>/getMyCommands"` to see what commands Telegram has.
- Restart the gateway/bot so it re-registers commands from the current skill snapshot. If the snapshot is correct after fixing workspace/tier, commands should appear.

---

## 6. Skill validation (SKILL.md / YAML)

**Doc checklist:** “Malformed SKILL.md”, “Required fields”, “tail -f gateway.log”.

**In this repo:**

- Skills are loaded by `loadSkillsFromDir` (from `@mariozechner/pi-coding-agent`). A malformed SKILL.md can cause a skill to be skipped or throw; check gateway/bot logs for load errors.
- Required: at least `name` and `description` in frontmatter (see `docs/tools/skills.md`). For OpenJoey, the **name** must match the allowlist in `getAllowedSkills()` (e.g. `meme-guru`).

**What to do:**

- `cat skills/meme-guru/SKILL.md | head -25` — ensure `name: meme-guru` and valid YAML.
- Search logs for “skill” and the skill name; look for parse or load errors.

---

## Quick diagnostic commands (OpenJoey-aware)

Run these **in the same environment** where the Telegram bot/gateway runs (same machine or same Docker image):

```bash
# 1. Effective workspace for default agent (config-based)
openclaw config get agents.defaults.workspace
# If empty, default is ~/.openclaw/workspace or /app in Docker.

# 2. List skills OpenClaw sees (no tier filter; uses default agent workspace)
openclaw skills list

# 3. List files in that workspace’s skills dir
ls -la "$(openclaw config get agents.defaults.workspace 2>/dev/null || echo "$HOME/.openclaw/workspace")/skills/"
# Or if in Docker with /app: ls -la /app/skills/
```

**OpenJoey-specific:**

- **Tier:** Check in Supabase `users` for the Telegram user’s `tier`. If `free`, they only get CORE_SKILLS (including meme-guru). If you expect more, fix tier or onboarding.
- **Filter log:** When processing a message, the code logs `[skills] Applying skill filter: ...` and `[skills] After filter: ...`. Grep gateway/bot logs for that to see what’s allowed and what remains.

---

## Summary: most likely causes in OpenJoey

1. **Tier in DB** — User’s `tier` is wrong or missing, so `getAllowedSkills(tier)` returns a minimal list. Fix tier in Supabase or temporarily broaden `getAllowedSkills()` to test.
2. **Workspace path** — Gateway/bot runs with a workspace that doesn’t contain `skills/` (e.g. Docker without mount, or config pointing to a different dir). Fix mount or `agents.defaults.workspace`.
3. **Skill name mismatch** — Allowlist uses kebab-case (e.g. `meme-guru`). SKILL.md `name` must match exactly so the filter keeps the skill.

The checklist’s “skills.entries → enabled” in config is still valid for **global** enable/disable of a skill in OpenClaw; OpenJoey **additionally** restricts by tier in code, so tier and workspace are the first things to verify.
