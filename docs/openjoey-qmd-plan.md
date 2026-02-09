# OpenJoey + QMD (semantic memory)

**Status:** QMD is **already implemented** in OpenClaw as an optional memory backend. OpenJoey does not use it yet. This doc explains how to enable it for OpenJoey and the tradeoffs.

## What QMD is

[QMD](https://github.com/tobi/qmd) is a local-first CLI search engine: BM25 + vector embeddings + LLM re-ranking over Markdown. OpenClaw integrates it by setting `memory.backend = "qmd"`; the agent’s `memory_search` / `memory_get` tools then shell out to the `qmd` binary instead of using the built-in SQLite indexer.

- **No extra API cost:** QMD runs fully locally (Bun + node-llama-cpp, GGUF models from HuggingFace).
- **Better recall:** Hybrid search + reranking often beats builtin-only, especially for natural-language questions over docs/notes.
- **Same UX surface:** The model already has the memory tools; it just gets higher-quality results when QMD is used.

## Current state

- **OpenClaw:** Supports `memory.backend = "builtin"` (default) or `"qmd"`. Config: `memory.qmd.*` (paths, limits, update intervals). See [Memory](/concepts/memory) and [QMD backend](https://docs.openclaw.ai/concepts/memory#qmd-backend-experimental).
- **OpenJoey:** No `memory` section in `openclaw.openjoey.json`, so the gateway default applies (typically builtin or disabled). The OpenJoey agent can use `memory_search` only if memory search is enabled and the backend is configured.

## How to enable QMD for OpenJoey

### 1. Config (openclaw.openjoey.json)

Add a top-level `memory` block so the backend is QMD and (optionally) point at a knowledge base:

```json
"memory": {
  "backend": "qmd",
  "qmd": {
    "includeDefaultMemory": true,
    "paths": [
      { "path": "/path/to/openjoey/docs", "name": "openjoey-docs" }
    ],
    "limits": { "maxResults": 6, "timeoutMs": 5000 }
  }
}
```

- `includeDefaultMemory: true` indexes the agent workspace `MEMORY.md` and `memory/*.md` (OpenJoey’s workspace).
- `paths` adds extra collections (e.g. a repo of trading/research docs). Omit if you only want workspace memory.
- If the `qmd` binary is missing or fails, OpenClaw falls back to builtin (or empty results); the bot keeps working.

### 2. Install QMD where the gateway runs

The process that runs the gateway must be able to run `qmd` (same PATH or `memory.qmd.command`).

**On the host (e.g. Hetzner):**

```bash
# Bun (required by QMD)
curl -fsSL https://bun.sh/install | bash
# QMD
bun install -g github:tobi/qmd
# Ensure qmd is on PATH for the user/process that runs the gateway
export PATH="$HOME/.bun/bin:$PATH"
```

- QMD needs an SQLite with extension support (`apt install sqlite` or `brew install sqlite`).
- First `qmd query` will download GGUF models (~2GB total); ensure disk and network are OK.

**In Docker:** The gateway image does not include Bun or QMD today. Options:

- **A.** Extend the image: install Bun + `bun install -g qmd`, and set `memory.backend = "qmd"`. Heavier image and longer first-run (model download).
- **B.** Run the gateway on the host (not in Docker) so the host’s `qmd` is on PATH.
- **C.** Run QMD in a sidecar container and expose a wrapper that the gateway calls (custom; not documented here).

For a single-box OpenJoey server, **B** or **A** are the practical options.

### 3. What gets indexed

- **Default (includeDefaultMemory: true):** The OpenJoey agent’s workspace: `MEMORY.md`, `memory/*.md` under the workspace dir. So anything the bot or an admin writes there is searchable.
- **paths:** Any dirs you add (e.g. `skills/*/README.md`, or a cloned “research docs” repo). Use `path` + optional `pattern` (default `**/*.md`).

So you can have:

- Shared knowledge: e.g. `/app/docs` or a volume with curated trading/research Markdown.
- Per-session or per-user notes: if you export them into the workspace `memory/` (or a path you add), QMD will index them.

## Benefits for the codebase

- **No new code paths:** You only add config and install the QMD CLI. All wiring (memory tool, backend selection, fallback) already exists.
- **Single backend choice:** Same `memory.backend` and `memory.qmd` config for all agents using that config file; OpenJoey’s default agent gets it automatically when you set it in `openclaw.openjoey.json`.

## Benefits for users (UX)

- **Smarter answers:** “What did we decide about SOL?” or “Summarize the research doc on X” get better results via hybrid + rerank.
- **Citations:** With citations on, replies can include “Source: memory/2025-02-08.md#12” so users can verify.
- **Local-only option:** No embedding API keys; good for privacy and cost.

## Recommendation

- **Short term:** Add the `memory` block to `openclaw.openjoey.json` with `backend: "qmd"` and `includeDefaultMemory: true`, and optional `paths` to a small docs/knowledge dir. Leave `memory.qmd.command` default so that if `qmd` is not installed, the gateway falls back and nothing breaks.
- **Server (Hetzner):** If you want QMD in production, install Bun + QMD on the host and run the gateway on the host (so PATH has `qmd`), or add QMD to the gateway Docker image and document the first-run model download.

No separate “implement QMD” step is required in code; it’s enablement via config and install.

## Reference

- QMD repo: [github.com/tobi/qmd](https://github.com/tobi/qmd)
- OpenClaw memory concept: [Memory](/concepts/memory) (and QMD backend section)
- Config schema: `memory.backend`, `memory.qmd.*` in [configuration](/configuration)
