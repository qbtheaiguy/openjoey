# OpenJoey Guru Skills: Doc vs Codebase Comparison

This compares the "Guru Skills Architecture" document (from the agent) with how the OpenClaw/OpenJoey codebase actually works.

---

## 1. Skill discovery and registry

| Doc says                               | Codebase reality                                                                                                                                       |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Scans `./skills/` for `SKILL.md` files | **Match.** `loadSkillsFromDir` (from `@mariozechner/pi-coding-agent`) and workspace loader scan directories for subdirs containing `SKILL.md`.         |
| Builds "skill registry with metadata"  | **Partial.** There is a runtime snapshot (skill entries + command specs), not a literal `SKILL_INDEX.json` file. No auto-generated JSON index on disk. |
| "Skill registry (JSON/Index)"          | **No.** Skills are discovered at runtime from workspace + managed + bundled dirs; no persisted `SKILL_INDEX.json`.                                     |

---

## 2. Folder structure and naming

| Doc says                                                                  | Codebase reality                                                                                                                                                            |
| ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Skill folders: `meme_guru`, `alert_guru` (snake_case)                     | **Different.** Repo uses **kebab-case**: `meme-guru`, `alert-guru`, `whale-guru`, etc.                                                                                      |
| `skills/_shared/` (types.ts, constants.ts, state.ts, events.ts, utils.ts) | **Missing.** No `_shared` folder under `skills/`. No shared TypeScript/state/event bus in repo skills.                                                                      |
| `skills/<guru>/scripts/` (e.g. `fetch_trending.py`)                       | **Partial.** Some skills have `scripts/` (e.g. `local-places`, `skill-creator`, `nano-banana-pro`). Most guru skills are **SKILL.md-only** (no scripts dir).                |
| `skills/<guru>/references/`                                               | **Partial.** A few skills have `references/` (e.g. `1password`, `model-usage`). Most guru skills do not.                                                                    |
| `skills/<guru>/tools.yaml`                                                | **No.** OpenClaw does not use a separate `tools.yaml`; tool gating is via config and skill metadata (e.g. `metadata.openclaw.requires.bins`), not per-skill YAML tool defs. |
| `state/` at workspace root (positions.json, watchlist.json, alerts.json)  | **No.** No `state/` directory or shared JSON state store in the repo. OpenJoey uses **Supabase** for users, sessions, alerts, usage, etc., not local JSON files.            |
| `config/guru_config.yaml`                                                 | **No.** No such file. Channel/model/skills config lives in `openclaw.json` and env.                                                                                         |

---

## 3. SKILL.md frontmatter

| Doc says                                                                                | Codebase reality                                                                                                                                                                                       |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `user-invocable: true`                                                                  | **Supported.** Parsed in `src/agents/skills/frontmatter.ts`; default `true`.                                                                                                                           |
| `allowed-tools: [WebSearch, WebFetch, Read, Bash]`                                      | **Not used.** OpenClaw does not read `allowed-tools` from frontmatter for tool gating. Tool policy is global/agent/channel (e.g. `tools.allow` in config). Skills describe tools in prose in SKILL.md. |
| `command-dispatch: tool`, `command-tool: create_alert`                                  | **Supported.** Parsed and used for slash commands that bypass the model and call a tool directly.                                                                                                      |
| `metadata: { openclaw: { requires: { env: ["BIRDEYE_API_KEY"] }, primaryEnv: "..." } }` | **Supported.** `metadata.openclaw.requires.bins`, `requires.env`, `primaryEnv` are used for eligibility. Doc’s `allowed-tools` in metadata is not a thing; `requires` is.                              |
| `emoji` in frontmatter                                                                  | **Supported** via `metadata.openclaw.emoji` (e.g. in `meme-guru`, `alert-guru`).                                                                                                                       |

---

## 4. Telegram and slash commands

| Doc says                                                   | Codebase reality                                                                                                                                                                                                                                                                         |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/skills` — lists all available guru skills                | **Different.** There is no dedicated `/skills` command. OpenJoey has **`/help`** (in `src/openjoey/onboarding.ts`) which lists _tier-based_ allowed skills and account commands. Native slash commands include **per-skill commands** (e.g. `/meme_guru`) when `user-invocable` is true. |
| `/meme_guru` — directly invokes meme research skill        | **Match in behavior.** Skill names are **sanitized to snake_case** for the slash command: `meme-guru` → `/meme_guru` (see `sanitizeSkillCommandName` in `src/agents/skills/workspace.ts`: non-alphanumeric → `_`). So the doc’s slash name matches.                                      |
| User asks "Find me memes" → agent selects appropriate guru | **Match.** The agent gets a **skills prompt** (from `buildWorkspaceSkillsPrompt`) with skill names and descriptions; it chooses which skill applies. Selection is by model + prompt, not a separate "intent → skill" router.                                                             |

---

## 5. Invoke modes

| Doc says                                            | Codebase reality                                                                                                                                                                                                            |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| User invoke: "Use meme_guru to research..."         | **Match.** User can say "use meme_guru" or similar; the agent sees skills in the prompt and can follow that skill’s SKILL.md.                                                                                               |
| Agent select: "Find trending memes" → matched skill | **Match.** Same mechanism: skills are in the system/workspace prompt; the model picks which skill (if any) to use.                                                                                                          |
| Slash command: `/meme_guru` → run                   | **Match.** User-invocable skills are registered as native slash commands (Telegram, Discord, Slack); invoking `/meme_guru` runs the agent with that skill in context / or dispatches to a tool if `command-dispatch: tool`. |

---

## 6. Skill-to-skill communication

| Doc says                                                         | Codebase reality                                                                                                                                                                                                                                     |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Direct composition (e.g. deploy_guru → alert_guru)               | **By agent only.** There is no formal "call skill B from skill A" API. The **agent** can use multiple skills in one turn by reading different SKILL.md files and using tools; composition is orchestrated by the model, not by skill-to-skill calls. |
| Shared state store (positions.json, watchlist.json, alerts.json) | **No.** No shared `state/` JSON files. OpenJoey uses **Supabase** (e.g. `alerts`, `usage_events`, `sessions`). No generic `positions.json` or `watchlist.json` in repo.                                                                              |
| Event bus (pub-sub: whale_guru emits "whale:large_buy", etc.)    | **No.** No event bus or pub-sub layer in the codebase. Skills do not emit or subscribe to structured events.                                                                                                                                         |

---

## 7. Which gurus exist in the repo

Doc mentions many gurus (deploy_guru, chart_guru, trade_guru, news_guru, snipe_guru, copy_guru, yield_guru, risk_guru, bridge_guru, wallet_guru, stats_guru, portfolio_guru, scanner_guru, social_guru, rug_guru).

**In repo (`skills/`):**

- **Present (trading/guru-style):** `meme-guru`, `alert-guru`, `whale-guru`, `signal-guru`, `research-guru`, `crypto-guru`, `stock-guru`, `forex-guru`, `commodity-guru`, `options-guru`, `options-strategy`, `trading-god-pro`, plus supporting skills: `dex-scanner`, `sentiment-tracker`, `insider-tracker`, `penny-stock-scanner`, `market-scanner`, `news-alerts`, `economic-calendar`, `central-bank-watch`, `correlation-tracker`, `cot-analyzer`, `futures-analyzer`, `unusual-options`, `edy`.
- **Not present as named skills:** deploy_guru, chart_guru, trade_guru (as a single skill), news_guru (there is `news-alerts`), snipe_guru, copy_guru, yield_guru, risk_guru, bridge_guru, wallet_guru, stats_guru, portfolio_guru, scanner_guru, social_guru, rug_guru. (Some of these concerns may be partially covered inside existing skills or product backlogs.)

---

## 8. OpenJoey-specific behavior

- **Skill list:** `getAllowedSkills(tier)` in `src/openjoey/session-isolation.ts` returns the full OpenJoey skill set for every user (tier-based filtering was removed; all paying users get all skills). The list is passed as `skillFilterOverride` so those skills are loaded into the snapshot.
- **No separate /skills menu:** Help and skill discovery are via `/help` (and tier + allowed skills), not a dedicated `/skills` command that lists all gurus.

---

## 9. Summary: alignments and gaps

**Aligned with doc:**

- Skills live under `skills/` with `SKILL.md`; discovery by scanning for `SKILL.md`.
- Slash commands for skills: names become snake_case (e.g. `/meme_guru`).
- `user-invocable`, `command-dispatch`, `command-tool`, and `metadata.openclaw` (emoji, requires) are supported.
- Agent selects skills via prompt (no separate intent router); user can invoke by slash or natural language.

**Different or missing in codebase:**

- **Naming:** Repo uses **kebab-case** folders (`meme-guru`), not snake_case (`meme_guru`); slash command is derived as snake_case.
- **No `skills/_shared/`**, no `state/` JSON store, no event bus; OpenJoey uses Supabase for persistence.
- **No `SKILL_INDEX.json`** or `tools.yaml`; no doc-style `allowed-tools` in frontmatter.
- **No dedicated `/skills`** command; discovery is via `/help` and tier-based allowed list.
- **Not all doc gurus exist**; only a subset (meme, alert, whale, signal, research, crypto, stock, forex, commodity, options, etc.) are implemented as skills.

If you want the codebase to match the doc more closely, the main optional additions would be: a **`/skills`** command that lists allowed skills for the user, and optionally a **`skills/_shared/`** and/or **`state/`** convention if you introduce shared state beyond Supabase—without changing the existing discovery and frontmatter behavior.

---

## 10. Alignment summary: is the codebase aligned?

**For “skills are reachable” — yes, with one fix.**

- **Discovery and structure:** The repo is aligned. Skills live under `skills/` with `SKILL.md`; folder names are kebab-case; slash commands are derived (e.g. `/meme_guru`). The engine scans and builds the snapshot; tier filtering is applied at request time.
- **Reachability in Telegram:** A skill is reachable only if:
  1. It exists under `skills/<name>/` with a valid `SKILL.md` whose frontmatter `name` matches the folder (e.g. `name: meme-guru`).
  2. Its **name** is included in `getAllowedSkills(tier)` in `src/openjoey/session-isolation.ts` for the user’s tier.

**Fixed:** The allowlist had **`api-access`** in `PREMIUM_SKILLS` with no `skills/api-access/` folder. `api-access` was removed from `PREMIUM_SKILLS` in `src/openjoey/session-isolation.ts`. Re-add it when you create `skills/api-access/SKILL.md`.

**Everything else in the comparison doc** (naming, \_shared, state/, event bus, SKILL_INDEX.json, allowed-tools) is either already aligned or is an optional enhancement; none of it blocks skills from being reachable.

---

## 11. What to change to align and keep all skills reachable

| Goal                             | What to do                                                                                                                                                                                                                                                                 |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **All allowed skills reachable** | Allowlist is synced: `api-access` was removed from `PREMIUM_SKILLS` (no `skills/api-access/` yet). When adding new skills to the allowlist, ensure a matching `skills/<name>/SKILL.md` with `name: <name>` exists.                                                         |
| **Users can discover skills**    | Keep using `/help` (already lists allowed skills per tier). Optionally add a **`/skills`** command that only lists allowed skills and their descriptions (no account commands), e.g. in `src/openjoey/onboarding.ts` and register it in `gateway-hook.ts` next to `/help`. |
| **Match doc folder layout**      | Optional: use **kebab-case** everywhere (you already do). No need to add `_shared/` or `state/` unless you introduce shared code or local JSON state; OpenJoey uses Supabase.                                                                                              |
| **Match doc frontmatter**        | Do **not** add `allowed-tools` to SKILL.md; the codebase ignores it. Use `metadata.openclaw.requires.bins` or `requires.env` for eligibility; describe tools in prose.                                                                                                     |
| **Workspace / Docker**           | Ensure the process that serves Telegram uses a workspace that contains `skills/` (config `agents.defaults.workspace` or Docker mount). See [openjoey-telegram-skills-debugging.md](openjoey-telegram-skills-debugging.md).                                                 |

**Minimal checklist for “aligned and reachable”:**

1. ~~Fix **api-access**: remove from `PREMIUM_SKILLS` or add `skills/api-access/SKILL.md`.~~ **Done:** removed from allowlist until the skill exists.
2. Keep **SKILL.md** `name` equal to folder name for every skill in the allowlist (already true for all current guru skills).
3. (Optional) Add **`/skills`** so users can list allowed skills in one place.
