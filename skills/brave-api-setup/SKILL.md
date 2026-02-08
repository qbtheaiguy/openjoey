---
name: brave-api-setup
description: Guide users through setting up the Brave Search API for OpenClaw's web_search tool. Use when a user wants to enable web search, get a Brave API key, or configure BRAVE_API_KEY for the agent.
---

# Brave API Setup

This skill walks users through enabling **web search** in OpenClaw using the Brave Search API. The `web_search` tool lets the agent look up information online; it requires a Brave Search API key.

## When to use this skill

- User asks to "set up Brave API", "enable web search", "get a Brave key", or "configure web_search".
- User sees errors about missing Brave API key or `web_search` being unavailable.
- User wants to use the `web_search` tool and needs step-by-step setup.

## Setup steps (follow in order)

### 1) Get a Brave Search API key

1. **Create an account**  
   Go to [https://brave.com/search/api/](https://brave.com/search/api/) and sign up or log in.

2. **Choose the correct plan**  
   In the dashboard, select the **"Data for Search"** plan (not "Data for AI"). The Data for AI plan is not compatible with OpenClaw's `web_search` tool.

3. **Generate an API key**  
   Create an API key in the Brave dashboard. You will get a key string (e.g. starting with `BSA...`). Keep it secret; do not commit it to version control or share it in chat.

### 2) Provide the key to OpenClaw

Choose **one** of the following. Prefer the config method for persistence.

**Option A — Config (recommended)**

- Run in a terminal (on the machine where the OpenClaw gateway runs):
  ```bash
  openclaw configure --section web
  ```
- When prompted, paste your Brave API key. The wizard will store it in `~/.openclaw/openclaw.json` under `tools.web.search.apiKey`.
- Restart the OpenClaw gateway (or Mac app) so it picks up the new config.

**Option B — Environment variable**

- Set `BRAVE_API_KEY` in the **Gateway process** environment (the process that runs `openclaw gateway` or the OpenClaw app).
  - **Local install:** e.g. in `~/.openclaw/.env` or your shell profile, add:
    ```bash
    export BRAVE_API_KEY="your-key-here"
    ```
  - **Docker/systemd:** add `BRAVE_API_KEY` to the container or service environment.
- Restart the gateway after setting the variable.

**Option C — Manual config edit**

- Edit `~/.openclaw/openclaw.json` (on the gateway host) and ensure:
  ```json5
  {
    tools: {
      web: {
        search: {
          provider: "brave",
          apiKey: "YOUR_BRAVE_API_KEY_HERE",
          enabled: true,
        },
      },
    },
  }
  ```
- Restart the gateway.

### 3) Confirm web_search is allowed

- The agent must have `web_search` in its tool allowlist. Default config usually allows it when the key is present.
- If the user has a strict allowlist, ensure `web_search` is listed in `tools.allow` or the equivalent in `openclaw.json`.

### 4) Verify

- Ask the user to send a message that requires a web search (e.g. "What's the weather in Paris right now?" or "Search for the latest OpenClaw release").
- If the agent uses `web_search` and returns results, setup is complete.
- If the agent reports a missing key, confirm the key is set in the **gateway** environment or config (not only in the user's local shell) and that the gateway was restarted.

## Important notes

- **Data for Search only.** The "Data for AI" plan from Brave is not compatible with this integration; the user must use "Data for Search."
- **Free tier.** Brave offers a free tier; check [brave.com/search/api](https://brave.com/search/api/) for current limits and pricing.
- **Security.** Never log or echo the API key. Do not put the key in skill files or docs that get committed.

## References

- OpenClaw docs: [Brave Search](/brave-search), [Web tools](/tools/web)
- Brave Search API: [https://brave.com/search/api/](https://brave.com/search/api/)
